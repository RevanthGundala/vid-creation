import asyncio
import aiohttp
import logging
from datetime import datetime
from typing import Optional, Dict, Any, Literal
from uuid import uuid4
from src.database.firestore import FirestoreService
from src.schemas.job import JobStatus, JobUpdate, WebhookNotification

logger = logging.getLogger(__name__)

class JobService:
    def __init__(self):
        self.db = FirestoreService.get_firestore_service()
    
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
        await self.db.create_document("jobs", job_id, job_data.dict())
        
        logger.info(f"Created job {job_id} for project {project_id} for user {user_id}")
        return job_data
    
    async def update_job(self, job_id: str, update_data: JobUpdate) -> JobStatus:
        """Update job status and send webhook notification if configured."""
        # Get current job data
        current_data = await self.db.get_document("jobs", job_id)
        if current_data is None:
            raise ValueError(f"Job {job_id} not found")
        
        current_data.update(update_data.dict(exclude_unset=True))
        current_data["modified_at"] = datetime.now()
        
        # Update in Firestore
        await self.db.update_document("jobs", job_id, current_data)
        
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
        data = await self.db.get_document("jobs", job_id)
        if data:
            return JobStatus(**data)
        return None
    
    async def get_user_jobs(self, user_id: str, limit: int = 50) -> list[JobStatus]:
        """Get all jobs for a specific user."""
        filters = [("user_id", "==", user_id)]
        docs = await self.db.query_collection("jobs", filters=filters, order_by="created_at", direction="DESCENDING", limit=limit)
        
        return [JobStatus(**doc) for doc in docs]
    
    async def get_project_jobs(self, project_id: str, limit: int = 50) -> list[JobStatus]:
        """Get all jobs for a specific project."""
        filters = [("project_id", "==", project_id)]
        docs = await self.db.query_collection("jobs", filters=filters, order_by="created_at", direction="DESCENDING", limit=limit)
        
        return [JobStatus(**doc) for doc in docs]
    
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