import logging
import traceback
from datetime import datetime

import numpy as np
from fastapi import APIRouter, HTTPException

from services.lap_loader import load_lap_session
from utils.colors import get_team_color
from utils.driver_lookup import build_driver_name_lookup
from utils.helpers import safe_val, safe_timedelta

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/api/race/{year}/{round_number}/positions")
def get_lap_positions(year: int, round_number: int, session_type: str = "R"):
    if year < 1950 or year > datetime.now().year + 1:
        raise HTTPException(status_code=400, detail="Invalid year.")
    if round_number < 1 or round_number > 30:
        raise HTTPException(status_code=400, detail="Invalid round number.")
    try:
        session, laps = load_lap_session(year, round_number, session_type)

        drivers = laps["Driver"].unique().tolist()
        driver_name_lookup = build_driver_name_lookup(laps)

        driver_info = {}
        for drv in drivers:
            drv_laps = laps[laps["Driver"] == drv]
            team = (
                str(drv_laps["Team"].iloc[0])
                if "Team" in drv_laps.columns
                else "Unknown"
            )
            driver_info[drv] = {
                "code": drv,
                "fullName": driver_name_lookup.get(drv, drv),
                "team": team,
                "color": get_team_color(team),
            }

        max_lap = int(laps["LapNumber"].max())
        lap_data = []
        for lap_num in range(1, max_lap + 1):
            lap_positions = {}
            for drv in drivers:
                rows = laps[(laps["Driver"] == drv) & (laps["LapNumber"] == lap_num)]
                if len(rows) > 0:
                    pos = rows["Position"].iloc[0]
                    lap_positions[drv] = {
                        "position": (
                            safe_val(pos)
                            if not (isinstance(pos, float) and np.isnan(pos))
                            else None
                        ),
                        "lapTime": safe_timedelta(rows["LapTime"].iloc[0]),
                    }
            lap_data.append({"lap": lap_num, "positions": lap_positions})

        return {
            "year": year,
            "round": round_number,
            "sessionType": session_type,
            "event": str(session.event["EventName"]),
            "totalLaps": max_lap,
            "drivers": driver_info,
            "laps": lap_data,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(
            "get_lap_positions failed year=%s round=%s session=%s: %s",
            year,
            round_number,
            session_type,
            e,
        )
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
