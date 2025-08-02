"""
Firebase authentication service.
Provides authentication functionality without database operations.
"""
import os
import firebase_admin
from firebase_admin import auth, initialize_app, credentials
from fastapi import HTTPException, status, Depends, Header


class FirebaseAuthService:
    """Firebase authentication service with static methods for auth operations."""
    
    @staticmethod
    def initialize_firebase():
        """Initialize Firebase Admin SDK with emulator support for development."""
        try:
            # Check if Firebase is already initialized
            if firebase_admin._apps:
                print("✅ Firebase Admin SDK already initialized")
                return
            
            # Check if we're in development mode with emulators
            if os.getenv('APP_ENV', 'development') == 'development':
                print("🔧 Running in development mode with Firebase emulators")

                # Set emulator environment variables BEFORE any Firebase imports or initialization
                os.environ['FIREBASE_AUTH_EMULATOR_HOST'] = '127.0.0.1:9099'
                os.environ['FIRESTORE_EMULATOR_HOST'] = '127.0.0.1:8080'
                os.environ['FIREBASE_STORAGE_EMULATOR_HOST'] = '127.0.0.1:9199'
                
                # Set the project ID environment variable that Firebase Admin SDK expects
                project_id = os.getenv("FIREBASE_PROJECT_ID", "vid-creation-671f2")
                os.environ["GOOGLE_CLOUD_PROJECT"] = project_id
                
                # For emulator mode, initialize with project ID only
                try:
                    initialize_app(options={
                        'projectId': project_id
                    })
                    print(f"✅ Firebase Admin SDK initialized for emulator mode with project: {project_id}")
                except Exception as e:
                    print(f"❌ Failed to initialize Firebase with dummy credentials: {e}")
                    print("Running without Firebase authentication")
            else:
                # Production mode - use service account credentials
                print("🚀 Running in production mode with real Firebase")
                cred = credentials.Certificate({
                    "type": "service_account",
                    "project_id": os.getenv("FIREBASE_PROJECT_ID"),
                    "private_key_id": os.getenv("FIREBASE_PRIVATE_KEY_ID"),
                    "private_key": os.getenv("FIREBASE_PRIVATE_KEY").replace('\\n', '\n'),
                    "client_email": os.getenv("FIREBASE_CLIENT_EMAIL"),
                    "client_id": os.getenv("FIREBASE_CLIENT_ID"),
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                    "client_x509_cert_url": os.getenv("FIREBASE_CLIENT_CERT_URL")
                })
                initialize_app(cred)
                print("✅ Firebase Admin SDK initialized for production mode")
                
        except Exception as e:
            print(f"❌ Failed to initialize Firebase: {e}")
            print("Running without Firebase authentication")

    @staticmethod
    def verify_firebase_token(id_token: str):
        """Verify Firebase ID token and return decoded token."""
        try:
            decoded_token = auth.verify_id_token(id_token)
            return decoded_token
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid Firebase token: {str(e)}"
            )

    @staticmethod
    def firebase_auth_dependency(authorization: str = Header(None)):
        """FastAPI dependency for Firebase authentication."""
        if not authorization or not authorization.startswith('Bearer '):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail='Missing or invalid Authorization header'
            )
        
        id_token = authorization.split(' ')[1]
        return FirebaseAuthService.verify_firebase_token(id_token)

    @staticmethod
    def get_auth_dependency():
        """
        FastAPI dependency function that provides an authenticated user from Firebase Auth.
        
        Returns:
            dict: Decoded Firebase token with user information
            
        Example:
            @app.get("/profile/")
            def get_profile(user: dict = Depends(FirebaseAuthService.get_auth_dependency)):
                return {"user_id": user["uid"]}
        """
        return FirebaseAuthService.firebase_auth_dependency 