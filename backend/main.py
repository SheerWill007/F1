from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import fastf1
import fastf1.plotting
import pandas as pd
import numpy as np
from typing import Optional, List
from datetime import datetime
import os
import warnings
warnings.filterwarnings('ignore')

# Enable FastF1 cache
cache_dir = "./f1_cache"
os.makedirs(cache_dir, exist_ok=True)
fastf1.Cache.enable_cache(cache_dir)

app = FastAPI(title="F1 Dashboard API", version="1.0.0")

# ---------------------------------------------------------------------------
# CORS — update VERCEL_URL to your actual Vercel deployment URL(s)
# ---------------------------------------------------------------------------
origins = [
    # --- Local development ---
    "http://localhost:3000",
    "http://127.0.0.1:3000",

    # --- Production Vercel URLs ---
    "https://slipstreams-f1.vercel.app",
    "https://f1-git-main-williamtecumsehs​herman007-7520s-projects.vercel.app",
]

# Alternatively, read allowed origins from an environment variable so you
# never have to redeploy the backend just to add a new frontend URL:
#
#   ALLOWED_ORIGINS="https://your-app.vercel.app,https://your-custom-domain.com"
#
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

# Official F1 team colors (2024 season)
TEAM_COLORS = {
    "Red Bull Racing": "#3671C6",
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
    if hasattr(val, 'item'):
        return val.item()
    return val


_START_TIME = datetime.utcnow()

@app.get("/")
def root():
    return {"status": "F1 Dashboard API running", "version": "1.0.0"}


@app.get("/health")
def health():
    uptime_seconds = (datetime.utcnow() - _START_TIME).total_seconds()
    return {
        "status": "healthy",
        "uptime_seconds": uptime_seconds,
        "cache_dir_exists": os.path.isdir(cache_dir),
    }


@app.get("/api/seasons")
def get_seasons():
    """Return available seasons (2018–current year)."""
    return {"seasons": list(range(2018, datetime.now().year + 1))}


@app.get("/api/schedule/{year}")
def get_schedule(year: int):
    """Return the race schedule for a given year."""
    if year < 1950 or year > datetime.now().year + 1:
        raise HTTPException(status_code=400, detail="Invalid year. Must be between 1950 and current year + 1")
    try:
        schedule = fastf1.get_event_schedule(year, include_testing=False)
        races = []
        for _, row in schedule.iterrows():
            races.append({
                "round": safe_val(row.get("RoundNumber")),
                "name": safe_val(row.get("EventName")),
                "country": safe_val(row.get("Country")),
                "location": safe_val(row.get("Location")),
                "date": str(row.get("EventDate", ""))[:10],
                "format": safe_val(row.get("EventFormat")),
            })
        return {"year": year, "races": races}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/session/{year}/{round_number}")
def get_session_info(year: int, round_number: int):
    """Return available sessions for a round."""
    if year < 1950 or year > datetime.now().year + 1:
        raise HTTPException(status_code=400, detail="Invalid year")
    if round_number < 1 or round_number > 30:
        raise HTTPException(status_code=400, detail="Invalid round number. Must be between 1 and 30")
    try:
        event = fastf1.get_event(year, round_number)
        sessions = []
        for i in range(1, 6):
            key = f"Session{i}"
            name = event.get(key, None)
            if name and str(name) not in ["None", ""]:
                sessions.append({"number": i, "name": str(name)})
        return {
            "year": year,
            "round": round_number,
            "event": safe_val(event.get("EventName")),
            "sessions": sessions,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/race/{year}/{round_number}/positions")
def get_lap_positions(year: int, round_number: int, session_type: str = "R"):
    """
    Return lap-by-lap position data for all drivers in a race session.
    session_type: 'R' = Race, 'Q' = Qualifying, 'S' = Sprint, etc.
    """
    if year < 1950 or year > datetime.now().year + 1:
        raise HTTPException(status_code=400, detail="Invalid year")
    if round_number < 1 or round_number > 30:
        raise HTTPException(status_code=400, detail="Invalid round number")
    try:
        session = fastf1.get_session(year, round_number, session_type)
        session.load(laps=True, telemetry=False, weather=False, messages=False)

        laps = session.laps
        if laps is None or len(laps) == 0:
            raise HTTPException(status_code=404, detail="No lap data available")

        drivers = laps["Driver"].unique().tolist()
        driver_info = {}
        for drv in drivers:
            drv_laps = laps[laps["Driver"] == drv]
            team = drv_laps["Team"].iloc[0] if "Team" in drv_laps.columns else "Unknown"
            try:
                full_name = session.get_driver(drv)["FullName"]
            except Exception:
                full_name = drv
            driver_info[drv] = {
                "code": drv,
                "fullName": str(full_name),
                "team": str(team),
                "color": get_team_color(str(team)),
            }

        # Build lap-by-lap positions
        max_lap = int(laps["LapNumber"].max())
        lap_data = []

        for lap_num in range(1, max_lap + 1):
            lap_positions = {}
            for drv in drivers:
                drv_laps = laps[(laps["Driver"] == drv) & (laps["LapNumber"] == lap_num)]
                if len(drv_laps) > 0:
                    pos = drv_laps["Position"].iloc[0]
                    lap_time = drv_laps["LapTime"].iloc[0]
                    lap_positions[drv] = {
                        "position": safe_val(pos) if not pd.isna(pos) else None,
                        "lapTime": str(lap_time) if not pd.isna(lap_time) else None,
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
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/race/{year}/{round_number}/tyres")
def get_tyre_strategy(year: int, round_number: int, session_type: str = "R"):
    """
    Return tyre compound and stint data for all drivers.
    """
    if year < 1950 or year > datetime.now().year + 1:
        raise HTTPException(status_code=400, detail="Invalid year")
    if round_number < 1 or round_number > 30:
        raise HTTPException(status_code=400, detail="Invalid round number")
    try:
        session = fastf1.get_session(year, round_number, session_type)
        session.load(laps=True, telemetry=False, weather=False, messages=False)

        laps = session.laps
        if laps is None or len(laps) == 0:
            raise HTTPException(status_code=404, detail="No lap data available")

        drivers = laps["Driver"].unique().tolist()
        driver_tyres = {}

        for drv in drivers:
            drv_laps = laps[laps["Driver"] == drv].copy()
            drv_laps = drv_laps.sort_values("LapNumber")

            stints = []
            stint_data = []

            prev_compound = None
            stint_start = None

            for _, lap in drv_laps.iterrows():
                compound = str(lap.get("Compound", "UNKNOWN")).upper()
                if compound in ["NAN", "NONE", ""]:
                    compound = "UNKNOWN"
                lap_num = safe_val(lap["LapNumber"])

                if compound != prev_compound:
                    if prev_compound is not None and stint_start is not None:
                        stints.append({
                            "compound": prev_compound,
                            "startLap": stint_start,
                            "endLap": lap_num - 1,
                            "laps": lap_num - stint_start,
                            "color": TYRE_COLORS.get(prev_compound, "#888888"),
                        })
                    stint_start = lap_num
                    prev_compound = compound

                stint_data.append({
                    "lap": lap_num,
                    "compound": compound,
                    "tyreLife": safe_val(lap.get("TyreLife")),
                    "color": TYRE_COLORS.get(compound, "#888888"),
                    "isPersonalBest": bool(lap.get("IsPersonalBest", False)),
                    "lapTime": str(lap["LapTime"]) if not pd.isna(lap["LapTime"]) else None,
                    "sector1": str(lap["Sector1Time"]) if "Sector1Time" in lap and not pd.isna(lap["Sector1Time"]) else None,
                    "sector2": str(lap["Sector2Time"]) if "Sector2Time" in lap and not pd.isna(lap["Sector2Time"]) else None,
                    "sector3": str(lap["Sector3Time"]) if "Sector3Time" in lap and not pd.isna(lap["Sector3Time"]) else None,
                })

            # Close last stint
            if prev_compound is not None and stint_start is not None:
                last_lap = safe_val(drv_laps["LapNumber"].max())
                stints.append({
                    "compound": prev_compound,
                    "startLap": stint_start,
                    "endLap": last_lap,
                    "laps": last_lap - stint_start + 1,
                    "color": TYRE_COLORS.get(prev_compound, "#888888"),
                })

            team = str(drv_laps["Team"].iloc[0]) if "Team" in drv_laps.columns else "Unknown"
            try:
                full_name = str(session.get_driver(drv)["FullName"])
            except (KeyError, TypeError, AttributeError):
                full_name = drv

            driver_tyres[drv] = {
                "code": drv,
                "fullName": full_name,
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
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/race/{year}/{round_number}/results")
def get_race_results(year: int, round_number: int, session_type: str = "R"):
    """Return final race results."""
    if year < 1950 or year > datetime.now().year + 1:
        raise HTTPException(status_code=400, detail="Invalid year")
    if round_number < 1 or round_number > 30:
        raise HTTPException(status_code=400, detail="Invalid round number")
    try:
        session = fastf1.get_session(year, round_number, session_type)
        session.load(laps=False, telemetry=False, weather=False, messages=False)

        results = session.results
        if results is None or len(results) == 0:
            raise HTTPException(status_code=404, detail="No results available")

        result_list = []
        for _, row in results.iterrows():
            team = str(row.get("TeamName", "Unknown"))
            result_list.append({
                "position": safe_val(row.get("Position")),
                "driverNumber": safe_val(row.get("DriverNumber")),
                "code": safe_val(row.get("Abbreviation")),
                "fullName": safe_val(row.get("FullName")),
                "team": team,
                "color": get_team_color(team),
                "points": safe_val(row.get("Points")),
                "status": safe_val(row.get("Status")),
                "gridPosition": safe_val(row.get("GridPosition")),
                "time": str(row.get("Time", "")) if row.get("Time") is not None else None,
            })

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
        raise HTTPException(status_code=500, detail=str(e))