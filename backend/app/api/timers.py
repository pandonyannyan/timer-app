from fastapi import APIRouter, Depends, HTTPException, status

from app.auth.dependencies import CurrentUser, get_current_user
from app.core.supabase import get_supabase_client
from app.schemas.timer import TimerResponse, TimerRestartRequest


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

@router.post(
    "/{timer_id}/restart",
    response_model=TimerResponse,
    response_model_by_alias=True,
)
async def restart_timer(
    timer_id: str,
    payload: TimerRestartRequest,
    current_user: CurrentUser = Depends(get_current_user),
) -> TimerResponse:
    supabase = get_supabase_client()

    timer_response = (
        supabase.table("timers")
        .select("id, duration_seconds")
        .eq("id", timer_id)
        .single()
        .execute()
    )

    timer = timer_response.data

    if not timer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Timer not found",
        )

    duration_seconds = timer["duration_seconds"]

    if payload.time_shift_seconds < 0 or payload.time_shift_seconds > duration_seconds:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid timeShiftSeconds",
        )

    update_response = (
        supabase.table("timers")
        .update(
            {
                "status": "active",
                "time_shift_seconds": payload.time_shift_seconds,
                "started_at": "now()",
                "last_run_by": current_user.id,
                "updated_by": current_user.id,
            }
        )
        .eq("id", timer_id)
        .execute()
    )

    updated_timer_response = (
        supabase.table("timers")
        .select(
            "id, title, description, image_url, duration_seconds, "
            "min_duration_seconds, time_shift_seconds, started_at, "
            "last_run_by, status, created_at, updated_at"
        )
        .eq("id", timer_id)
        .single()
        .execute()
    )

    updated_timer = updated_timer_response.data

    if not updated_timer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Timer not found",
        )

    return TimerResponse.model_validate(updated_timer)

@router.post(
    "/{timer_id}/stop",
    response_model=TimerResponse,
    response_model_by_alias=True,
)
async def stop_timer(
    timer_id: str,
    current_user: CurrentUser = Depends(get_current_user),
) -> TimerResponse:
    supabase = get_supabase_client()

    timer_response = (
        supabase.table("timers")
        .select("id")
        .eq("id", timer_id)
        .single()
        .execute()
    )

    timer = timer_response.data

    if not timer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Timer not found",
        )

    supabase.table("timers").update(
        {
            "status": "stopped",
            "updated_by": current_user.id,
        }
    ).eq("id", timer_id).execute()

    updated_timer_response = (
        supabase.table("timers")
        .select(
            "id, title, description, image_url, duration_seconds, "
            "min_duration_seconds, time_shift_seconds, started_at, "
            "last_run_by, status, created_at, updated_at"
        )
        .eq("id", timer_id)
        .single()
        .execute()
    )

    updated_timer = updated_timer_response.data

    if not updated_timer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Timer not found",
        )

    return TimerResponse.model_validate(updated_timer)

