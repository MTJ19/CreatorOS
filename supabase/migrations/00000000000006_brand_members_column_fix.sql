-- Migration 00000000000005 renamed the agency_members table to brand_members
-- but missed renaming its own agency_id column — found live via the seed
-- script failing with "Could not find the 'brand_id' column of
-- 'brand_members' in the schema cache".

ALTER TABLE brand_members RENAME COLUMN agency_id TO brand_id;
