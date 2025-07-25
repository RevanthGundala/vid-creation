from functools import cache
import dspy
import os
import dotenv
from fastapi import APIRouter, Depends, HTTPException, status, Request, UploadFile, File
import torch
from diffusers import DiffusionPipeline
from diffusers.utils import export_to_video
from pydantic import BaseModel
from auth.firebase import firebase_auth_dependency
from database.firestore import get_firestore_client
from database.models import VideoMetadata
from datetime import datetime
from uuid import uuid4
from typing import Optional, Literal
from pydantic import ValidationError
from database.gcs import upload_video_to_gcs, generate_signed_upload_url
import uuid

router = APIRouter()

dotenv.load_dotenv()

class VideoRequest(BaseModel):
    prompt: str

# Load the model
@cache
def load_model():
    pipe = DiffusionPipeline.from_pretrained(
        "cerspense/zeroscope_v2_576w",
        torch_dtype=torch.float16,
    )
    pipe.enable_model_cpu_offload() # Helps manage memory
    # pipe = pipe.to("cuda")
    return pipe

@router.post("/api/video")
async def generate_video(video_request: VideoRequest, user=Depends(firebase_auth_dependency)) -> str:
    # video_agent = VideoAgent()
    # result = video_agent(user_request)
    # return result.video_url

    # pipe = load_model()
    # prompt = video_request.prompt
    # negative_prompt = "blurry ugly bad"

    # video_frames = pipe(
    #     prompt=prompt,
    #     negative_prompt=negative_prompt,
    #     num_frames=57,
    #     num_inference_steps=24,
    #     guidance_scale=2.5
    # ).frames

    # export_to_video(video_frames, "output.mp4", fps=16)

    return "https://www.youtube.com/watch?v=R8uxmXmtOrk"

class VideoMetadataCreate(BaseModel):
    name: str
    user_id: str
    description: Optional[str] = None
    status: Literal["pending", "uploaded"]
    S3URL: str

@router.post("/api/video-metadata", response_model=VideoMetadata)
async def create_video_metadata(metadata: VideoMetadataCreate, user=Depends(firebase_auth_dependency)):
    db = get_firestore_client()
    now = datetime.now()
    video_id = str(uuid4())
    data = metadata.dict()
    data["video_id"] = video_id
    data["created_at"] = now
    data["modified_at"] = now
    doc_ref = db.collection("VideoMetadata").document(video_id)
    doc_ref.set(data)
    try:
        return VideoMetadata(**data)
    except ValidationError as e:
        raise HTTPException(status_code=500, detail=f"Validation error: {e}")

@router.post("/api/generate-upload-url")
async def generate_upload_url(filename: str, user=Depends(firebase_auth_dependency)):
    blob_name = f"videos/{uuid.uuid4()}_{filename}"
    signed_url = generate_signed_upload_url(blob_name)
    return {"upload_url": signed_url, "blob_name": blob_name}


