from fastapi import FastAPI, Depends, HTTPException, status, Request
from src.api.asset import router as asset_router
from src.api.webhooks import router as webhook_router
import os
from fastapi.middleware.cors import CORSMiddleware
from src.api.auth import router as auth_router
from src.api.middleware import logging_middleware
import dotenv
from src.database.firebase import FirebaseService


dotenv.load_dotenv()
app = FastAPI()

app.middleware("http")(logging_middleware)

app.include_router(auth_router)
app.include_router(asset_router)
app.include_router(webhook_router)

app.add_middleware(
       CORSMiddleware,
       allow_origins=["http://localhost:3000"],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
)

FirebaseService.initialize_firebase()

@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
