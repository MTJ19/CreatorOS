from uuid import UUID

from fastapi import APIRouter, Depends

from application.services.activity_log import ActivityLogService
from domain.models.activity_log import ActivityLog
from infrastructure.supabase.client import get_supabase_client
from infrastructure.supabase.repos import SupabaseActivityLogRepo
from interface.dependencies import ActorContext, get_current_actor

router = APIRouter(prefix="/activity-log", tags=["activity-log"])

def get_activity_log_service() -> ActivityLogService:
    return ActivityLogService(SupabaseActivityLogRepo(get_supabase_client(service_role=True)))

@router.get("", response_model=list[ActivityLog])
async def get_activity_logs(
    deal_id: UUID | None = None,
    limit: int = 50,
    offset: int = 0,
    actor: ActorContext = Depends(get_current_actor),
    service: ActivityLogService = Depends(get_activity_log_service)
):
    limit = min(limit, 100)
    if deal_id:
        return await service.get_logs_for_deal(str(deal_id), limit, offset)
    if actor.actor_type == "creator":
        return await service.get_logs_for_creator(str(actor.creator_id), limit, offset)
    return await service.get_logs_for_brand(str(actor.brand_id), limit, offset)
