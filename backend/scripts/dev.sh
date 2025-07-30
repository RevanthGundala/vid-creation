#!/bin/bash

# Shutdown all firebase emulators
pkill -f "firebase/emulators"

# Start Firebase emulators
firebase emulators:start &

# Start backend server
source .venv/bin/activate
ENVIRONMENT=development python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000 &
