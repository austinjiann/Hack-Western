from blacksheep import json, Response, Request, FromForm
from blacksheep.server.controllers import APIController, post, get
from models.job import VideoJobRequest, VideoGenerationInput
from services.job_service import JobService

class Jobs(APIController):
    def __init__(self, job_service: JobService):
        self.job_service = job_service

    @post("/video")
    async def add_video_job(self, request: Request, input: FromForm[VideoGenerationInput]):
        """
        Starts a video generation job.
        Input: starting image (file), context, any other user-prompt
        Return: jobId
        """
        # FromForm parses the body, so request.files should be populated if multipart
        # request.files is a method that returns the list of files
        files = await request.files()
        
        if not files:
            return json({"error": "No image file provided"}, status=400)

        image_file = files[0]
        
        data = VideoJobRequest(
            starting_image=image_file.data,
            global_context=input.value.global_context,
            custom_prompt=input.value.custom_prompt
        )
        
        job_id = await self.job_service.create_video_job(data)
        return json({"job_id": job_id})

    @get("/video/{job_id}")
    async def get_video_job_status(self, job_id: str):
        """
        Get status of job
        """
        status = await self.job_service.get_video_job_status(job_id)
        
        if not status:
            return json({"error": "Job not found"}, status=404)

        return json({
            "status": status.status,
            "job_start_time": status.job_start_time.isoformat(),
            "job_end_time": status.job_end_time.isoformat() if status.job_end_time else None,
            "video_url": status.video_url
        })
