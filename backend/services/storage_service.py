from google.cloud import storage
from utils.env import settings

class StorageService:
    def __init__(self):
        self.client = storage.Client()
        self.bucket = self.client.bucket(settings.GOOGLE_CLOUD_BUCKET_NAME)

    async def upload_file(self, item_name: str, file_data: bytes):
        blob = self.bucket.blob(item_name)
        blob.upload_from_string(file_data)
        return True
