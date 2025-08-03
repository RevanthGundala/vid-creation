#!/bin/bash

pkill -f "uvicorn"

source .venv/bin/activate

# Start backend server
python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000 --env-file .env.development
