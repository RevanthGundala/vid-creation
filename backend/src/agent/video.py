import dspy

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