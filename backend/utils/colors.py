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

TYRE_COLORS = {
    "SOFT": "#E8002D",
    "MEDIUM": "#FFF200",
    "HARD": "#FFFFFF",
    "INTERMEDIATE": "#39B54A",
    "WET": "#0067FF",
    "UNKNOWN": "#888888",
    "TEST_UNKNOWN": "#888888",
}


def get_team_color(team_name: str) -> str:
    for key in TEAM_COLORS:
        if key.lower() in team_name.lower() or team_name.lower() in key.lower():
            return TEAM_COLORS[key]
    return TEAM_COLOR_FALLBACK
