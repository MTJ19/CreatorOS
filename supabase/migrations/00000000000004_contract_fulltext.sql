-- Phase 3 cont'd: persist extracted contract text so the clause-review page can
-- render the full document with sensitive clauses highlighted inline, not just
-- a list of segmented clause cards.

ALTER TABLE contracts ADD COLUMN raw_text text;
