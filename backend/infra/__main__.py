import pulumi
import pulumi_gcp as gcp

# --- Configuration ---
# Use Pulumi's built-in config system. Set these values from your terminal:
# `pulumi config set gcp_project_id your-project-id`
# `pulumi config set gcp_region us-central1`
# `pulumi config set frontend_prod_url https://your-app.onrender.com`

config = pulumi.Config()
project_id = config.require("gcp_project_id")
region = config.require("gcp_region")
frontend_prod_url = config.require("frontend_prod_url")

# --- Resource Definitions ---

# 1. Enable necessary APIs for Firestore and Storage
firestore_api = gcp.projects.Service("firestore-api", service="firestore.googleapis.com")
storage_api = gcp.projects.Service("storage-api", service="storage.googleapis.com")

# 2. Create a GCS bucket for storing generated videos
# This bucket will be accessed by your application running on Render.
bucket = gcp.storage.Bucket('vid-creation-bucket',
    name=f"{project_id}-video-storage", # Creates a unique bucket name
    location=region,
    force_destroy=True, # OK for portfolio project, use with caution in real prod
    uniform_bucket_level_access=True,
    versioning={'enabled': True},
    cors=[{
        'origins': [frontend_prod_url],
        'methods': ['GET', 'PUT', 'POST', 'HEAD'],
        'response_headers': ['Content-Type', 'Content-Range'],
        'max_age_seconds': 3600
    }],
    lifecycle_rules=[{
        'action': {'type': 'Delete'},
        'condition': {'age': 30} # Delete videos older than 30 days
    }],
    opts=pulumi.ResourceOptions(depends_on=[storage_api])
)

# 3. Create a Firestore Native database
firestore_database = gcp.firestore.Database('vid-creation-db',
    name='vid-creation-db',
    location_id=region,
    type='FIRESTORE_NATIVE',
    delete_protection_state='DELETE_PROTECTION_DISABLED',
    opts=pulumi.ResourceOptions(depends_on=[firestore_api])
)

# 4. Create a dedicated Service Account for your Render application to use
service_account = gcp.serviceaccount.Account('render-app-sa',
    account_id='render-app-service-account',
    display_name='Service Account for Render App'
)

# 5. Grant the Service Account necessary permissions
# Grant permission to read/write/delete objects in the bucket
gcp.storage.BucketIAMMember('bucket-admin-iam',
    bucket=bucket.name,
    role='roles/storage.objectAdmin',
    member=service_account.email.apply(lambda email: f'serviceAccount:{email}')
)

# Grant permission to read/write to Firestore
gcp.projects.IAMMember('firestore-user-iam',
    project=project_id,
    role='roles/datastore.user',
    member=service_account.email.apply(lambda email: f'serviceAccount:{email}')
)

# 6. Create a key for the Service Account.
# This key's content will be securely passed to Render.
service_account_key = gcp.serviceaccount.Key('render-app-sa-key',
    service_account_id=service_account.name
)

# --- Pulumi Exports ---
# These are the values your Render application will need.

pulumi.export('GCP_PROJECT_ID', project_id)
pulumi.export('GCP_STORAGE_BUCKET', bucket.name)
pulumi.export('FIRESTORE_DATABASE_ID', firestore_database.name)

# CRITICAL: Export the key as a SECRET so it is encrypted in your state.
pulumi.export('GCP_SERVICE_ACCOUNT_JSON', pulumi.Output.secret(service_account_key.private_key))