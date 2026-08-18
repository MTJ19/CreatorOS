# Agency Ops Core — backend

Phase 1, Agency Ops Core module. Supabase Postgres + Edge Functions (Deno/TypeScript).

## Setup

```bash
supabase init          # if not already a supabase project
supabase link --project-ref <your-project-ref>
supabase db push        # applies supabase/migrations/001_agency_ops_core.sql
supabase functions deploy creators
supabase functions deploy contracts
supabase functions deploy webhooks-esign
supabase functions deploy deliverables
supabase functions deploy brand-portal
supabase functions deploy negotiation-script-drafter
```

Env vars needed by the functions (set via `supabase secrets set`):
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — provided automatically in deployed functions, needed in `.env` for local `supabase functions serve`
- `GEMINI_API_KEY` — required for the `negotiation-script-drafter` function in Phase 2.
- `ESIGN_PROVIDER` — unset defaults to the stub provider (`_shared/esignProvider.ts`). Set to `docusign` / `zoho` / etc. once picked, and add the real implementation.

For local development, create a `.env` file in this directory and start your functions using:
```bash
supabase functions serve --no-verify-jwt --env-file .env
```

## Important: the `deals` table is a stub

`deals` in the migration is a placeholder so `contracts.deal_id` has an FK target for local dev. **The negotiation teammate owns the real `deals` schema.** Once their migration exists:

1. Drop the stub `deals` table from `001_agency_ops_core.sql` (or better, let their migration `create table deals` and remove it from this file so there's one source of truth).
2. Confirm the contract between our modules stays: a deal reaching `status = 'agreed'` with an `agreed_terms` jsonb blob containing at minimum `{ rate, usage_rights_duration, exclusivity_scope, revision_limit, payment_timeline }` — `POST /contracts` checks `status = 'agreed'` before drafting.
3. Nothing else in this module should need to change if that contract holds.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/creators` | Onboard a creator |
| GET | `/creators/:id` | Fetch a creator |
| POST | `/contracts` | Draft a contract from an agreed deal (`{ deal_id, doc_url }`) |
| POST | `/contracts/:id/send-for-signature` | Send to e-sign provider |
| GET | `/contracts/:id` | Fetch a contract |
| POST | `/webhooks-esign` | Provider callback — updates `esign_status`/`status` |
| POST | `/deliverables` | Create a deliverable slot (contract must be `signed`) |
| PATCH | `/deliverables/:id/status` | Update status (`{ status, actor_role, notes }`) |
| GET | `/deliverables/:id` | Fetch a deliverable |
| POST | `/brand-portal/generate-link` | Agency generates a magic link (`{ contract_id }`) |
| GET | `/brand-portal/:token` | Brand views contract + deliverables — no auth, token-scoped |
| POST | `/brand-portal/:token/approve` | Brand approves a deliverable (`{ deliverable_id }`) |
| POST | `/negotiation-script-drafter` | Phase 2: Drafts a negotiation counter-offer using Gemini (`{ brandName, initialOffer, desiredRate }`) |

## Activity log

Every mutating endpoint calls `logActivity()` from `_shared/activityLog.ts`. **The negotiation teammate should call the same helper** for deal/checklist/script events so there's one activity feed, not two. Default visibility per entity type is defined in that file — override with `visibleTo` for anything that shouldn't reach the creator or brand (e.g. internal notes).

## What's NOT in this module (by design, per the Phase 1 spec)

- No clause/red-flag scanning on contracts — that's Phase 2 (Legal & Contract Intelligence). Every contract here goes straight from `drafted` → `sent_for_signature` → `signed`.
- No AI calls anywhere in this module.
- Payment gateway integration is stubbed as a `payments` table only — no provider wired in yet (not yet selected per spec).

## Known open decisions (blockers for full functionality, not for building/testing)

- **E-sign provider** — currently `StubEsignProvider`, which fabricates envelope IDs and does not collect real signatures. Swap in `_shared/esignProvider.ts`.
- **Payment gateway / invoicing rail** — `payments` table exists, no write path wired yet.
- Auth: RLS policies in the migration assume an `agency_members` table (auth_user_id → agency_id) that doesn't exist yet — add that migration alongside whichever teammate builds agency staff login.
