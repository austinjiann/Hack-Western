from blacksheep import Response, FromFiles, json
from blacksheep.server.controllers import APIController, put
from services.storage_service import StorageService

class Files(APIController):
    def __init__(self, storage_service: StorageService):
        self.storage_service = storage_service

    @put("/video/{item_name}")
    async def update_video(self, bucket_name: str, item_name: str, files: FromFiles):
        """
        Uploads a video to a specific bucket and item name.
        Input: video object (as form data or blob)
        Return: status codes
        """

        if not files.value:
            return json({"error": "No file provided"}, status=400)

        video_file = files.value[0]
        
        await self.storage_service.upload_file(bucket_name, item_name, video_file.data)
        
        return Response(200)
