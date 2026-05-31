from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class TimerResponse(BaseModel):
    id: str

    title: str
    description: str
    image_url: str | None = Field(alias="imageUrl")

    duration_seconds: int = Field(alias="durationSeconds")
    min_duration_seconds: int | None = Field(alias="minDurationSeconds")
    time_shift_seconds: int = Field(alias="timeShiftSeconds")

    started_at: datetime = Field(alias="startedAt")
    last_run_by: str | None = Field(alias="lastRunBy")

    status: Literal["active", "stopped"]

    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    sound_enabled: bool = Field(default=True, alias="soundEnabled")

    model_config = {
        "populate_by_name": True,
    }
    