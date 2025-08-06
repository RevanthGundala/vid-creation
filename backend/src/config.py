from dataclasses import dataclass
import os
import json
import tempfile

@dataclass
class Config:
    USER_COLLECTION_NAME: str = "users"
    JOB_COLLECTION_NAME: str = "jobs"
    STARTING_CREDITS: int = 10
    COOKIE_NAME: str = "vid-cookie"
    REPLICATE_VIDEO_MODEL_ID: str = "wan-video/wan-2.2-t2v-fast"
    
    def __post_init__(self):
        """Initialize Google Cloud credentials from environment variables."""
        # Get Google Cloud settings from environment variables
        self.gcp_project_id = os.getenv("GCP_PROJECT_ID")
        self.gcp_region = os.getenv("GCP_REGION")
        self.gcp_storage_bucket = os.getenv("GCP_STORAGE_BUCKET")
        self.firestore_database_id = os.getenv("FIRESTORE_DATABASE_ID")
        
        # Handle service account JSON from environment
        service_account_json = os.getenv("GCP_SERVICE_ACCOUNT_JSON")
        if service_account_json:
            # Write the JSON credentials to a temporary file
            with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
                json.dump(json.loads(service_account_json), f)
                os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = f.name
            print(f"🔍 Set up Google credentials from environment")
        else:
            print(f"🔍 Using default Google credentials")

config = Config()