from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
import json
import asyncio
from typing import Set
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# Store active webhook connections
active_connections: Set[str] = set()


@router.get("/api/webhooks/{job_id}/stream")
async def stream_job_updates(job_id: str):
    """
    Server-Sent Events (SSE) endpoint for streaming job updates.
    The frontend can connect to this endpoint to receive real-time updates.
    """
    async def event_stream():
        try:
            # Add connection to active set
            connection_id = f"{job_id}_{id(asyncio.current_task())}"
            active_connections.add(connection_id)
            
            logger.info(f"Webhook stream started for job {job_id}")
            
            # Send initial connection message
            yield f"data: {json.dumps({'type': 'connected', 'job_id': job_id})}\n\n"
            
            # Keep connection alive and wait for updates
            # In a real implementation, you'd use a message queue or pub/sub system
            while connection_id in active_connections:
                await asyncio.sleep(1)
                
        except asyncio.CancelledError:
            logger.info(f"Webhook stream cancelled for job {job_id}")
        finally:
            # Clean up connection
            active_connections.discard(connection_id)
    
    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Cache-Control"
        }
    )

@router.post("/api/webhooks/test")
async def test_webhook(request: Request):
    """
    Test endpoint for webhook notifications.
    """
    try:
        body = await request.json()
        logger.info(f"Received webhook test: {body}")
        return {"status": "received", "data": body}
    except Exception as e:
        logger.error(f"Error processing webhook test: {e}")
        raise HTTPException(status_code=400, detail="Invalid webhook data") 