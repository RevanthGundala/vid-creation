import pulumi
import pulumi_gcp as gcp
from src.config import config

project = config.gcp_project_id
region = config.gcp_region
bucket_name = config.gcp_bucket_name

firestore_api = gcp.projects.Service(
    "firestore-api",
    service="firestore.googleapis.com",
    disable_on_destroy=False,
)

firestore_db = gcp.firestore.Database(
    "firestore-db",
    project=project,
    location_id=region,
    type="FIRESTORE_NATIVE",
    opts=pulumi.ResourceOptions(depends_on=[firestore_api]),
)

video_bucket = gcp.storage.Bucket(
    "video-blobs-bucket",
    name=bucket_name,
    location=region,
    force_destroy=True,  # Allows deleting non-empty bucket for dev
)

# #TODO: Implement backend chunked video upload
# #TODO: Implement manifest file to store different video resolutions
