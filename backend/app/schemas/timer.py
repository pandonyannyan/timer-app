from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class TimerResponse(BaseModel):
    id: str

    title: str
    description: str
    imageUrl: str | None

    durationSeconds: int
    minDurationSeconds: int | None
    timeShiftSeconds: int

    startedAt: datetime
    lastRunBy: str | None

    status: Literal["active", "stopped"]

    createdAt: datetime
    updatedAt: datetime

    soundEnabled: bool = True


class TimerRestartRequest(BaseModel):
    timeShiftSeconds: int = 0