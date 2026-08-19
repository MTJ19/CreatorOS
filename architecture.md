# Creator OS — Architecture

This is the single source of truth for stack, structure, and how code gets built.
Every prompt references sections **by path** (e.g. "per `docs/architecture.md §4`")
— never paste this file's contents into a prompt.

Before any step: check **§1** and `docs/progress.md` → "Open decisions." If
something the step needs is blank, **stop and ask** — never stub a secret,
invent a schema, or guess a provider.

---

## 0. The core problem this architecture exists to solve

The previous build let "wiring" — router registration, dependency injection,
cross-module integration — happen implicitly, wherever it fell inside a bigger
step. That's why fixing a bug in one place kept breaking another: nothing ever
verified the *seams* on their own, only the pieces.

Fix: **every step is one complete, paste-ready prompt (`docs/BUILD_PLAN.md` —
3–4 per phase, matching the original spec), and inside that single prompt the
agent works through three internal checkpoints it cannot skip or reorder:**

1. **Contract** — write the interface first (Pydantic schema, Protocol/ABC, DB
   migration, endpoint signatures — all specified concretely in the prompt
   itself, not invented on the fly). Nothing here talks to a database or a
   framework.
2. **Implementation** — domain logic + service, built and unit-tested against
   the contract in isolation (mocked repository, no live DB, no router, no
   network). If this checkpoint needs a database or an LLM call to pass its
   tests, the contract wasn't cut correctly.
3. **Wiring** — router registration, dependency injection, the actual database
   and network calls, one integration test per use-case, end-to-end.
   **This is the only checkpoint allowed to touch two modules at once**, and it
   has its own explicit gate (below) precisely because it's where bugs used to
   hide.

A step's prompt is not "done" until all three checkpoints inside it are green —
each `BUILD_PLAN.md` prompt states this explicitly and gives the agent enough
concrete detail (exact schemas, exact endpoints, exact formulas) to run all
three itself in one pass.

---

## 1. Locked decisions

| Input | Decision | Notes |
|---|---|---|
| Database / backend | **Supabase** (Postgres + Storage + Auth, magic-link) | your call, kept |
| LLM provider | **Google Gemini** | see §1a |
| WhatsApp Business API | **Not integrated in MVP** | email instead; backlog §9 |
| E-sign provider | **Not integrated in MVP** | manual upload + status flag; backlog §9 |
| Payment gateway | **None — invoicing only** | manual mark-paid |
| Frontend framework | **Next.js 16** (App Router, TypeScript strict) | 14 is EOL (Oct 2025) |
| Transactional email provider | **TBD** | resolve before Phase 1, Step 1 (Wiring) |
| Hosting | **Assumed: Vercel + Supabase-hosted backend** | confirm before Phase 1, Step 4 |
| Video/audio preprocessing (Phase 3) | **TBD** | resolve before Phase 3, Step 1 |

### 1a. Gemini model selection

Gemini 2.5 Pro/Flash/Flash-Lite retire **October 16, 2026** — don't build against
those IDs.

```
GEMINI_MODEL_FLASH=gemini-3.5-flash   # clause explanations, script drafts,
                                        # individual Content Health Score agents
GEMINI_MODEL_PRO=gemini-3.1-pro        # Content Health Score synthesis pass;
                                        # any call needing deeper reasoning
```

Both are natively multimodal — one provider covers text and the vision-capable
Content Health Score agents. Both live as env vars, read only by the Gemini
adapter (§3) — nothing else in the codebase imports a Gemini SDK directly.

---

## 2. Tech stack

- **Frontend:** Next.js 16 (App Router), TypeScript strict, Tailwind — tokens
  from `docs/design-system.md` only
- **Backend:** FastAPI (Python), async throughout
- **Database:** Supabase Postgres, RLS on every table, migrations only
- **Storage:** Supabase Storage (contract PDFs, deliverable assets)
- **Auth:** Supabase Auth — Agency/Creator normal auth, Brand magic-link
- **Background jobs:** Celery (Phase 3 pipeline, off the request path)
- **Cache:** Redis (Phase 3 aggregate reads, TTL-based)
- **LLM:** Google Gemini (§1a), accessed only through `infrastructure/llm/`
- **Testing:** pytest (unit + integration, backend), Playwright (frontend E2E,
  Phase 1 Step 4 onward)
- **Dev environment:** Claude Code + `ponytail` (anti-over-engineering review)

---

## 3. File structure — hexagonal layering

The layout is the enforcement mechanism for the Contract/Implementation/Wiring
split. `domain/` cannot import anything from `infrastructure/` or `interface/`
— that rule is checked by CI (`import-linter` or equivalent config committed in
Step 1), not just convention.

```
/backend
  /domain
    /interfaces        # Protocol/ABC contracts: repositories, LLM adapter,
                        # email adapter — pure Python, zero imports outside stdlib
    /models             # business objects + Pydantic I/O schemas
    /logic              # pure functions: rate formulas, red-flag rules,
                        # checklist gate, forecast math — fully unit-testable
                        # with no DB and no network
  /application
    /services           # use-cases: orchestrate domain/logic + repositories.
                        # this is what a router calls.
  /infrastructure
    /supabase           # repository implementations (satisfy domain/interfaces)
    /llm                # Gemini adapter — the ONLY place a Gemini SDK is imported
    /email               # email adapter
  /interface
    /routers            # FastAPI routers — request/response translation only,
                        # no business logic, no direct DB calls
  /tests
    /unit                # domain + application, mocked repositories
    /integration          # full stack, real test DB, one file per use-case
  config.py              # Settings — env-var-backed
  exceptions.py           # typed exceptions, caught once at the router boundary
  main.py                 # app assembly + router registration only

/supabase
  /migrations             # schema change = migration; RLS ships in the same file

/frontend
  /app
    /(agency)
    /(creator)
    /(brand)              # magic-link portal, no auth beyond the token
  /components
  /lib                    # Supabase client, API client, formatting helpers

/docs
  architecture.md          # this file
  progress.md
  BUILD_PLAN.md
  design-system.md         # created before Phase 1, Step 4
CLAUDE.md
```

**Why this shape:** a future feature that needs a new business rule only
touches `domain/logic` — it can't accidentally reach into Supabase specifics
because domain code has no import path there. A future feature that swaps
Gemini for another provider only touches `infrastructure/llm` — nothing in
`application/` or `interface/` knows which LLM it's calling, only that
something satisfying the `LLMPort` protocol exists.

---

## 4. The three internal checkpoints, in detail

Each of these runs inside one step's single prompt, in order, without skipping.

### Checkpoint 1 — Contract
- Output: Pydantic schemas, `Protocol`/`ABC` interfaces in `domain/interfaces`,
  a migration file if new tables are needed, and the contract written into
  `docs/architecture.md §6` (the registry).
- Verification: `mypy`/`tsc` passes on the new file (nothing to implement yet —
  if this doesn't type-check cleanly, the contract itself is broken). If a
  migration is included, it applies cleanly to a fresh local DB and its RLS
  policy is present in the same file.
- Gate: contract is committed and referenced by section number before Stage 2
  starts. **No implementation code is written in this stage.**

### Checkpoint 2 — Implementation
- Output: `domain/logic` pure functions + `application/services`, built against
  the Stage 1 contract, with **mocked repositories** — no live DB, no network,
  no router.
- Verification: unit tests for every function in `domain/logic` (deterministic
  math/rules must hit 100% branch coverage — these are the checklist gate,
  red-flag rules, rate/forecast formulas); `ruff`+`mypy` clean.
- Gate: unit test suite green, using only mocks. If a test needs a real DB
  connection to pass, that logic belongs in Stage 3, not here — move it.

### Checkpoint 3 — Wiring
- Output: router registration in `interface/routers`, dependency injection
  wiring the real Supabase/Gemini/email adapters, **one integration test per
  use-case** hitting a real (test) Supabase instance end-to-end.
- Verification: integration test green; full lint/type-check on the whole
  step's cumulative diff; `/ponytail-review` on the cumulative diff (Contract +
  Implementation + Wiring together — this is where over-engineering across a
  whole unit of work is visible, not in any single checkpoint); manual diff read.
- Gate: append one `docs/progress.md` → Log entry, mark the step Completed —
  all three checkpoints done, in one prompt run.

**At the end of each phase:** `/ponytail-debt` → harvest shortcuts into
`docs/progress.md` → Known shortcuts. Optionally `/ponytail-audit` (whole-repo
report, review before applying). Re-run the *full* test suite. Manually
smoke-test the phase's end-to-end user flow once.

---

## 5. Guardrails for future features

- **Domain layer has zero framework/DB imports.** Enforced by CI import-linter
  config (set up in Phase 1, Step 1), not just code review.
- **Blast-radius check before touching a shared contract:** grep every current
  usage of the interface/model being changed, list affected files before
  writing the prompt.
- **One adapter per external dependency.** A new integration (a second LLM
  provider, a different storage backend) gets its own file in
  `infrastructure/`, satisfying an existing `domain/interfaces` protocol — it
  never gets called directly from `application/` or `interface/`.
- **Schema changes are migrations, RLS ships in the same file, always.**
- **Typed exceptions, caught once at the router boundary** — extend
  `exceptions.py`, never a raw `try/except` in a router.
- **A step's Stage 3 integration test is the regression fence.** Once it
  exists, any future change that breaks that use-case fails CI immediately,
  instead of surfacing as a bug report weeks later.

---

## 6. Contract registry

The canonical schema and endpoint list. `docs/BUILD_PLAN.md` prompts quote from
this section directly — if the two ever disagree, this file wins and
`BUILD_PLAN.md` should be corrected to match.

### Phase 1 — tables

- **agencies**: id uuid pk, name text, gst_number text null, pan_number text null, created_at timestamptz default now()
- **agency_members**: id uuid pk, agency_id uuid fk→agencies, user_id uuid (Supabase auth uid), role text check in ('owner','member'), created_at timestamptz
- **creators**: id uuid pk, agency_id uuid fk→agencies, user_id uuid null, display_name text, instagram_handle text, niche text, follower_tier text, created_at timestamptz
- **deals**: id uuid pk, agency_id uuid fk→agencies, creator_id uuid fk→creators, brand_name text, brand_contact_email text, status text check in ('lead','negotiating','contracted','in_production','completed','cancelled'), created_at, updated_at
- **contracts**: id uuid pk, deal_id uuid fk→deals, file_path text null, status text check in ('draft','uploaded','signed','void','pending_review'), usage_rights_duration_days int null, exclusivity_scope text null, revision_limit int null, payment_timeline_days int null, created_at, updated_at
- **deliverables**: id uuid pk, deal_id uuid fk→deals, title text, description text, status text check in ('pending','submitted','approved','rejected','revision_requested'), file_path text null, created_at, updated_at
- **activity_log**: id uuid pk, agency_id uuid fk→agencies, deal_id uuid fk→deals, actor_type text check in ('agency','creator','brand','system'), actor_label text, action text, metadata jsonb default '{}', created_at
- **payments**: id uuid pk, contract_id uuid fk→contracts, amount_inr numeric, status text check in ('pending','paid','overdue'), invoice_number text, invoice_pdf_path text null, due_date date null, paid_at timestamptz null, created_at, updated_at
- **negotiation_sessions**: id uuid pk, deal_id uuid fk→deals, views_per_week int, niche_cpm numeric, follower_tier_multiplier numeric, engagement_rate_adjustment numeric, base_rate numeric, range_low numeric, range_high numeric, checklist jsonb default '{}', status text, created_at
- **negotiation_offers**: id uuid pk, session_id uuid fk→negotiation_sessions, amount numeric, message text, sent_at timestamptz
- **brand_portal_tokens**: id uuid pk, deal_id uuid fk→deals, token_hash text, expires_at timestamptz, revoked_at timestamptz null, created_at

RLS: agency-scoped tables filtered by `private.current_agency_ids()`; creator
rows additionally filtered by `private.current_creator_id()` for the creator
role. Brand never gets a Supabase Auth session — the brand portal talks only
to the FastAPI backend, which validates `brand_portal_tokens` manually and
reads via the service-role key. RLS stays enabled (deny-by-default) on every
table regardless.

**Contracts status transitions:** 
- `draft` → `uploaded` → `signed`
- `any` → `void` (agency-only, any time)
- `any` → `pending_review` (forced by an open escalation, Phase 2)
**No e-sign API call anywhere in these transitions** — status is set manually by the agency.

**Deliverables status transitions:**
- `pending` → `submitted` → `approved` | `revision_requested`
- `revision_requested` → `submitted` (resubmission loop)
- `any` → `rejected` (agency-only)

**Negotiation formulas** (fixed, deterministic):
`base_rate = (views/week × niche CPM) + follower-tier multiplier + engagement-rate adjustment`
`range = base_rate × [0.85–1.35]`
growth forecast: compounding weekly growth, recomputed weekly, shown as a
confidence band. Checklist gate: `usage_rights_duration`, `exclusivity_scope`,
`revision_limit`, `payment_timeline` must all be set before
`POST /negotiation/sessions/{id}/counter-offer` succeeds (`409` otherwise).

### Phase 2 — tables

- **clause_cards**: id uuid pk, contract_id uuid fk→contracts, clause_type text, raw_text text, flag text check in ('red','yellow','green'), flag_reason_code text null, llm_explanation text null, created_at
- **escalations**: id uuid pk, contract_id uuid fk→contracts, clause_card_id uuid fk→clause_cards, status text check in ('open','cleared','amended','rejected'), opened_at, resolved_at timestamptz null, resolved_by uuid null, resolution_note text null
- **rate_benchmarks**: id uuid pk, niche text, follower_tier text, engagement_bucket text, p25_rate numeric, p50_rate numeric, p75_rate numeric, sample_size int, computed_at timestamptz

**Red-flag list** (fixed, rule-based pattern matching — never an LLM
decision): perpetual usage rights, unpaid whitelisting/boosting, unlimited
revisions, exclusivity beyond campaign window. Any flag forces the parent
contract to `pending_review`; only a human `resolve` call (`clear`/`amend`/
`reject`) unlocks it. A single Gemini call (`GEMINI_MODEL_FLASH`) may attach
`llm_explanation` to a clause card, but a failed LLM call must never prevent
the flag itself from being recorded.

**Benchmarks:** populated only from real Phase 1 deal data; `sample_size < 5`
returns an explicit "insufficient data" response, never a synthetic number.

### Phase 3 — tables

- **content_scores**: id uuid pk, deliverable_id uuid fk→deliverables, score int (0–100), explanation text, rewrite_suggestion text, evaluator_outputs jsonb, disagreement_note text null, actual_performance jsonb null, created_at
- **analytics_snapshots**: id uuid pk, creator_id uuid fk→creators, platform text default 'instagram', metric_date date, followers int, avg_views numeric, avg_engagement_rate numeric, raw jsonb, fetched_at

Three evaluator agents (niche insider, outside viewer, platform pattern — the
last compares against `rate_benchmarks`/`analytics_snapshots`, not a persona)
run in parallel on `GEMINI_MODEL_FLASH`; one synthesis call on
`GEMINI_MODEL_PRO` reconciles them into `content_scores`. Runs as a Celery
job, off the request path.

---

## 7. Verification standard — summary

| Stage | Automated gate | Manual gate |
|---|---|---|
| Contract | type-check on new files | contract logged in §6 before Stage 2 starts |
| Implementation | unit tests (mocked), lint+type-check | — |
| Wiring | integration tests (real test DB), lint+type-check, ponytail-review | diff read like a PR |
| Phase end | full test suite | end-to-end smoke test of the phase's user flow |

---

## 8. Design system

`docs/design-system.md` now holds the actual tokens (colors, type, spacing,
radius, elevation) and the specific component patterns pulled from the
reference image — read it directly rather than this summary. Place the
reference image at `docs/design/reference/antimetal-landing.jpg` so it's in
the repo for the agent to view during frontend steps. No component may
introduce a value not defined in `design-system.md`, and none falls back to
a framework default.

---

## 9. Deferred / backlog

- **WhatsApp Business API** — Gupshup (fastest India-specific onboarding) or
  Meta Cloud API direct (cheaper, more setup), when picked back up
- **E-sign** — Digio/Leegality (India-first, Aadhaar-based), when picked back up
- Regional-language UI
- Practice mode (simulated negotiation back-and-forth)
- Optional secondary agentic contract re-check pass (Phase 2 spec marks this
  optional — can only *open* a case, never auto-clear)
