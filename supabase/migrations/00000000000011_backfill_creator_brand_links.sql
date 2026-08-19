-- Migration 000009 added creator_brand_links but only new signups/onboards
-- populate it going forward. Every creator seeded before that migration
-- still carries a legacy brand_id with no matching link row, so a brand's
-- roster query (now sourced from creator_brand_links only) silently drops
-- them — found live via the brand dashboard showing "—" for every
-- pre-existing creator's name after signing up and linking a brand new one.
INSERT INTO creator_brand_links (creator_id, brand_id)
SELECT id, brand_id FROM creators WHERE brand_id IS NOT NULL
ON CONFLICT (creator_id, brand_id) DO NOTHING;
