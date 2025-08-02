#!/bin/bash

# Shutdown all firebase emulators
pkill -f "firebase/emulators"
pkill -f "uvicorn"

# Start Firebase emulators
firebase emulators:start &

# Generate TypeScript types
source .venv/bin/activate
# python scripts/generate_types.py

# Start backend server
export APP_ENV=development
python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000 --env-file .env.development
