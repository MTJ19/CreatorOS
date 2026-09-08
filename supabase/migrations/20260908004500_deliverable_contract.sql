-- Let a deliverable reference the contract it was scoped under, so the brand
-- can see which contract each deliverable came from. Nullable: a brand can
-- still add a deliverable that isn't tied to any specific contract.
alter table deliverables add column if not exists contract_id uuid references contracts(id);
