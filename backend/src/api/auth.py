from fastapi import Request, HTTPException, status, APIRouter
from src.database.firebase import FirebaseService
from src.database.firestore import FirestoreService
from src.schemas.user import User

router = APIRouter()    

@router.post("/auth/google")
async def google_auth_callback(request: Request):
    decoded_token = await FirebaseService.verify_firebase_token(request.headers.get('Authorization'))
    user_id = decoded_token.get('uid')
    if not user_id:
        raise HTTPException(status_code=400, detail='No UID in Firebase token')
    
    db = FirestoreService.get_firestore_service()
    # Check if user exists
    existing_user = await db.get_document('users', user_id)
    if not existing_user:
        user = User(user_id=user_id, video_ids=[], credits=10)
        await db.create_document('users', user_id, user.dict())
    return decoded_token