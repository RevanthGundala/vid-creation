"""
Google Cloud Firestore implementation of the repository interfaces.
This handles all Google Cloud Firestore-specific logic while implementing the generic repository contracts.
"""
from typing import Dict, Any, Optional, List
from src.repositories.base import (
    DatabaseRepository, FileStorageRepository
)
from google.cloud import firestore, storage
from src.schemas.job import JobType, JobStatus
from src.config import config
import os


class GCPFirestoreRepository(DatabaseRepository[Dict[str, Any]]):
    """Google Cloud Firestore implementation of the base repository interface."""
    
    def __init__(self, collection_name: str):
        self._firestore_client = firestore.AsyncClient(project=config.gcp_project_id, 
        database=config.firestore_database_id)
        self._collection_name = collection_name

    # TODO: This is probably eating performance
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
                pass  # Keep as string if not a valid enum value
        
        # Convert string back to JobStatus enum
        if "status" in converted_data and isinstance(converted_data["status"], str):
            try:
                converted_data["status"] = JobStatus(converted_data["status"])
            except ValueError:
                pass  # Keep as string if not a valid enum value
        
        return converted_data 

    async def create(self, entity: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new entity in Firestore."""
        # Extract ID from entity or generate one
        entity_id = entity.get('id') or entity.get('job_id') or entity.get('user_id')
        if not entity_id:
            raise ValueError("Entity must have an 'id', 'user_id', or 'job_id' field")
        
        # Convert enums to strings for Firestore storage
        firestore_entity = self._convert_enums_for_firestore(entity)
        
        print(f"🔧 Creating entity in collection '{self._collection_name}' with ID '{entity_id}'")
        print(f"🔧 Entity data: {firestore_entity}")
        
        doc_ref = self._firestore_client.collection(self._collection_name).document(entity_id)
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
        print(f"🔍 Looking for entity {entity_id} in collection '{self._collection_name}'")
        doc_ref = self._firestore_client.collection(self._collection_name).document(entity_id)
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
        # Convert enums to strings for Firestore storage
        firestore_entity = self._convert_enums_for_firestore(entity)
        
        doc_ref = self._firestore_client.collection(self._collection_name).document(entity_id)
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
        doc_ref = self._firestore_client.collection(self._collection_name).document(entity_id)
        await doc_ref.delete()
        return True
    
    async def find_all(self, filters: Dict[str, Any] = None, limit: int = None) -> List[Dict[str, Any]]:
        """Find all entities matching optional filters."""
        query = self._firestore_client.collection(self._collection_name)
        
        if filters:
            for key, value in filters.items():
                query = query.where(key, "==", value)
        
        if limit:
            query = query.limit(limit)
        
        docs = query.stream()
        results = [doc.to_dict() async for doc in docs]
        return [self._convert_strings_to_enums(doc) for doc in results]
    
    async def find_one(self, filters: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Find a single entity matching the filters."""
        results = await self.find_all(filters, limit=1)
        return results[0] if results else None
    
    async def upsert(self, entity: Dict[str, Any]) -> Dict[str, Any]:
        """Upsert an entity into Firestore."""
        user_id = entity.get("user_id")
        if not user_id:
            raise ValueError("Entity must have a 'user_id' field to upsert")
        existing_entity = await self.get_by_id(user_id)
        if existing_entity: 
            return await self.update(user_id, entity)
        return await self.create(entity)
    

class GCPFileStorageRepository(FileStorageRepository[Dict[str, Any]]):
    """Google Cloud implementation for storage operations."""
    
    def __init__(self, bucket_name: Optional[str] = None):
        # Initialize service account credentials for signed URLs
        self._service_account_credentials = None
        service_account_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        print(f"🔍 Service account path: {service_account_path}")
        if service_account_path and os.path.exists(service_account_path):
            from google.oauth2 import service_account
            print(f"✅ Loaded service account credentials from {service_account_path}")
            self._service_account_credentials = service_account.Credentials.from_service_account_file(service_account_path)
        self._storage = storage.Client()
        self._bucket_name = bucket_name
    
    async def upload_file(self, source_file_path: str, destination_blob_name: str, 
                         content_type: Optional[str] = None) -> Dict[str, Any]:
        """Upload a file to Google Cloud Storage."""
        bucket = self._storage.bucket(self._bucket_name)
        blob = bucket.blob(destination_blob_name)
        if content_type:
            blob.upload_from_filename(source_file_path, content_type=content_type)
        return {"blob_name": destination_blob_name, "bucket": self._bucket_name}
    
    async def upload_bytes(self, data: bytes, destination_blob_name: str, 
                          content_type: str = "application/octet-stream") -> Dict[str, Any]:
        """Upload bytes data to Google Cloud Storage."""
        bucket = self._storage.bucket(self._bucket_name)
        blob = bucket.blob(destination_blob_name)
        blob.upload_from_string(data, content_type=content_type)
        return {"blob_name": destination_blob_name, "bucket": self._bucket_name}
    
    async def download_file(self, blob_name: str, destination_file_path: str) -> bool:
        """Download a file from Google Cloud Storage."""
        bucket = self._storage.bucket(self._bucket_name)
        blob = bucket.blob(blob_name)
        if blob.exists():
            blob.download_to_filename(destination_file_path)
            return True
        return False
    
    async def delete_file(self, blob_name: str) -> bool:
        """Delete a file from Google Cloud Storage."""
        bucket = self._storage.bucket(self._bucket_name)
        blob = bucket.blob(blob_name)
        blob.delete()
        return not blob.exists()
    
    async def file_exists(self, blob_name: str) -> bool:
        """Check if a file exists in Google Cloud Storage."""
        return self._storage.file_exists(blob_name)
    
    async def list_files(self, prefix: Optional[str] = None) -> List[str]:
        """List all files in the bucket, optionally filtering by a prefix."""
        blobs = self._storage.list_blobs(self._bucket_name, prefix=prefix)
        return [blob.name for blob in blobs]
    
    async def get_file_metadata(self, blob_name: str) -> Optional[Dict[str, Any]]:
        """Get metadata for a file in Google Cloud Storage."""
        return self._storage.get_file_metadata(blob_name)
    
    async def generate_signed_upload_url(self, destination_blob_name: str, expiration: int = 15 * 60, 
                                       content_type: str = "application/octet-stream") -> str:
        """Generate a signed URL for uploading a file to Google Cloud Storage."""
        if self._service_account_credentials:
            print("✅ Using service account credentials for signed URL")
            # Use service account credentials for signed URLs
            client = storage.Client(credentials=self._service_account_credentials)
            bucket = client.bucket(self._bucket_name)
        else:
            # Fallback to default credentials
            print("⚠️ Using default credentials - signed URLs may not work")
            bucket = self._storage.bucket(self._bucket_name)
        
        blob = bucket.blob(destination_blob_name)
        from datetime import timedelta
        return blob.generate_signed_url(expiration=timedelta(seconds=expiration), method="PUT", content_type=content_type)
    
    async def generate_download_url(self, blob_name: str, expiration: Optional[int] = None) -> str:
        """Generate a download URL for a file in Google Cloud Storage."""
        if self._service_account_credentials:
            print("✅ Using service account credentials for signed URL")
            # Use service account credentials for signed URLs
            client = storage.Client(credentials=self._service_account_credentials)
            bucket = client.bucket(self._bucket_name)
        else:
            # Fallback to default credentials
            print("⚠️ Using default credentials - signed URLs may not work")
            bucket = self._storage.bucket(self._bucket_name)
        
        blob = bucket.blob(blob_name)
        if expiration is None:
            expiration = 3600  # 1 hour default
        from datetime import timedelta
        print(f"🔍 About to generate signed URL for blob: {blob_name}")
        return blob.generate_signed_url(expiration=timedelta(seconds=expiration), method="GET")
        print(f"✅ Generated signed URL successfully")
