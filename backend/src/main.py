from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from src.config import config
from src.repositories.gcp_repository import GCPFirestoreRepository, GCPFileStorageRepository
from src.services.job_processor import JobProcessor
from src.api.webhooks import router as webhook_router
from fastapi.middleware.cors import CORSMiddleware
from src.api.auth import router as auth_router
from src.api.middleware import logging_middleware
import dotenv
from src.services.auth_service import AuthService
from contextlib import asynccontextmanager
from src.services.job_service import JobService
from src.api.job import router as job_router
import os
import json
import tempfile

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load environment variables first
    dotenv.load_dotenv()
    
    # Handle Google Cloud service account JSON from environment
    service_account_json = os.getenv("GCP_SERVICE_ACCOUNT_JSON")
    if service_account_json and service_account_json.strip():
        try:
            # Validate that the JSON is valid before writing to file
            parsed_json = json.loads(service_account_json)
            # Write the JSON credentials to a temporary file
            with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
                json.dump(parsed_json, f)
                os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = f.name
            print(f"🔍 Set up Google credentials from environment")
        except json.JSONDecodeError as e:
            print(f"⚠️  Invalid JSON in GCP_SERVICE_ACCOUNT_JSON: {e}")
            print(f"🔍 Using default Google credentials")
    else:
        print(f"🔍 Using default Google credentials")
    
    # Initialize services using environment variables directly
    app.state.auth_service = AuthService()
    app.state.user_repo = GCPFirestoreRepository(config.USER_COLLECTION_NAME)
    app.state.job_repo = GCPFirestoreRepository(config.JOB_COLLECTION_NAME)
    app.state.file_storage = GCPFileStorageRepository(os.getenv("GCP_STORAGE_BUCKET"))
    app.state.job_service = JobService(app.state.job_repo)
    app.state.job_processor = JobProcessor(app.state.job_service, app.state.file_storage)
    print("Services initialized")
    yield
    print("Shutting down...")

app = FastAPI(lifespan=lifespan)

app.middleware("http")(logging_middleware)
app.add_middleware(
       CORSMiddleware,
       allow_origins=["http://localhost:3000"],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
)



app.include_router(auth_router)
app.include_router(webhook_router)
app.include_router(job_router)

@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
