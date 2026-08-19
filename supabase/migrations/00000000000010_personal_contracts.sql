-- A creator can now upload and get the same clause-scan review on a contract
-- of their own, independent of any brand/deal on the platform (e.g. an offer
-- from a company that isn't a Creator OS brand at all).
ALTER TABLE contracts ALTER COLUMN deal_id DROP NOT NULL;
ALTER TABLE contracts ADD COLUMN creator_id uuid REFERENCES creators(id) ON DELETE CASCADE;
