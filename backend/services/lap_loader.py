import logging
from contextlib import nullcontext
from threading import Lock

import fastf1
from fastapi import HTTPException

from services.fastf1_service import _extract_laps

logger = logging.getLogger(__name__)
_LAP_LOAD_LOCK = Lock()


def load_lap_session(year: int, round_number: int, session_type: str):
    """
    Load a session with lap data.

    Attempt order:
      1. Normal load with cache enabled.
      2. Reload with cache disabled (handles corrupt cache entries).

    Uses _extract_laps() after every load() to safely catch
    'data not loaded yet' errors rather than letting them propagate.
    """
    acquired = _LAP_LOAD_LOCK.acquire(timeout=60)
    if not acquired:
        raise HTTPException(
            status_code=503,
            detail="Server is busy loading another session. Please retry in a moment.",
        )

    try:
        last_exc = None

        attempts = [
            {"bypass_cache": False, "label": "cached"},
            {"bypass_cache": True, "label": "cache-bypass"},
        ]

        for attempt in attempts:
            label = attempt["label"]
            try:
                logger.info(
                    "Lap load [%s]: year=%s round=%s session=%s",
                    label,
                    year,
                    round_number,
                    session_type,
                )

                ctx = (
                    fastf1.Cache.disabled()
                    if attempt["bypass_cache"]
                    else nullcontext()
                )

                with ctx:
                    session = fastf1.get_session(year, round_number, session_type)
                    session.load(
                        laps=True,
                        telemetry=False,
                        weather=False,
                        messages=False,
                        # livedata param removed — blocks lap loading in FastF1 3.8.x
                    )

                laps = _extract_laps(session)
                if laps is not None:
                    logger.info(
                        "Lap load succeeded [%s]: year=%s round=%s session=%s rows=%d",
                        label,
                        year,
                        round_number,
                        session_type,
                        len(laps),
                    )
                    return session, laps

                last_exc = RuntimeError(
                    f"session.load() completed [{label}] but session.laps is empty or inaccessible."
                )
                logger.warning(str(last_exc))

            except Exception as exc:
                last_exc = exc
                logger.warning(
                    "Lap load [%s] raised exception: year=%s round=%s session=%s — %s",
                    label,
                    year,
                    round_number,
                    session_type,
                    exc,
                )

        logger.error(
            "All lap load attempts failed: year=%s round=%s session=%s — %s",
            year,
            round_number,
            session_type,
            last_exc,
        )
        raise HTTPException(
            status_code=404,
            detail=(
                f"Lap data unavailable for {year} round {round_number} ({session_type}). "
                f"The race may be upcoming, live, or not yet published. "
                f"Underlying error: {last_exc}"
            ),
        )

    finally:
        _LAP_LOAD_LOCK.release()
