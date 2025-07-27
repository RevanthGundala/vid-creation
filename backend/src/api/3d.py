from datetime import datetime
from uuid import uuid4
from fastapi import APIRouter
from src.database.schemas import Project
from src.database.firebase import firebase_auth_dependency, get_firestore_client
from fastapi import Depends


router = APIRouter()

@router.post("/api/generate-3d-asset")
async def generate_3d_asset(prompt: str, user=Depends(firebase_auth_dependency)):
    db = get_firestore_client()
    now = datetime.now()
    project_id = str(uuid4())
    data = {
        "project_id": project_id,
        "user_id": user.uid,
        "prompt": prompt,
        "status": "pending",
        "created_at": now,
        "modified_at": now
    }
    data["project_id"] = project_id
    data["created_at"] = now
    data["modified_at"] = now
    doc_ref = db.collection("Project").document(project_id)
    doc_ref.set(data)