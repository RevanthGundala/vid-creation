import logging
import os
import requests
from pathlib import Path
from datetime import datetime
from typing import Dict, Any
from src.repositories.base import FileStorageRepository
from src.services.job_service import JobService
from src.schemas.job import JobType, JobUpdate, JobStatus
import replicate
from src.config import config

logger = logging.getLogger(__name__)

class JobProcessor:
    def __init__(self, job_service: JobService, file_storage: FileStorageRepository):
        self.job_service = job_service
        self.file_storage = file_storage
        self.assets_dir = Path("assets")  # Directory for temporary asset files
        
    async def process_3d_asset_job(self, job_id: str, parameters: Dict[str, Any]):
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
            
            output_filename = f"{job_id}.{parameters.get('file_type')}"
            output_path = self.assets_dir / output_filename
            
            # TODO: Add actual 3D generation here
            # For now, use an example K-Splat file
            truck_ksplat_path = self.assets_dir / "ksplat" / "truck.ksplat"
            if truck_ksplat_path.exists():
                with open(truck_ksplat_path, 'rb') as f:
                    file_content = f.read()
                logger.info(f"Using truck K-Splat file: {truck_ksplat_path}")
            else:
                # Fallback to placeholder if example file doesn't exist
                logger.warning(f"Truck K-Splat file not found, using placeholder content for {output_filename}")
                raise FileNotFoundError(f"Truck K-Splat file not found: {truck_ksplat_path}")

            # Upload the generated asset to Firebase Storage
            storage_path = f"assets/{job_id}/{output_filename}"
            
            upload_result = await self.file_storage.upload_bytes(
                file_content, 
                storage_path, 
                content_type="application/octet-stream"
            )
            
            # Get the signed URL from the upload result
            # Generate a signed download URL for the uploaded file
            try:
                signed_url = await self.file_storage.generate_download_url(storage_path, 86400)  # 24 hours
                print(f"✅ Generated signed URL: {signed_url[:100]}...")  # Show first 100 chars
            except Exception as e:
                print(f"❌ Failed to generate signed URL: {e}")
                signed_url = ""

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

    async def process_video_job(self, job_id: str, parameters: Dict[str, Any]):
        """Process a video generation job."""
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
            logger.info(f"Starting video generation for job {job_id} with prompt: {prompt}")

            # TODO: Customize the video generation parameters
            if os.getenv("REPLICATE_API_TOKEN"):
                output = replicate.run(
                    config.REPLICATE_VIDEO_MODEL_ID,
                    input={
                        "prompt": prompt,
                        "go_fast": True,
                        "num_frames": 81,
                        "resolution": "480p",
                        "aspect_ratio": "16:9",
                        "sample_shift": 12,
                        "frames_per_second": 16
                    } 
                )

                # Get the direct URL from Replicate output
                # Handle the output properly - it might be a FileOutput object or string
                logger.info(f"Replicate output type: {type(output)}")
                logger.info(f"Replicate output: {output}")
                
                if hasattr(output, 'url'):
                    # If it's a FileOutput object
                    replicate_video_url = output.url()
                    logger.info(f"Extracted URL from FileOutput: {replicate_video_url}")
                else:
                    # If it's already a string URL
                    replicate_video_url = str(output)
                    logger.info(f"Using output as string URL: {replicate_video_url}")
                
                # Clear the output variable to prevent any accidental storage
                del output
            else: 
                replicate_video_url = "https://replicate.delivery/xezq/HAevwZ966eiJxkd7jByCStY9jALtnraJ8z6bNsnJV9GXiGIVA/output.mp4"
                logger.info(f"Using placeholder URL: {replicate_video_url}")

            response = requests.get(replicate_video_url)
            response.raise_for_status()  # Raise exception for bad status codes
            
            video_content = response.content
            
            # Define storage paths
            storage_path = f"assets/{job_id}/video.mp4"
            output_filename = f"{job_id}.mp4"

            # Upload the video content to our storage
            upload_result = await self.file_storage.upload_bytes(
                video_content, 
                storage_path, 
                content_type="video/mp4"
            )

            signed_url = await self.file_storage.generate_download_url(storage_path, 86400)  # 24 hours
            print(f"✅ Generated signed URL: {signed_url[:100]}...")  # Show first 100 chars
            
            # Ensure all result values are serializable strings
            result = { 
                "filename": str(output_filename),
                "storage_path": str(storage_path),
                "signed_url": str(signed_url),
                "replicate_url": str(replicate_video_url),  # Keep the original Replicate URL as backup
                "asset_id": str(job_id)
            }
            
            logger.info(f"Job result: {result}")
            logger.info(f"Result types: {[(k, type(v)) for k, v in result.items()]}") 

            await self.job_service.update_job(job_id, JobUpdate(
                status=JobStatus.COMPLETED,
                completed_at=datetime.now(),
                progress=100.0,
                result=result
            ))
            
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
                result = await self.process_3d_asset_job(job_id, parameters)
            case JobType.VIDEO:
                result = await self.process_video_job(job_id, parameters)
            case _:
                raise ValueError(f"Unknown job type: {job_type}")
        return result
