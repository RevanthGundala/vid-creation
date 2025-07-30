#!/bin/bash

# Test GCS emulator functionality
echo "🧪 Testing GCS emulator..."

# Check if Firebase emulators are running
if ! curl -s http://localhost:4000 > /dev/null; then
    echo "❌ Firebase emulators not running. Please start them first:"
    echo "   firebase emulators:start"
    exit 1
fi

echo "✅ Firebase emulators are running"

# Test file upload
echo "📤 Testing file upload to GCS emulator..."

# Upload the ksplat file from assets directory
UPLOAD_RESPONSE=$(curl -s -X POST "http://localhost:8000/api/upload-to-gcs" \
  -F "file=@assets/ksplat/truck.ksplat")

echo "Upload response: $UPLOAD_RESPONSE"

echo "✅ GCS emulator test completed" 