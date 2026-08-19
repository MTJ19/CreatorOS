from fastapi import APIRouter, Depends

from application.services.analytics import AnalyticsService
from domain.models.analytics import BrandAnalytics
from infrastructure.supabase.client import get_supabase_client
from infrastructure.supabase.contract_intelligence_repos import (
    SupabaseClauseCardRepo,
    SupabaseEscalationRepo,
)
from infrastructure.supabase.repos import (
    SupabaseContractRepo,
    SupabaseCreatorRepo,
    SupabaseDealRepo,
    SupabaseNegotiationSessionRepo,
    SupabasePaymentRepo,
)
from interface.dependencies import ActorContext, get_current_brand

router = APIRouter(prefix="/analytics", tags=["analytics"])


def get_analytics_service() -> AnalyticsService:
    client = get_supabase_client(service_role=True)
    return AnalyticsService(
        deal_repo=SupabaseDealRepo(client),
        creator_repo=SupabaseCreatorRepo(client),
        contract_repo=SupabaseContractRepo(client),
        payment_repo=SupabasePaymentRepo(client),
        negotiation_repo=SupabaseNegotiationSessionRepo(client),
        clause_card_repo=SupabaseClauseCardRepo(client),
        escalation_repo=SupabaseEscalationRepo(client),
    )


@router.get("/brand", response_model=BrandAnalytics)
async def get_brand_analytics(
    actor: ActorContext = Depends(get_current_brand),
    service: AnalyticsService = Depends(get_analytics_service),
):
    return await service.get_brand_analytics(actor.brand_id)
