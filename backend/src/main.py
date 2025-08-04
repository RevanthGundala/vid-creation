from fastapi import FastAPI
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

@asynccontextmanager
async def lifespan(app: FastAPI):
    dotenv.load_dotenv()
    app.state.auth_service = AuthService()
    app.state.user_repo = GCPFirestoreRepository(config.USER_COLLECTION_NAME)
    app.state.job_repo = GCPFirestoreRepository(config.JOB_COLLECTION_NAME)
    app.state.file_storage = GCPFileStorageRepository(os.getenv("GCP_STORAGE_BUCKET"))
    app.state.job_service = JobService(app.state.job_repo)
    app.state.job_processor = JobProcessor(app.state.job_service, app.state.file_storage)
    google_creds = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    print(f"🔍 GOOGLE_APPLICATION_CREDENTIALS: {google_creds}")
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
