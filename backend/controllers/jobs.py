from blacksheep import json, Response, Request, FromForm
from blacksheep.server.controllers import APIController, post, get
from services.supabase_service import SupabaseService
from models.job import JobStatus, VideoJobRequest, VideoGenerationInput
from services.job_service import JobService
from services.video_merge_service import VideoMergeService

class Jobs(APIController):
    def __init__(self, job_service: JobService, supabase_service: SupabaseService, video_merge_service: VideoMergeService):
        self.job_service = job_service
        self.supabase_service = supabase_service
        self.video_merge_service = video_merge_service

    @post("/video")
    async def add_video_job(self, request: Request, input: FromForm[VideoGenerationInput]):
        """
        Starts a video generation job.
        Input: starting image (file), context, any other user-prompt
        Return: jobId
        """
        user_id = request.scope.get("user_id") or self.supabase_service.get_user_id_from_request(request)
        if not user_id:
            return json({"error": "Unauthorized"}, status=401)

        # FromForm parses the body, so request.files should be populated if multipart
        # request.files is a method that returns the list of files
        files = await request.files()
        
        if not files:
            return json({"error": "No image file provided"}, status=400)

        image_file = files[0]
        ending_image_file = files[1] if len(files) > 1 else None
        
        data = VideoJobRequest(
            starting_image=image_file.data,
            ending_image=ending_image_file.data if ending_image_file else None,
            global_context=input.value.global_context,
            custom_prompt=input.value.custom_prompt
        )

        success, error = self.supabase_service.do_transaction(
            user_id=user_id,
            transaction_type="video_gen",
            credit_usage=10 # TODO: adjust number later
        )
        
        if not success:
            if error == "insufficient_credits":
                return json({"error": "You don't have enough credits. Please purchase more credits to continue."}, status=402)
            return json({"error": "Transaction failed"}, status=500)
        
        job_id = await self.job_service.create_video_job(data)
        return json({"job_id": job_id})

    @get("/video/{job_id}")
    async def get_video_job_status(self, job_id: str):
        """
        Get status of job
        """
        jobStatus: JobStatus = await self.job_service.get_video_job_status(job_id)
        
        if not jobStatus:
            return json({"error": "Job not found"}, status=404)

        if jobStatus.status == "error":
            return json({
                "status": "error",
                "error_message": jobStatus.error
            }, status=500)
        
        if jobStatus.status == "waiting":
            return json({
                "status": "waiting",
                "job_start_time": jobStatus.job_start_time.isoformat()
            }, status=202)
        
        return json({
            "status": jobStatus.status,
            "job_start_time": jobStatus.job_start_time.isoformat(),
            "job_end_time": jobStatus.job_end_time.isoformat() if jobStatus.job_end_time else None,
            "video_url": jobStatus.video_url,
            "metadata": jobStatus.metadata
        }, status=200)

    # DEV MOCK ENDPOINTS
    @post("/video/mock")
    async def add_video_job_mock(self, request: Request, input: FromForm[VideoGenerationInput]):

        user_id = request.scope.get("user_id") or self.supabase_service.get_user_id_from_request(request)
        if not user_id:
            return json({"error": "Unauthorized"}, status=401)
        
        # validate input
        files = await request.files()
        
        if not files:
            return json({"error": "No image file provided"}, status=400)

        image_file = files[0]
        
        data = VideoJobRequest(
            starting_image=image_file.data,
            global_context=input.value.global_context,
            custom_prompt=input.value.custom_prompt
        )

        success, error = self.supabase_service.do_transaction(
            user_id=user_id,
            transaction_type="video_gen",
            credit_usage=10 # TODO: adjust number later
        )
        
        if not success:
            if error == "insufficient_credits":
                return json({"error": "You don't have enough credits. Please purchase more credits to continue."}, status=402)
            return json({"error": "Transaction failed"}, status=500)
        
        # just return random stuff
        return json({"job_id": "mock-job-id"})

    @get("/video/mock/{job_id}")
    async def get_video_job_status_mock(self, job_id: str):
        return json({
            "status": "done",
            "job_start_time": "2024-01-01T00:00:00",
            "job_end_time": "2024-01-01T00:00:30",
            "video_url": "https://storage.googleapis.com/hackwestern_bucket/videos/15826790601517257638/sample_0.mp4"
        })
    
    @get("/health/redis")
    async def redis_health_check(self):
        is_healthy = await self.job_service.redis_health_check()
        if is_healthy:
            return Response(200)
        else:
            return Response(500)
    
    @post("/video/merge")
    async def merge_videos(self, request: Request):
        """
        Merges multiple videos from URLs into a single video.
        Input: JSON body with "video_urls" array (ordered from root to end frame)
        Return: merged video URL
        """     
        user_id = request.scope.get("user_id") or self.supabase_service.get_user_id_from_request(request)
        if not user_id:
            return json({"error": "Unauthorized"}, status=401)
        
        try:
            body = await request.json()
            video_urls = body.get("video_urls", [])
            
            if not video_urls or not isinstance(video_urls, list):
                return json({"error": "video_urls array is required"}, status=400)
            
            if len(video_urls) < 2:
                return json({"error": "At least 2 video URLs are required for merging"}, status=400)
            
            merged_video_url = await self.video_merge_service.merge_videos(video_urls, user_id)
            
            return json({"video_url": merged_video_url})
        except Exception as e:
            import traceback
            traceback.print_exc()
            return json({"error": str(e)}, status=500)
        