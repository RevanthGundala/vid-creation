from pydantic import BaseModel, Field
from typing import List, Optional

class User(BaseModel):
    user_id: str
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    credits: int = 0
    profile_picture_url: Optional[str] = None