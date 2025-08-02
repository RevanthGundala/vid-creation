"""
Base repository interfaces for database operations.
These define the contract that all database implementations must follow.
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List, Generic, TypeVar

T = TypeVar('T')

class BaseRepository(ABC, Generic[T]):
    """Base repository interface for common database operations."""
    
    @abstractmethod
    async def create(self, entity: T) -> T:
        """Create a new entity in the database."""
        pass
    
    @abstractmethod
    async def get_by_id(self, entity_id: str) -> Optional[T]:
        """Get an entity by ID from the database."""
        pass
    
    @abstractmethod
    async def update(self, entity_id: str, entity: T) -> T:
        """Update an existing entity in the database."""
        pass
    
    @abstractmethod
    async def delete(self, entity_id: str) -> bool:
        """Delete an entity from the database."""
        pass
    
    @abstractmethod
    async def find_all(self, filters: Dict[str, Any] = None, limit: int = None) -> List[T]:
        """Find all entities matching optional filters."""
        pass
    
    @abstractmethod
    async def find_one(self, filters: Dict[str, Any]) -> Optional[T]:
        """Find a single entity matching the filters."""
        pass


class StorageRepository(ABC):
    """Base repository interface for file storage operations."""
    
    @abstractmethod
    async def upload_file(self, file_content: bytes, filename: str, content_type: str = "application/octet-stream") -> Dict[str, Any]:
        """Upload a file to storage."""
        pass
    
    @abstractmethod
    async def download_file(self, filename: str) -> bytes:
        """Download a file from storage."""
        pass
    
    @abstractmethod
    async def delete_file(self, filename: str) -> bool:
        """Delete a file from storage."""
        pass
    
    @abstractmethod
    async def file_exists(self, filename: str) -> bool:
        """Check if a file exists in storage."""
        pass
    
    @abstractmethod
    async def get_file_metadata(self, filename: str) -> Optional[Dict[str, Any]]:
        """Get metadata for a file in storage."""
        pass
    
    @abstractmethod
    async def list_files(self, prefix: str = None) -> List[Dict[str, Any]]:
        """List files in storage with optional prefix filter."""
        pass
    
    @abstractmethod
    async def generate_download_url(self, filename: str, expiration: Optional[int] = None) -> str:
        """Generate a download URL for a file."""
        pass


# Specific repository interfaces for different entity types
class UserRepository(BaseRepository[Dict[str, Any]]):
    """Repository interface for user operations."""
    pass


class JobRepository(BaseRepository[Dict[str, Any]]):
    """Repository interface for job operations."""
    pass


class ProjectRepository(BaseRepository[Dict[str, Any]]):
    """Repository interface for project operations."""
    pass


class AssetRepository(BaseRepository[Dict[str, Any]]):
    """Repository interface for asset operations."""
    pass 