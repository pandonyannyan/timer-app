from fastapi import APIRouter, Depends

from app.auth.dependencies import CurrentUser, get_current_user
from app.schemas.me import MeResponse


router = APIRouter(prefix="/me", tags=["me"])


@router.get("", response_model=MeResponse)
async def get_me(current_user: CurrentUser = Depends(get_current_user)) -> MeResponse:
    return MeResponse(
        id=current_user.id,
        email=current_user.email,
        role=current_user.role,
        is_active=current_user.is_active,
    )
