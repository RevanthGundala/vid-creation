import os
from fastapi import FastAPI
from src.services.job_processor import JobProcessor
from src.api.webhooks import router as webhook_router
from fastapi.middleware.cors import CORSMiddleware
from src.api.auth import router as auth_router
from src.api.middleware import logging_middleware
import dotenv
from src.database.firebase_auth import FirebaseAuthService
from contextlib import asynccontextmanager
from src.services.job_service import JobService
from src.api.job import router as job_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    dotenv.load_dotenv()
    FirebaseAuthService.initialize_firebase()
    app.state.job_service = JobService()
    app.state.job_processor = JobProcessor(app.state.job_service)
    print("Firebase initialized")
    yield
    print("Shutting down...")

app = FastAPI(lifespan=lifespan)

app.middleware("http")(logging_middleware)

app.include_router(auth_router)
app.include_router(webhook_router)
app.include_router(job_router)

app.add_middleware(
       CORSMiddleware,
       allow_origins=["http://localhost:3000"],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
