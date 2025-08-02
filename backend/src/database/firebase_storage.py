"""
Firebase Storage service for file operations.
Provides storage functionality without database operations.
"""
import os
from typing import Optional, Dict, Any
from src.config import config
import firebase_admin
from firebase_admin import credentials, storage
from firebase_admin.exceptions import FirebaseError

class FirebaseStorage:
    def __init__(self, bucket_name: Optional[str] = None, app: Optional[firebase_admin.App] = None):
        """
        Initialize Firebase Storage client.
        
        Args:
            bucket_name: Custom bucket name (optional, uses default if not provided)
            app: Custom Firebase app instance (optional)
        """
        self._bucket_name = bucket_name or config.gcp_bucket_name
        self._app = app
        self._bucket = None
        self._initialize_bucket()
    
    def _initialize_bucket(self):
        """Initialize the storage bucket."""
        try:
            # Check if Firebase app is already initialized
            if not firebase_admin._apps:
                # Initialize Firebase app if not already done
                if os.getenv('ENVIRONMENT', 'development') == 'development':
                    # Use emulator for development
                    os.environ['STORAGE_EMULATOR_HOST'] = 'http://localhost:9199'
                    print("🔧 Using Firebase Storage emulator for development")
                
                # Initialize with default credentials (works with emulator or service account)
                firebase_admin.initialize_app(options={
                    'storageBucket': self._bucket_name
                })
                print("✅ Successfully initialized Firebase app")
            
            # Get bucket reference
            self._bucket = storage.bucket(self._bucket_name, app=self._app)
            
        except Exception as e:
            print(f"❌ Failed to initialize Firebase Storage: {e}")
            raise
    
    @property
    def bucket(self):
        """Get the storage bucket instance."""
        if self._bucket is None:
            self._initialize_bucket()
        return self._bucket
    
    def generate_signed_upload_url(self, destination_blob_name: str, expiration: int = 15 * 60, 
                                 content_type: str = "application/octet-stream") -> str:
        """
        Generate a signed URL for uploading a file to Firebase Storage.
        
        Args:
            destination_blob_name: The path/name for the file in storage
            expiration: URL expiration time in seconds (default: 15 minutes)
            content_type: MIME type of the file being uploaded
            
        Returns:
            Signed URL for uploading
        """
        try:
            blob = self.bucket.blob(destination_blob_name)
            url = blob.generate_signed_url(
                version="v4",
                expiration=expiration,
                method="PUT",
                content_type=content_type,
            )
            return url
        except Exception as e:
            print(f"❌ Failed to generate signed upload URL: {e}")
            raise
    
    def generate_download_url(self, blob_name: str, expiration: Optional[int] = None) -> str:
        """
        Generate a download URL for a file in Firebase Storage.
        
        Args:
            blob_name: The path/name of the file in storage
            expiration: URL expiration time in seconds (None for non-expiring URL)
            
        Returns:
            Download URL for the file
        """
        try:
            blob = self.bucket.blob(blob_name)
            
            # Use a default expiration of 1 hour if None is provided
            if expiration is None:
                expiration = 3600  # 1 hour in seconds
            
            # Generate signed URL with expiration
            url = blob.generate_signed_url(
                version="v4",
                expiration=expiration,
                method="GET"
            )
            
            return url
        except Exception as e:
            print(f"❌ Failed to generate download URL: {e}")
            raise
    
    def upload_file(self, source_file_path: str, destination_blob_name: str, 
                   content_type: Optional[str] = None) -> Dict[str, Any]:
        """
        Upload a file to Firebase Storage.
        
        Args:
            source_file_path: Local path to the file to upload
            destination_blob_name: The path/name for the file in storage
            content_type: MIME type of the file (auto-detected if not provided)
            
        Returns:
            Dictionary with upload result information
        """
        try:
            blob = self.bucket.blob(destination_blob_name)
            
            if content_type:
                blob.content_type = content_type
            
            blob.upload_from_filename(source_file_path)
            
            # Get public URL if bucket is public, otherwise generate signed URL
            try:
                public_url = blob.public_url
            except:
                public_url = self.generate_download_url(destination_blob_name)
            
            return {
                "success": True,
                "blob_name": destination_blob_name,
                "size": blob.size,
                "content_type": blob.content_type,
                "public_url": public_url,
                "bucket": self._bucket_name
            }
            
        except Exception as e:
            print(f"❌ Failed to upload file: {e}")
            raise
    
    def upload_bytes(self, data: bytes, destination_blob_name: str, 
                    content_type: str = "application/octet-stream") -> Dict[str, Any]:
        """
        Upload bytes data to Firebase Storage.
        
        Args:
            data: Bytes data to upload
            destination_blob_name: The path/name for the file in storage
            content_type: MIME type of the data
            
        Returns:
            Dictionary with upload result information
        """
        try:
            blob = self.bucket.blob(destination_blob_name)
            
            # Create a temporary file-like object
            import io
            file_obj = io.BytesIO(data)
            
            # Set content type before upload
            blob.content_type = content_type
            
            # Upload from file object
            blob.upload_from_file(file_obj, content_type=content_type)
            
            # Get public URL if bucket is public, otherwise generate signed URL
            try:
                public_url = blob.public_url
            except:
                public_url = self.generate_download_url(destination_blob_name)
            
            return {
                "success": True,
                "blob_name": destination_blob_name,
                "size": blob.size,
                "content_type": blob.content_type,
                "public_url": public_url,
                "bucket": self._bucket_name
            }
            
        except Exception as e:
            print(f"❌ Failed to upload bytes: {e}")
            raise
    
    def download_file(self, blob_name: str, destination_file_path: str) -> bool:
        """
        Download a file from Firebase Storage.
        
        Args:
            blob_name: The path/name of the file in storage
            destination_file_path: Local path where to save the file
            
        Returns:
            True if download successful, False otherwise
        """
        try:
            blob = self.bucket.blob(blob_name)
            blob.download_to_filename(destination_file_path)
            return True
        except Exception as e:
            print(f"❌ Failed to download file: {e}")
            return False
    
    def delete_file(self, blob_name: str) -> bool:
        """
        Delete a file from Firebase Storage.
        
        Args:
            blob_name: The path/name of the file in storage
            
        Returns:
            True if deletion successful, False otherwise
        """
        try:
            blob = self.bucket.blob(blob_name)
            blob.delete()
            return True
        except Exception as e:
            print(f"❌ Failed to delete file: {e}")
            return False
    
    def file_exists(self, blob_name: str) -> bool:
        """
        Check if a file exists in Firebase Storage.
        
        Args:
            blob_name: The path/name of the file in storage
            
        Returns:
            True if file exists, False otherwise
        """
        try:
            blob = self.bucket.blob(blob_name)
            return blob.exists()
        except Exception as e:
            print(f"❌ Failed to check file existence: {e}")
            return False
    
    def get_file_metadata(self, blob_name: str) -> Optional[Dict[str, Any]]:
        """
        Get metadata for a file in Firebase Storage.
        
        Args:
            blob_name: The path/name of the file in storage
            
        Returns:
            Dictionary with file metadata or None if file doesn't exist
        """
        try:
            blob = self.bucket.blob(blob_name)
            blob.reload()  # Refresh metadata
            
            return {
                "name": blob.name,
                "size": blob.size,
                "content_type": blob.content_type,
                "created": blob.time_created,
                "updated": blob.updated,
                "md5_hash": blob.md5_hash,
                "etag": blob.etag
            }
        except Exception as e:
            print(f"❌ Failed to get file metadata: {e}")
            return None

# Singleton Firebase Storage client
_firebase_storage = None

def get_firebase_storage(bucket_name: Optional[str] = None) -> FirebaseStorage:
    """
    Get a singleton instance of Firebase Storage client.
    
    Args:
        bucket_name: Custom bucket name (optional)
        
    Returns:
        FirebaseStorage instance
    """
    global _firebase_storage
    if _firebase_storage is None:
        _firebase_storage = FirebaseStorage(bucket_name=bucket_name)
    return _firebase_storage 