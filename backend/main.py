from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import fastf1
import pandas as pd
import numpy as np
from datetime import datetime
import os
from threading import Lock
import warnings
import traceback
import logging

warnings.filterwarnings("ignore")

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
logging.getLogger("fastf1").propagate = False
fastf1.set_log_level(os.getenv("FASTF1_LOG_LEVEL", "ERROR"))

# ---------------------------------------------------------------------------
# FastF1 cache — /tmp is the correct writable path on Render
# ---------------------------------------------------------------------------
cache_dir = "/tmp/fastf1"
os.makedirs(cache_dir, exist_ok=True)
fastf1.Cache.enable_cache(cache_dir)

app = FastAPI(title="F1 Dashboard API", version="1.0.0")

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://slipstreams-f1.vercel.app",
    "https://f1-git-main-williamtecumsehsherman007-7520s-projects.vercel.app",
    "https://f1.willx.tech",
]

_env_origins = os.getenv("ALLOWED_ORIGINS", "")
if _env_origins:
    origins += [o.strip() for o in _env_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Team colors (2024 season)
# ---------------------------------------------------------------------------
TEAM_COLORS = {
    "Red Bull Racing": "#18407A",
    "Ferrari": "#E8002D",
    "Mercedes": "#27F4D2",
    "McLaren": "#FF8000",
    "Aston Martin": "#229971",
    "Alpine": "#FF87BC",
    "Williams": "#64C4FF",
    "RB": "#6692FF",
    "Kick Sauber": "#52E252",
    "Haas F1 Team": "#B6BABD",
}

TEAM_COLOR_FALLBACK = "#FFFFFF"


def get_team_color(team_name: str) -> str:
    for key in TEAM_COLORS:
        if key.lower() in team_name.lower() or team_name.lower() in key.lower():
            return TEAM_COLORS[key]
    return TEAM_COLOR_FALLBACK


TYRE_COLORS = {
    "SOFT": "#E8002D",
    "MEDIUM": "#FFF200",
    "HARD": "#FFFFFF",
    "INTERMEDIATE": "#39B54A",
    "WET": "#0067FF",
    "UNKNOWN": "#888888",
    "TEST_UNKNOWN": "#888888",
}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def safe_val(val):
    """Convert numpy/pandas types to Python native types safely."""
    if val is None:
        return None
    if isinstance(val, float) and np.isnan(val):
        return None
    if isinstance(val, (np.integer,)):
        return int(val)
    if isinstance(val, (np.floating,)):
        return float(val)
    if isinstance(val, pd.Timestamp):
        return str(val)
    if hasattr(val, "item"):
        return val.item()
    return val


def safe_timedelta(val):
    """Safely convert a Timedelta/NaT value to string."""
    try:
        if val is None:
            return None
        if pd.isna(val):
            return None
        return str(val)
    except (TypeError, ValueError):
        return None


def build_driver_name_lookup(laps: pd.DataFrame) -> dict:
    """
    Build driver abbreviation -> full name lookup purely from laps DataFrame.
    Avoids session.get_driver() which needs results metadata loaded separately.
    """
    lookup = {}
    for drv in laps["Driver"].unique().tolist():
        drv_laps = laps[laps["Driver"] == drv]
        resolved = drv
        for col in ["FullName", "BroadcastName", "Driver"]:
            if col in drv_laps.columns:
                val = str(drv_laps[col].iloc[0])
                if val and val not in ["nan", "None", ""]:
                    resolved = val
                    break
        lookup[drv] = resolved
    return lookup


_START_TIME = datetime.utcnow()
_LAP_LOAD_LOCK = Lock()


def load_lap_session(year: int, round_number: int, session_type: str):
    """
    Load a session with laps=True. Serialised via a lock so concurrent requests
    don't saturate the FastF1 download threads.

    Strategy:
      1. Try with cache enabled (fast path for already-cached races).
      2. On ANY exception, retry once with the cache disabled (handles corrupt
         cache entries and network-level errors from the Ergast fallback).
      3. If both attempts fail, raise HTTP 503 with the actual error message so
         the frontend can show a meaningful error instead of a silent blank.
    """
    with _LAP_LOAD_LOCK:
        last_exc = None
        for attempt, bypass_cache in enumerate((False, True), start=1):
            try:
                if bypass_cache:
                    logger.warning(
                        "Retrying lap load without cache: year=%s round=%s session=%s",
                        year, round_number, session_type,
                    )
                    ctx = fastf1.Cache.disabled()
                else:
                    from contextlib import nullcontext
                    ctx = nullcontext()

                with ctx:
                    session = fastf1.get_session(year, round_number, session_type)
                    session.load(
                        laps=True,
                        telemetry=False,
                        weather=False,
                        messages=False,
                    )

                laps = session.laps
                if laps is None or len(laps) == 0:
                    raise ValueError("Session loaded but laps DataFrame is empty.")

                logger.info(
                    "Lap session loaded (attempt %d): year=%s round=%s session=%s rows=%d",
                    attempt, year, round_number, session_type, len(laps),
                )
                return session, laps

            except Exception as exc:
                last_exc = exc
                logger.warning(
                    "Lap load attempt %d failed: year=%s round=%s session=%s — %s",
                    attempt, year, round_number, session_type, exc,
                )

        # Both attempts failed — surface the real error to the caller.
        logger.error(
            "All lap load attempts exhausted: year=%s round=%s session=%s — %s",
            year, round_number, session_type, last_exc,
        )
        raise HTTPException(
            status_code=503,
            detail=(
                f"Lap timing data could not be loaded after 2 attempts. "
                f"Underlying error: {last_exc}"
            ),
        )


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/")
def root():
    return {"status": "F1 Dashboard API running", "version": "1.0.0"}


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "uptime_seconds": (datetime.utcnow() - _START_TIME).total_seconds(),
        "cache_dir_exists": os.path.isdir(cache_dir),
    }


@app.get("/api/seasons")
def get_seasons():
    """Return available seasons (2018 – current year)."""
    return {"seasons": list(range(2018, datetime.now().year + 1))}


@app.get("/api/schedule/{year}")
def get_schedule(year: int):
    """Return the race schedule for a given year."""
    if year < 1950 or year > datetime.now().year + 1:
        raise HTTPException(status_code=400, detail="Invalid year.")
    try:
        schedule = fastf1.get_event_schedule(year, include_testing=False)
        races = []
        for _, row in schedule.iterrows():
            races.append({
                "round":    safe_val(row.get("RoundNumber")),
                "name":     safe_val(row.get("EventName")),
                "country":  safe_val(row.get("Country")),
                "location": safe_val(row.get("Location")),
                "date":     str(row.get("EventDate", ""))[:10],
                "format":   safe_val(row.get("EventFormat")),
            })
        return {"year": year, "races": races}
    except Exception as e:
        logger.exception("get_schedule failed year=%s: %s", year, e)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/session/{year}/{round_number}")
def get_session_info(year: int, round_number: int):
    """Return available sessions for a round."""
    if year < 1950 or year > datetime.now().year + 1:
        raise HTTPException(status_code=400, detail="Invalid year.")
    if round_number < 1 or round_number > 30:
        raise HTTPException(status_code=400, detail="Invalid round number.")
    try:
        event = fastf1.get_event(year, round_number)
        sessions = []
        for i in range(1, 6):
            name = event.get(f"Session{i}", None)
            if name and str(name) not in ["None", ""]:
                sessions.append({"number": i, "name": str(name)})
        return {
            "year":     year,
            "round":    round_number,
            "event":    safe_val(event.get("EventName")),
            "sessions": sessions,
        }
    except Exception as e:
        logger.exception("get_session_info failed year=%s round=%s: %s", year, round_number, e)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/race/{year}/{round_number}/positions")
def get_lap_positions(year: int, round_number: int, session_type: str = "R"):
    """Return lap-by-lap position data for all drivers."""
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
            team = str(drv_laps["Team"].iloc[0]) if "Team" in drv_laps.columns else "Unknown"
            driver_info[drv] = {
                "code":     drv,
                "fullName": driver_name_lookup.get(drv, drv),
                "team":     team,
                "color":    get_team_color(team),
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
                        "position": safe_val(pos) if not (isinstance(pos, float) and np.isnan(pos)) else None,
                        "lapTime":  safe_timedelta(rows["LapTime"].iloc[0]),
                    }
            lap_data.append({"lap": lap_num, "positions": lap_positions})

        return {
            "year":        year,
            "round":       round_number,
            "sessionType": session_type,
            "event":       str(session.event["EventName"]),
            "totalLaps":   max_lap,
            "drivers":     driver_info,
            "laps":        lap_data,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(
            "get_lap_positions failed year=%s round=%s session=%s: %s",
            year, round_number, session_type, e,
        )
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/race/{year}/{round_number}/tyres")
def get_tyre_strategy(year: int, round_number: int, session_type: str = "R"):
    """Return tyre compound and stint data for all drivers."""
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
                        stints.append({
                            "compound":  prev_compound,
                            "startLap":  stint_start,
                            "endLap":    lap_num - 1,
                            "laps":      lap_num - stint_start,
                            "color":     TYRE_COLORS.get(prev_compound, "#888888"),
                        })
                    stint_start = lap_num
                    prev_compound = compound

                stint_data.append({
                    "lap":            lap_num,
                    "compound":       compound,
                    "tyreLife":       safe_val(lap.get("TyreLife")),
                    "color":          TYRE_COLORS.get(compound, "#888888"),
                    "isPersonalBest": bool(lap.get("IsPersonalBest", False)),
                    "lapTime":        safe_timedelta(lap.get("LapTime")),
                    "sector1":        safe_timedelta(lap.get("Sector1Time")),
                    "sector2":        safe_timedelta(lap.get("Sector2Time")),
                    "sector3":        safe_timedelta(lap.get("Sector3Time")),
                })

            # Close the final stint
            if prev_compound is not None and stint_start is not None:
                last_lap = safe_val(drv_laps["LapNumber"].max())
                stints.append({
                    "compound": prev_compound,
                    "startLap": stint_start,
                    "endLap":   last_lap,
                    "laps":     last_lap - stint_start + 1,
                    "color":    TYRE_COLORS.get(prev_compound, "#888888"),
                })

            team = str(drv_laps["Team"].iloc[0]) if "Team" in drv_laps.columns else "Unknown"
            driver_tyres[drv] = {
                "code":     drv,
                "fullName": driver_name_lookup.get(drv, drv),
                "team":     team,
                "color":    get_team_color(team),
                "stints":   stints,
                "laps":     stint_data,
            }

        return {
            "year":        year,
            "round":       round_number,
            "sessionType": session_type,
            "event":       str(session.event["EventName"]),
            "drivers":     driver_tyres,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(
            "get_tyre_strategy failed year=%s round=%s session=%s: %s",
            year, round_number, session_type, e,
        )
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/race/{year}/{round_number}/results")
def get_race_results(year: int, round_number: int, session_type: str = "R"):
    """Return final race results."""
    if year < 1950 or year > datetime.now().year + 1:
        raise HTTPException(status_code=400, detail="Invalid year.")
    if round_number < 1 or round_number > 30:
        raise HTTPException(status_code=400, detail="Invalid round number.")
    try:
        session = fastf1.get_session(year, round_number, session_type)
        session.load(
            laps=False,
            telemetry=False,
            weather=False,
            messages=False,
        )

        results = session.results
        if results is None or len(results) == 0:
            raise HTTPException(status_code=404, detail="No results available.")

        result_list = []
        for _, row in results.iterrows():
            team = str(row.get("TeamName", "Unknown"))
            result_list.append({
                "position":     safe_val(row.get("Position")),
                "driverNumber": safe_val(row.get("DriverNumber")),
                "code":         safe_val(row.get("Abbreviation")),
                "fullName":     safe_val(row.get("FullName")),
                "team":         team,
                "color":        get_team_color(team),
                "points":       safe_val(row.get("Points")),
                "status":       safe_val(row.get("Status")),
                "gridPosition": safe_val(row.get("GridPosition")),
                "time":         safe_timedelta(row.get("Time")),
            })

        result_list.sort(key=lambda x: (x["position"] or 99))

        return {
            "year":    year,
            "round":   round_number,
            "event":   str(session.event["EventName"]),
            "results": result_list,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(
            "get_race_results failed year=%s round=%s session=%s: %s",
            year, round_number, session_type, e,
        )
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))