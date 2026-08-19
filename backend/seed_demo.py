"""
Seeds two full demo brands — rosters, deals across every status, a real
scanned contract each (full pipeline: PDF -> extract -> Gemini segment ->
rule-based scan -> red flag), negotiation threads (checklist + creator/brand/
brand offers), deliverables walked across every staged status, and payments
including one overdue per brand — so every feature can be demonstrated
without any manual setup.

Run once from backend/, with the venv active and real Supabase credentials
in .env:

    python seed_demo.py

Not idempotent: creates fresh Supabase Auth users with fixed emails, so a
second run will fail once those emails already exist. Delete the demo rows
(or the Auth users) first if you want to reseed.
"""
import asyncio
import subprocess
import tempfile
import textwrap
from datetime import UTC, date, datetime, timedelta
from pathlib import Path
from uuid import UUID

from application.services.auth import AuthService
from application.services.clause_explanation import ClauseExplanationService
from application.services.contract_intelligence import ContractIntelligenceService
from application.services.contracts import ContractService
from application.services.creators import CreatorService
from application.services.deals import DealService
from application.services.deliverables import DeliverableService
from application.services.negotiation import NegotiationService
from application.services.payments import PaymentService
from domain.models.auth import BrandSignupRequest, CreatorSignupRequest
from domain.models.contract import ContractStatusUpdateRequest
from domain.models.creator import CreatorOnboardRequest
from domain.models.deal import DealCreateRequest
from domain.models.deliverable import DeliverableCreateRequest, DeliverableStatusUpdateRequest
from domain.models.negotiation import ChecklistState, NegotiationSessionCreate
from domain.models.payment import PaymentCreateRequest
from infrastructure.email.resend_adapter import ResendAdapter
from infrastructure.llm.gemini_adapter import GeminiAdapter
from infrastructure.pdf import extract_text
from infrastructure.supabase.client import get_supabase_client
from infrastructure.supabase.contract_intelligence_repos import (
    SupabaseClauseCardRepo,
    SupabaseEscalationRepo,
)
from infrastructure.supabase.repos import (
    SupabaseActivityLogRepo,
    SupabaseBrandMemberRepo,
    SupabaseBrandRepo,
    SupabaseContractRepo,
    SupabaseCreatorRepo,
    SupabaseDealRepo,
    SupabaseDeliverableRepo,
    SupabaseNegotiationSessionRepo,
    SupabasePaymentRepo,
)
from infrastructure.supabase.storage import SupabaseStorage

DEMO_PASSWORD = "DemoPass123!"
TODAY = date.today()


def make_contract_pdf(text: str) -> bytes:
    # cupsfilter hard-wraps any line wider than its own column width, breaking
    # mid-word ("c\nontent") regardless of the newlines already in `text`.
    # Pre-wrapping each paragraph at a narrow width means cupsfilter never
    # needs to split a line itself, so extracted text stays word-clean.
    wrapped = "\n\n".join(
        textwrap.fill(para, width=60) if para.strip() else ""
        for para in text.split("\n\n")
    )
    with tempfile.TemporaryDirectory() as tmp:
        txt_path = Path(tmp) / "contract.txt"
        txt_path.write_text(wrapped)
        result = subprocess.run(["cupsfilter", str(txt_path)], capture_output=True, check=True)
    return result.stdout


NYKAA_CONTRACT = """BRAND COLLABORATION AGREEMENT — VERVE SKINCARE x ANANYA SHARMA

1. Usage Rights: This Agreement grants the Brand perpetual usage rights to all content
produced under this campaign, in all media, in perpetuity, without additional compensation.

2. Deliverables: Creator shall deliver one (1) Instagram Reel and two (2) Instagram Stories
featuring the Product within 14 days of contract signing.

3. Payment Terms: Payment shall be made to the Creator within 30 days of invoice submission,
in full, via bank transfer.

4. Exclusivity: Creator agrees not to promote directly competing beauty brands for a period
of 30 days from the campaign launch date, limited to the campaign category only.
"""

BOAT_CONTRACT = """BRAND COLLABORATION AGREEMENT — SOLSTICE AUDIO x KABIR ANAND

1. Deliverables: Creator shall deliver one (1) YouTube integration segment (60-90 seconds)
reviewing the Product, plus one (1) Instagram Reel.

2. Revisions: Creator agrees to unlimited revisions at the Brand's request until the Brand
is fully satisfied with the final content.

3. Payment Terms: Payment shall be made to the Creator within 15 days of content going live,
in full, via bank transfer.

4. Usage Rights: Brand may use the delivered content for organic social posting for a period
of 90 days from the publish date.
"""


async def main() -> None:
    client = get_supabase_client(service_role=True)

    def fresh_auth_service() -> AuthService:
        # A fresh client per call: AuthService.brand_signup/creator_signup both
        # end by calling sign_in_with_password, which mutates the client's own
        # session to the newly-created (non-admin) user. A shared client would
        # carry that session into the next signup's admin.create_user call and
        # get rejected with "User not allowed".
        c = get_supabase_client(service_role=True)
        return AuthService(c, SupabaseBrandRepo(c), SupabaseBrandMemberRepo(c), SupabaseCreatorRepo(c))

    creator_service = CreatorService(
        SupabaseCreatorRepo(client), SupabaseActivityLogRepo(client), SupabaseBrandRepo(client)
    )
    deal_repo = SupabaseDealRepo(client)
    deal_service = DealService(deal_repo, SupabaseActivityLogRepo(client))
    contract_service = ContractService(SupabaseContractRepo(client), SupabaseActivityLogRepo(client))
    negotiation_service = NegotiationService(
        SupabaseNegotiationSessionRepo(client), SupabaseActivityLogRepo(client), GeminiAdapter(), deal_repo
    )
    deliverable_service = DeliverableService(SupabaseDeliverableRepo(client), SupabaseActivityLogRepo(client))
    payment_service = PaymentService(SupabasePaymentRepo(client), SupabaseActivityLogRepo(client))
    storage = SupabaseStorage(client)

    clause_card_repo = SupabaseClauseCardRepo(client)
    escalation_repo = SupabaseEscalationRepo(client)
    ci_service = ContractIntelligenceService(
        clause_card_repo,
        escalation_repo,
        SupabaseContractRepo(client),
        ResendAdapter(),
        ClauseExplanationService(GeminiAdapter(), clause_card_repo),
    )

    async def _with_retry(coro_fn, *args, attempts: int = 4, delay: float = 3.0):
        # Supabase's admin create_user endpoint occasionally 403s ("User not
        # allowed") when hit by rapid consecutive calls, as this script does.
        last_exc = None
        for attempt in range(attempts):
            try:
                return await coro_fn(*args)
            except Exception as e:  # noqa: BLE001 - seed script, broad catch is fine
                last_exc = e
                if attempt < attempts - 1:
                    print(f"    (retrying after transient error: {e})")
                    await asyncio.sleep(delay)
        raise last_exc

    async def onboard_creator(brand_id: UUID, actor_id: UUID, **kw) -> UUID:
        req = CreatorOnboardRequest(
            display_name=kw["name"], instagram_handle=kw["handle"], niche=kw["niche"], follower_tier=kw["tier"]
        )
        creator = await creator_service.onboard_creator(req, brand_id, actor_id, "brand")
        await creator_service.update_profile(creator.id, kw["followers"], kw["engagement"], kw.get("views"))
        return creator.id

    async def signup_creator(invite_code: str, **kw) -> UUID:
        req = CreatorSignupRequest(
            display_name=kw["name"], instagram_handle=kw["handle"], niche=kw["niche"],
            follower_tier=kw["tier"], email=kw["login_email"], password=DEMO_PASSWORD,
        )
        session = await _with_retry(fresh_auth_service().creator_signup, req)
        await creator_service.link_brand(session.creator_id, invite_code)
        await creator_service.update_profile(session.creator_id, kw["followers"], kw["engagement"], kw.get("views"))
        return session.creator_id

    async def make_deal(
        brand_id: UUID, actor_id: UUID, creator_id: UUID, brand: str, email: str, status: str,
        created_days_ago: int = 0,
    ) -> UUID:
        deal = await deal_service.create_deal(
            DealCreateRequest(creator_id=creator_id, campaign_name=brand, contact_email=email),
            brand_id, actor_id, "brand",
        )
        if status != "lead":
            await deal_repo.update_status(deal.id, status)
        if created_days_ago:
            backdated = (datetime.now(UTC) - timedelta(days=created_days_ago)).isoformat()
            deal_repo.client.table("deals").update({"created_at": backdated}).eq("id", str(deal.id)).execute()
        return deal.id

    async def make_scanned_contract(brand_id: UUID, actor_id: UUID, deal_id: UUID, text: str) -> UUID:
        pdf_bytes = make_contract_pdf(text)
        path = f"contracts/{deal_id}/demo-agreement.pdf"
        uploaded_path = await storage.upload_file("creator-os-assets", path, pdf_bytes)
        contract = await contract_service.create_contract(deal_id, uploaded_path, brand_id, actor_id, "brand")
        extracted = extract_text(pdf_bytes)
        contract = await contract_service.save_raw_text(contract.id, extracted)
        clauses = await GeminiAdapter().segment_clauses(extracted)
        if clauses:
            await ci_service.scan_contract(contract.id, clauses)
        return contract.id

    async def make_simple_contract(brand_id: UUID, actor_id: UUID, deal_id: UUID) -> UUID:
        contract = await contract_service.create_contract(
            deal_id, f"contracts/{deal_id}/agreement.pdf", brand_id, actor_id, "brand"
        )
        await contract_service.update_status(contract.id, ContractStatusUpdateRequest(status="uploaded"), actor_id, "brand", brand_id)
        await contract_service.update_status(contract.id, ContractStatusUpdateRequest(status="signed"), actor_id, "brand", brand_id)
        return contract.id

    async def make_negotiation(brand_id, actor_id, deal_id, views, cpm, tier_mult, eng_adj, checklist_complete, offers):
        session = await negotiation_service.create_session(
            NegotiationSessionCreate(
                deal_id=deal_id, views_per_week=views, niche_cpm=cpm,
                follower_tier_multiplier=tier_mult, engagement_rate_adjustment=eng_adj,
            ),
            brand_id,
        )
        if checklist_complete:
            await negotiation_service.update_checklist(session.id, ChecklistState(
                usage_rights_duration_set=True, exclusivity_scope_set=True,
                revision_limit_set=True, payment_timeline_set=True,
            ))
        for actor_type, amount, message in offers:
            await negotiation_service.create_counter_offer(
                session.id, amount, message, actor_id, actor_type, brand_id
            )
        return session.id

    async def make_deliverable(brand_id, actor_id, deal_id, title, desc, status_path):
        d = await deliverable_service.create_deliverable(
            DeliverableCreateRequest(deal_id=deal_id, title=title, description=desc), brand_id, actor_id, "brand"
        )
        for status in status_path:
            d = await deliverable_service.update_status(
                d.id, DeliverableStatusUpdateRequest(status=status), actor_id, "brand", brand_id, deal_id
            )
        return d.id

    async def make_payment(brand_id, actor_id, deal_id, contract_id, amount, due_date, paid):
        payment = await payment_service.create_payment(
            PaymentCreateRequest(contract_id=contract_id, amount_inr=amount, due_date=due_date),
            brand_id, actor_id, "brand", deal_id,
        )
        if paid:
            await payment_service.mark_paid(payment.id, brand_id, actor_id, "brand", deal_id)
        return payment.id

    async def seed_brand(brand_name, brand_email, roster, deals_spec):
        print(f"\n=== {brand_name} ===")
        req = BrandSignupRequest(brand_name=brand_name, email=brand_email, password=DEMO_PASSWORD)
        session = await _with_retry(fresh_auth_service().brand_signup, req)
        brand_id, actor_id = session.brand_id, session.user_id
        print(f"  brand login: {brand_email} / {DEMO_PASSWORD}")

        creator_ids = {}
        for key, spec in roster.items():
            if spec.get("login_email"):
                cid = await signup_creator(str(brand_id), **spec)
                print(f"  creator login: {spec['login_email']} / {DEMO_PASSWORD} ({spec['name']})")
            else:
                cid = await onboard_creator(brand_id, actor_id, **spec)
            creator_ids[key] = cid

        for spec in deals_spec:
            deal_id = await make_deal(
                brand_id, actor_id, creator_ids[spec["creator"]], spec["brand"], spec["email"], spec["status"],
                spec.get("created_days_ago", 0),
            )

            if spec.get("scanned_contract_text"):
                contract_id = await make_scanned_contract(brand_id, actor_id, deal_id, spec["scanned_contract_text"])
            elif spec.get("simple_contract"):
                contract_id = await make_simple_contract(brand_id, actor_id, deal_id)
            else:
                contract_id = None

            if spec.get("negotiation"):
                await make_negotiation(brand_id, actor_id, deal_id, **spec["negotiation"])

            if spec.get("deliverable"):
                await make_deliverable(brand_id, actor_id, deal_id, **spec["deliverable"])

            if spec.get("payment") and contract_id:
                await make_payment(brand_id, actor_id, deal_id, contract_id, **spec["payment"])

            print(f"  deal: {spec['brand']} ({spec['status']}) — done")

    # --- Brand 1: Verve Skincare -----------------------------------
    await seed_brand(
        "Verve Skincare",
        "demo.brand1@creatoros.dev",
        roster={
            "ananya": dict(name="Ananya Sharma", handle="@ananya.beauty", niche="beauty", tier="micro",
                            followers=68000, engagement=5.2, views=21000, login_email="demo.creator1@creatoros.dev"),
            "rohan": dict(name="Rohan Mehta", handle="@rohan.fit", niche="fitness", tier="mid",
                          followers=145000, engagement=3.8, views=48000),
            "zara": dict(name="Zara Khan", handle="@zara.style", niche="fashion", tier="micro",
                         followers=42000, engagement=6.1, views=15000),
        },
        deals_spec=[
            dict(creator="ananya", brand="Radiance Serum Launch", email="priya.nair@verveskincare.demo", status="completed",
                 created_days_ago=52,
                 scanned_contract_text=NYKAA_CONTRACT,
                 negotiation=dict(views=18000, cpm=40, tier_mult=6000, eng_adj=3000, checklist_complete=True,
                                   offers=[("creator", 780000, "Our standard ask for this scope"),
                                           ("brand", 650000, "Verve's initial budget"),
                                           ("brand", 729000, "Meeting in the middle at our calculated rate")]),
                 deliverable=dict(title="Instagram Reel — Radiance Serum Launch", desc="1x 30s Reel + 2 Stories",
                                   status_path=["in_production", "editing", "submitted", "approved"]),
                 payment=dict(amount=729000, due_date=TODAY - timedelta(days=10), paid=True)),
            dict(creator="ananya", brand="Winter Glow Kit", email="priya.nair@verveskincare.demo", status="negotiating",
                 created_days_ago=4,
                 negotiation=dict(views=18000, cpm=30, tier_mult=4000, eng_adj=2000, checklist_complete=False,
                                   offers=[("brand", 480000, "Verve's opening offer, still negotiating terms")])),
            dict(creator="rohan", brand="Active Recovery Line", email="priya.nair@verveskincare.demo", status="in_production",
                 created_days_ago=18,
                 simple_contract=True,
                 negotiation=dict(views=40000, cpm=25, tier_mult=8000, eng_adj=3000, checklist_complete=True,
                                   offers=[("creator", 1050000, "Initial ask"),
                                           ("brand", 1011000, "Final agreed rate")]),
                 deliverable=dict(title="YouTube Integration — Active Recovery Line", desc="60-90s integrated segment",
                                   status_path=["in_production", "editing"]),
                 payment=dict(amount=1011000, due_date=TODAY + timedelta(days=20), paid=False)),
            dict(creator="rohan", brand="Sport Balm Teaser", email="priya.nair@verveskincare.demo", status="lead",
                 created_days_ago=2),
            dict(creator="zara", brand="Festive Edit Capsule", email="priya.nair@verveskincare.demo", status="contracted",
                 created_days_ago=26,
                 simple_contract=True,
                 negotiation=dict(views=12000, cpm=35, tier_mult=3000, eng_adj=1500, checklist_complete=True,
                                   offers=[("creator", 450000, "Initial ask"),
                                           ("brand", 424500, "Final agreed rate")]),
                 payment=dict(amount=424500, due_date=TODAY - timedelta(days=15), paid=False)),
            dict(creator="zara", brand="Spring Refresh", email="priya.nair@verveskincare.demo", status="cancelled",
                 created_days_ago=65),
        ],
    )

    # --- Brand 2: Solstice Audio ------------------------------
    await seed_brand(
        "Solstice Audio",
        "demo.brand2@creatoros.dev",
        roster={
            "kabir": dict(name="Kabir Anand", handle="@kabir.tech", niche="tech", tier="mid",
                          followers=112000, engagement=4.5, views=27000, login_email="demo.creator2@creatoros.dev"),
            "ishita": dict(name="Ishita Rao", handle="@ishita.travels", niche="travel", tier="micro",
                           followers=53000, engagement=5.5, views=17000),
            "devansh": dict(name="Devansh Gupta", handle="@devansh.plays", niche="gaming", tier="mid",
                            followers=180000, engagement=3.2, views=62000),
        },
        deals_spec=[
            dict(creator="kabir", brand="Wireless Earbuds Review", email="arjun.mehra@solsticeaudio.demo", status="completed",
                 created_days_ago=48,
                 scanned_contract_text=BOAT_CONTRACT,
                 negotiation=dict(views=25000, cpm=45, tier_mult=7000, eng_adj=3500, checklist_complete=True,
                                   offers=[("creator", 1200000, "Our standard ask"),
                                           ("brand", 1000000, "Solstice's initial budget"),
                                           ("brand", 1135500, "Final agreed rate")]),
                 deliverable=dict(title="YouTube Review — Wireless Earbuds", desc="60-90s review + 1 Reel",
                                   status_path=["in_production", "editing", "submitted", "approved"]),
                 payment=dict(amount=1135500, due_date=TODAY - timedelta(days=12), paid=True)),
            dict(creator="kabir", brand="Studio Headphones Teaser", email="arjun.mehra@solsticeaudio.demo", status="negotiating",
                 created_days_ago=5,
                 negotiation=dict(views=25000, cpm=38, tier_mult=6000, eng_adj=3000, checklist_complete=False,
                                   offers=[("brand", 800000, "Solstice's opening offer")])),
            dict(creator="ishita", brand="Travel Speaker Vlog", email="arjun.mehra@solsticeaudio.demo", status="in_production",
                 created_days_ago=22,
                 simple_contract=True,
                 negotiation=dict(views=15000, cpm=28, tier_mult=4000, eng_adj=2000, checklist_complete=True,
                                   offers=[("creator", 470000, "Initial ask"),
                                           ("brand", 440000, "Final agreed rate")]),
                 deliverable=dict(title="Travel Vlog — Travel Speaker", desc="1x destination vlog, 3-5 min",
                                   status_path=["in_production"]),
                 payment=dict(amount=440000, due_date=TODAY + timedelta(days=25), paid=False)),
            dict(creator="ishita", brand="Podcast Mic Unboxing", email="arjun.mehra@solsticeaudio.demo", status="lead",
                 created_days_ago=1),
            dict(creator="devansh", brand="Gaming Headset Launch", email="arjun.mehra@solsticeaudio.demo", status="contracted",
                 created_days_ago=30,
                 simple_contract=True,
                 negotiation=dict(views=60000, cpm=22, tier_mult=9000, eng_adj=2500, checklist_complete=True,
                                   offers=[("creator", 1420000, "Initial ask"),
                                           ("brand", 1351500, "Final agreed rate")]),
                 payment=dict(amount=1351500, due_date=TODAY - timedelta(days=8), paid=False)),
            dict(creator="devansh", brand="Soundbar Campaign", email="arjun.mehra@solsticeaudio.demo", status="cancelled",
                 created_days_ago=58),
        ],
    )

    print("\nDone. All demo logins use the password:", DEMO_PASSWORD)


if __name__ == "__main__":
    asyncio.run(main())
