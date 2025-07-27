from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime

class User(BaseModel):
    user_id: str
    video_ids: List[str] = Field(default_factory=list)
    credits: int 

class Project(BaseModel):
    project_id: str
    user_id: str
    name: str
    created_at: datetime
    modified_at: datetime

class VideoMetadata(BaseModel):
    video_id: str
    user_id: str
    name: str
    description: Optional[str] = None
    status: Literal["pending", "uploaded"]
    S3URL: str
    created_at: datetime