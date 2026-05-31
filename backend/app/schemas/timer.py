from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


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


class TimerCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    description: str = ""
    imageUrl: str | None = None

    durationSeconds: int = Field(gt=0)
    minDurationSeconds: int | None = Field(default=None, ge=0)
    timeShiftSeconds: int = Field(default=0, ge=0)

    soundEnabled: bool = True


class TimerUpdateRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = None
    imageUrl: str | None = None

    durationSeconds: int | None = Field(default=None, gt=0)
    minDurationSeconds: int | None = Field(default=None, ge=0)
    timeShiftSeconds: int | None = Field(default=None, ge=0)

    soundEnabled: bool | None = None