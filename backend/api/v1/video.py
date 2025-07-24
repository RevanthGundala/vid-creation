from functools import cache
import dspy
import os
import dotenv
from fastapi import APIRouter, Depends, HTTPException, status, Request
import torch
from diffusers import DiffusionPipeline
from diffusers.utils import export_to_video
from pydantic import BaseModel

router = APIRouter()

dotenv.load_dotenv()

class VideoRequest(BaseModel):
    prompt: str

class VideoGenerator(dspy.Signature):
    """You are an AI video generator agent that creates a video based on the user's command."""

    prompt: str = dspy.InputField(desc="User command to generate a video")
    video_url: str = dspy.OutputField(desc="URL of the generated video")

class VideoAgent(dspy.Module):
    def __init__(self):
        self.video_generator = dspy.Predict(VideoGenerator)

    def forward(self, prompt: str) -> str:
        video = self.video_generator(prompt)
        return video.video_url

# lm = dspy.LM(model="huggingface/", api_key=os.getenv("OPENROUTER_API_KEY"), api_base="https://openrouter.ai/api/v1")
# lm = dspy.LM(model="huggingface/Lightricks/LTX-Video")
# dspy.configure(lm=lm)

@cache
def load_model():
    pipe = DiffusionPipeline.from_pretrained(
        "cerspense/zeroscope_v2_576w",
        torch_dtype=torch.float16,
    )
    pipe.enable_model_cpu_offload() # Helps manage memory
    # pipe = pipe.to("cuda")
    return pipe

@router.post("/auth/google")
def google_auth(request: Request):
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Missing or invalid Authorization header')
    id_token = auth_header.split(' ')[1]
    decoded_token = verify_firebase_token(id_token)
    return decoded_token

def firebase_auth_dependency(request: Request):
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Missing or invalid Authorization header')
    id_token = auth_header.split(' ')[1]
    decoded_token = verify_firebase_token(id_token)
    if not decoded_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid Firebase ID token')
    return decoded_token

@router.post("/api/v1/video")
async def generate_video(video_request: VideoRequest, user=Depends(firebase_auth_dependency)) -> str:
    # video_agent = VideoAgent()
    # result = video_agent(user_request)
    # return result.video_url

    pipe = load_model()
    prompt = video_request.prompt
    negative_prompt = "blurry ugly bad"

    video_frames = pipe(
        prompt=prompt,
        negative_prompt=negative_prompt,
        num_frames=57,
        num_inference_steps=24,
        guidance_scale=2.5
    ).frames

    export_to_video(video_frames, "output.mp4", fps=16)


