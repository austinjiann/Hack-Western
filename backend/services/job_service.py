from datetime import datetime
from typing import Optional
from models.job import JobStatus, VideoJobRequest, VideoJob
from services.vertex_service import VertexService
from utils.prompt_builder import create_video_prompt
from utils.env import settings
import uuid
import redis
import pickle
import blosc
import asyncio
import traceback

class JobService:
    def __init__(self, vertex_service: VertexService):
        self.vertex_service = vertex_service
        self.redis_client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=False)

    def _serialize(self, data: dict | VideoJob) -> bytes:
        """Serialize + compress any data to bytes for Redis storage"""
        return blosc.compress(pickle.dumps(data))
    
    def _deserialize(self, data: bytes) -> Optional[dict | VideoJob]:
        """Deserialize + decompress bytes from Redis storage"""
        if not data:
            return None
        return pickle.loads(blosc.decompress(data))

    async def create_video_job(self, request: VideoJobRequest) -> str:
        """Create a video job and return job_id immediately, processing happens in background"""
        job_id = str(uuid.uuid4())
        
        pending_job = {
            "status": "pending",
            "job_start_time": datetime.now().isoformat()
        }
        # Store pending job BEFORE starting background task to avoid 404 race condition
        self.redis_client.setex(f"job:{job_id}:pending", 300, self._serialize(pending_job))
        
        # start background task
        asyncio.create_task(self._process_video_job(job_id, request))
        
        return job_id
    
    async def _process_video_job(self, job_id: str, request: VideoJobRequest):
        """Background task that processes the video generation"""
        try:
            # for parallel tasks
            tasks = [
                self.vertex_service.analyze_image_content(
                    prompt="Describe any animation annotations you see. Use this description to inform a video director. Be descriptive about location and purpose of the annotations.",
                    image_data=request.starting_image
                ),
                self.vertex_service.generate_image_content(
                    prompt="Remove all text, captions, subtitles, annotations from this image. Generate a clean version of the image with no text. Keep everything else the exact same.",
                    image=request.starting_image
                )
            ]
            
            if request.ending_image:
                tasks.append(
                    self.vertex_service.generate_image_content(
                        prompt="Remove all text, captions, subtitles, annotations from this image. Generate a clean version of the image with no text. Keep the art/image style the exact same.",
                        image=request.ending_image
                    )
                )
            
            results = await asyncio.gather(*tasks)
            annotation_description = results[0]
            starting_frame = results[1]
            ending_frame = results[2] if len(results) > 2 else None

            operation = await self.vertex_service.generate_video_content(
                create_video_prompt(request.custom_prompt, request.global_context, annotation_description),
                starting_frame,
                ending_frame,
                request.duration_seconds
            )
            
            job = VideoJob(
                job_id=job_id,
                operation=operation,
                request=request,
                job_start_time=datetime.now(), # goes against naming here, this is actually end time of the job
                metadata={
                    "annotation_description": annotation_description
                }
            )
            
            self.redis_client.delete(f"job:{job_id}:pending")
            self.redis_client.setex(f"job:{job_id}", 300, self._serialize(job))
            
        except Exception as e:
            # debug stuff
            print(f"Error processing video job {job_id}: {e}")
            traceback.print_exc()
            error_job = {
                "status": "error",
                "error": str(e),
                "job_start_time": datetime.now().isoformat()
            }
            self.redis_client.delete(f"job:{job_id}:pending")
            self.redis_client.setex(f"job:{job_id}:error", 300, self._serialize(error_job))

    async def get_video_job_status(self, job_id: str) -> JobStatus:
        # Check if job is still pending
        pending_data = self.redis_client.get(f"job:{job_id}:pending")
        if pending_data:
            pending_job = self._deserialize(pending_data)
            return JobStatus(
                status="waiting",
                job_start_time=datetime.fromisoformat(pending_job["job_start_time"]),
                job_end_time=None,
                video_url=None,
            )
        
        # Check if job failed
        error_data = self.redis_client.get(f"job:{job_id}:error")
        if error_data:
            error_job = self._deserialize(error_data)
            return JobStatus(
                status="error",
                job_start_time=datetime.fromisoformat(error_job["job_start_time"]),
                job_end_time=None,
                video_url=None,
                error=error_job.get("error")
            )
        
        # Retrieve actual job from Redis
        job_data = self.redis_client.get(f"job:{job_id}")

        if job_data is None: # if job not found
            return None

        job = self._deserialize(job_data)

        result = await self.vertex_service.get_video_status(job.operation)

        ret = JobStatus(
            status=result.status,
            job_start_time=job.job_start_time,
            job_end_time=datetime.now() if result.status == "done" else None,
            video_url=result.video_url.replace("gs://", "https://storage.googleapis.com/") if result.video_url else None,
            metadata=job.metadata
        )

        if result.status == "done":
            self.redis_client.delete(f"job:{job_id}") # clean from redis

        return ret

    async def redis_health_check(self) -> bool:
        try:
            self.redis_client.ping()
            return True
        except redis.RedisError:
            return False
        