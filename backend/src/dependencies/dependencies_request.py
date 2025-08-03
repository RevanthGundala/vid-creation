from fastapi import Request, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from src.schemas.user import User
from src.repositories.base import DatabaseRepository, FileStorageRepository
from src.services.job_service import JobService
from src.services.job_processor import JobProcessor
from src.services.auth_service import AuthService

# Security scheme for Bearer token authentication
security = HTTPBearer()

def get_job_service(request: Request) -> JobService:
    return request.app.state.job_service

def get_job_processor(request: Request) -> JobProcessor:
    return request.app.state.job_processor

def get_user_repository(request: Request) -> DatabaseRepository:
    return request.app.state.user_repo

def get_job_repository(request: Request) -> DatabaseRepository:
    return request.app.state.job_repo

def get_file_storage_repository(request: Request) -> FileStorageRepository:
    return request.app.state.file_storage

def get_auth_service(request: Request) -> AuthService:
    return request.app.state.auth_service

async def get_current_user_from_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth_service: AuthService = Depends(get_auth_service),
    user_repo: DatabaseRepository = Depends(get_user_repository)
) -> User:
    """
    Dependency to get the current user from a Bearer token.
    Use this for token-based authentication.
    """
    return await auth_service.get_current_user_from_token(credentials, user_repo)