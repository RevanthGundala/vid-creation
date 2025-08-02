from fastapi import Request
from src.services.job_service import JobService
from src.services.job_processor import JobProcessor


def get_job_service(request: Request) -> JobService:
    return request.app.state.job_service

def get_job_processor(request: Request) -> JobProcessor:
    return request.app.state.job_processor
