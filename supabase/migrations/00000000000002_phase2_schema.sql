-- Phase 2 Schema: Red-flag detection, escalations, and rate benchmarks

-- 1. clause_cards
CREATE TABLE clause_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    clause_type TEXT NOT NULL,
    raw_text TEXT NOT NULL,
    flag TEXT NOT NULL CHECK (flag IN ('red', 'yellow', 'green')),
    flag_reason_code TEXT,
    llm_explanation TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for FK
CREATE INDEX idx_clause_cards_contract_id ON clause_cards(contract_id);

-- 2. escalations
CREATE TABLE escalations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    clause_card_id UUID NOT NULL REFERENCES clause_cards(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('open', 'cleared', 'amended', 'rejected')),
    opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID,
    resolution_note TEXT
);

-- Indexes for FKs
CREATE INDEX idx_escalations_contract_id ON escalations(contract_id);
CREATE INDEX idx_escalations_clause_card_id ON escalations(clause_card_id);

-- 3. rate_benchmarks
CREATE TABLE rate_benchmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    niche TEXT NOT NULL,
    follower_tier TEXT NOT NULL,
    engagement_bucket TEXT NOT NULL,
    p25_rate NUMERIC NOT NULL,
    p50_rate NUMERIC NOT NULL,
    p75_rate NUMERIC NOT NULL,
    sample_size INT NOT NULL,
    computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Alter contracts table to add previous_status to support reverting from pending_review
ALTER TABLE contracts ADD COLUMN previous_status TEXT;


-- RLS Policies

ALTER TABLE clause_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_benchmarks ENABLE ROW LEVEL SECURITY;

-- clause_cards: accessible if agency owns the contract's deal
CREATE POLICY "Agency members can access their clause_cards"
    ON clause_cards
    FOR ALL
    USING (
        contract_id IN (
            SELECT c.id FROM contracts c
            JOIN deals d ON c.deal_id = d.id
            WHERE d.agency_id IN (SELECT private.current_agency_ids())
        )
    );

-- escalations: accessible if agency owns the contract's deal
CREATE POLICY "Agency members can access their escalations"
    ON escalations
    FOR ALL
    USING (
        contract_id IN (
            SELECT c.id FROM contracts c
            JOIN deals d ON c.deal_id = d.id
            WHERE d.agency_id IN (SELECT private.current_agency_ids())
        )
    );

-- rate_benchmarks: readable by any authenticated user for now, or just agency members
CREATE POLICY "Authenticated users can read rate_benchmarks"
    ON rate_benchmarks
    FOR SELECT
    USING (
        auth.role() = 'authenticated'
    );
