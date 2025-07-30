from dataclasses import dataclass

@dataclass
class Config:
    dev_mode: bool = False
    gcp_project_id: str = "vid-creation-671f2"
    gcp_region: str = "us-east1"
    gcp_bucket_name: str = "vid-creation-671f2.firebasestorage.app"
    gcp_firestore_database_id: str = "k-studio-444118"
    gcp_firestore_database_location: str = "nam5"
    gcp_firestore_database_type: str = "FIRESTORE_NATIVE"


config = Config()