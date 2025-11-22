from google import genai
from models.job import JobStatus
from utils.env import settings

class VertexService:
    def __init__(self):
        self.client = genai.Client(
            vertexai=settings.GOOGLE_GENAI_USE_VERTEXAI,
            project=settings.GOOGLE_CLOUD_PROJECT,
            location=settings.GOOGLE_CLOUD_LOCATION
        )

    async def generate_video_content(self, prompt: str, image_data: bytes = None):
        # gen vid
        return "test_vid_id"
    
    async def get_video_status(self, video_id: str):
        return "waiting"
    
    async def test_service(self):
        return self.client.models.generate_content(
            model="gemini-2.0-flash",
            contents="Hi there, does u work?",
        )
