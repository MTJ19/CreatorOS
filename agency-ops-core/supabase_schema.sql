-- ============================================================
-- Creator OS — Phase 1 Complete Schema & Seed Data
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Identity & Core Tables
CREATE TABLE IF NOT EXISTS agencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agency_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  auth_user_id uuid,
  role text NOT NULL DEFAULT 'member'
);

CREATE TABLE IF NOT EXISTS creators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  auth_user_id uuid,
  name text NOT NULL,
  email text NOT NULL,
  niche text,
  follower_tier text,
  connected_accounts jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Deals / Opportunities Table
CREATE TABLE IF NOT EXISTS deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'negotiating'
    CHECK (status IN ('negotiating', 'agreed', 'dead')),
  agreed_terms jsonb,
  usage_rights_duration text,
  exclusivity_scope text,
  revision_limit integer,
  payment_timeline text,
  base_rate numeric(12,2),
  suggested_rate_low numeric(12,2),
  suggested_rate_high numeric(12,2),
  growth_forecast jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Contracts Table
CREATE TABLE IF NOT EXISTS contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES deals(id) ON DELETE RESTRICT,
  creator_id uuid NOT NULL REFERENCES creators(id) ON DELETE RESTRICT,
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE RESTRICT,
  agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'drafted'
    CHECK (status IN ('drafted', 'sent_for_signature', 'signed', 'void')),
  doc_url text,
  esign_provider text DEFAULT 'stub',
  esign_envelope_id text,
  esign_status text DEFAULT 'not_sent'
    CHECK (esign_status IN ('not_sent', 'sent', 'viewed', 'signed', 'declined', 'voided')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Deliverables Table
CREATE TABLE IF NOT EXISTS deliverables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'submitted', 'changes_requested', 'approved', 'rejected')),
  content_url text,
  notes text,
  submitted_at timestamptz,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Magic-Link Brand Portal Table
CREATE TABLE IF NOT EXISTS brand_portal_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  last_accessed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6. Payments Table (GST / INR Ready)
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'invoiced', 'paid', 'failed')),
  invoice_ref text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 7. Shared Activity Log
CREATE TABLE IF NOT EXISTS activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  actor_role text NOT NULL CHECK (actor_role IN ('agency', 'creator', 'brand', 'system')),
  actor_id uuid,
  action text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  visible_to text[] NOT NULL DEFAULT ARRAY['agency']::text[],
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 8. Triggers for updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_contracts_updated_at ON contracts;
CREATE TRIGGER trg_contracts_updated_at BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_deliverables_updated_at ON deliverables;
CREATE TRIGGER trg_deliverables_updated_at BEFORE UPDATE ON deliverables
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_deals_updated_at ON deals;
CREATE TRIGGER trg_deals_updated_at BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 9. Sample Starter Data (Seeds)
DO $$
DECLARE
  v_agency_id uuid := 'a0000000-0000-0000-0000-000000000001'::uuid;
  v_creator_1 uuid := 'c0000000-0000-0000-0000-000000000001'::uuid;
  v_creator_2 uuid := 'c0000000-0000-0000-0000-000000000002'::uuid;
  v_brand_1   uuid := 'b0000000-0000-0000-0000-000000000001'::uuid;
  v_brand_2   uuid := 'b0000000-0000-0000-0000-000000000002'::uuid;
  v_deal_1    uuid := 'd0000000-0000-0000-0000-000000000001'::uuid;
  v_contract_1 uuid := 'e0000000-0000-0000-0000-000000000001'::uuid;
  v_deliv_1   uuid := 'f0000000-0000-0000-0000-000000000001'::uuid;
BEGIN
  -- Agency
  INSERT INTO agencies (id, name, settings)
  VALUES (v_agency_id, 'Apex Talent Agency', '{"currency":"USD","timezone":"UTC"}'::jsonb)
  ON CONFLICT (id) DO NOTHING;

  -- Creators
  INSERT INTO creators (id, agency_id, name, email, niche, follower_tier, connected_accounts)
  VALUES 
    (v_creator_1, v_agency_id, 'Alex Rivera', 'alex@creator.io', 'tech', 'macro', '[{"platform":"youtube","handle":"@alextech","followers":750000,"avg_views":500000}]'::jsonb),
    (v_creator_2, v_agency_id, 'Maya Chen', 'maya@fitstudio.com', 'fitness', 'mid', '[{"platform":"instagram","handle":"@mayafit","followers":280000,"avg_views":150000}]'::jsonb)
  ON CONFLICT (id) DO NOTHING;

  -- Brands
  INSERT INTO brands (id, name, contact_email)
  VALUES 
    (v_brand_1, 'Titan Tech Corp', 'partnerships@titantech.com'),
    (v_brand_2, 'EcoBottle Co', 'campaigns@ecobottle.io')
  ON CONFLICT (id) DO NOTHING;

  -- Deal 1 (Agreed)
  INSERT INTO deals (id, agency_id, creator_id, brand_id, status, agreed_terms, usage_rights_duration, exclusivity_scope, revision_limit, payment_timeline, base_rate, suggested_rate_low, suggested_rate_high)
  VALUES (
    v_deal_1, 
    v_agency_id, 
    v_creator_1, 
    v_brand_1, 
    'agreed', 
    '{"rate":8500,"deliverable":"1 Dedicated YouTube Video","usage_rights_duration":"6 months","exclusivity_scope":"Category Specific","revision_limit":2,"payment_timeline":"Net 30"}'::jsonb,
    '6 months',
    'Category Specific',
    2,
    'Net 30',
    8500.00,
    7225.00,
    11475.00
  )
  ON CONFLICT (id) DO NOTHING;

  -- Contract 1 (Signed)
  INSERT INTO contracts (id, deal_id, creator_id, brand_id, agency_id, status, doc_url, esign_provider, esign_envelope_id, esign_status)
  VALUES (
    v_contract_1,
    v_deal_1,
    v_creator_1,
    v_brand_1,
    v_agency_id,
    'signed',
    'https://storage.example.com/contracts/contract_titan_alex.pdf',
    'stub',
    'stub_env_8992a',
    'signed'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Deliverable 1
  INSERT INTO deliverables (id, contract_id, status, content_url, notes, submitted_at, approved_at)
  VALUES (
    v_deliv_1,
    v_contract_1,
    'approved',
    'https://loom.com/share/draft-v1-titan-integration',
    'Approved by brand sponsor via Magic Link.',
    now() - interval '2 hours',
    now() - interval '1 hour'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Magic Link Token
  INSERT INTO brand_portal_links (contract_id, brand_id, token, expires_at)
  VALUES (
    v_contract_1,
    v_brand_1,
    'token_titan_magic_9831',
    now() + interval '30 days'
  )
  ON CONFLICT (token) DO NOTHING;

  -- Activity Log Entries
  INSERT INTO activity_log (entity_type, entity_id, agency_id, actor_role, action, metadata, visible_to)
  VALUES 
    ('creator', v_creator_1, v_agency_id, 'agency', 'creator.onboarded', '{"name":"Alex Rivera"}'::jsonb, ARRAY['agency', 'creator']),
    ('contract', v_contract_1, v_agency_id, 'creator', 'contract.signed', '{"envelope_id":"stub_env_8992a"}'::jsonb, ARRAY['agency', 'creator', 'brand']),
    ('deliverable', v_deliv_1, v_agency_id, 'brand', 'deliverable.approved', '{"contract_id":"e0000000-0000-0000-0000-000000000001"}'::jsonb, ARRAY['agency', 'creator', 'brand'])
  ON CONFLICT DO NOTHING;
END $$;
