-- ============================================================
-- Creator OS — Phase 1 — Creator Negotiation Dashboard
-- Owner: Negotiation Dashboard teammate
--
-- Expands the `deals` table with fields required for the 
-- rate calculator, growth forecast, and checklist gating.
-- ============================================================

-- Add new columns for the checklist and rate calculations
ALTER TABLE deals
ADD COLUMN IF NOT EXISTS usage_rights_duration text,
ADD COLUMN IF NOT EXISTS exclusivity_scope text,
ADD COLUMN IF NOT EXISTS revision_limit integer,
ADD COLUMN IF NOT EXISTS payment_timeline text,
ADD COLUMN IF NOT EXISTS base_rate numeric(12,2),
ADD COLUMN IF NOT EXISTS suggested_rate_low numeric(12,2),
ADD COLUMN IF NOT EXISTS suggested_rate_high numeric(12,2),
ADD COLUMN IF NOT EXISTS growth_forecast jsonb,
ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- updated_at trigger for deals
CREATE TRIGGER trg_deals_updated_at BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Row Level Security
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

-- Agency staff: full access to rows in their own agency.
-- (Relies on the agency_members table defined/assumed in 001)
CREATE POLICY agency_full_access_deals ON deals
  FOR ALL USING (
    agency_id IN (
      SELECT agency_id FROM agency_members WHERE auth_user_id = auth.uid()
    )
  );

-- Creators: read-only access to their own deals.
CREATE POLICY creator_read_own_deals ON deals
  FOR SELECT USING (
    creator_id IN (SELECT id FROM creators WHERE auth_user_id = auth.uid())
  );
