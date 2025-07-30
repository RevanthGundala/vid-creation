import asyncio
import aiohttp
import logging
from datetime import datetime
from typing import Optional, Dict, Any, Literal
from uuid import uuid4
from src.database.firebase import get_firestore_client
from src.schemas.job import JobStatus, JobUpdate, WebhookNotification

logger = logging.getLogger(__name__)

class JobService:
    def __init__(self):
        self.db = get_firestore_client()
    
    async def create_job(
        self, 
        job_type: Literal["3d", "video"],
        parameters: Dict[str, Any],
        user_id: str = None,
        project_id: str = None,
        webhook_url: Optional[str] = None
    ) -> JobStatus:
        """Create a new job and store it in Firestore."""
        job_id = str(uuid4())
        now = datetime.now()
        
        job_data = JobStatus(
            job_id=job_id,
            project_id=project_id,
            user_id=user_id,
            job_type=job_type,
            status="queued",
            created_at=now,
            modified_at=now,
            webhook_url=webhook_url
        )
        
        # Store in Firestore
        doc_ref = self.db.collection("jobs").document(job_id)
        doc_ref.set(job_data.dict())
        
        logger.info(f"Created job {job_id} for project {project_id} for user {user_id}")
        return job_data
    
    async def update_job(self, job_id: str, update_data: JobUpdate) -> JobStatus:
        """Update job status and send webhook notification if configured."""
        doc_ref = self.db.collection("jobs").document(job_id)
        
        # Get current job data
        doc = doc_ref.get()
        if not doc.exists:
            raise ValueError(f"Job {job_id} not found")
        
        current_data = doc.to_dict()
        current_data.update(update_data.dict(exclude_unset=True))
        current_data["modified_at"] = datetime.now()
        
        # Update in Firestore
        doc_ref.update(current_data)
        
        # Send webhook notification if URL is provided
        if current_data.get("webhook_url"):
            await self._send_webhook_notification(
                current_data["webhook_url"],
                WebhookNotification(
                    job_id=job_id,
                    status=current_data["status"],
                    progress=current_data.get("progress"),
                    result=current_data.get("result"),
                    error=current_data.get("error")
                )
            )
        
        logger.info(f"Updated job {job_id} to status {current_data['status']}")
        return JobStatus(**current_data)
    
    async def get_job(self, job_id: str) -> Optional[JobStatus]:
        """Get job status by ID."""
        doc_ref = self.db.collection("jobs").document(job_id)
        doc = doc_ref.get()
        
        if doc.exists:
            return JobStatus(**doc.to_dict())
        return None
    
    async def get_user_jobs(self, user_id: str, limit: int = 50) -> list[JobStatus]:
        """Get all jobs for a specific user."""
        query = self.db.collection("jobs").where("user_id", "==", user_id).order_by("created_at", direction="DESCENDING").limit(limit)
        docs = query.stream()
        
        return [JobStatus(**doc.to_dict()) for doc in docs]
    
    async def get_project_jobs(self, project_id: str, limit: int = 50) -> list[JobStatus]:
        """Get all jobs for a specific project."""
        query = self.db.collection("jobs").where("project_id", "==", project_id).order_by("created_at", direction="DESCENDING").limit(limit)
        docs = query.stream()
        
        return [JobStatus(**doc.to_dict()) for doc in docs]
    
    async def _send_webhook_notification(self, webhook_url: str, notification: WebhookNotification):
        """Send webhook notification asynchronously."""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    webhook_url,
                    json=notification.dict(),
                    headers={"Content-Type": "application/json"},
                    timeout=aiohttp.ClientTimeout(total=10)
                ) as response:
                    if response.status >= 400:
                        logger.warning(f"Webhook notification failed for job {notification.job_id}: {response.status}")
                    else:
                        logger.info(f"Webhook notification sent successfully for job {notification.job_id}")
        except Exception as e:
            logger.error(f"Failed to send webhook notification for job {notification.job_id}: {e}")

# Global instance
job_service = JobService() 