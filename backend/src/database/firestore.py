from google.cloud import firestore
import os
from functools import cache

# Optionally set GOOGLE_APPLICATION_CREDENTIALS in your environment for local dev
# os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "/path/to/service-account.json"

# Singleton Firestore client
_firestore_client = None

@cache
def get_firestore_client():
    global _firestore_client
    if _firestore_client is None:
        _firestore_client = firestore.Client()
    return _firestore_client 