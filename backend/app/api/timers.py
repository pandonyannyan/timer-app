from fastapi import APIRouter, Depends, HTTPException, status

from app.auth.dependencies import CurrentUser, get_current_user
from app.core.supabase import get_supabase_client
from app.schemas.timer import TimerResponse, TimerRestartRequest


router = APIRouter(prefix="/timers", tags=["timers"])


def map_timer_response(timer: dict) -> TimerResponse:
    return TimerResponse(
        id=timer["id"],
        title=timer["title"],
        description=timer["description"],
        imageUrl=timer["image_url"],
        durationSeconds=timer["duration_seconds"],
        minDurationSeconds=timer["min_duration_seconds"],
        timeShiftSeconds=timer["time_shift_seconds"],
        startedAt=timer["started_at"],
        lastRunBy=timer["last_run_by"],
        status=timer["status"],
        createdAt=timer["created_at"],
        updatedAt=timer["updated_at"],
        soundEnabled=True,
    )


def log_timer_action(
    *,
    timer_id: str,
    user_id: str,
    action: str,
    old_status: str | None,
    new_status: str | None,
    details: dict,
) -> None:
    supabase = get_supabase_client()

    supabase.table("timer_logs").insert(
        {
            "timer_id": timer_id,
            "user_id": user_id,
            "action": action,
            "old_status": old_status,
            "new_status": new_status,
            "details": details,
        }
    ).execute()


@router.get("", response_model=list[TimerResponse])
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
        map_timer_response(timer)
        for timer in response.data
    ]


@router.post(
    "/{timer_id}/restart",
    response_model=TimerResponse,
)
async def restart_timer(
    timer_id: str,
    payload: TimerRestartRequest,
    current_user: CurrentUser = Depends(get_current_user),
) -> TimerResponse:
    supabase = get_supabase_client()

    timer_response = (
        supabase.table("timers")
        .select("id, duration_seconds, status, time_shift_seconds, started_at")
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

    if payload.timeShiftSeconds < 0 or payload.timeShiftSeconds > duration_seconds:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid timeShiftSeconds",
        )

    (
        supabase.table("timers")
        .update(
            {
                "status": "active",
                "time_shift_seconds": payload.timeShiftSeconds,
                "started_at": "now()",
                "last_run_by": current_user.id,
                "updated_by": current_user.id,
            }
        )
        .eq("id", timer_id)
        .execute()
    )

    log_timer_action(
        timer_id=timer_id,
        user_id=current_user.id,
        action="restarted",
        old_status=timer["status"],
        new_status="active",
        details={
            "oldTimeShiftSeconds": timer["time_shift_seconds"],
            "newTimeShiftSeconds": payload.timeShiftSeconds,
            "previousStartedAt": timer["started_at"],
        },
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

    return map_timer_response(updated_timer)


@router.post(
    "/{timer_id}/stop",
    response_model=TimerResponse,
)
async def stop_timer(
    timer_id: str,
    current_user: CurrentUser = Depends(get_current_user),
) -> TimerResponse:
    supabase = get_supabase_client()

    timer_response = (
        supabase.table("timers")
        .select("id, status")
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

    (
        supabase.table("timers")
        .update(
            {
                "status": "stopped",
                "updated_by": current_user.id,
            }
        )
        .eq("id", timer_id)
        .execute()
    )

    log_timer_action(
        timer_id=timer_id,
        user_id=current_user.id,
        action="stopped",
        old_status=timer["status"],
        new_status="stopped",
        details={},
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

    return map_timer_response(updated_timer)