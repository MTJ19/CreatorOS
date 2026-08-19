CREATE TABLE agencies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    gst_number text,
    pan_number text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE agency_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    user_id uuid NOT NULL,
    role text NOT NULL CHECK (role IN ('owner','member')),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE creators (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    user_id uuid,
    display_name text NOT NULL,
    instagram_handle text NOT NULL,
    niche text NOT NULL,
    follower_tier text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE deals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    creator_id uuid NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    brand_name text NOT NULL,
    brand_contact_email text NOT NULL,
    status text NOT NULL CHECK (status IN ('lead','negotiating','contracted','in_production','completed','cancelled')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE contracts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id uuid NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    file_path text,
    status text NOT NULL CHECK (status IN ('draft','uploaded','signed','void','pending_review')),
    usage_rights_duration_days int,
    exclusivity_scope text,
    revision_limit int,
    payment_timeline_days int,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE deliverables (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id uuid NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text NOT NULL,
    status text NOT NULL CHECK (status IN ('pending','submitted','approved','rejected','revision_requested')),
    file_path text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE activity_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    deal_id uuid REFERENCES deals(id) ON DELETE CASCADE,
    actor_type text NOT NULL CHECK (actor_type IN ('agency','creator','brand','system')),
    actor_label text NOT NULL,
    action text NOT NULL,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    amount_inr numeric NOT NULL,
    status text NOT NULL CHECK (status IN ('pending','paid','overdue')),
    invoice_number text NOT NULL,
    invoice_pdf_path text,
    due_date date,
    paid_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE negotiation_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id uuid NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    views_per_week int NOT NULL,
    niche_cpm numeric NOT NULL,
    follower_tier_multiplier numeric NOT NULL,
    engagement_rate_adjustment numeric NOT NULL,
    base_rate numeric NOT NULL,
    range_low numeric NOT NULL,
    range_high numeric NOT NULL,
    checklist jsonb NOT NULL DEFAULT '{}'::jsonb,
    status text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE negotiation_offers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id uuid NOT NULL REFERENCES negotiation_sessions(id) ON DELETE CASCADE,
    amount numeric NOT NULL,
    message text NOT NULL,
    sent_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE brand_portal_tokens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id uuid NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    token_hash text NOT NULL,
    expires_at timestamptz NOT NULL,
    revoked_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS Helper Functions
CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.current_agency_ids() RETURNS setof uuid AS $$
    SELECT agency_id FROM agency_members WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION private.current_creator_id() RETURNS uuid AS $$
    SELECT id FROM creators WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE negotiation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE negotiation_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_portal_tokens ENABLE ROW LEVEL SECURITY;

-- Base Policies
CREATE POLICY "agencies_agency_isolation" ON agencies
    FOR ALL TO authenticated
    USING (id IN (SELECT private.current_agency_ids()));

CREATE POLICY "agency_members_agency_isolation" ON agency_members
    FOR ALL TO authenticated
    USING (agency_id IN (SELECT private.current_agency_ids()));

CREATE POLICY "creators_agency_isolation" ON creators
    FOR ALL TO authenticated
    USING (agency_id IN (SELECT private.current_agency_ids()) OR id = private.current_creator_id());

CREATE POLICY "deals_agency_isolation" ON deals
    FOR ALL TO authenticated
    USING (agency_id IN (SELECT private.current_agency_ids()) OR creator_id = private.current_creator_id());

CREATE POLICY "contracts_agency_isolation" ON contracts
    FOR ALL TO authenticated
    USING (
        deal_id IN (SELECT id FROM deals WHERE agency_id IN (SELECT private.current_agency_ids()) OR creator_id = private.current_creator_id())
    );

CREATE POLICY "deliverables_agency_isolation" ON deliverables
    FOR ALL TO authenticated
    USING (
        deal_id IN (SELECT id FROM deals WHERE agency_id IN (SELECT private.current_agency_ids()) OR creator_id = private.current_creator_id())
    );

CREATE POLICY "activity_log_agency_isolation" ON activity_log
    FOR ALL TO authenticated
    USING (agency_id IN (SELECT private.current_agency_ids()));

CREATE POLICY "payments_agency_isolation" ON payments
    FOR ALL TO authenticated
    USING (
        contract_id IN (SELECT c.id FROM contracts c JOIN deals d ON c.deal_id = d.id WHERE d.agency_id IN (SELECT private.current_agency_ids()) OR d.creator_id = private.current_creator_id())
    );

CREATE POLICY "negotiation_sessions_agency_isolation" ON negotiation_sessions
    FOR ALL TO authenticated
    USING (
        deal_id IN (SELECT id FROM deals WHERE agency_id IN (SELECT private.current_agency_ids()) OR creator_id = private.current_creator_id())
    );

CREATE POLICY "negotiation_offers_agency_isolation" ON negotiation_offers
    FOR ALL TO authenticated
    USING (
        session_id IN (SELECT ns.id FROM negotiation_sessions ns JOIN deals d ON ns.deal_id = d.id WHERE d.agency_id IN (SELECT private.current_agency_ids()) OR d.creator_id = private.current_creator_id())
    );

CREATE POLICY "brand_portal_tokens_agency_isolation" ON brand_portal_tokens
    FOR ALL TO authenticated
    USING (
        deal_id IN (SELECT id FROM deals WHERE agency_id IN (SELECT private.current_agency_ids()))
    );
