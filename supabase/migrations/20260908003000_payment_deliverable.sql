-- Let an invoice reference which deliverable it's for, so the brand can
-- generate an invoice directly from a specific deliverable.
alter table payments add column if not exists deliverable_id uuid references deliverables(id);
