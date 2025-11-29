from dataclasses import dataclass
from datetime import datetime
from typing import Optional, Literal
from google.genai.types import GenerateVideosOperation

@dataclass
class VideoGenerationInput:
    custom_prompt: str
    global_context: str
    duration_seconds: int = 6

@dataclass
class VideoJobRequest:
    starting_image: bytes
    global_context: str
    custom_prompt: str
    duration_seconds: int = 6
    ending_image: Optional[bytes] = None

@dataclass
class JobStatus:
    job_start_time: datetime
    status: Optional[Literal["done", "waiting", "error"]]
    job_end_time: Optional[datetime] = None
    video_url: Optional[str] = None
    error: Optional[str] = None

@dataclass
class VideoJob:
    job_id: str
    request: VideoJobRequest
    job_start_time: datetime
    operation: GenerateVideosOperation
