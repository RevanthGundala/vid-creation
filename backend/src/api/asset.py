from datetime import datetime
from uuid import uuid4
from fastapi import APIRouter, HTTPException, BackgroundTasks, UploadFile, File
from fastapi.responses import FileResponse
from src.schemas.project import Project
from src.schemas.asset import Generate3DAssetRequest, Generate3DAssetResponse, AssetMetadata
from src.schemas.job import JobStatus, JobCreate, JobUpdate
from src.database.firebase import FirebaseService
from src.services.job_service import job_service
from src.services.job_processor import job_processor
from fastapi import Depends
import os
from pathlib import Path
from pydantic import BaseModel, Field
from typing import Optional, Literal
from src.database.gcs import get_gcs_client
from src.config import config

router = APIRouter()

@router.post("/api/generate-3d-asset", response_model=Generate3DAssetResponse)
async def generate_3d_asset(
    request: Generate3DAssetRequest, 
    background_tasks: BackgroundTasks,
    user=Depends(FirebaseService.firebase_auth_dependency)
):
    """
    Generate a 3D asset based on a text prompt.
    
    This endpoint creates a new job for 3D asset generation and returns
    a job ID that can be used to track the generation progress.
    """
    # Create job using the job service
    job = await job_service.create_job(
        job_type="3d",
        parameters={"prompt": request.prompt},
        user_id=user["uid"],
        project_id=request.project_id,
        webhook_url=request.webhook_url
    )
    
    # Start background processing
    background_tasks.add_task(
        job_processor.process_job,
        job.job_id,
        job.job_type,
        {"prompt": request.prompt}
    )
    
    return Generate3DAssetResponse(job_id=job.job_id, status=job.status)

@router.get("/api/jobs/{job_id}", response_model=JobStatus)
async def get_job_status(job_id: str, user=Depends(FirebaseService.firebase_auth_dependency)):
    """
    Get the status of a specific job.
    """
    job = await job_service.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Ensure user can only access their own jobs
    if job.user_id != user["uid"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return job

@router.get("/api/projects/{project_id}/jobs", response_model=list[JobStatus])
async def get_project_jobs(project_id: str, user=Depends(FirebaseService.firebase_auth_dependency)):
    """
    Get all jobs for a specific project.
    """
    jobs = await job_service.get_project_jobs(project_id)
    return jobs

@router.get("/api/jobs", response_model=list[JobStatus])
async def get_user_jobs(
    limit: int = 50,
    user=Depends(FirebaseService.firebase_auth_dependency)
):
    """
    Get all jobs for the authenticated user.
    """
    jobs = await job_service.get_user_jobs(user["uid"], limit)
    return jobs

@router.post("/api/jobs", response_model=JobStatus)
async def create_job(
    job_request: JobCreate,
    background_tasks: BackgroundTasks,
    user=Depends(FirebaseService.firebase_auth_dependency)
):
    """
    Create a new job of any supported type.
    """
    job = await job_service.create_job(
        job_type=job_request.job_type,
        parameters=job_request.parameters,
        user_id=user["uid"],
        webhook_url=job_request.webhook_url
    )
    
    # Start background processing
    background_tasks.add_task(
        job_processor.process_job,
        job.job_id,
        job.job_type,
        job_request.parameters
    )
    
    return job

@router.get("/api/assets/{job_id}")
async def get_ksplat_asset(job_id: str, user=Depends(FirebaseService.firebase_auth_dependency)):
    """
    Serve a .ksplat file for a specific job (authenticated).
    """
    # Get job to verify ownership and status
    job = await job_service.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job.user_id != user["uid"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    if job.status != "completed":
        raise HTTPException(status_code=400, detail="Job not completed yet")
    
    # Get the filename from job result
    filename = f"{job_id}.ksplat"
    file_path = Path("assets/ksplat") / filename
    
    # Check if file exists
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Asset file not found")
    
    # Return the file with appropriate headers for .ksplat files
    return FileResponse(
        path=str(file_path),
        filename=filename,
        media_type="application/octet-stream"
    )

@router.get("/api/assets/public/{job_id}")
async def get_ksplat_asset_public(job_id: str):
    """
    Serve a .ksplat file for a specific job (public, for development).
    """
    # Get job to verify status
    job = await job_service.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job.status != "completed":
        raise HTTPException(status_code=400, detail="Job not completed yet")
    
    # Get the filename from job result
    filename = f"{job_id}.ksplat"
    file_path = Path("assets/ksplat") / filename
    
    # Check if file exists
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Asset file not found")
    
    # Return the file with appropriate headers for .ksplat files
    return FileResponse(
        path=str(file_path),
        filename=filename,
        media_type="application/octet-stream",
        headers={"Content-Disposition": f"inline; filename={filename}"}
    )

class UploadToGCSResponse(BaseModel):
    message: str
    filename: str

@router.get("/api/list-gcs-files")
async def list_gcs_files():
    """
    List all files in the GCS bucket.
    """
    try:
        gcs_client = get_gcs_client()
        if gcs_client is None:
            raise HTTPException(status_code=500, detail="GCS client not available")
        
        bucket = gcs_client.bucket(config.gcp_bucket_name)
        blobs = list(bucket.list_blobs())
        
        files = []
        for blob in blobs:
            files.append({
                "name": blob.name,
                "size": blob.size,
                "created": blob.time_created.isoformat() if blob.time_created else None,
                "content_type": blob.content_type
            })
        
        return {"files": files, "total": len(files)}
    except Exception as e:
        print(f"❌ Failed to list files: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/download-gcs-file/{filename}")
async def download_gcs_file(filename: str):
    """
    Download a file from GCS by filename.
    """
    try:
        gcs_client = get_gcs_client()
        if gcs_client is None:
            raise HTTPException(status_code=500, detail="GCS client not available")
        
        bucket = gcs_client.bucket(config.gcp_bucket_name)
        blob = bucket.blob(filename)
        
        if not blob.exists():
            raise HTTPException(status_code=404, detail="File not found")
        
        # Download the file content
        content = blob.download_as_bytes()
        
        # Return the file with appropriate headers
        from fastapi.responses import Response
        return Response(
            content=content,
            media_type=blob.content_type or "application/octet-stream",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        print(f"❌ Failed to download file: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/upload-to-gcs")
async def upload_to_gcs(
    file: UploadFile = File(...),
    user=Depends(FirebaseService.firebase_auth_dependency)
):
    """
    Upload a file to GCS.
    """
    try:
        gcs_client = get_gcs_client()
        if gcs_client is None:
            raise HTTPException(status_code=500, detail="GCS client not available")
        
        # Generate a unique filename
        filename = f"{user['uid']}_{file.filename}"
        
        # Get the bucket
        bucket = gcs_client.bucket(config.gcp_bucket_name)
        blob = bucket.blob(filename)
        
        # Upload the file content
        content = await file.read()
        # Use upload_from_string for better emulator compatibility
        blob.upload_from_string(content, content_type=file.content_type)
        
        print(f"✅ File uploaded to GCS: {filename}")
        return UploadToGCSResponse(message="File uploaded successfully", filename=filename)
    except Exception as e:
        print(f"❌ Upload failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    