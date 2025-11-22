from dataclasses import dataclass
from datetime import datetime
from typing import Optional, Literal

@dataclass
class VideoJobRequest:
    starting_image: str
    context: str
    prompt: str

@dataclass
class JobStatus:
    status: Optional[Literal["done", "waiting"]]
    job_start_time: datetime
    video_url: Optional[str] = None
