from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from application.services.negotiation import NegotiationService
from domain.logic.negotiation import calculate_forecast, calculate_range
from domain.models.negotiation import (
    ChecklistState,
    CounterOfferRequest,
    ForecastPoint,
    NegotiationOffer,
    NegotiationSession,
    NegotiationSessionCreate,
    RateRangeOut,
)
from infrastructure.llm.gemini_adapter import GeminiAdapter
from infrastructure.supabase.client import get_supabase_client
from infrastructure.supabase.repos import (
    SupabaseActivityLogRepo,
    SupabaseDealRepo,
    SupabaseNegotiationSessionRepo,
)
from interface.dependencies import ActorContext, get_current_actor, get_current_brand


def get_negotiation_service() -> NegotiationService:
    client = get_supabase_client(service_role=True)
    return NegotiationService(
        session_repo=SupabaseNegotiationSessionRepo(client),
        activity_log_repo=SupabaseActivityLogRepo(client),
        llm_port=GeminiAdapter(),
        deal_repo=SupabaseDealRepo(client),
    )

router = APIRouter(prefix="/negotiation/sessions", tags=["Negotiation"])

@router.post("", response_model=NegotiationSession)
async def create_session(
    request: NegotiationSessionCreate,
    actor: ActorContext = Depends(get_current_brand),
    service: NegotiationService = Depends(get_negotiation_service)
):
    return await service.create_session(request, actor.brand_id)

@router.get("", response_model=list[NegotiationSession])
async def list_sessions(
    limit: int = 50,
    offset: int = 0,
    actor: ActorContext = Depends(get_current_actor),
    service: NegotiationService = Depends(get_negotiation_service)
):
    limit = min(limit, 100)
    if actor.actor_type == "creator":
        return await service.list_for_creator(actor.creator_id, limit, offset)
    return await service.list_for_brand(actor.brand_id, limit, offset)

@router.get("/{id}/rate-range", response_model=RateRangeOut)
async def get_rate_range(
    id: UUID,
    service: NegotiationService = Depends(get_negotiation_service)
):
    session = await service.session_repo.get(id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    low, high = calculate_range(session.base_rate)
    return RateRangeOut(base_rate=session.base_rate, range_low=low, range_high=high)

@router.get("/{id}/forecast", response_model=list[ForecastPoint])
async def get_forecast(
    id: UUID,
    weekly_growth_rate: float = 0.05,
    weeks: int = 12,
    service: NegotiationService = Depends(get_negotiation_service)
):
    session = await service.session_repo.get(id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return calculate_forecast(session.base_rate, weekly_growth_rate, weeks)

@router.patch("/{id}/checklist", response_model=NegotiationSession)
async def update_checklist(
    id: UUID,
    checklist: ChecklistState,
    service: NegotiationService = Depends(get_negotiation_service)
):
    return await service.update_checklist(id, checklist)

@router.post("/{id}/counter-offer", response_model=NegotiationOffer)
async def create_counter_offer(
    id: UUID,
    request: CounterOfferRequest,
    actor: ActorContext = Depends(get_current_actor),
    service: NegotiationService = Depends(get_negotiation_service)
):
    try:
        return await service.create_counter_offer(
            id, request.amount, request.message, actor.actor_id, actor.actor_type
        )
    except ValueError as e:
        if str(e) == "Checklist is not complete":
            raise HTTPException(status_code=409, detail=str(e))
        if str(e) == "Session not found":
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{id}/offers", response_model=list[NegotiationOffer])
async def list_offers(
    id: UUID,
    actor: ActorContext = Depends(get_current_actor),
    service: NegotiationService = Depends(get_negotiation_service)
):
    return await service.list_offers(id)

from domain.models.negotiation import ScriptGenerateRequest


@router.post("/{id}/script", response_model=str)
async def generate_script(
    id: UUID,
    request: ScriptGenerateRequest,
    service: NegotiationService = Depends(get_negotiation_service)
):
    try:
        if request.use_llm:
            return await service.generate_script_llm(id, request.kind)
        else:
            return await service.generate_script(id, request.kind)
    except ValueError as e:
        if str(e) == "Checklist is not complete":
            raise HTTPException(status_code=409, detail=str(e))
        if str(e) == "Session not found":
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))

