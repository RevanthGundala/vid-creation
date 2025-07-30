#!/usr/bin/env python3

import os
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from src.database.gcs import get_gcs_client
from src.config import config

def list_files():
    """List all files in the GCS bucket"""
    try:
        # Set environment for emulator
        os.environ['ENVIRONMENT'] = 'development'
        os.environ['STORAGE_EMULATOR_HOST'] = 'http://localhost:9199'
        
        client = get_gcs_client()
        if client is None:
            print("❌ Failed to get GCS client")
            return
        
        bucket = client.bucket(config.gcp_bucket_name)
        
        print(f"📁 Listing files in bucket: {config.gcp_bucket_name}")
        print("-" * 50)
        
        blobs = list(bucket.list_blobs())
        if not blobs:
            print("No files found in bucket")
        else:
            for blob in blobs:
                print(f"📄 {blob.name} (Size: {blob.size} bytes, Created: {blob.time_created})")
        
        print("-" * 50)
        print(f"Total files: {len(blobs)}")
        
    except Exception as e:
        print(f"❌ Error listing files: {e}")

if __name__ == "__main__":
    list_files() 