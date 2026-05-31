from fastapi import APIRouter, Depends, HTTPException, status

from app.auth.dependencies import CurrentUser, get_current_user
from app.core.supabase import get_supabase_client
from app.schemas.timer import (
    TimerCreateRequest,
    TimerResponse,
    TimerRestartRequest,
    TimerUpdateRequest,
)


router = APIRouter(prefix="/timers", tags=["timers"])


def require_timer_manager(current_user: CurrentUser) -> None:
    if current_user.role not in ("admin", "manager"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )


def map_timer_create_payload(payload: TimerCreateRequest, user_id: str) -> dict:
    return {
        "title": payload.title,
        "description": payload.description,
        "image_url": payload.imageUrl,
        "duration_seconds": payload.durationSeconds,
        "min_duration_seconds": payload.minDurationSeconds,
        "time_shift_seconds": payload.timeShiftSeconds,
        "status": "active",
        "last_run_by": user_id,
        "created_by": user_id,
        "updated_by": user_id,
    }


def map_timer_update_payload(payload: TimerUpdateRequest, user_id: str) -> dict:
    update_data = {}

    if payload.title is not None:
        update_data["title"] = payload.title

    if payload.description is not None:
        update_data["description"] = payload.description

    if payload.imageUrl is not None:
        update_data["image_url"] = payload.imageUrl

    if payload.durationSeconds is not None:
        update_data["duration_seconds"] = payload.durationSeconds

    if payload.minDurationSeconds is not None:
        update_data["min_duration_seconds"] = payload.minDurationSeconds

    if payload.timeShiftSeconds is not None:
        update_data["time_shift_seconds"] = payload.timeShiftSeconds

    update_data["updated_by"] = user_id

    return update_data


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


@router.post("", response_model=TimerResponse, status_code=status.HTTP_201_CREATED)
async def create_timer(
    payload: TimerCreateRequest,
    current_user: CurrentUser = Depends(get_current_user),
) -> TimerResponse:
    require_timer_manager(current_user)

    supabase = get_supabase_client()

    create_data = map_timer_create_payload(
        payload=payload,
        user_id=current_user.id,
    )

    created_timer_response = (
        supabase.table("timers")
        .insert(create_data)
        .execute()
    )

    created_timer = created_timer_response.data[0] if created_timer_response.data else None

    if not created_timer:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create timer",
        )

    log_timer_action(
        timer_id=created_timer["id"],
        user_id=current_user.id,
        action="created",
        old_status=None,
        new_status=created_timer["status"],
        details={},
    )

    return map_timer_response(created_timer)


@router.patch("/{timer_id}", response_model=TimerResponse)
async def update_timer(
    timer_id: str,
    payload: TimerUpdateRequest,
    current_user: CurrentUser = Depends(get_current_user),
) -> TimerResponse:
    require_timer_manager(current_user)

    supabase = get_supabase_client()

    update_data = map_timer_update_payload(
        payload=payload,
        user_id=current_user.id,
    )

    if len(update_data) == 1 and "updated_by" in update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update",
        )

    existing_timer_response = (
        supabase.table("timers")
        .select("id, status")
        .eq("id", timer_id)
        .single()
        .execute()
    )

    existing_timer = existing_timer_response.data

    if not existing_timer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Timer not found",
        )

    updated_timer_response = (
        supabase.table("timers")
        .update(update_data)
        .eq("id", timer_id)
        .execute()
    )

    updated_timer = updated_timer_response.data[0] if updated_timer_response.data else None

    if not updated_timer:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update timer",
        )

    log_timer_action(
        timer_id=timer_id,
        user_id=current_user.id,
        action="updated",
        old_status=existing_timer["status"],
        new_status=updated_timer["status"],
        details={
            "updatedFields": [
                key
                for key in update_data.keys()
                if key != "updated_by"
            ],
        },
    )

    return map_timer_response(updated_timer)


@router.delete("/{timer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_timer(
    timer_id: str,
    current_user: CurrentUser = Depends(get_current_user),
) -> None:
    require_timer_manager(current_user)

    supabase = get_supabase_client()

    existing_timer_response = (
        supabase.table("timers")
        .select("id, status")
        .eq("id", timer_id)
        .single()
        .execute()
    )

    existing_timer = existing_timer_response.data

    if not existing_timer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Timer not found",
        )

    log_timer_action(
        timer_id=timer_id,
        user_id=current_user.id,
        action="deleted",
        old_status=existing_timer["status"],
        new_status=None,
        details={},
    )

    (
        supabase.table("timers")
        .delete()
        .eq("id", timer_id)
        .execute()
    )

    return None


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