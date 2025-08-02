# from functools import cache
# from fastapi import APIRouter, HTTPException
# import torch
# from diffusers import DiffusionPipeline
# from diffusers.utils import export_to_video
# from pydantic import BaseModel
# from src.database.repositories.dependencies import get_asset_repository
# from src.schemas.asset import AssetMetadata
# from datetime import datetime
# from uuid import uuid4
# from typing import Optional, Literal
# from pydantic import ValidationError
# from src.database.gcs import generate_signed_upload_url
# import uuid

# router = APIRouter()


# class VideoRequest(BaseModel):
#     prompt: str

# Load the model
# @cache
# def load_model():
#     pipe = DiffusionPipeline.from_pretrained(
#         "cerspense/zeroscope_v2_576w",
#         torch_dtype=torch.float16,
#     )
#     pipe.enable_model_cpu_offload() # Helps manage memory
#     # pipe = pipe.to("cuda")
#     return pipe

# @router.post("/api/video")
# async def generate_video(video_request: VideoRequest) -> str:
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

#     return "https://www.youtube.com/watch?v=R8uxmXmtOrk"

# class AssetMetadataCreate(BaseModel):
#     name: str
#     user_id: str
#     description: Optional[str] = None
#     status: Literal["pending", "uploaded"]
#     S3URL: str

# @router.post("/api/video-metadata", response_model=AssetMetadata)
# async def create_asset_metadata(metadata: AssetMetadataCreate):
#     db = get_firestore_client()
#     now = datetime.now()
#     asset_id = str(uuid4())
#     data = metadata.dict()
#     data["asset_id"] = asset_id
#     data["created_at"] = now
#     data["modified_at"] = now
#     doc_ref = db.collection("AssetMetadata").document(asset_id)
#     doc_ref.set(data)
#     try:
#         return AssetMetadata(
#             asset_id=asset_id,
#             **data
#         )
#     except ValidationError as e:
#         raise HTTPException(status_code=500, detail=f"Validation error: {e}")

# @router.post("/api/generate-upload-url")
# async def generate_upload_url(filename: str):
#     blob_name = f"videos/{uuid.uuid4()}_{filename}"
#     signed_url = generate_signed_upload_url(blob_name)
#     return {"upload_url": signed_url, "blob_name": blob_name}


