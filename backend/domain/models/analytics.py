from uuid import UUID

from pydantic import BaseModel


class RevenueMonth(BaseModel):
    month: str
    paid: float
    pending: float


class TopBrand(BaseModel):
    campaign_name: str
    deal_count: int
    total_value: float


class CreatorPerformance(BaseModel):
    creator_id: UUID
    display_name: str
    niche: str
    follower_tier: str
    deal_count: int
    total_value: float


class ContractRiskStats(BaseModel):
    contracts_scanned: int
    clauses_reviewed: int
    red_flags: int
    yellow_flags: int
    green_flags: int
    open_escalations: int
    resolved_escalations: int


class NegotiationStats(BaseModel):
    active_sessions: int
    avg_base_rate: float
    avg_ask: float
    avg_brand_offer: float


class NicheBreakdown(BaseModel):
    niche: str
    follower_tier: str
    creator_count: int
    avg_engagement_rate: float | None = None


class BrandAnalytics(BaseModel):
    total_creators: int
    total_deals: int
    deals_by_status: dict[str, int]
    revenue_by_month: list[RevenueMonth]
    top_brands: list[TopBrand]
    creator_performance: list[CreatorPerformance]
    contract_risk: ContractRiskStats
    negotiation_stats: NegotiationStats
    overdue_payments_count: int
    overdue_payments_total: float
    roster_by_niche: list[NicheBreakdown]
