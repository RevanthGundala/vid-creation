from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from src.dependencies.dependencies_request import get_job_service, get_job_processor, get_mock_user
from src.services.job_service import JobService
from src.services.job_processor import JobProcessor
from src.schemas.job import JobStatus, JobCreate, Job
from pydantic import BaseModel
from src.schemas.user import User

router = APIRouter()

class AssetUrlResponse(BaseModel):
    signed_url: str
    asset_id: str
    filename: str
    storage_path: str

@router.get("/api/jobs/{job_id}", response_model=Job)
async def get_job(
    job_id: str, 
    user: User = Depends(get_mock_user),
    job_service: JobService = Depends(get_job_service)
):
    """
    Get a specific job.
    """
    if not job_id:
        raise HTTPException(status_code=400, detail="Job ID is required")
    
    job = await job_service.get_job_by_id(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
    
    # Skip user ownership check for development
    # if job.user_id != user.user_id:
    #     raise HTTPException(status_code=403, detail=f"Access denied for job {job_id} and user {user.user_id}")
    
    return job

@router.get("/api/jobs/{project_id}", response_model=list[Job])
async def get_project_jobs(
    project_id: str, 
    limit: int = 50,
    user: User = Depends(get_mock_user),
    job_service: JobService = Depends(get_job_service)
):
    """
    Get all jobs for a specific project and user.
    """
    if not project_id:
        raise HTTPException(status_code=400, detail="Project ID is required")
    
    # TODO: Maybe add endpoint that gets all jobs for a project without a user
    jobs = await job_service.get_project_jobs(project_id, user.user_id, limit)
    return jobs

@router.get("/api/jobs", response_model=list[Job])
async def get_user_jobs(
    limit: int = 50,
    user: User = Depends(get_mock_user),
    job_service: JobService = Depends(get_job_service)
):
    """
    Get all jobs for the authenticated user.
    """
    if not user.user_id:
        raise HTTPException(status_code=400, detail="User ID is required")
    jobs = await job_service.get_user_jobs(user.user_id, limit)
    return jobs

@router.post("/api/jobs", response_model=Job)
async def create_job(
    job_request: JobCreate,
    background_tasks: BackgroundTasks,
    user: User = Depends(get_mock_user),
    job_service: JobService = Depends(get_job_service),
    job_processor: JobProcessor = Depends(get_job_processor),
):
    """
    Create a new job of any supported type.
    """
    job = await job_service.create_job(
        job_request,
        user_id=user.user_id,
    )
    
    # Start background processing
    background_tasks.add_task(
        job_processor.process_job,
        job.job_type,
        job.job_id,
        job.parameters
    )
    
    return job

@router.get("/api/jobs/{job_id}/asset-url", response_model=AssetUrlResponse)
async def get_job_asset_url(
    job_id: str,
    user: User = Depends(get_mock_user),
    job_service: JobService = Depends(get_job_service),
):
    """
    Dedicated endpoint to get the signed URL for a completed job's asset.
    This is a separate endpoint from the main job endpoint to avoid bloating the job endpoint with too many responsibilities.
    """
    if not job_id:
        raise HTTPException(status_code=400, detail="Job ID is required")
    
    job = await job_service.get_job_by_id(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
    
    # Skip user ownership check for development
    # if job.user_id != user.user_id:
    #     raise HTTPException(status_code=403, detail=f"Access denied for job {job_id}")
    
    if job.status != JobStatus.COMPLETED:
        raise HTTPException(status_code=400, detail=f"Job {job_id} is not completed. Current status: {job.status}")
    
    result = job.result or {}
    if not result or "signed_url" not in result:
        raise HTTPException(status_code=404, detail=f"No asset URL found for job {job_id}")
    
    return AssetUrlResponse(
        signed_url=result["signed_url"],
        asset_id=result.get("asset_id", job_id),
        filename=result.get("filename", ""),
        storage_path=result.get("storage_path", "")
    )