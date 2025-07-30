import asyncio
import logging
import os
from pathlib import Path
from datetime import datetime
from typing import Dict, Any
from src.services.job_service import job_service
from src.schemas.job import JobUpdate

logger = logging.getLogger(__name__)

class JobProcessor:
    def __init__(self):
        self.assets_dir = Path("assets/ksplat")
        self.assets_dir.mkdir(parents=True, exist_ok=True)
    
    async def process_3d_asset_job(self, job_id: str, parameters: Dict[str, Any]):
        """Process a 3D asset generation job."""
        try:
            # Update job status to processing
            await job_service.update_job(job_id, JobUpdate(
                status="processing",
                started_at=datetime.now(),
                progress=0.0
            ))
            
            prompt = parameters.get("prompt", "")
            logger.info(f"Starting 3D asset generation for job {job_id} with prompt: {prompt}")
            
            # Simulate processing steps with progress updates
            steps = [
                ("Initializing model", 10),
                ("Processing prompt", 25),
                ("Generating 3D geometry", 50),
                ("Optimizing mesh", 75),
                ("Finalizing asset", 90),
                ("Saving to storage", 100)
            ]
            
            for step_name, progress in steps:
                logger.info(f"Job {job_id}: {step_name}")
                await job_service.update_job(job_id, JobUpdate(progress=progress))
                await asyncio.sleep(2)  # Simulate processing time
            
            # Generate output file path
            output_filename = f"{job_id}.ksplat"
            output_path = self.assets_dir / output_filename
            
            # For now, we'll create a placeholder file
            # In production, this would be where your actual 3D generation happens
            output_path.touch()
            
            # Update job as completed
            result = {
                "output_file": str(output_path),
                "filename": output_filename,
                "download_url": f"/api/assets/{job_id}"
            }
            
            await job_service.update_job(job_id, JobUpdate(
                status="completed",
                completed_at=datetime.now(),
                progress=100.0,
                result=result
            ))
            
            logger.info(f"Job {job_id} completed successfully")
            
        except Exception as e:
            logger.error(f"Job {job_id} failed: {e}")
            await job_service.update_job(job_id, JobUpdate(
                status="failed",
                completed_at=datetime.now(),
                error=str(e)
            ))
    
    async def process_job(self, job_id: str, job_type: str, parameters: Dict[str, Any]):
        """Route job to appropriate processor based on type."""
        if job_type == "3d":
            await self.process_3d_asset_job(job_id, parameters)
        else:
            raise ValueError(f"Unknown job type: {job_type}")

# Global instance
job_processor = JobProcessor() 