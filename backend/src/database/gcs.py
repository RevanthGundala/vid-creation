from google.cloud import storage
import os
from functools import cache

BUCKET_NAME = os.getenv("GCS_BUCKET_NAME", "example-video-blobs-bucket")

# Singleton GCS client
_gcs_client = None

@cache
def get_gcs_client():
    global _gcs_client
    if _gcs_client is None:
        _gcs_client = storage.Client()
    return _gcs_client



def generate_signed_upload_url(destination_blob_name: str, expiration: int = 15 * 60) -> str:
    """
    Generates a signed URL for uploading a file to GCS.
    :param destination_blob_name: The name of the object in the bucket.
    :param expiration: Time in seconds for the signed URL to be valid (default: 15 minutes).
    :return: The signed URL as a string.
    """
    client = get_gcs_client()
    bucket = client.bucket(BUCKET_NAME)
    blob = bucket.blob(destination_blob_name)
    url = blob.generate_signed_url(
        version="v4",
        expiration=expiration,
        method="PUT",
        content_type="application/octet-stream",
    )
    return url 