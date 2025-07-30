"""
Firestore service for handling all database operations.
Provides a clean abstraction layer over the Firestore client.
"""
from typing import Dict, Any, Optional, List
from src.database.firebase import FirebaseService
from src.database.mock_db import get_mock_firestore_client, MockFirestoreClient


class FirestoreService:
    """Service class for handling all Firestore database operations."""
    _firestore_service = None
    def __init__(self):
        """Initialize the Firestore service with either real or mock client."""
        self.client = FirebaseService.get_firestore_client()
        if self.client is None:
            # Fall back to mock client if real client fails
            self.client = get_mock_firestore_client()
            print("⚠️ Using mock Firestore client")
        else:
            print("✅ Using real Firestore client")

    @staticmethod
    def get_firestore_service() -> 'FirestoreService':
        """Get the global Firestore service instance."""
        if FirestoreService._firestore_service is None:
            FirestoreService._firestore_service = FirestoreService()
        return FirestoreService._firestore_service
    
    async def create_document(
        self, 
        collection: str, 
        doc_id: str, 
        data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create a new document in the specified collection."""
        try:
            if isinstance(self.client, MockFirestoreClient):
                # Use mock client interface
                self.client.set_document(collection, doc_id, data)
                return data
            else:
                # Use real Firestore client
                doc_ref = self.client.collection(collection).document(doc_id)
                doc_ref.set(data)
                return data
        except Exception as e:
            print(f"❌ Error creating document {doc_id} in {collection}: {e}")
            raise
    
    async def get_document(
        self, 
        collection: str, 
        doc_id: str
    ) -> Optional[Dict[str, Any]]:
        """Get a document by ID from the specified collection."""
        try:
            if isinstance(self.client, MockFirestoreClient):
                # Use mock client interface
                return self.client.get_document(collection, doc_id)
            else:
                # Use real Firestore client
                doc_ref = self.client.collection(collection).document(doc_id)
                doc = doc_ref.get()
                return doc.to_dict() if doc.exists else None
        except Exception as e:
            print(f"❌ Error getting document {doc_id} from {collection}: {e}")
            raise
    
    async def update_document(
        self, 
        collection: str, 
        doc_id: str, 
        data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update an existing document in the specified collection."""
        try:
            if isinstance(self.client, MockFirestoreClient):
                # For mock client, we need to merge with existing data
                existing_data = self.client.get_document(collection, doc_id) or {}
                updated_data = {**existing_data, **data}
                self.client.set_document(collection, doc_id, updated_data)
                return updated_data
            else:
                # Use real Firestore client
                doc_ref = self.client.collection(collection).document(doc_id)
                doc_ref.update(data)
                # Get the updated document
                doc = doc_ref.get()
                return doc.to_dict() if doc.exists else None
        except Exception as e:
            print(f"❌ Error updating document {doc_id} in {collection}: {e}")
            raise
    
    async def delete_document(self, collection: str, doc_id: str) -> bool:
        """Delete a document from the specified collection."""
        try:
            if isinstance(self.client, MockFirestoreClient):
                # Mock client doesn't have delete, so we set to None
                self.client.set_document(collection, doc_id, None)
                return True
            else:
                # Use real Firestore client
                doc_ref = self.client.collection(collection).document(doc_id)
                doc_ref.delete()
                return True
        except Exception as e:
            print(f"❌ Error deleting document {doc_id} from {collection}: {e}")
            raise
    
    async def query_collection(
        self, 
        collection: str, 
        filters: List[tuple] = None,
        order_by: str = None,
        direction: str = "ASCENDING",
        limit: int = None
    ) -> List[Dict[str, Any]]:
        """Query documents in a collection with optional filters and ordering."""
        try:
            if isinstance(self.client, MockFirestoreClient):
                # Use mock client interface
                documents = self.client.query_collection(collection, filters or [])
                # Apply ordering and limit
                if order_by:
                    reverse = direction == "DESCENDING"
                    documents.sort(key=lambda doc: doc.to_dict().get(order_by, ""), reverse=reverse)
                if limit:
                    documents = documents[:limit]
                return [doc.to_dict() for doc in documents]
            else:
                # Use real Firestore client
                query = self.client.collection(collection)
                
                # Apply filters
                if filters:
                    for field, operator, value in filters:
                        query = query.where(field, operator, value)
                
                # Apply ordering
                if order_by:
                    query = query.order_by(order_by, direction=direction)
                
                # Apply limit
                if limit:
                    query = query.limit(limit)
                
                # Execute query
                docs = query.stream()
                return [doc.to_dict() for doc in docs]
        except Exception as e:
            print(f"❌ Error querying collection {collection}: {e}")
            raise
    
    async def get_collection_reference(self, collection: str):
        """Get a collection reference for advanced operations."""
        return self.client.collection(collection)
    
    async def get_document_reference(self, collection: str, doc_id: str):
        """Get a document reference for advanced operations."""
        return self.client.collection(collection).document(doc_id)

