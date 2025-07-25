from fastapi import Request, HTTPException, status
from utils.firebase import verify_firebase_token
from fastapi import APIRouter
from database.firestore import get_firestore_client
from database.models import User
import uuid

router = APIRouter()

@router.post("/auth/google")
def google_auth_callback(request: Request):
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Missing or invalid Authorization header')
    id_token = auth_header.split(' ')[1]
    decoded_token = verify_firebase_token(id_token)

    # Firestore user creation logic
    db = get_firestore_client()
    user_id = decoded_token.get('uid')
    if not user_id:
        raise HTTPException(status_code=400, detail='No UID in Firebase token')
    user_ref = db.collection('users').document(user_id)
    if not user_ref.get().exists:
        user = User(user_id=user_id, video_ids=[], credits=10)
        user_ref.set(user.dict())
    return decoded_token