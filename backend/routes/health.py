import os
from datetime import datetime

from fastapi import APIRouter

from config.settings import cache_dir

router = APIRouter()
_START_TIME = datetime.utcnow()


@router.get("/")
def root():
    return {"status": "F1 Dashboard API running", "version": "1.0.0"}


@router.get("/health")
def health():
    return {
        "status": "healthy",
        "uptime_seconds": (datetime.utcnow() - _START_TIME).total_seconds(),
        "cache_dir_exists": os.path.isdir(cache_dir),
    }
