from pydantic import BaseModel, Field
from typing import List

class User(BaseModel):
    user_id: str
    video_ids: List[str] = Field(default_factory=list)
    credits: int 