from pydantic import BaseModel
from datetime import datetime

class Project(BaseModel):
    project_id: str
    user_id: str
    name: str
    created_at: datetime
    modified_at: datetime
