-- Migration 000005 renamed the private.current_agency_ids() function itself
-- (ALTER FUNCTION ... RENAME), but its body is a dollar-quoted `LANGUAGE sql`
-- string — Postgres stores that as opaque text (prosrc), not a parsed
-- expression tree, so the rename did NOT rewrite the literal table/column
-- names inside it. Every RLS policy that calls this function was therefore
-- still querying the now-nonexistent "agency_members" table, breaking login
-- with a 500 (42P01 undefined_table) for every actor. Found live via the
-- browser demo-login flow after the seed script itself succeeded fine (the
-- seed uses the service-role key, which bypasses RLS and never calls this
-- function).
CREATE OR REPLACE FUNCTION private.current_brand_ids() RETURNS setof uuid AS $$
    SELECT brand_id FROM brand_members WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;
