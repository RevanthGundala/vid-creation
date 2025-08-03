import pulumi
import pulumi_gcp as gcp
import subprocess
import sys
import os

# Load environment variables from .env file if it exists
def load_env_file(env_file_path):
    if os.path.exists(env_file_path):
        with open(env_file_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    # Remove quotes if present
                    value = value.strip('"\'')
                    os.environ[key] = value

# Load .env.development from parent directory
env_file_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env.development')
load_env_file(env_file_path)

# Configuration from environment variables
project_id = os.getenv('GOOGLE_CLOUD_PROJECT') or gcp.config.project
region = os.getenv('GCP_REGION', 'us-central1')
environment = os.getenv('APP_ENV', 'production')

print(f"Environment: {environment}")
print(f"Project ID: {project_id}")
print(f"Region: {region}")

def build_and_push_image():
    try:
        # Get the project ID for the image name
        image_name = f"gcr.io/{project_id}/vid-creation-backend:latest"
        
        # Build the image
        subprocess.run([
            'docker', 'build', '-t', image_name, 
            '/home/revan/projects/vid-creation/backend'
        ], check=True)
        
        # Push to GCR
        subprocess.run(['docker', 'push', image_name], check=True)
        
        return image_name
    except subprocess.CalledProcessError as e:
        print(f"Error building/pushing image: {e}")
        sys.exit(1)

# Build and push the image only for production
if environment == 'production':
    built_image = build_and_push_image()
else:
    print("Development mode: Skipping Docker image build and push.")
    built_image = None

# Enable required APIs
apis = [
    'cloudresourcemanager.googleapis.com',
    'firestore.googleapis.com',
    'storage.googleapis.com',
    'run.googleapis.com',
    'iam.googleapis.com',
    'cloudbuild.googleapis.com',
    'containerregistry.googleapis.com'
]

enabled_apis = []
for api in apis:
    enabled_api = gcp.projects.Service(f"{api.replace('.', '-')}",
        project=project_id,
        service=api,
        disable_dependent_services=False
    )
    enabled_apis.append(enabled_api)

# Create a GCS bucket with proper configuration
bucket = gcp.storage.Bucket('vid-creation-bucket',
    location=region,
    uniform_bucket_level_access=True,
    public_access_prevention='enforced',
    versioning={
        'enabled': True
    },
    lifecycle_rules=[{
        'action': {
            'type': 'Delete'
        },
        'condition': {
            'age': 30,  # Delete objects older than 30 days
            'matches_storage_class': ['STANDARD', 'NEARLINE']
        }
    }],
    labels={
        'project': 'vid-creation',
        'environment': environment
    }
)

# Create Firestore database
firestore_database = gcp.firestore.Database('vid-creation-db',
    name='vid-creation-db',
    location_id=region,
    type='FIRESTORE_NATIVE',
    delete_protection_state='DELETE_PROTECTION_DISABLED'
)

# Create a service account for the Cloud Run service
service_account = gcp.serviceaccount.Account('fastapi-service-account',
    account_id='fastapi-service-account',
    display_name='FastAPI Service Account',
    description='Service account for FastAPI Cloud Run service'
)

# Create service account key for local development
service_account_key = gcp.serviceaccount.Key('fastapi-service-account-key',
    service_account_id=service_account.name,
    public_key_type='TYPE_X509_PEM_FILE'
)

# Grant the service account access to Firestore
firestore_user_role = gcp.projects.IAMMember('firestore-user',
    project=project_id,
    role='roles/datastore.user',
    member=service_account.email.apply(lambda email: f'serviceAccount:{email}')
)

# Grant the service account access to GCS bucket
bucket_iam_member = gcp.storage.BucketIAMMember('bucket-access',
    bucket=bucket.name,
    role='roles/storage.objectViewer',
    member=service_account.email.apply(lambda email: f'serviceAccount:{email}')
)

# Grant the service account admin access to GCS bucket for uploads
bucket_admin_iam_member = gcp.storage.BucketIAMMember('bucket-admin-access',
    bucket=bucket.name,
    role='roles/storage.objectAdmin',
    member=service_account.email.apply(lambda email: f'serviceAccount:{email}')
)

# Create Cloud Run service only for production
if environment == 'production':
    # Create a Cloud Run service with proper configuration
    service = gcp.cloudrun.Service('fastapi-service',
        location=region,
        template={
            'spec': {
                'containers': [{
                    'image': built_image,
                    'ports': [{'containerPort': 8080}],
                    'envs': [
                        {
                            'name': 'GCP_PROJECT_ID',
                            'value': project_id
                        },
                        {
                            'name': 'GCP_STORAGE_BUCKET',
                            'value': bucket.name
                        },
                        {
                            'name': 'FIRESTORE_DATABASE_ID',
                            'value': firestore_database.name
                        },
                        {
                            'name': 'APP_ENV',
                            'value': environment
                        },
                        {
                            'name': 'GOOGLE_CLOUD_PROJECT',
                            'value': project_id
                        },
                        {
                            'name': 'WORKOS_API_KEY',
                            'value': '${WORKOS_API_KEY}'  # Will be set from environment
                        }
                    ],
                    'resources': {
                        'limits': {
                            'cpu': '1000m',
                            'memory': '2Gi'  # Increased for video processing
                        },
                        'requests': {
                            'cpu': '500m',
                            'memory': '1Gi'
                        }
                    }
                }],
                'service_account_name': service_account.email,
                'timeout_seconds': 900,  # 15 minutes for video processing
                'max_instance_request_concurrency': 80
            },
            'metadata': {
                'annotations': {
                    'run.googleapis.com/ingress': 'all',
                    'run.googleapis.com/execution-environment': 'gen2'
                }
            }
        },
        traffics=[{
            'percent': 100,
            'latest_revision': True
        }]
    )

    # Make the service publicly accessible
    no_auth_policy = gcp.cloudrun.IamMember('no-auth',
        location=service.location,
        service=service.name,
        role='roles/run.invoker',
        member='allUsers'
    )

    # Create a Cloud Scheduler job for cleanup tasks (optional)
    cleanup_job = gcp.cloudscheduler.Job('cleanup-job',
        name='vid-creation-cleanup',
        description='Cleanup old jobs and assets',
        schedule='0 2 * * *',  # Daily at 2 AM
        time_zone='UTC',
        http_target={
            'uri': service.statuses.apply(lambda statuses: f"{statuses[0].url}/cleanup"),
            'http_method': 'POST',
            'headers': {
                'Content-Type': 'application/json'
            }
        }
    )
else:
    print("Development mode: Skipping Cloud Run deployment.")

# Export the resources
pulumi.export('bucket_name', bucket.name)
pulumi.export('bucket_url', bucket.url)
pulumi.export('firestore_database_id', firestore_database.name)
pulumi.export('service_account_email', service_account.email)
pulumi.export('project_id', project_id)
pulumi.export('region', region)
pulumi.export('environment', environment)

# Export service account key for local development
pulumi.export('service_account_key', service_account_key.private_key)

# Export different URLs based on environment
if environment == 'production':
    pulumi.export('cloudrun_url', service.statuses.apply(lambda statuses: statuses[0].url))
    pulumi.export('image_name', built_image)
    pulumi.export('app_url', service.statuses.apply(lambda statuses: statuses[0].url))
else:
    pulumi.export('app_url', 'http://localhost:8000')  # Local FastAPI endpoint
    pulumi.export('cloudrun_url', 'Not deployed in development mode')
    pulumi.export('image_name', 'Not built in development mode')

# Export environment variables for local development use
pulumi.export('env_vars', {
    'GCP_PROJECT_ID': project_id,
    'GCP_STORAGE_BUCKET': bucket.name,
    'FIRESTORE_DATABASE_ID': firestore_database.name,
    'APP_ENV': environment,
    'GOOGLE_CLOUD_PROJECT': project_id
})
