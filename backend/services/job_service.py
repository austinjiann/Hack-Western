from datetime import datetime
from typing import Dict
from models.job import JobStatus, VideoJobRequest
from services.vertex_service import VertexService

class JobService:
    def __init__(self, vertex_service: VertexService):
        self.vertex_service = vertex_service
        self.jobs: Dict[str, JobStatus] = {}

    async def create_job(self, request: VideoJobRequest) -> str:
        operation = await self.vertex_service.generate_video_content(request.prompt)
        job_id = operation # TODO: change to actual job ID from operation
        
        # Initialize job status
        self.jobs[job_id] = JobStatus(
            status="waiting",
            job_start_time=datetime.now(),
            video_url=None
        )
        
        return job_id

    async def get_job_status(self, job_id: str) -> JobStatus:
        if job_id not in self.jobs:
            return None

        result = await self.vertex_service.get_video_status(job_id)
        return JobStatus(
            status=result,
            job_start_time=self.jobs[job_id].job_start_time
        )
