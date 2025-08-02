"""
Dependency injection functions for the repository pattern.
These provide database abstractions to API endpoints without exposing Firebase-specific details.
"""
from fastapi import Depends, Header, HTTPException, status
from src.database.repositories.base import (
    BaseRepository, StorageRepository, UserRepository, JobRepository, 
    ProjectRepository, AssetRepository
)
from src.database.repositories.firebase_repository import (
    FirebaseUserRepository, FirebaseJobRepository, FirebaseProjectRepository, 
    FirebaseAssetRepository, FirebaseStorageRepository
)
from src.database.firebase_auth import FirebaseAuthService


def get_user_repository() -> UserRepository:
    """
    Dependency function that provides a user repository instance.
    
    Returns:
        UserRepository: User repository implementation (currently Firebase)
        
    Example:
        @app.get("/users/{user_id}")
        def get_user(user_id: str, repo: UserRepository = Depends(get_user_repository)):
            return repo.get_by_id(user_id)
    """
    return FirebaseUserRepository()


def get_job_repository() -> JobRepository:
    """
    Dependency function that provides a job repository instance.
    
    Returns:
        JobRepository: Job repository implementation (currently Firebase)
        
    Example:
        @app.get("/jobs/{job_id}")
        def get_job(job_id: str, repo: JobRepository = Depends(get_job_repository)):
            return repo.get_by_id(job_id)
    """
    return FirebaseJobRepository()


def get_asset_repository() -> AssetRepository:
    """
    Dependency function that provides an asset repository instance.
    
    Returns:
        AssetRepository: Asset repository implementation (currently Firebase)
        
    Example:
        @app.get("/assets/{asset_id}")
        def get_asset(asset_id: str, repo: AssetRepository = Depends(get_asset_repository)):
            return repo.get_by_id(asset_id)
    """
    return FirebaseAssetRepository()


def get_storage_repository(bucket_name: str = None) -> StorageRepository:
    """
    Dependency function that provides a storage repository instance.
    
    Args:
        bucket_name: Optional custom bucket name
        
    Returns:
        StorageRepository: Storage repository implementation (currently Firebase)
        
    Example:
        @app.post("/upload/")
        def upload_file(
            file: UploadFile,
            storage: StorageRepository = Depends(get_storage_repository)
        ):
            return storage.upload_file(file.read(), file.filename)
    """
    return FirebaseStorageRepository(bucket_name=bucket_name)


def get_authenticated_user(authorization: str = Header(None)):
    """
    Dependency function that provides an authenticated user from Firebase Auth.
    
    Returns:
        dict: Decoded Firebase token with user information
        
    Example:
        @app.get("/profile/")
        def get_profile(user: dict = Depends(get_authenticated_user)):
            return {"user_id": user["uid"]}
    """
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Missing or invalid Authorization header'
        )
    
    id_token = authorization.split(' ')[1]
    try:
        user = FirebaseAuthService.verify_firebase_token(id_token)
        print(f"✅ User authenticated: {user.get('uid', 'No UID')}")
        return user
    except Exception as e:
        print(f"❌ Authentication failed: {e}")
        raise


# Type aliases for better IDE support and documentation
UserRepo = Depends(get_user_repository)
JobRepo = Depends(get_job_repository)
AssetRepo = Depends(get_asset_repository)
StorageRepo = Depends(get_storage_repository)
AuthenticatedUser = Depends(get_authenticated_user) 