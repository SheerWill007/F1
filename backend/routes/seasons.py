import logging
from datetime import datetime

from fastapi import APIRouter, HTTPException

from services.fastf1_service import get_event_schedule
from utils.helpers import safe_val

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/api/seasons")
def get_seasons():
    return {"seasons": list(range(2018, datetime.now().year + 1))}


@router.get("/api/schedule/{year}")
def get_schedule(year: int):
    if year < 1950 or year > datetime.now().year + 1:
        raise HTTPException(status_code=400, detail="Invalid year.")
    try:
        schedule = get_event_schedule(year)
        races = []
        for _, row in schedule.iterrows():
            races.append(
                {
                    "round": safe_val(row.get("RoundNumber")),
                    "name": safe_val(row.get("EventName")),
                    "country": safe_val(row.get("Country")),
                    "location": safe_val(row.get("Location")),
                    "date": str(row.get("EventDate", ""))[:10],
                    "format": safe_val(row.get("EventFormat")),
                }
            )
        return {"year": year, "races": races}
    except Exception as e:
        logger.exception("get_schedule failed year=%s: %s", year, e)
        raise HTTPException(status_code=500, detail=str(e))
