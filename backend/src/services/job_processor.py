import logging
from pathlib import Path
from datetime import datetime
from typing import Dict, Any
from src.repositories.base import FileStorageRepository
from src.services.job_service import JobService
from src.schemas.job import JobType, JobUpdate, JobStatus

logger = logging.getLogger(__name__)

class JobProcessor:
    def __init__(self, job_service: JobService, file_storage: FileStorageRepository):
        self.job_service = job_service
        self.file_storage = file_storage
        self.assets_dir = Path("assets")  # Directory for temporary asset files
        
    async def process_3d_asset_job(self, job_type: JobType, job_id: str, parameters: Dict[str, Any]):
        """Process a 3D asset generation job."""
        try:
            # Update job status to processing
            await self.job_service.update_job(job_id, JobUpdate(
                status=JobStatus.PROCESSING,
                started_at=datetime.now(),
                progress=0.0
            ))
            
            prompt = parameters.get("prompt")
            if not prompt:
                raise ValueError(f"Job {job_id} failed: prompt is required")
            logger.info(f"Starting 3D asset generation for job {job_id} with prompt: {prompt}")
            
            # Generate output file path
            # TODO: Add file extension to parameters
            output_filename = f"{job_id}.{parameters.get('file_type')}"
            output_path = self.assets_dir / output_filename
            
            # TODO: Add actual 3D generation here
            # Don't create a file, just upload empty bytes directly
            # Create a binary placeholder that's clearly not text
            file_content = b'\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09'  # Binary data
            logger.warning(f"Uploading binary placeholder content for {output_filename}")

            # Upload the generated asset to Firebase Storage
            storage_path = f"assets/{job_id}/{output_filename}"
            
            upload_result = await self.file_storage.upload_file(
                file_content, 
                storage_path, 
                content_type="application/octet-stream"
            )
            
            # Get the signed URL from the upload result
            signed_url = upload_result.get("public_url", "")

            result = { 
                "output_file": str(output_path),
                "filename": output_filename,
                "storage_path": storage_path,
                "signed_url": signed_url,
                "asset_id": job_id
            } 
            await self.job_service.update_job(job_id, JobUpdate(
                status=JobStatus.COMPLETED,
                completed_at=datetime.now(),
                progress=100.0,
                result=result
            ))
            
            logger.info(f"Job {job_id} completed successfully")
            
        except Exception as e:
            logger.error(f"Job {job_id} failed: {e}")
            await self.job_service.update_job(job_id, JobUpdate(
                status=JobStatus.FAILED,
                completed_at=datetime.now(),
                error=str(e)
            ))
    
    async def process_job(self, job_type: JobType, job_id: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Route job to appropriate processor based on type."""
        result = {}
        if not parameters:
            raise ValueError(f"Job {job_id} failed: parameters are required")
        
        match job_type:
            case JobType.OBJECT:
                result = await self.process_3d_asset_job(job_type, job_id, parameters)
            case JobType.VIDEO:
                ...
            case _:
                raise ValueError(f"Unknown job type: {job_type}")
        return result
