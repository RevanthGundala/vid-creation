from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime

class Generate3DAssetRequest(BaseModel):
    prompt: str = Field(..., description="Text prompt for 3D asset generation", min_length=1, max_length=1000)
    project_id: str = Field(..., description="Project ID that the asset belongs to")
    webhook_url: Optional[str] = Field(None, description="Optional webhook URL for job status updates")

class Generate3DAssetResponse(BaseModel):
    job_id: str = Field(..., description="Unique identifier for the generated project")
    status: Literal["queued", "processing", "completed", "failed"] = Field(..., description="Current status of the asset generation")

class AssetMetadata(BaseModel):
    asset_id: str
    project_id: str
    user_id: str
    name: str
    description: Optional[str] = None
    type: Literal["video", "image", "audio", "3d"]
    status: Literal["queued", "uploaded", "processing", "completed", "failed"]
    S3URL: str
    created_at: datetime
    updated_at: datetime
