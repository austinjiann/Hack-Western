from google.cloud import storage
from utils.env import settings
import os

class StorageService:
    def __init__(self):
        # Only initialize if bucket name is configured
        if settings.GOOGLE_CLOUD_BUCKET_NAME:
            try:
                from google.oauth2 import service_account
                
                # Try to use service account key if provided
                credentials = None
                service_account_path = (
                    getattr(settings, 'GOOGLE_APPLICATION_CREDENTIALS', None) or
                    os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
                )
                
                if service_account_path and os.path.exists(service_account_path):
                    credentials = service_account.Credentials.from_service_account_file(
                        service_account_path
                    )
                
                # Initialize client with credentials (or use default)
                if credentials:
                    self.client = storage.Client(credentials=credentials)
                else:
                    self.client = storage.Client()
                
                self.bucket = self.client.bucket(settings.GOOGLE_CLOUD_BUCKET_NAME)
            except Exception as e:
                print(f"Warning: Could not initialize Google Cloud Storage: {e}")
                self.client = None
                self.bucket = None
        else:
            self.client = None
            self.bucket = None

    async def upload_file(self, item_name: str, file_data: bytes):
        if not self.bucket:
            raise ValueError("Google Cloud Storage not configured. Set GOOGLE_CLOUD_BUCKET_NAME in .env")
        
        blob = self.bucket.blob(item_name)
        blob.upload_from_string(file_data)
        
        # Try to make the blob publicly readable
        # If uniform bucket-level access is enabled, this will fail
        try:
            blob.make_public()
            return blob.public_url
        except Exception:
            # If uniform bucket-level access is enabled, return the public URL format
            # Format: https://storage.googleapis.com/{bucket_name}/{object_name}
            bucket_name = self.bucket.name
            return f"https://storage.googleapis.com/{bucket_name}/{item_name}"
