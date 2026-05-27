from services.fastf1_service import get_session


def load_results_session(year: int, round_number: int, session_type: str):
    session = get_session(year, round_number, session_type)
    session.load(
        laps=False,
        telemetry=False,
        weather=False,
        messages=False,
        livedata=False,
    )
    return session
