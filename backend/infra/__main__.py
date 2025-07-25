"""A Python Pulumi program"""

import pulumi
import pulumi_gcp as gcp

# Example config variables (replace with your actual values or use pulumi.Config)
project = "example-gcp-project"
region = "us-east1"
bucket_name = "example-video-blobs-bucket"

# Enable Firestore API
firestore_api = gcp.projects.Service(
    "firestore-api",
    service="firestore.googleapis.com",
    disable_on_destroy=False,
)

# Create Firestore database (Native mode)
firestore_db = gcp.firestore.Database(
    "firestore-db",
    project=project,
    location_id=region,
    type="FIRESTORE_NATIVE",
    opts=pulumi.ResourceOptions(depends_on=[firestore_api]),
)

# Firestore collections are created implicitly by writing documents to them.
# We'll document the schemas here for reference.
# VideoMetadata schema:
#   - video_id (string, doc id)
#   - name (string)
#   - user_id (string)
#   - description (string)
#   - status (string: pending | uploaded)
#   - S3URL (string)
#   - created_at (timestamp)
#   - modified_at (timestamp)

# users schema:
#   - user_id (string, doc id)
#   - video_id (array of strings)
#   - credits (int)

# Create a GCS bucket for video blobs
video_bucket = gcp.storage.Bucket(
    "video-blobs-bucket",
    name=bucket_name,
    location=region,
    force_destroy=True,  # Allows deleting non-empty bucket for dev
)

# #TODO: Implement backend chunked video upload
# #TODO: Implement manifest file to store different video resolutions
