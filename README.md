# Creator OS — feature, flow & architecture spec

## Full feature list (by module)

**Agency Ops Core**
- Creator onboarding
- Contract drafting + e-sign
- Deliverable tracking
- Brand approval chain
- White-labeled, magic-link brand portal (no password)
- Shared activity log (agency + creator + brand visibility)

**Creator Negotiation Dashboard**
- Opportunity intake
- Rate range calculator: `base rate = (views/week × niche CPM) + follower-tier multiplier + engagement-rate adjustment`; range = base × [0.85–1.35]
- Growth-adjusted forecast (compounding weekly growth, recomputed weekly, shown as confidence band)
- Ready-to-send negotiation scripts (lowball opener, "exposure instead of pay," scope creep)
- Pre-send checklist gate: usage-rights duration, exclusivity scope, revision limit, payment timeline must be set before a counter can send
- Practice mode (optional, simulated back-and-forth)

**Legal & Contract Intelligence**
- Clause-by-clause breakdown: payment, usage rights, exclusivity, revisions, termination, kill fee
- Red-flag detection: perpetual usage rights, unpaid whitelisting/boosting, unlimited revisions, exclusivity beyond campaign window
- Human escalation path (compliance lead / lawyer) — hard gate, not a suggestion

**Rate & Deal Benchmarking**
- Aggregated, anonymized rate data by niche / tier / engagement
- Requires real deal flow from Phase 1 to be meaningful

**Content Health Score**
- Hook strength, pacing/retention risk, trend alignment, CTA clarity scoring
- Plain-language reason + rewrite suggestion per score
- Closes loop: pre-publish score vs. actual post performance

**Analytics & Reporting**
- Connected-account performance
- KPI vs. actual
- Stakeholder reports

**Cross-cutting (India-first layer)**
- WhatsApp Business API: reminders, approvals, payment confirmations
- GST/PAN-ready INR invoicing, transparent on-site pricing
- Regional-language UI

---

## Application flow

1. Agency onboards a creator → profile + connected accounts created
2. Brand opportunity comes in → routed to Negotiation Dashboard
3. Rate calculator + growth forecast → suggested ask range shown to creator
4. Negotiation script drafted → pre-send checklist must clear → counter sent
5. Terms agreed → contract drafted / uploaded for e-sign
6. Contract Intelligence scans clauses → red / yellow / green
7. **If red flag:** e-sign locks → case opens in compliance queue → reviewer notified (WhatsApp/email) → human clears, amends, or rejects → decision logged → contract unlocks or returns for redline
8. **If clean:** e-sign proceeds directly
9. Deliverable produced → brand approves via magic-link portal
10. Payment status tracked → WhatsApp confirmation sent
11. Every step writes to the shared activity log (agency, creator, brand — permissioned view)
12. *(Phase 2)* Completed, anonymized deal terms feed Rate Benchmarking
13. *(Phase 3)* Content Health Score runs pre-publish; Analytics & Reporting rolls up performance for stakeholder reports

---

## Phase-by-phase build plan + feature allocation

**Phase 1 — MVP wedge** (no AI required)
- Agency Ops Core (full)
- Creator Negotiation Dashboard: rate calculator, growth forecast, checklist (deterministic formulas only)
- Goal: replace WhatsApp + Sheets; establish activity log as system of record

**Phase 2 — Trust layer** (introduces AI, tightly scoped)
- Legal & Contract Intelligence: rule-based red-flag detection (primary) + single LLM call for plain-language clause explanation
- Escalation workflow (lock → queue → human decision → log)
- Optional secondary agentic pass: multi-step agent re-checks contracts the rules cleared, can only *open* a new case — never auto-clear
- Negotiation scripts upgraded from templated to LLM-drafted, still gated by the checklist
- Rate & Deal Benchmarking (pure aggregation, no AI)

**Phase 3 — Retention**
- Content Health Score: full agentic loop (multi-step reasoning over hook/pacing/trend/CTA, low-stakes enough to tolerate imperfection)
- Analytics & Reporting

---

## Structure (roles / portals)

| Role | Access |
|---|---|
| Agency internal team | Full dashboard — all creators, deals, activity log, compliance queue |
| Creator | Own dashboard — negotiation tool, contracts, deliverables, payment status |
| Brand | Magic-link portal, no login — approvals, deliverable review, payment confirmation (view-only) |

---

## Tech stack

- Frontend: React
- Database / backend: Supabase (Postgres, storage, magic-link auth)
- Dev environment: Claude Code
- Messaging: WhatsApp Business API
- E-sign provider: not yet selected
- Payment gateway / invoicing rail: not yet selected
- LLM provider: not yet selected
- Video/audio preprocessing (Phase 3 only): frame sampling + speech-to-text — provider not yet selected
- Vision-capable LLM (Phase 3 only): required for Content Health Score persona agents — provider not yet selected

---

## Content Health Score — agent design

Three evaluator agents run per draft, each a distinct persona, followed by one synthesis pass. Runs pre-publish; low-stakes by design — a wrong score costs a suggestion, not money or legal exposure, so this is the one module where full agentic judgment calls are appropriate.

**1. Niche insider agent**
- Persona: an engaged follower already inside the creator's niche (fitness, beauty, finance, etc.)
- Evaluates: hook relevance to current niche trends, whether pacing matches what an already-invested audience expects, whether jargon/context-skipping is fine for this crowd

**2. Outside viewer agent**
- Persona: a cold viewer, zero context, scrolling past
- Evaluates: does the hook land in the first 1–2 seconds without prior context, does the CTA make sense standalone, retention risk for someone not already invested

**3. Platform pattern agent**
- Not a persona — a benchmark-comparison pass against aggregated retention/pacing data (sourced from Phase 2's Rate & Deal Benchmarking dataset, extended to store engagement patterns)
- Evaluates: cut frequency, hook length, CTA placement vs. what the dataset shows actually retains viewers

**4. Synthesis pass**
- Orchestrator runs the three evaluators in parallel (independent perspectives, no need to sequence them), then a final call reconciles their outputs
- Surfaces disagreement explicitly — e.g. "niche viewers engage with this reference immediately, but a cold viewer likely drops off before it lands"
- Outputs: one score, one plain-language reason, one concrete rewrite suggestion targeting the biggest gap
- Score history + actual post performance stored in Supabase to close the loop over time (pre-publish score vs. real retention)

---

## Architecture (layers)

1. **Data layer** — Supabase Postgres: creators, deals, contracts, clauses, activity log, benchmark data
2. **Deterministic logic layer** — rate/growth formulas, red-flag rule engine (pattern matching, not ML), checklist gating. No AI, fully auditable.
3. **AI layer**
   - Single LLM call: clause explanation, negotiation script drafting (Phase 2)
   - Full agentic (multi-step, tool-calling, benchmark lookups): Content Health Score (Phase 3); optional second-opinion contract pass (Phase 2) — output is always a new case, never an auto-clear
4. **Orchestration / workflow engine** — event-triggered state machine (upload → scan → gate → escalate/clear → log); owns the e-sign lock
5. **Channel layer** — WhatsApp Business API + email for notifications/approvals; magic-link auth for the brand portal
6. **Presentation layer** — React, three role-based views sharing one activity log
