from dataclasses import dataclass

@dataclass
class Config:
    USER_COLLECTION_NAME: str = "users"
    JOB_COLLECTION_NAME: str = "jobs"
    STARTING_CREDITS: int = 10
    COOKIE_NAME: str = "vid-cookie"

config = Config()