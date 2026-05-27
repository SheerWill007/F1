from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config.settings import ALLOWED_ORIGINS


def add_cors_middleware(app: FastAPI):
    app.add_middleware(
        CORSMiddleware,
        allow_origins=ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
