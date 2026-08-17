-- ============================================================
-- Creator OS — Phase 1 — Agency Ops Core schema
-- Owner: Agency Ops Core backend (this module)
--
-- NOTE ON `deals`: the deals/opportunities table is owned by the
-- Negotiation Dashboard teammate. A minimal stub is included below
-- so contracts.deal_id has something to reference in local dev —
-- swap this out for their real migration once it exists, keeping
-- the column name/type (uuid) the same so nothing else here breaks.
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- core identity tables ----------

create table agencies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table creators (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references agencies(id) on delete cascade,
  auth_user_id uuid references auth.users(id) on delete set null,
  name text not null,
  email text not null,
  niche text,
  follower_tier text,               -- e.g. 'nano','micro','mid','macro','mega'
  connected_accounts jsonb not null default '[]'::jsonb, -- [{platform, handle, followers, avg_views}]
  created_at timestamptz not null default now()
);

create table brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_email text,
  created_at timestamptz not null default now()
);

-- ---------- STUB owned by negotiation teammate — replace when their migration lands ----------

create table deals (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references agencies(id) on delete cascade,
  creator_id uuid not null references creators(id) on delete cascade,
  brand_id uuid not null references brands(id) on delete cascade,
  status text not null default 'negotiating',   -- negotiating | agreed | dead
  agreed_terms jsonb,                            -- filled once negotiation lands: rate, usage_rights, exclusivity, revisions, payment_timeline
  created_at timestamptz not null default now()
);

-- ---------- Agency Ops Core tables (yours) ----------

create table contracts (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references deals(id) on delete restrict,
  creator_id uuid not null references creators(id) on delete restrict,
  brand_id uuid not null references brands(id) on delete restrict,
  agency_id uuid not null references agencies(id) on delete restrict,
  status text not null default 'drafted'
    check (status in ('drafted','sent_for_signature','signed','void')),
  doc_url text,                       -- storage path to the drafted/uploaded contract file
  esign_provider text,                -- e.g. 'docusign' | 'zoho' | 'signeasy' — set at send time
  esign_envelope_id text,             -- provider's reference id
  esign_status text default 'not_sent'
    check (esign_status in ('not_sent','sent','viewed','signed','declined','voided')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table deliverables (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references contracts(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending','submitted','changes_requested','approved','rejected')),
  content_url text,
  notes text,
  submitted_at timestamptz,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table brand_portal_links (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references contracts(id) on delete cascade,
  brand_id uuid not null references brands(id) on delete cascade,
  token text not null unique,          -- opaque random token, sent in the magic link URL
  expires_at timestamptz not null,
  last_accessed_at timestamptz,
  created_at timestamptz not null default now()
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references contracts(id) on delete cascade,
  amount numeric(12,2) not null,
  currency text not null default 'INR',
  status text not null default 'pending'
    check (status in ('pending','invoiced','paid','failed')),
  invoice_ref text,                    -- GST/PAN invoice reference once invoicing rail is picked
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------- shared activity log — every module writes here ----------

create table activity_log (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,           -- 'creator' | 'deal' | 'contract' | 'deliverable' | 'payment'
  entity_id uuid not null,
  agency_id uuid not null references agencies(id) on delete cascade,
  actor_role text not null check (actor_role in ('agency','creator','brand','system')),
  actor_id uuid,                       -- nullable for 'system' actions
  action text not null,                -- short verb phrase, e.g. 'contract.sent_for_signature'
  metadata jsonb not null default '{}'::jsonb,
  visible_to text[] not null default array['agency']::text[], -- subset of {agency,creator,brand}
  created_at timestamptz not null default now()
);

create index idx_activity_log_entity on activity_log(entity_type, entity_id);
create index idx_activity_log_agency on activity_log(agency_id, created_at desc);
create index idx_contracts_deal on contracts(deal_id);
create index idx_deliverables_contract on deliverables(contract_id);
create index idx_brand_portal_token on brand_portal_links(token);

-- ---------- updated_at trigger ----------

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_contracts_updated_at before update on contracts
  for each row execute function set_updated_at();
create trigger trg_deliverables_updated_at before update on deliverables
  for each row execute function set_updated_at();

-- ---------- Row Level Security ----------

alter table creators enable row level security;
alter table contracts enable row level security;
alter table deliverables enable row level security;
alter table activity_log enable row level security;
alter table payments enable row level security;

-- Agency staff: full access to rows in their own agency.
-- Assumes agency staff auth_user_id is stored via a separate agency_members table
-- in Agency Ops Core's auth setup — adjust join once that table exists.
create policy agency_full_access_contracts on contracts
  for all using (
    agency_id in (
      select agency_id from agency_members where auth_user_id = auth.uid()
    )
  );

-- Creators: read-only access to their own contracts/deliverables.
create policy creator_read_own_contracts on contracts
  for select using (
    creator_id in (select id from creators where auth_user_id = auth.uid())
  );

create policy creator_read_own_deliverables on deliverables
  for select using (
    contract_id in (
      select id from contracts where creator_id in (
        select id from creators where auth_user_id = auth.uid()
      )
    )
  );

-- Brand portal access is token-scoped and goes through the service role
-- via the brand-portal edge function, not direct RLS — brands never get
-- a Supabase auth session (magic link = no password, no login).

create policy activity_log_role_visibility on activity_log
  for select using (
    ('agency' = any(visible_to) and agency_id in (
      select agency_id from agency_members where auth_user_id = auth.uid()
    ))
    or
    ('creator' = any(visible_to) and entity_id in (
      select id from creators where auth_user_id = auth.uid()
    ))
  );
