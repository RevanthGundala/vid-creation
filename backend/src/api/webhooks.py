from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
import json
import asyncio
from typing import Set, Dict, List
import logging
from collections import defaultdict

logger = logging.getLogger(__name__)

router = APIRouter()

# Store active webhook connections
active_connections: Set[str] = set()

# In-memory message queue: {job_id: [messages]}
job_message_queues: Dict[str, List[dict]] = defaultdict(list)

# Event notifiers for each job: {job_id: asyncio.Event}
job_events: Dict[str, asyncio.Event] = defaultdict(asyncio.Event)


async def publish_job_update(job_id: str, message: dict):
    """
    Publish a job update message to all listeners for this job.
    This function should be called whenever a job is updated.
    """
    logger.info(f"Publishing job update for {job_id}: {message}")
    
    # Add message to queue
    job_message_queues[job_id].append(message)

    # TODO: Potential race condition here. 
    # If multiple threads call this function, the event may be set multiple times.
    # This is not a problem for our use case, but it is something to be aware of.
    # Notify all waiting streams for this job
    if job_id in job_events:
        job_events[job_id].set()
        # Reset the event for next update
        job_events[job_id] = asyncio.Event()


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
            
            # Track last message index to avoid resending
            last_message_index = 0
            
            # Keep connection alive and wait for updates
            while connection_id in active_connections:
                # Check for new messages in the queue
                messages = job_message_queues[job_id]
                if len(messages) > last_message_index:
                    # Send new messages
                    for i in range(last_message_index, len(messages)):
                        message = messages[i]
                        yield f"data: {json.dumps(message)}\n\n"
                    last_message_index = len(messages)
                
                # Wait for next update or timeout
                try:
                    await asyncio.wait_for(job_events[job_id].wait(), timeout=30.0)
                except asyncio.TimeoutError:
                    # Send heartbeat to keep connection alive
                    yield f"data: {json.dumps({'type': 'heartbeat', 'job_id': job_id})}\n\n"
                
        except asyncio.CancelledError:
            logger.info(f"Webhook stream cancelled for job {job_id}")
        finally:
            # Clean up connection
            active_connections.discard(connection_id)
            
            # Clean up message queue if no more connections for this job
            remaining_connections = [conn for conn in active_connections if conn.startswith(f"{job_id}_")]
            if not remaining_connections:
                # Clean up old messages (keep last 10 for late connections)
                if len(job_message_queues[job_id]) > 10:
                    job_message_queues[job_id] = job_message_queues[job_id][-10:]
    
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