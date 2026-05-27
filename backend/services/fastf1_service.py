import fastf1
import pandas as pd


def _extract_laps(session) -> pd.DataFrame:
    """
    Safely extract laps from a loaded session.

    FastF1 sometimes completes session.load() without error but leaves the
    internal laps store unset — accessing session.laps then raises
    'data not loaded yet'. We catch that here and return None so callers
    can decide what to do.
    """
    try:
        laps = session.laps
        if laps is None or len(laps) == 0:
            return None
        return laps
    except Exception:
        return None


def get_session(year: int, round_number: int, session_type: str):
    return fastf1.get_session(year, round_number, session_type)


def get_event(year: int, round_number: int):
    return fastf1.get_event(year, round_number)


def get_event_schedule(year: int):
    return fastf1.get_event_schedule(year, include_testing=False)
