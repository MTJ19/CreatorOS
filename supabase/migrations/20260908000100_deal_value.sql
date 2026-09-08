-- C4: creator-set value for unlinked (no-brand) projects, and as a fallback
-- display value for linked deals that never went through formal negotiation.
alter table deals add column if not exists value_inr numeric(12, 2);
