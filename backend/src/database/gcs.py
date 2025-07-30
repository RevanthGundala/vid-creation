import os
from google.cloud import storage
from src.config import config

# Singleton GCS client
_gcs_client = None

def get_gcs_client():
    global _gcs_client
    if _gcs_client is None:
        try:
            # Check if we're in development mode and use emulator
            if os.getenv('ENVIRONMENT', 'development') == 'development':
                # Set Storage emulator host
                os.environ['STORAGE_EMULATOR_HOST'] = 'http://localhost:9199'
                print("🔧 Using GCS emulator for development")
            
            _gcs_client = storage.Client()
            print("✅ Successfully initialized GCS client")
        except Exception as e:
            print(f"Failed to initialize GCS client: {e}")
            _gcs_client = None
    return _gcs_client

def generate_signed_upload_url(destination_blob_name: str, expiration: int = 15 * 60) -> str:
    """
    Generates a signed URL for uploading a file to GCS.
    """
    try:
        client = get_gcs_client()
        if client is None:
            raise Exception("GCS client not available")
        
        bucket = client.bucket(config.gcp_bucket_name)
        blob = bucket.blob(destination_blob_name)
        url = blob.generate_signed_url(
            version="v4",
            expiration=expiration,
            method="PUT",
            content_type="application/octet-stream",
        )
        return url
    except Exception as e:
        print(f"Failed to generate signed URL: {e}")
        raise
