from blacksheep import json, Response
from blacksheep.server.controllers import APIController, post, get
from models.job import VideoJobRequest
from services.job_service import JobService

class Jobs(APIController):
    def __init__(self, job_service: JobService):
        self.job_service = job_service

    @post("/video")
    async def add_video_job(self, data: VideoJobRequest):
        """
        Starts a video generation job.
        Input: starting image, context, any other user-prompt
        Return: jobId
        """
        job_id = await self.job_service.create_job(data)
        return json({"jobId": job_id})

    @get("/video/{job_id}")
    async def get_job_status(self, job_id: str):
        """
        Get status of job
        """
        status = await self.job_service.get_job_status(job_id)
        
        if not status:
            return json({"error": "Job not found"}, status=404)

        return json({
            "status": status.status,
            "jobStartTime": status.job_start_time.isoformat(),
            "videoURL": status.video_url
        })
