from datetime import UTC, datetime
from uuid import UUID, uuid4

from domain.interfaces.llm import LLMPort
from domain.interfaces.repositories import ActivityLogRepo, DealRepo, NegotiationSessionRepo
from domain.logic.negotiation import (
    calculate_base_rate,
    calculate_range,
    checklist_is_complete,
)
from domain.models.activity_log import ActivityLog
from domain.models.negotiation import (
    ChecklistState,
    NegotiationOffer,
    NegotiationSession,
    NegotiationSessionCreate,
)


class NegotiationService:
    def __init__(
        self, session_repo: NegotiationSessionRepo, activity_log_repo: ActivityLogRepo,
        llm_port: LLMPort | None = None, deal_repo: DealRepo | None = None,
    ):
        self.session_repo = session_repo
        self.activity_log_repo = activity_log_repo
        self.llm_port = llm_port
        self.deal_repo = deal_repo

    async def create_session(self, request: NegotiationSessionCreate, brand_id: UUID) -> NegotiationSession:
        base_rate = calculate_base_rate(
            request.views_per_week,
            request.niche_cpm,
            request.follower_tier_multiplier,
            request.engagement_rate_adjustment
        )
        low, high = calculate_range(base_rate)
        
        session = NegotiationSession(
            id=uuid4(),
            deal_id=request.deal_id,
            status="active",
            views_per_week=request.views_per_week,
            niche_cpm=request.niche_cpm,
            follower_tier_multiplier=request.follower_tier_multiplier,
            engagement_rate_adjustment=request.engagement_rate_adjustment,
            base_rate=base_rate,
            range_low=low,
            range_high=high,
            checklist=ChecklistState(),
            created_at=datetime.now(UTC)
        )
        return await self.session_repo.create(session)

    async def list_for_brand(self, brand_id: UUID, limit: int = 50, offset: int = 0) -> list[NegotiationSession]:
        return await self.session_repo.list_for_brand(brand_id, limit, offset)

    async def list_for_creator(self, creator_id: UUID, limit: int = 50, offset: int = 0) -> list[NegotiationSession]:
        return await self.session_repo.list_for_creator(creator_id, limit, offset)

    async def update_checklist(self, session_id: UUID, checklist: ChecklistState) -> NegotiationSession:
        return await self.session_repo.update_checklist(session_id, checklist)

    async def create_counter_offer(
        self,
        session_id: UUID,
        amount: float,
        message: str | None,
        actor_id: UUID,
        actor_type: str,
    ) -> NegotiationOffer:
        session = await self.session_repo.get(session_id)
        if not session:
            raise ValueError("Session not found")

        # The checklist protects the creator from sending an incomplete ask —
        # it never gates what the brand offers.
        if actor_type == "creator" and not checklist_is_complete(session.checklist):
            raise ValueError("Checklist is not complete")

        deal = await self.deal_repo.get(session.deal_id)
        brand_id = deal.brand_id if deal else None

        offer = NegotiationOffer(
            id=uuid4(),
            session_id=session_id,
            amount=amount,
            message=message,
            sender=actor_type,
            sent_at=datetime.now(UTC)
        )
        saved = await self.session_repo.save_offer(offer)

        log = ActivityLog(
            id=uuid4(),
            brand_id=brand_id,
            deal_id=session.deal_id,
            actor_type=actor_type,
            actor_label=str(actor_id),
            action="counter_offer_sent",
            metadata={"amount": amount, "message": message, "sender": offer.sender},
            created_at=datetime.now(UTC)
        )
        await self.activity_log_repo.create(log)

        return saved

    async def list_offers(self, session_id: UUID) -> list[NegotiationOffer]:
        return await self.session_repo.list_offers(session_id)

    async def generate_script(self, session_id: UUID, kind: str) -> str:
        from domain.logic.negotiation import generate_script as pure_generate_script
        session = await self.session_repo.get(session_id)
        if not session:
            raise ValueError("Session not found")
        if not checklist_is_complete(session.checklist):
            raise ValueError("Checklist is not complete")
        return pure_generate_script(kind, session) # type: ignore

    async def generate_script_llm(self, session_id: UUID, kind: str) -> str:
        session = await self.session_repo.get(session_id)
        if not session:
            raise ValueError("Session not found")
        if not checklist_is_complete(session.checklist):
            raise ValueError("Checklist is not complete")
            
        if not self.llm_port:
            raise ValueError("LLM port not configured")
            
        # We use a dummy reason string or just prompt the LLM directly
        # LLMPort currently has explain_clause. Wait, let me check LLMPort. 
        # If I need a generic prompt, maybe I should add a method or use explain_clause?
        # Actually the instruction says "using LLMPort (from Phase 2 Step 2, reused, not a new adapter)".
        # Let's check LLMPort to see if I need to modify it or just reuse the explain_clause method.
        # It's better to add a generic `generate_text` or similar to LLMPort, but the prompt says:
        # "using LLMPort (from Phase 2 Step 2, reused, not a new adapter)".
        # Let me add a draft_script method to LLMPort.
        return await self.llm_port.draft_script(session, kind)

