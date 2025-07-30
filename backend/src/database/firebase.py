import os
import firebase_admin
from firebase_admin import auth, initialize_app, credentials
from firebase_admin import firestore
from fastapi import HTTPException, status, Depends, Header

class FirebaseService:
    """Firebase service class with static methods for authentication and initialization."""
    
    _firestore_client = None
    
    @staticmethod
    def initialize_firebase():
        """Initialize Firebase Admin SDK with emulator support for development."""
        try:
            # Check if Firebase is already initialized
            if firebase_admin._apps:
                print("✅ Firebase Admin SDK already initialized")
                return
            
            # Check if we're in development mode with emulators
            if os.getenv('ENVIRONMENT', 'development') == 'development':
                print("🔧 Running in development mode with Firebase emulators")
                
                # Set emulator environment variables
                os.environ['FIREBASE_AUTH_EMULATOR_HOST'] = 'localhost:9099'
                os.environ['FIRESTORE_EMULATOR_HOST'] = 'localhost:8080'
                
                # Set the project ID environment variable that Firebase Admin SDK expects
                project_id = os.getenv("FIREBASE_PROJECT_ID", "vid-creation-671f2")
                os.environ["GOOGLE_CLOUD_PROJECT"] = project_id
                
                # For emulator mode, we need to initialize with a project ID but no credentials
                # This is a special case for Firebase emulators
                try:
                    # Try to initialize with just the project ID for emulator mode
                    initialize_app(options={
                        'projectId': project_id
                    })
                    print(f"✅ Firebase Admin SDK initialized for emulator mode with project: {project_id}")
                except Exception as e:
                    print(f"❌ Failed to initialize Firebase for emulator mode: {e}")
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
        return FirebaseService.verify_firebase_token(id_token)

    @staticmethod
    def get_firestore_client() -> firestore.Client:
        """Get singleton Firestore client."""
        if FirebaseService._firestore_client is None:
            try:
                # Make sure Firebase is initialized first
                if not firebase_admin._apps:
                    FirebaseService.initialize_firebase()
                
                FirebaseService._firestore_client = firestore.Client()
                print("✅ Firestore client initialized successfully")
                return FirebaseService._firestore_client
            except Exception as e:
                print(f"❌ Failed to initialize Firestore client: {e}")
                print("Falling back to mock implementation")
                return None
        return FirebaseService._firestore_client
