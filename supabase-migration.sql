-- Pro Consulting Tracker — Supabase migration
-- Run this in the Supabase SQL editor after creating your project.

-- Sessions table
create table public.sessions (
  id         text        primary key,
  customer   text        not null,
  start_time timestamptz not null,
  end_time   timestamptz,
  breaks     jsonb       not null default '[]'::jsonb,
  notes      text        not null default '',
  user_id    uuid        not null references auth.users(id) on delete cascade,
  updated_at timestamptz not null default now()
);

-- Config table (stores customer list as JSONB — single row per user)
create table public.config (
  user_id   uuid  primary key references auth.users(id) on delete cascade,
  customers jsonb not null default '[]'::jsonb
);

-- Row-level security
alter table public.sessions enable row level security;
alter table public.config   enable row level security;

create policy "owner_all_sessions" on public.sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "owner_config" on public.config
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Indexes
create index sessions_user_start   on public.sessions (user_id, start_time desc);
create index sessions_user_updated on public.sessions (user_id, updated_at desc);
