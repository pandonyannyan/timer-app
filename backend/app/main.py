from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.me import router as me_router
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(me_router)


@app.get("/")
def read_root() -> dict[str, str]:
    return {
        "name": settings.app_name,
        "env": settings.app_env,
    }


@app.get("/health")
def health_check() -> dict[str, str]:
    return {
        "status": "ok",
    }
