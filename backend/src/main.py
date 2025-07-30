from fastapi import FastAPI, Depends, HTTPException, status, Request
from src.api.asset import router as asset_router
from src.api.webhooks import router as webhook_router
import firebase_admin
from firebase_admin import credentials, auth
import os
from fastapi.middleware.cors import CORSMiddleware
from src.api.auth import router as auth_router
from src.api.middleware import logging_middleware
import dotenv
from src.database.firebase import firebase_auth_dependency

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

try:
    cert = { 
        "type": os.getenv("FIREBASE_TYPE"),
        "project_id": os.getenv("FIREBASE_PROJECT_ID"),
        "private_key_id": os.getenv("FIREBASE_PRIVATE_KEY_ID"),
        "private_key": os.getenv("FIREBASE_PRIVATE_KEY").replace('\\n', '\n'),
        "client_email": os.getenv("FIREBASE_CLIENT_EMAIL"),
        "client_id": os.getenv("FIREBASE_CLIENT_ID"),
        "auth_uri": os.getenv("FIREBASE_AUTH_URI"),
        "token_uri": os.getenv("FIREBASE_TOKEN_URI"),
        "auth_provider_x509_cert_url": os.getenv("FIREBASE_AUTH_PROVIDER_X509_CERT_URL"),
        "client_x509_cert_url": os.getenv("FIREBASE_CLIENT_X509_CERT_URL")
    }
    for name, value in cert.items():
        print(f"{name}: {value}")
    cred = credentials.Certificate(cert)
    firebase_admin.initialize_app(cred)
    print("Firebase Admin SDK initialized successfully")
except Exception as e:
    print(f"Failed to initialize Firebase: {e}")
    print("Running in development mode without Firebase")


# Test routes
@app.get("/api/hello")
def hello():
    return {"message": "Hello from the backend!"}

@app.get("/api/protected")
def protected_route(user=Depends(firebase_auth_dependency)):
    return {"uid": user.get("uid"), "email": user.get("email")}
