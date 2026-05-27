import logging
import traceback
from datetime import datetime

from fastapi import APIRouter, HTTPException

from services.lap_loader import load_lap_session
from utils.colors import TYRE_COLORS, get_team_color
from utils.driver_lookup import build_driver_name_lookup
from utils.helpers import safe_val, safe_timedelta

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/api/race/{year}/{round_number}/tyres")
def get_tyre_strategy(year: int, round_number: int, session_type: str = "R"):
    if year < 1950 or year > datetime.now().year + 1:
        raise HTTPException(status_code=400, detail="Invalid year.")
    if round_number < 1 or round_number > 30:
        raise HTTPException(status_code=400, detail="Invalid round number.")
    try:
        session, laps = load_lap_session(year, round_number, session_type)

        drivers = laps["Driver"].unique().tolist()
        driver_name_lookup = build_driver_name_lookup(laps)

        driver_tyres = {}
        for drv in drivers:
            drv_laps = laps[laps["Driver"] == drv].copy().sort_values("LapNumber")
            stints, stint_data = [], []
            prev_compound, stint_start = None, None

            for _, lap in drv_laps.iterrows():
                compound = str(lap.get("Compound", "UNKNOWN")).upper()
                if compound in ["NAN", "NONE", ""]:
                    compound = "UNKNOWN"
                lap_num = safe_val(lap["LapNumber"])

                if compound != prev_compound:
                    if prev_compound is not None and stint_start is not None:
                        stints.append(
                            {
                                "compound": prev_compound,
                                "startLap": stint_start,
                                "endLap": lap_num - 1,
                                "laps": lap_num - stint_start,
                                "color": TYRE_COLORS.get(prev_compound, "#888888"),
                            }
                        )
                    stint_start = lap_num
                    prev_compound = compound

                stint_data.append(
                    {
                        "lap": lap_num,
                        "compound": compound,
                        "tyreLife": safe_val(lap.get("TyreLife")),
                        "color": TYRE_COLORS.get(compound, "#888888"),
                        "isPersonalBest": bool(lap.get("IsPersonalBest", False)),
                        "lapTime": safe_timedelta(lap.get("LapTime")),
                        "sector1": safe_timedelta(lap.get("Sector1Time")),
                        "sector2": safe_timedelta(lap.get("Sector2Time")),
                        "sector3": safe_timedelta(lap.get("Sector3Time")),
                    }
                )

            if prev_compound is not None and stint_start is not None:
                last_lap = safe_val(drv_laps["LapNumber"].max())
                stints.append(
                    {
                        "compound": prev_compound,
                        "startLap": stint_start,
                        "endLap": last_lap,
                        "laps": last_lap - stint_start + 1,
                        "color": TYRE_COLORS.get(prev_compound, "#888888"),
                    }
                )

            team = (
                str(drv_laps["Team"].iloc[0])
                if "Team" in drv_laps.columns
                else "Unknown"
            )
            driver_tyres[drv] = {
                "code": drv,
                "fullName": driver_name_lookup.get(drv, drv),
                "team": team,
                "color": get_team_color(team),
                "stints": stints,
                "laps": stint_data,
            }

        return {
            "year": year,
            "round": round_number,
            "sessionType": session_type,
            "event": str(session.event["EventName"]),
            "drivers": driver_tyres,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(
            "get_tyre_strategy failed year=%s round=%s session=%s: %s",
            year,
            round_number,
            session_type,
            e,
        )
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
