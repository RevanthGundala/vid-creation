from fastapi import FastAPI, Depends, HTTPException, status, Request
from api.video import router as video_router
import firebase_admin
from firebase_admin import credentials, auth
import os
from fastapi.middleware.cors import CORSMiddleware
from api.auth import firebase_auth_dependency
from api.auth import router as auth_router
from src.api.middleware import logging_middleware

app = FastAPI()

app.middleware("http")(logging_middleware)

app.include_router(video_router)
app.include_router(auth_router)

app.add_middleware(
       CORSMiddleware,
       allow_origins=["http://localhost:3000"],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )

# Initialize Firebase Admin SDK
if not firebase_admin._apps:
    cred = credentials.Certificate({
        "type": os.getenv("FIREBASE_TYPE", "service_account"),
        "project_id": os.getenv("FIREBASE_PROJECT_ID", "your-project-id"),
        "private_key_id": os.getenv("FIREBASE_PRIVATE_KEY_ID", "your-private-key-id"),
        "private_key": os.getenv("FIREBASE_PRIVATE_KEY", "your-private-key").replace('\\n', '\n'),
        "client_email": os.getenv("FIREBASE_CLIENT_EMAIL", "your-client-email"),
        "client_id": os.getenv("FIREBASE_CLIENT_ID", "your-client-id"),
        "auth_uri": os.getenv("FIREBASE_AUTH_URI", "https://accounts.google.com/o/oauth2/auth"),
        "token_uri": os.getenv("FIREBASE_TOKEN_URI", "https://oauth2.googleapis.com/token"),
        "auth_provider_x509_cert_url": os.getenv("FIREBASE_AUTH_PROVIDER_X509_CERT_URL", "https://www.googleapis.com/oauth2/v1/certs"),
        "client_x509_cert_url": os.getenv("FIREBASE_CLIENT_X509_CERT_URL", "your-client-x509-cert-url")
    })
    firebase_admin.initialize_app(cred)

# Test routes
@app.get("/api/hello")
def hello():
    return {"message": "Hello from the backend!"}

@app.get("/api/protected")
def protected_route(user=Depends(firebase_auth_dependency)):
    return {"uid": user.get("uid"), "email": user.get("email")}