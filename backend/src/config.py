from dataclasses import dataclass

@dataclass
class Config:
    USER_COLLECTION_NAME: str = "users"
    JOB_COLLECTION_NAME: str = "jobs"
    STARTING_CREDITS: int = 10
    COOKIE_NAME: str = "vid-cookie"
    REPLICATE_VIDEO_MODEL_ID: str = "wan-video/wan-2.2-t2v-fast"

config = Config()