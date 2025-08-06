import aiohttp
import logging
from datetime import datetime
from typing import Optional
from uuid import uuid4
from src.repositories.base import DatabaseRepository
from src.schemas.job import JobStatus, JobUpdate, WebhookNotification, Job, JobCreate

logger = logging.getLogger(__name__)

class JobService:
    def __init__(self, job_repo: DatabaseRepository[Job]):
        self.db = job_repo
    
    async def create_job(
        self, 
        job_request: JobCreate,
        user_id: str,
    ) -> Job:
        """Create a new job and store it in Firestore."""
        if not user_id: 
            raise ValueError("User ID is required")
        if not job_request.project_id:
            raise ValueError("Project ID is required")
        if not job_request.job_type:
            raise ValueError("Job type is required")
        
        job_id = str(uuid4())
        now = datetime.now()
        
        job_data = Job(
            job_id=job_id,
            user_id=user_id,
            project_id=job_request.project_id,
            job_type=job_request.job_type,
            status=JobStatus.QUEUED,
            created_at=now,
            modified_at=now,
            parameters=job_request.parameters or {},
            webhook_url=job_request.webhook_url
        )
        
        # Store in database using repository
        job_dict = job_data.model_dump()
        job_dict["job_id"] = job_id  # Ensure job_id is set
        logger.info(f"About to create job in database: {job_dict}")
        await self.db.create(job_dict)
        
        # Verify the job was created
        created_job = await self.db.get_by_id(job_id)
        if created_job:
            logger.info(f"✅ Job {job_id} successfully created in database")
        else:
            logger.error(f"❌ Job {job_id} was not found in database after creation!")
        
        logger.info(f"Created job {job_id} for user {user_id}")
        return job_data
    
    async def update_job(self, job_id: str, update_data: JobUpdate) -> Job:
        """Update job status and send webhook notification if configured."""
        # Get current job data
        current_data = await self.db.get_by_id(job_id)
        if current_data is None:
            raise ValueError(f"Job {job_id} not found")
        
        current_data.update(update_data.model_dump(exclude_unset=True))
        current_data["modified_at"] = datetime.now()
        
        # Update in database using repository
        await self.db.update(job_id, current_data)
        
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
        return Job(**current_data)
    
    async def get_job_by_id(self, job_id: str) -> Optional[Job]:
        """Get job status by ID."""
        data = await self.db.get_by_id(job_id)
        return Job(**data) if data else None
    
    async def get_user_jobs(self, user_id: str, limit: int = 50) -> list[Job]:
        """Get all jobs for a specific user."""
        docs = await self.db.find_all(filters={"user_id": user_id}, limit=limit)
        return [Job(**doc) for doc in docs]
    
    async def get_project_jobs(self, project_id: str, user_id: Optional[str] = None, limit: int = 50) -> list[Job]:
        """Get all jobs for a specific project."""
        filters = {"project_id": project_id}
        if user_id:
            filters["user_id"] = user_id
        docs = await self.db.find_all(filters=filters, limit=limit)
        return [Job(**doc) for doc in docs]
    
    async def _send_webhook_notification(self, webhook_url: str, notification: WebhookNotification):
        """Send webhook notification asynchronously."""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    webhook_url,
                    json=notification.model_dump(),
                    headers={"Content-Type": "application/json"},
                    timeout=aiohttp.ClientTimeout(total=10)
                ) as response:
                    if response.status >= 400:
                        logger.warning(f"Webhook notification failed for job {notification.job_id}: {response.status}")
                    else:
                        logger.info(f"Webhook notification sent successfully for job {notification.job_id}")
        except Exception as e:
            logger.error(f"Failed to send webhook notification for job {notification.job_id}: {e}")
