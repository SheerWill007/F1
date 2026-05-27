import warnings

warnings.filterwarnings("ignore")

from fastapi import FastAPI

from config.logging_config import configure_logging
import config.settings  # noqa: F401 — runs cache setup on import
from middleware.cors import add_cors_middleware
from routes import health, seasons, sessions, positions, tyres, results

configure_logging()

app = FastAPI(title="F1 Dashboard API", version="1.0.0")
add_cors_middleware(app)

app.include_router(health.router)
app.include_router(seasons.router)
app.include_router(sessions.router)
app.include_router(positions.router)
app.include_router(tyres.router)
app.include_router(results.router)
