-- Phase 3: creator growth profile, deliverable production stages, negotiation offer sender

ALTER TABLE creators ADD COLUMN followers_count int;
ALTER TABLE creators ADD COLUMN engagement_rate numeric;

ALTER TABLE deliverables DROP CONSTRAINT deliverables_status_check;
ALTER TABLE deliverables ADD CONSTRAINT deliverables_status_check
    CHECK (status IN ('pending','in_production','editing','submitted','approved','rejected','revision_requested'));

ALTER TABLE negotiation_offers ADD COLUMN sender text NOT NULL DEFAULT 'creator' CHECK (sender IN ('creator','agency','brand'));
ALTER TABLE negotiation_offers ALTER COLUMN sender DROP DEFAULT;
