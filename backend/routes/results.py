import logging
import traceback
from datetime import datetime

from fastapi import APIRouter, HTTPException

from services.session_service import load_results_session
from utils.colors import get_team_color
from utils.helpers import safe_val, safe_timedelta

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/api/race/{year}/{round_number}/results")
def get_race_results(year: int, round_number: int, session_type: str = "R"):
    if year < 1950 or year > datetime.now().year + 1:
        raise HTTPException(status_code=400, detail="Invalid year.")
    if round_number < 1 or round_number > 30:
        raise HTTPException(status_code=400, detail="Invalid round number.")
    try:
        session = load_results_session(year, round_number, session_type)

        results = session.results
        if results is None or len(results) == 0:
            raise HTTPException(status_code=404, detail="No results available.")

        result_list = []
        for _, row in results.iterrows():
            team = str(row.get("TeamName", "Unknown"))
            result_list.append(
                {
                    "position": safe_val(row.get("Position")),
                    "driverNumber": safe_val(row.get("DriverNumber")),
                    "code": safe_val(row.get("Abbreviation")),
                    "fullName": safe_val(row.get("FullName")),
                    "team": team,
                    "color": get_team_color(team),
                    "points": safe_val(row.get("Points")),
                    "status": safe_val(row.get("Status")),
                    "gridPosition": safe_val(row.get("GridPosition")),
                    "time": safe_timedelta(row.get("Time")),
                }
            )

        result_list.sort(key=lambda x: (x["position"] or 99))

        return {
            "year": year,
            "round": round_number,
            "event": str(session.event["EventName"]),
            "results": result_list,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(
            "get_race_results failed year=%s round=%s session=%s: %s",
            year,
            round_number,
            session_type,
            e,
        )
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
