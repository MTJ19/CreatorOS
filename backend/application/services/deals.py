from collections import defaultdict
from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid4

from domain.interfaces.repositories import ActivityLogRepo, DealRepo, NegotiationSessionRepo
from domain.models.activity_log import ActivityLog
from domain.models.deal import Deal, DealCreateRequest, WeeklyValuePoint
from exceptions import NotFoundError, PermissionDeniedError


class DealService:
    def __init__(
        self, deal_repo: DealRepo, activity_log_repo: ActivityLogRepo,
        negotiation_session_repo: NegotiationSessionRepo | None = None,
    ):
        self.deal_repo = deal_repo
        self.activity_log_repo = activity_log_repo
        self.negotiation_session_repo = negotiation_session_repo

    async def create_deal(
        self,
        request: DealCreateRequest,
        brand_id: UUID,
        actor_id: UUID,
        actor_type: str
    ) -> Deal:
        deal = Deal(
            id=uuid4(),
            brand_id=brand_id,
            creator_id=request.creator_id,
            campaign_name=request.campaign_name,
            contact_email=request.contact_email,
            status="lead",
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC)
        )
        created = await self.deal_repo.create(deal)

        log = ActivityLog(
            id=uuid4(),
            brand_id=brand_id,
            deal_id=created.id,
            actor_type=actor_type,
            actor_label=str(actor_id),
            action="deal_created",
            metadata={"deal_id": str(created.id), "campaign_name": created.campaign_name},
            created_at=datetime.now(UTC)
        )
        await self.activity_log_repo.create(log)

        return created

    async def list_for_brand(self, brand_id: UUID, limit: int = 50, offset: int = 0) -> list[Deal]:
        return await self.deal_repo.list_for_brand(brand_id, limit, offset)

    async def list_for_creator(self, creator_id: UUID, limit: int = 50, offset: int = 0) -> list[Deal]:
        return await self.deal_repo.list_for_creator(creator_id, limit, offset)

    async def update_status(
        self, deal_id: UUID, status: str, actor_id: UUID, actor_type: str,
        actor_brand_id: UUID | None, actor_creator_id: UUID | None,
    ) -> Deal:
        deal = await self.deal_repo.get(deal_id)
        if not deal:
            raise NotFoundError("Deal not found")
        if actor_type == "creator" and deal.creator_id != actor_creator_id:
            raise PermissionDeniedError("This deal isn't yours")
        if actor_type == "brand" and deal.brand_id != actor_brand_id:
            raise PermissionDeniedError("This deal isn't yours")

        from_status = deal.status
        updated = await self.deal_repo.update_status(deal_id, status)

        log = ActivityLog(
            id=uuid4(),
            brand_id=deal.brand_id,
            deal_id=deal_id,
            actor_type=actor_type,
            actor_label=str(actor_id),
            action="deal_status_updated",
            metadata={"from_status": from_status, "to_status": status},
            created_at=datetime.now(UTC)
        )
        await self.activity_log_repo.create(log)

        return updated

    async def get_weekly_completed_value(
        self, actor_type: str, actor_id: UUID, weeks: int = 8
    ) -> list[WeeklyValuePoint]:
        if actor_type == "creator":
            deals = await self.deal_repo.list_for_creator(actor_id, limit=200)
            sessions = await self.negotiation_session_repo.list_for_creator(actor_id, limit=200)
        else:
            deals = await self.deal_repo.list_for_brand(actor_id, limit=200)
            sessions = await self.negotiation_session_repo.list_for_brand(actor_id, limit=200)

        rate_by_deal = {s.deal_id: s.base_rate for s in sessions}
        completed = [d for d in deals if d.status == "completed"]

        today = datetime.now(UTC).date()
        week_starts = [today - timedelta(days=today.weekday() + 7 * i) for i in range(weeks)]
        week_starts.reverse()

        totals: dict = defaultdict(float)
        for d in completed:
            deal_week = d.updated_at.date() - timedelta(days=d.updated_at.date().weekday())
            totals[deal_week] += rate_by_deal.get(d.id, 0.0)

        return [WeeklyValuePoint(week_start=w, value=totals.get(w, 0.0)) for w in week_starts]
