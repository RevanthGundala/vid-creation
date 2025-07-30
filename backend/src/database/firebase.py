import os
from firebase_admin import auth, initialize_app, credentials
from firebase_admin import firestore
from fastapi import HTTPException, status, Depends, Header

# Initialize Firebase Admin SDK
def initialize_firebase():
    """Initialize Firebase Admin SDK with emulator support for development."""
    try:
        # Check if we're in development mode
        if os.getenv('ENVIRONMENT', 'development') == 'development':
            # Use emulator in development
            os.environ['FIREBASE_AUTH_EMULATOR_HOST'] = 'localhost:9099'
            os.environ['FIRESTORE_EMULATOR_HOST'] = 'localhost:8080'
            print("🔧 Using Firebase emulators for development")
        
        # Initialize Firebase Admin SDK
        # In production, you would use credentials.Certificate() with a service account
        # For development with emulator, we can use default credentials
        if os.getenv('ENVIRONMENT') == 'production':
            # Load service account credentials for production
            cred = credentials.Certificate(os.getenv('FIREBASE_SERVICE_ACCOUNT_PATH'))
            initialize_app(cred)
        else:
            # Use default credentials for development
            initialize_app()
            
    except Exception as e:
        print(f"Warning: Firebase initialization failed: {e}")
        # Continue without Firebase for development

# Initialize Firebase on module import
initialize_firebase()

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

def firebase_auth_dependency(authorization: str = Header(None)):
    """FastAPI dependency for Firebase authentication."""
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Missing or invalid Authorization header'
        )
    
    id_token = authorization.split(' ')[1]
    return verify_firebase_token(id_token)

# Singleton Firestore client
_firestore_client = None

def get_firestore_client() -> firestore.Client:
    global _firestore_client
    if _firestore_client is None:
        try:
            _firestore_client = firestore.Client()
            return _firestore_client
        except Exception as e:
            print(f"Failed to initialize Firestore client: {e}")
            print("Falling back to mock implementation")
            return None
