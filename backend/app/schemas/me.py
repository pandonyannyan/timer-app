from typing import Literal

from pydantic import BaseModel


class MeResponse(BaseModel):
    id: str
    email: str | None
    role: Literal["admin", "manager", "member"]
    is_active: bool
