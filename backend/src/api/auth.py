from src.config import config
from fastapi import Request, HTTPException, APIRouter, Depends
from src.dependencies.dependencies_repository import get_user_repository
from src.database.repositories.base import UserRepository
from src.schemas.user import User
from src.database.firebase_auth import FirebaseAuthService

router = APIRouter()    

@router.post("/auth/google")
async def google_auth_callback(
    request: Request,
    user_repo: UserRepository = Depends(get_user_repository)
):
    decoded_token = await FirebaseAuthService.verify_firebase_token(request.headers.get('Authorization'))
    user_id = decoded_token.get('uid')
    if not user_id:
        raise HTTPException(status_code=400, detail='No UID in Firebase token')
    
    # Check if user exists using repository abstraction
    existing_user = await user_repo.get_by_id(user_id)
    if not existing_user:
        user_data = User(user_id=user_id, video_ids=[], credits=config.starting_credits).dict()
        await user_repo.create(user_data)
    return decoded_token

@router.post("/auth/email")
async def verify_email_auth(
    request: Request,
    user_repo: UserRepository = Depends(get_user_repository)
):
    decoded_token = await FirebaseAuthService.verify_firebase_token(request.headers.get('Authorization'))
    user_id = decoded_token.get('uid')
    if not user_id:
        raise HTTPException(status_code=400, detail='No UID in Firebase token')
    
    # Check if user exists using repository abstraction
    existing_user = await user_repo.get_by_id(user_id)
    if not existing_user:
        user_data = User(user_id=user_id, video_ids=[], credits=config.starting_credits).dict()
        await user_repo.create(user_data)
    return decoded_token