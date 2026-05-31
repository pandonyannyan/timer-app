from fastapi import APIRouter, Depends

from app.auth.dependencies import CurrentUser, get_current_user
from app.core.supabase import get_supabase_client
from app.schemas.timer import TimerResponse


router = APIRouter(prefix="/timers", tags=["timers"])


@router.get("", response_model=list[TimerResponse], response_model_by_alias=True)
async def get_timers(
    current_user: CurrentUser = Depends(get_current_user),
) -> list[TimerResponse]:
    supabase = get_supabase_client()

    response = (
        supabase.table("timers")
        .select(
            "id, title, description, image_url, duration_seconds, "
            "min_duration_seconds, time_shift_seconds, started_at, "
            "last_run_by, status, created_at, updated_at"
        )
        .order("created_at", desc=False)
        .execute()
    )

    return [
        TimerResponse.model_validate(timer)
        for timer in response.data
    ]
