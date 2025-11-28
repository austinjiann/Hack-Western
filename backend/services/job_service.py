from datetime import datetime
from typing import Dict, Optional
from models.job import JobStatus, VideoJobRequest, VideoJob
from services.vertex_service import VertexService
from utils.prompt_builder import create_video_prompt
from utils.env import settings
import uuid
import redis
import pickle
import blosc

class JobService:
    def __init__(self, vertex_service: VertexService):
        self.vertex_service = vertex_service
        self.redis_client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=False)

    def _serialize_job(self, job: VideoJob) -> bytes:
        """Serialize VideoJob to bytes using pickle for Redis storage"""
        return blosc.compress(pickle.dumps(job))
    
    def _deserialize_job(self, data: bytes) -> Optional[VideoJob]:
        """Deserialize bytes to VideoJob from Redis storage"""
        if not data:
            return None
        return pickle.loads(blosc.decompress(data))

    async def create_video_job(self, request: VideoJobRequest) -> str:
        operation = await self.vertex_service.generate_video_content(
            create_video_prompt(request.custom_prompt, request.global_context),
            request.starting_image,
            request.duration_seconds
            )
        
        job_id = str(uuid.uuid4())
        
        # Initialize job status
        job = VideoJob(
            job_id=job_id,
            operation=operation,
            request=request,
            job_start_time=datetime.now()
        )
        
        # Store in Redis with 5 minute TTL
        self.redis_client.setex(f"job:{job_id}", 300, self._serialize_job(job))
        
        return job_id

    async def get_video_job_status(self, job_id: str) -> JobStatus:
        # Retrieve job from Redis
        job_data = self.redis_client.get(f"job:{job_id}")
        job = self._deserialize_job(job_data)
        
        if job is None:
            return None

        result = await self.vertex_service.get_video_status(job.operation)

        ret = JobStatus(
            status=result.status,
            job_start_time=job.job_start_time,
            job_end_time=datetime.now() if result.status == "done" else None,
            video_url=result.video_url.replace("gs://", "https://storage.googleapis.com/") if result.video_url else None
        )

        if result.status == "done":
            # Clean up completed job from Redis
            self.redis_client.delete(f"job:{job_id}")

        return ret

    async def redis_health_check(self) -> bool:
        try:
            self.redis_client.ping()
            return True
        except redis.RedisError:
            return False
        