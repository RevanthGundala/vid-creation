"""
Firebase implementation of the repository interfaces.
This handles all Firebase-specific logic while implementing the generic repository contracts.
"""
import os
from typing import Dict, Any, Optional, List
from src.database.repositories.base import (
    BaseRepository, StorageRepository, UserRepository, JobRepository, 
    ProjectRepository, AssetRepository
)
import firebase_admin
from firebase_admin import firestore_async as firestore
from src.database.firebase_storage import get_firebase_storage, FirebaseStorage
from src.schemas.job import JobType, JobStatus


class FirebaseRepository(BaseRepository[Dict[str, Any]]):
    """Firebase implementation of the base repository interface."""
    
    def __init__(self, collection_name: str):
        # Ensure Firebase is initialized before creating Firestore client
        if not firebase_admin._apps:
            from src.database.firebase_auth import FirebaseAuthService
            FirebaseAuthService.initialize_firebase()
        
        self._collection_name = collection_name
        self._firestore_client = None
    
    def _convert_enums_for_firestore(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Convert enum values to strings for Firestore storage."""
        converted_data = data.copy()
        
        # Convert JobType enum to string
        if "job_type" in converted_data and isinstance(converted_data["job_type"], JobType):
            converted_data["job_type"] = converted_data["job_type"].value
        
        # Convert JobStatus enum to string
        if "status" in converted_data and isinstance(converted_data["status"], JobStatus):
            converted_data["status"] = converted_data["status"].value
        
        return converted_data
    
    def _convert_strings_to_enums(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Convert string values back to enums for application use."""
        converted_data = data.copy()
        
        # Convert string back to JobType enum
        if "job_type" in converted_data and isinstance(converted_data["job_type"], str):
            try:
                converted_data["job_type"] = JobType(converted_data["job_type"])
            except ValueError:
                # If the string doesn't match any enum value, keep it as string
                pass
        
        # Convert string back to JobStatus enum
        if "status" in converted_data and isinstance(converted_data["status"], str):
            try:
                converted_data["status"] = JobStatus(converted_data["status"])
            except ValueError:
                # If the string doesn't match any enum value, keep it as string
                pass
        
        return converted_data 

    # TODO: Switch back to initializing the firestore client in the constructor
    # Currently using lazy initialization b/c got errors when using emulator mode
    def _get_firestore_client(self):
        """Get Firestore client, initializing if needed."""
        if self._firestore_client is None:
            # Explicitly set emulator host for Firestore client
            if os.getenv('APP_ENV', 'development') == 'development':
                os.environ['FIRESTORE_EMULATOR_HOST'] = '127.0.0.1:8080'
                print(f"🔧 Setting FIRESTORE_EMULATOR_HOST to {os.getenv('FIRESTORE_EMULATOR_HOST')}")
            
            self._firestore_client = firestore.client()
        return self._firestore_client
    
    async def create(self, entity: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new entity in Firestore."""
        firestore_client = self._get_firestore_client()
        # Extract ID from entity or generate one
        entity_id = entity.get('id') or entity.get('job_id')
        if not entity_id:
            raise ValueError("Entity must have an 'id', 'user_id', or 'job_id' field")
        
        # Convert enums to strings for Firestore storage
        firestore_entity = self._convert_enums_for_firestore(entity)
        
        print(f"🔧 Creating entity in collection '{self._collection_name}' with ID '{entity_id}'")
        print(f"🔧 Entity data: {firestore_entity}")
        
        doc_ref = firestore_client.collection(self._collection_name).document(entity_id)
        await doc_ref.set(firestore_entity)
        
        # Verify the document was created
        doc = await doc_ref.get()
        if doc.exists:
            print(f"✅ Entity {entity_id} successfully created in Firestore")
        else:
            print(f"❌ Entity {entity_id} was not found in Firestore after creation!")
        
        return entity
    
    async def get_by_id(self, entity_id: str) -> Optional[Dict[str, Any]]:
        """Get an entity by ID from Firestore."""
        firestore_client = self._get_firestore_client()
        print(f"🔍 Looking for entity {entity_id} in collection '{self._collection_name}'")
        doc_ref = firestore_client.collection(self._collection_name).document(entity_id)
        doc = await doc_ref.get()
        if doc.exists:
            print(f"✅ Found entity {entity_id} in Firestore")
            data = doc.to_dict()
            # Convert strings back to enums for application use
            return self._convert_strings_to_enums(data)
        else:
            print(f"❌ Entity {entity_id} not found in Firestore")
            return None
    
    async def update(self, entity_id: str, entity: Dict[str, Any]) -> Dict[str, Any]:
        """Update an existing entity in Firestore."""
        firestore_client = self._get_firestore_client()
        # Convert enums to strings for Firestore storage
        firestore_entity = self._convert_enums_for_firestore(entity)
        
        doc_ref = firestore_client.collection(self._collection_name).document(entity_id)
        await doc_ref.update(firestore_entity)
        # Get the updated document
        doc = await doc_ref.get()
        if doc.exists:
            data = doc.to_dict()
            # Convert strings back to enums for application use
            return self._convert_strings_to_enums(data)
        return None
    
    async def delete(self, entity_id: str) -> bool:
        """Delete an entity from Firestore."""
        firestore_client = self._get_firestore_client()
        doc_ref = firestore_client.collection(self._collection_name).document(entity_id)
        await doc_ref.delete()
        return True
    
    async def find_all(self, filters: Dict[str, Any] = None, limit: int = None) -> List[Dict[str, Any]]:
        """Find all entities matching optional filters."""
        firestore_client = self._get_firestore_client()
        
        query = firestore_client.collection(self._collection_name)
        
        # Apply filters using the async Firestore syntax
        if filters:
            for key, value in filters.items():
                query = query.where(key, "==", value)
        
        # Apply limit
        if limit:
            query = query.limit(limit)
        
        # Execute query
        docs = query.stream()
        results = [doc.to_dict() async for doc in docs]
        # Convert strings back to enums for application use
        return [self._convert_strings_to_enums(doc) for doc in results]
    
    async def find_one(self, filters: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Find a single entity matching the filters."""
        results = await self.find_all(filters, limit=1)
        return results[0] if results else None


# Specific Firebase repository implementations
class FirebaseUserRepository(FirebaseRepository, UserRepository):
    """Firebase implementation for user operations."""
    
    def __init__(self):
        super().__init__("users")


class FirebaseJobRepository(FirebaseRepository, JobRepository):
    """Firebase implementation for job operations."""
    
    def __init__(self):
        super().__init__("jobs")


class FirebaseProjectRepository(FirebaseRepository, ProjectRepository):
    """Firebase implementation for project operations."""
    
    def __init__(self):
        super().__init__("projects")


class FirebaseAssetRepository(FirebaseRepository, AssetRepository):
    """Firebase implementation for asset operations."""
    
    def __init__(self):
        super().__init__("assets")


class FirebaseStorageRepository(StorageRepository):
    """Firebase implementation of the storage repository interface."""
    
    def __init__(self, bucket_name: Optional[str] = None):
        self._storage = get_firebase_storage(bucket_name)
    
    async def upload_file(self, file_content: bytes, filename: str, content_type: str = "application/octet-stream") -> Dict[str, Any]:
        """Upload a file to Firebase Storage."""
        return self._storage.upload_bytes(file_content, filename, content_type)
    
    async def download_file(self, filename: str) -> bytes:
        """Download a file from Firebase Storage."""
        # Note: Firebase Storage doesn't have a direct download_as_bytes method
        # This would need to be implemented based on your specific needs
        # For now, we'll return an empty bytes object as a placeholder
        raise NotImplementedError("Direct file download not implemented yet")
    
    async def delete_file(self, filename: str) -> bool:
        """Delete a file from Firebase Storage."""
        return self._storage.delete_file(filename)
    
    async def file_exists(self, filename: str) -> bool:
        """Check if a file exists in Firebase Storage."""
        return self._storage.file_exists(filename)
    
    async def get_file_metadata(self, filename: str) -> Optional[Dict[str, Any]]:
        """Get metadata for a file in Firebase Storage."""
        return self._storage.get_file_metadata(filename)
    
    async def list_files(self, prefix: str = None) -> List[Dict[str, Any]]:
        """List files in Firebase Storage with optional prefix filter."""
        bucket = self._storage.bucket
        blobs = list(bucket.list_blobs(prefix=prefix))
        
        files = []
        for blob in blobs:
            files.append({
                "name": blob.name,
                "size": blob.size,
                "created": blob.time_created.isoformat() if blob.time_created else None,
                "content_type": blob.content_type
            })
        
        return files
    
    async def generate_download_url(self, filename: str, expiration: Optional[int] = None) -> str:
        """Generate a download URL for a file in Firebase Storage."""
        return self._storage.generate_download_url(filename, expiration) 