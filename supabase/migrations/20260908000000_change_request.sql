-- Creator OS change-request migration.
-- Run via Supabase SQL Editor, or `supabase db push` if the project is linked to the CLI.

-- C4: allow creator-owned projects with no brand attached
alter table deals alter column brand_id drop not null;

-- C6: creator-owned contract read/unread status, kept separate from the
-- contract's legal status (draft/uploaded/signed/void) so the two can't collide.
alter table contracts add column if not exists creator_status text not null default 'unread'
  check (creator_status in ('unread', 'read', 'ongoing', 'completed'));

-- C9: commission/fee split so brand and creator invoices can show different amounts.
alter table payments add column if not exists platform_fee_inr numeric(12, 2) not null default 0;

-- B2: deal-level unread marker for the brand's deal list.
alter table deals add column if not exists brand_viewed_at timestamptz;

-- B1: richer brand profile.
alter table brands add column if not exists description text;

-- C3: real historical growth data points to feed the forecast, replacing the
-- single manually-entered growth-rate assumption.
create table if not exists growth_snapshots (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references creators(id) on delete cascade,
  recorded_at date not null,
  followers_count integer not null,
  engagement_rate numeric(5, 2),
  created_at timestamptz not null default now(),
  unique (creator_id, recorded_at)
);

-- C5: freeform brand conversation text + LLM next-step suggestion.
create table if not exists negotiation_conversations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references negotiation_sessions(id) on delete cascade,
  brand_name text not null,
  conversation_text text not null,
  ai_suggestion text,
  created_at timestamptz not null default now()
);
