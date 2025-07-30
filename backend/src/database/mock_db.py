"""
Mock database implementation for local development.
This provides in-memory storage that mimics Firestore behavior.
"""
from typing import Dict, Any, Optional, List
from datetime import datetime
import uuid
from collections import defaultdict

class MockDocument:
    """Mock Firestore document."""
    
    def __init__(self, data: Dict[str, Any]):
        self._data = data
    
    def to_dict(self) -> Dict[str, Any]:
        return self._data.copy()
    
    def exists(self) -> bool:
        return True

class MockDocumentReference:
    """Mock Firestore document reference."""
    
    def __init__(self, collection: str, document_id: str, mock_db):
        self.collection = collection
        self.document_id = document_id
        self.mock_db = mock_db
    
    def get(self) -> MockDocument:
        data = self.mock_db.get_document(self.collection, self.document_id)
        return MockDocument(data) if data else MockDocument({})
    
    def set(self, data: Dict[str, Any]):
        self.mock_db.set_document(self.collection, self.document_id, data)
    
    def update(self, data: Dict[str, Any]):
        current_data = self.mock_db.get_document(self.collection, self.document_id) or {}
        current_data.update(data)
        self.mock_db.set_document(self.collection, self.document_id, current_data)

class MockQuery:
    """Mock Firestore query."""
    
    def __init__(self, collection: str, mock_db):
        self.collection = collection
        self.mock_db = mock_db
        self.filters = []
        self.order_by_field = None
        self.order_by_direction = "ASCENDING"
        self.limit_count = None
    
    def where(self, field: str, operator: str, value: Any) -> 'MockQuery':
        self.filters.append((field, operator, value))
        return self
    
    def order_by(self, field: str, direction: str = "ASCENDING") -> 'MockQuery':
        self.order_by_field = field
        self.order_by_direction = direction
        return self
    
    def limit(self, count: int) -> 'MockQuery':
        self.limit_count = count
        return self
    
    def stream(self) -> List[MockDocument]:
        documents = self.mock_db.query_collection(self.collection, self.filters)
        
        # Apply ordering
        if self.order_by_field:
            reverse = self.order_by_direction == "DESCENDING"
            documents.sort(key=lambda doc: doc._data.get(self.order_by_field, ""), reverse=reverse)
        
        # Apply limit
        if self.limit_count:
            documents = documents[:self.limit_count]
        
        return documents

class MockFirestoreClient:
    """Mock Firestore client for local development."""
    
    def __init__(self):
        self._collections: Dict[str, Dict[str, Dict[str, Any]]] = defaultdict(dict)
    
    def collection(self, collection_name: str) -> 'MockCollectionReference':
        return MockCollectionReference(collection_name, self)
    
    def get_document(self, collection: str, document_id: str) -> Optional[Dict[str, Any]]:
        return self._collections[collection].get(document_id)
    
    def set_document(self, collection: str, document_id: str, data: Dict[str, Any]):
        self._collections[collection][document_id] = data.copy()
    
    def query_collection(self, collection: str, filters: List[tuple]) -> List[MockDocument]:
        documents = []
        for doc_id, data in self._collections[collection].items():
            # Apply filters
            matches = True
            for field, operator, value in filters:
                if operator == "==":
                    if data.get(field) != value:
                        matches = False
                        break
                elif operator == "!=":
                    if data.get(field) == value:
                        matches = False
                        break
            
            if matches:
                documents.append(MockDocument(data))
        
        return documents

class MockCollectionReference:
    """Mock Firestore collection reference."""
    
    def __init__(self, collection_name: str, mock_client: MockFirestoreClient):
        self.collection_name = collection_name
        self.mock_client = mock_client
    
    def document(self, document_id: str) -> MockDocumentReference:
        return MockDocumentReference(self.collection_name, document_id, self.mock_client)
    
    def where(self, field: str, operator: str, value: Any) -> MockQuery:
        query = MockQuery(self.collection_name, self.mock_client)
        return query.where(field, operator, value)

# Global mock client instance
_mock_firestore_client = None

def get_mock_firestore_client() -> MockFirestoreClient:
    """Get the global mock Firestore client instance."""
    global _mock_firestore_client
    if _mock_firestore_client is None:
        _mock_firestore_client = MockFirestoreClient()
    return _mock_firestore_client 