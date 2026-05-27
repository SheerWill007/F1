import logging

import fastf1
import pandas as pd

logger = logging.getLogger(__name__)


def _extract_laps(session) -> pd.DataFrame | None:
    """
    Safely extract laps from a loaded session.

    FastF1 sometimes completes session.load() without error but leaves the
    internal laps store unset — accessing session.laps then raises
    'data not loaded yet'. We catch that here and return None so callers
    can decide what to do.

    Returns ALL laps (not just accurate) so position trace charts
    have complete data including pit laps and safety car laps.
    """
    try:
        laps = session.laps

        if laps is None or len(laps) == 0:
            logger.warning("_extract_laps: session.laps is None or empty.")
            return None

        logger.debug("_extract_laps: returning %d laps.", len(laps))
        return laps

    except Exception as e:
        logger.warning("_extract_laps: failed to access session.laps — %s", e)
        return None


def get_session(year: int, round_number: int, session_type: str):
    return fastf1.get_session(year, round_number, session_type)


def get_event(year: int, round_number: int):
    return fastf1.get_event(year, round_number)


def get_event_schedule(year: int):
    return fastf1.get_event_schedule(year, include_testing=False)
