import os
import fastf1

cache_dir = "/tmp/fastf1"
os.makedirs(cache_dir, exist_ok=True)
fastf1.Cache.enable_cache(cache_dir)

ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://slipstreams-f1.vercel.app",
    "https://f1-git-main-williamtecumsehsherman007-7520s-projects.vercel.app",
    "https://f1.willx.tech",
]

_env_origins = os.getenv("ALLOWED_ORIGINS", "")
if _env_origins:
    ALLOWED_ORIGINS += [o.strip() for o in _env_origins.split(",") if o.strip()]
