import asyncio
import time
from services.storage_service import StorageService
import uuid
import shutil

class VideoMergeService:
    def __init__(self, storage_service: StorageService):
        self.storage_service = storage_service
        # Check if ffmpeg is available
        self._check_ffmpeg()

    def _check_ffmpeg(self):
        """Check if ffmpeg is available in the system."""
        if not shutil.which("ffmpeg"):
            raise RuntimeError(
                "ffmpeg is not installed or not in PATH. "
                "Please install ffmpeg to use video merging functionality."
            )

    async def merge_videos(self, video_urls: list[str], user_id: str) -> str:
        """
        Merges multiple videos from URLs into a single video using FFmpeg with HTTP inputs.
        This is the fastest approach - FFmpeg downloads and merges in one pass, no temporary files.
        
        Args:
            video_urls: List of video URLs in order (from root to end frame)
            user_id: User ID for organizing storage
            
        Returns:
            Public URL of the merged video
        """
        start_time = time.time()
        print(f"[VIDEO MERGE] Starting merge for user {user_id}: {len(video_urls)} videos")
        
        if not video_urls:
            raise ValueError("No video URLs provided")
        
        if len(video_urls) == 1:
            # Single video, just return the URL
            return video_urls[0]
        
        try:
            # Merge videos using FFmpeg with HTTP inputs directly
            merge_start = time.time()
            
            merged_video_data = await self._merge_with_ffmpeg_http(video_urls)
            
            merge_duration = time.time() - merge_start
            merged_size = len(merged_video_data)
            
            # Upload to storage
            upload_start = time.time()
            video_id = str(uuid.uuid4())
            video_path = f"videos/{user_id}/merged_{video_id}.mp4"
            
            public_url = await self.storage_service.upload_file(video_path, merged_video_data)
            
            upload_duration = time.time() - upload_start
            total_duration = time.time() - start_time
            
            return public_url
        except Exception as e:
            raise

    async def _merge_with_ffmpeg_http(self, video_urls: list[str]) -> bytes:
        """
        Merges videos using FFmpeg with HTTP inputs directly.
        FFmpeg downloads and merges in one pass - no temporary files, no intermediate downloads.
        Uses concat demuxer with HTTP URLs for maximum speed.
        
        Strategy:
        1. Create concat file content in memory (as string)
        2. Pipe concat file to FFmpeg via stdin
        3. FFmpeg reads videos directly from HTTP URLs
        4. Stream output directly to stdout
        """
        # Build concat file content in memory
        # Format: file 'http://url1'
        #         file 'http://url2'
        #         ...
        concat_content = "".join([f"file '{url}'\n" for url in video_urls])
        concat_bytes = concat_content.encode('utf-8')
        
        # FFmpeg command using concat demuxer with stdin for concat file
        # -protocol_whitelist allows HTTP/HTTPS access (required for remote URLs)
        # -f concat -safe 0 -i - reads concat file from stdin
        # -c copy uses stream copy (no re-encoding) for maximum speed
        # -movflags frag_keyframe+empty_moov enables streaming output
        ffmpeg_cmd = [
            "ffmpeg",
            "-protocol_whitelist", "file,http,https,tcp,tls,fd",  # Allow HTTP/HTTPS protocols and fd for stdin
            "-f", "concat",
            "-safe", "0",
            "-i", "-",  # Read concat file from stdin
            "-c", "copy",  # Stream copy (no re-encoding) for maximum speed
            "-f", "mp4",
            "-movflags", "frag_keyframe+empty_moov",  # Enable streaming output
            "-"  # Output to stdout
        ]
        
        # Start FFmpeg process
        process = await asyncio.create_subprocess_exec(
            *ffmpeg_cmd,
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        # Write concat file to stdin first, then read output in parallel
        async def write_concat_file():
            """Write concat file content to FFmpeg stdin."""
            try:
                process.stdin.write(concat_bytes)
                await process.stdin.drain()
                process.stdin.close()
                await process.stdin.wait_closed()
            except Exception as e:
                raise
        
        async def read_output():
            """Read merged video output from FFmpeg stdout."""
            chunks = []
            try:
                while True:
                    chunk = await process.stdout.read(1024 * 1024)  # Read 1MB chunks
                    if not chunk:
                        break
                    chunks.append(chunk)
                return b"".join(chunks)
            except Exception as e:
                raise
        
        async def monitor_progress():
            """Monitor FFmpeg stderr for progress and errors."""
            chunks = []
            try:
                while True:
                    chunk = await process.stderr.read(1024)
                    if not chunk:
                        break
                    chunks.append(chunk)
            except Exception as e:
                pass
            
            return b"".join(chunks)

        # Write concat file first, then read output and monitor progress in parallel
        try:
            await write_concat_file()
            stdout_data, stderr_data = await asyncio.gather(
                read_output(),
                monitor_progress()
            )
        except Exception as e:
            process.terminate()
            await process.wait()
            raise Exception(f"Error during FFmpeg execution: {e}")
        
        # Wait for process to complete
        return_code = await process.wait()

        if return_code != 0:
            error_msg = stderr_data.decode() if stderr_data else "Unknown FFmpeg error"
            raise Exception(f"FFmpeg failed with return code {return_code}: {error_msg}")
        
        return stdout_data
