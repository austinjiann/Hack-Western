import httpx
import tempfile
import os
import shutil
from moviepy import VideoFileClip, concatenate_videoclips
from services.storage_service import StorageService
import uuid

class VideoMergeService:
    def __init__(self, storage_service: StorageService):
        self.storage_service = storage_service

    async def merge_videos(self, video_urls: list[str], user_id: str) -> str:
        """
        Merges multiple videos from URLs into a single video.
        
        Args:
            video_urls: List of video URLs in order (from root to end frame)
            user_id: User ID for organizing storage
            
        Returns:
            Public URL of the merged video
        """
        if not video_urls:
            raise ValueError("No video URLs provided")
        
        # Create temporary directory for processing
        temp_dir = tempfile.mkdtemp()
        temp_files = []
        
        try:
            # Download all videos
            clips = []
            async with httpx.AsyncClient(timeout=300.0) as client:  # Increased timeout for large videos
                for i, video_url in enumerate(video_urls):
                    try:
                        # Download with longer timeout for large videos
                        response = await client.get(video_url, timeout=300.0, follow_redirects=True)
                        response.raise_for_status()
                        
                        # Save to temporary file
                        temp_file = os.path.join(temp_dir, f"video_{i}.mp4")
                        with open(temp_file, "wb") as f:
                            # Write content (httpx handles streaming internally)
                            f.write(response.content)
                        temp_files.append(temp_file)
                        
                        # Load video clip (moviepy will use ffmpeg)
                        clip = VideoFileClip(temp_file)
                        clips.append(clip)
                    except Exception as e:
                        # Clean up already loaded clips
                        for clip in clips:
                            try:
                                clip.close()
                            except:
                                pass
                        raise Exception(f"Failed to download video {i} from {video_url}: {str(e)}")
            
            if not clips:
                raise ValueError("No valid videos to merge")
            
            # Concatenate videos
            final_clip = concatenate_videoclips(clips, method="compose")
            
            # Save merged video to temporary file
            merged_temp_file = os.path.join(temp_dir, "merged_video.mp4")
            final_clip.write_videofile(
                merged_temp_file,
                codec="libx264",
                audio_codec="aac",
                temp_audiofile=os.path.join(temp_dir, "temp_audio.m4a"),
                remove_temp=True
            )
            
            # Clean up clips
            final_clip.close()
            for clip in clips:
                clip.close()
            
            # Read merged video
            with open(merged_temp_file, "rb") as f:
                merged_video_data = f.read()
            
            # Upload to storage
            video_id = str(uuid.uuid4())
            video_path = f"videos/{user_id}/merged_{video_id}.mp4"
            public_url = await self.storage_service.upload_file(video_path, merged_video_data)
            
            return public_url
            
        finally:
            # Clean up temporary files and directory
            # Use shutil for more reliable cleanup
            if os.path.exists(temp_dir):
                try:
                    shutil.rmtree(temp_dir)
                except Exception as e:
                    print(f"Warning: Failed to clean up temp directory {temp_dir}: {e}")

