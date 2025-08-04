from fastapi import Request, APIRouter, Depends
from fastapi.responses import JSONResponse
from src.repositories.base import DatabaseRepository
from src.dependencies.dependencies_request import get_auth_service, get_user_repository, get_current_user_from_cookie
from src.services.auth_service import AuthService
from src.schemas.user import User

router = APIRouter()

@router.get("/api/auth/login")
async def login(
    auth_service: AuthService = Depends(get_auth_service)
):
    """
    Login endpoint.
    """
    return await auth_service.login()

@router.get("/api/auth/callback")
async def handle_callback(
    request: Request,
    auth_service: AuthService = Depends(get_auth_service),
    user_repo: DatabaseRepository = Depends(get_user_repository)
) -> JSONResponse:
    """
    Handle the callback from the AuthKit login flow.
    Returns access_token and refresh_token.
    """
    return await auth_service.handle_callback(request, user_repo)

@router.get("/api/auth/me")
async def get_current_user(
    current_user: User = Depends(get_current_user_from_cookie)
):
    """
    Get current user information.
    This endpoint requires a valid Bearer token.
    """
    return current_user

@router.post("/api/auth/logout")
async def logout(
    request: Request,
    auth_service: AuthService = Depends(get_auth_service)
):
    """
    Logout endpoint.
    """
    return await auth_service.logout(request)