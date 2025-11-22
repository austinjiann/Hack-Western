from google import genai
from google.genai.types import GenerateVideosConfig, GenerateVideosOperation, Image
from models.job import JobStatus
from utils.env import settings

class VertexService:
    def __init__(self):
        self.client = genai.Client(
            vertexai=settings.GOOGLE_GENAI_USE_VERTEXAI,
            project=settings.GOOGLE_CLOUD_PROJECT,
            location=settings.GOOGLE_CLOUD_LOCATION
        )
        self.bucket_name = settings.GOOGLE_CLOUD_BUCKET_NAME

    async def generate_video_content(self, prompt: str, image_data: bytes = None) -> GenerateVideosOperation:
        # gen vid
        operation = self.client.models.generate_videos(
            model="veo-3.1-fast-generate-001",
            prompt=prompt,
            image=Image(
                image_bytes=image_data,
                mime_type="image/png",
            ),
            config=GenerateVideosConfig(
                aspect_ratio="16:9",
                output_gcs_uri=f"gs://{self.bucket_name}/videos/",
            ),
        )

        return operation
    
    async def get_video_status(self, operation: GenerateVideosOperation) -> JobStatus:
        operation = self.client.operations.get(operation)
        if operation.done:
            return JobStatus(status="done", job_start_time=None, video_url=operation.result.generated_videos[0].video.uri)
        return JobStatus(status="waiting", job_start_time=None, video_url=None)
    
    async def test_service(self):
        return self.client.models.generate_content(
            model="gemini-2.0-flash",
            contents="Hi there, does u work?",
        )
