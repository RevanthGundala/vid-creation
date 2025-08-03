"""
Simple authentication service for AuthKit integration.
Provides server-side token validation for AuthKit frontend authentication.
"""
import os
from fastapi import HTTPException, Request
import logging
from workos import WorkOSClient
from fastapi.responses import RedirectResponse
from src.config import config
from src.schemas.user import User
from src.repositories.base import DatabaseRepository

logger = logging.getLogger(__name__)

class AuthService:
    """Simple authentication service for AuthKit token validation."""
    
    def __init__(self):
        self._auth_client = WorkOSClient(
            api_key=os.getenv("WORKOS_API_KEY"), client_id=os.getenv("WORKOS_CLIENT_ID")
        )
        self._cookie_password = os.getenv("COOKIE_PASSWORD")
        self._frontend_redirect_url = os.getenv("FRONTEND_REDIRECT_URL")

    async def login(self) -> RedirectResponse:
        """
        Login to the AuthKit login flow.
        """
        try:
            auth_url = self._auth_client.user_management.get_authorization_url(
                provider="authkit", redirect_uri=os.getenv("WORKOS_REDIRECT_URI")
            )
            return RedirectResponse(auth_url)
        except Exception as e:
            print("Error getting authorization URL", e)
            raise HTTPException(status_code=500, detail="Error getting authorization URL") from e

    async def handle_callback(self, request: Request, user_repo: DatabaseRepository) -> RedirectResponse:
        """
        Callback from the AuthKit login flow.
        Sets HTTP-only cookies and redirects to the frontend.
        """
        try:
            code = request.query_params.get("code")
            
            auth_response = self._auth_client.user_management.authenticate_with_code(
                code=code,
                session={"seal_session": True, "cookie_password": self._cookie_password},
            )
            user = auth_response.user
            user_data = User(
                user_id=user.id,
                email=user.email,
                first_name=user.first_name,
                last_name=user.last_name,
                profile_picture_url=user.profile_picture_url,
            )
            await user_repo.create(user_data.model_dump())
            
            # Create redirect response to frontend
            response = RedirectResponse(url=self._frontend_redirect_url, status_code=302)
            
            response.set_cookie(
                config.COOKIE_NAME,
                auth_response.sealed_session,
                secure=True,
                httponly=True,
                samesite="lax",
            )

            return response
            
        except Exception as e:
            print("Error authenticating with code", e)
            raise HTTPException(status_code=401, detail="Invalid code") from e


    async def get_current_user_from_token(self, request: Request, user_repo: DatabaseRepository) -> User:
        """
        Get the current user from an access token.
        """
        try:
            session = self._auth_client.user_management.load_sealed_session(
                sealed_session=request.cookies.get(config.COOKIE_NAME),
                cookie_password=self._cookie_password,
            )
            auth_response = session.authenticate()
            if auth_response.authenticated:
                user_id = auth_response.user.id
                user = await user_repo.get_by_id(user_id)
                if user:
                    return user
                else:
                    raise HTTPException(status_code=401, detail="User not found")
            elif (
                auth_response.authenticated is False
                and auth_response.reason == "no_session_cookie_provided"
            ):
                return RedirectResponse(url=f"{self._frontend_redirect_url}", status_code=302)
            elif auth_response.authenticated is False and auth_response.reason == "invalid_session_cookie":
                response = RedirectResponse(url=f"{self._frontend_redirect_url}", status_code=302)
                response.delete_cookie(config.COOKIE_NAME)
                return response
            else:
                # If no session, attempt a refresh
                try:
                    print("Refreshing session")
                    result = session.refresh()
                    if result.authenticated is False:
                        return RedirectResponse(url=f"{self._frontend_redirect_url}", status_code=302)
                    response = RedirectResponse(url=request.url, status_code=302)
                    response.set_cookie(
                        config.COOKIE_NAME,
                        result.sealed_session,
                        secure=True,
                        httponly=True,
                        samesite="lax",
                    )
                    return response
                except Exception as e:
                    print("Error refreshing session", e)
                    response = RedirectResponse(url=f"{self._frontend_redirect_url}", status_code=302)
                    response.delete_cookie(config.COOKIE_NAME)
                    return response
        except Exception as e:
            logger.error(f"Error getting current user from token: {e}")
            raise HTTPException(status_code=401, detail="Invalid token") from e

    async def logout(self, request: Request):
        session = self._auth_client.user_management.load_sealed_session(
            sealed_session=request.cookies.get(config.COOKIE_NAME),
            cookie_password=self._cookie_password,
        )
        url = session.get_logout_url()
        response = RedirectResponse(url=url, status_code=302)
        response.delete_cookie(config.COOKIE_NAME)

        return response



    
