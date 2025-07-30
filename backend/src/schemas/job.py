from pydantic import BaseModel, Field
from typing import Dict, Any, Literal, Optional
from datetime import datetime

class JobStatus(BaseModel):
    job_id: str = Field(..., description="Unique job identifier")
    project_id: str = Field(..., description="Project ID that the job is associated with")
    user_id: str = Field(..., description="User who created the job")
    job_type: Literal["3d", "video"] = Field(..., description="Type of job")
    status: Literal["queued", "processing", "completed", "failed"] = Field(..., description="Current job status")
    created_at: datetime = Field(..., description="Job creation timestamp")
    modified_at: datetime = Field(..., description="Last update timestamp")
    started_at: Optional[datetime] = Field(None, description="When processing started")
    completed_at: Optional[datetime] = Field(None, description="When processing completed")
    progress: Optional[float] = Field(None, description="Progress percentage (0-100)")
    result: Optional[Dict[str, Any]] = Field(None, description="Job result data")
    error: Optional[str] = Field(None, description="Error message if failed")
    webhook_url: Optional[str] = Field(None, description="Webhook URL for notifications")

class JobCreate(BaseModel):
    job_type: Literal["3d", "video"] = Field(..., description="Type of job to create")
    parameters: Dict[str, Any] = Field(..., description="Job parameters")
    webhook_url: Optional[str] = Field(None, description="Optional webhook URL for notifications")

class JobUpdate(BaseModel):
    status: Optional[Literal["queued", "processing", "completed", "failed"]] = None
    progress: Optional[float] = Field(None, ge=0, le=100)
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

class WebhookNotification(BaseModel):
    job_id: str = Field(..., description="Job identifier")
    status: Literal["pending", "processing", "completed", "failed"] = Field(..., description="Current status")
    progress: Optional[float] = Field(None, description="Progress percentage")
    result: Optional[Dict[str, Any]] = Field(None, description="Job result")
    error: Optional[str] = Field(None, description="Error message if failed")
    timestamp: datetime = Field(default_factory=datetime.now, description="Notification timestamp")