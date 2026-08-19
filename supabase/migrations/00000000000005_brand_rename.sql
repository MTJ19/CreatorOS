-- Collapses the Agency middleman: the account that used to represent a talent
-- agency now IS the Brand, dealing with Creators directly. Renaming tables,
-- columns, the RLS helper function and its dependent policies; Postgres
-- auto-updates the parsed policy/function bodies that reference a renamed
-- table/column, so only the renames themselves need to be issued.

-- A prior partial run left a stray, empty "brands" table with no relation to
-- the real "agencies" data, which blocked the rename below. Confirmed empty
-- (0 rows) via the REST API before this line was added.
DROP TABLE IF EXISTS brands;

ALTER TABLE agencies RENAME TO brands;
ALTER TABLE agency_members RENAME TO brand_members;

ALTER TABLE creators RENAME COLUMN agency_id TO brand_id;
ALTER TABLE deals RENAME COLUMN agency_id TO brand_id;
ALTER TABLE activity_log RENAME COLUMN agency_id TO brand_id;

-- The Deal's old free-text "external brand" fields are now redundant (the
-- Brand is the account itself) — repurposed as campaign labeling.
ALTER TABLE deals RENAME COLUMN brand_name TO campaign_name;
ALTER TABLE deals RENAME COLUMN brand_contact_email TO contact_email;

ALTER FUNCTION private.current_agency_ids() RENAME TO current_brand_ids;

-- CHECK constraints hold literal values, not column/table references, so
-- these need an explicit drop + recreate (Postgres won't rewrite them) — and
-- existing rows still carrying the old literal 'agency' value must be
-- converted first, or the new constraint's validation scan rejects them.
UPDATE activity_log SET actor_type = 'brand' WHERE actor_type = 'agency';
ALTER TABLE activity_log DROP CONSTRAINT activity_log_actor_type_check;
ALTER TABLE activity_log ADD CONSTRAINT activity_log_actor_type_check
    CHECK (actor_type IN ('brand', 'creator', 'system'));

UPDATE negotiation_offers SET sender = 'brand' WHERE sender = 'agency';
ALTER TABLE negotiation_offers DROP CONSTRAINT negotiation_offers_sender_check;
ALTER TABLE negotiation_offers ADD CONSTRAINT negotiation_offers_sender_check
    CHECK (sender IN ('creator', 'brand'));

-- The no-login magic-link brand portal is gone now that Brand is a full
-- logged-in role; its policy is dropped along with the table (CASCADE).
DROP TABLE IF EXISTS brand_portal_tokens CASCADE;

-- Cosmetic but part of a genuine full rename: policy names themselves.
ALTER POLICY "agencies_agency_isolation" ON brands RENAME TO "brands_brand_isolation";
ALTER POLICY "agency_members_agency_isolation" ON brand_members RENAME TO "brand_members_brand_isolation";
ALTER POLICY "creators_agency_isolation" ON creators RENAME TO "creators_brand_isolation";
ALTER POLICY "deals_agency_isolation" ON deals RENAME TO "deals_brand_isolation";
ALTER POLICY "contracts_agency_isolation" ON contracts RENAME TO "contracts_brand_isolation";
ALTER POLICY "deliverables_agency_isolation" ON deliverables RENAME TO "deliverables_brand_isolation";
ALTER POLICY "activity_log_agency_isolation" ON activity_log RENAME TO "activity_log_brand_isolation";
ALTER POLICY "payments_agency_isolation" ON payments RENAME TO "payments_brand_isolation";
ALTER POLICY "negotiation_sessions_agency_isolation" ON negotiation_sessions RENAME TO "negotiation_sessions_brand_isolation";
ALTER POLICY "negotiation_offers_agency_isolation" ON negotiation_offers RENAME TO "negotiation_offers_brand_isolation";
ALTER POLICY "Agency members can access their clause_cards" ON clause_cards RENAME TO "Brand members can access their clause_cards";
ALTER POLICY "Agency members can access their escalations" ON escalations RENAME TO "Brand members can access their escalations";
