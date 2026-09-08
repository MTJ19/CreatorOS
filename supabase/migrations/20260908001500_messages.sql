-- Brand<->creator direct chat, replacing in-platform "negotiation" for
-- brands (real rate negotiation happens off-platform; brands still set the
-- rate range per deal via the existing negotiation_sessions machinery).
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id) on delete cascade,
  creator_id uuid not null references creators(id) on delete cascade,
  sender_type text not null check (sender_type in ('brand', 'creator')),
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists messages_thread_idx on messages (brand_id, creator_id, created_at);
