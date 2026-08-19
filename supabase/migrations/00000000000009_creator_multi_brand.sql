-- The single agency-owns-creator model is gone: a creator now signs up on
-- their own (no invite code required) and separately links to any number of
-- brands afterward. creators.brand_id stays only for the brand-onboarded,
-- no-login placeholder flow; a self-serve creator has none until they link.
ALTER TABLE creators ALTER COLUMN brand_id DROP NOT NULL;

CREATE TABLE creator_brand_links (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id uuid NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    linked_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (creator_id, brand_id)
);

ALTER TABLE creator_brand_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "creator_brand_links_isolation" ON creator_brand_links
    USING (brand_id IN (SELECT private.current_brand_ids()) OR creator_id = private.current_creator_id());
