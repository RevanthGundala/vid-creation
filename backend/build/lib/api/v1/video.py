import dspy
import os
import dotenv
from fastapi import APIRouter
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

@router.post("/api/v1/video")
async def generate_video(video_request: VideoRequest) -> str:
    # video_agent = VideoAgent()
    # result = video_agent(user_request)
    # return result.video_url


    pipe = DiffusionPipeline.from_pretrained(
        "damo-vilab/text-to-video-ms-1.7b",
        torch_dtype=torch.float16,
        variant="fp16"
    )
    pipe = pipe.to("cuda")

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


