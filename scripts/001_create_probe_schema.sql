-- Probe schema: monitors, runs, incidents, api_keys
-- All tables are user-scoped via auth.users(id) with RLS enforced.

create extension if not exists "pgcrypto";

-- ============================================================
-- monitors: user-defined API checks (single endpoint or multi-step flow)
-- ============================================================
create table if not exists public.monitors (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,

  name          text not null,
  slug          text not null,
  description   text,

  -- "simple" = one request, "flow" = multi-step with optional value capture
  kind          text not null default 'simple' check (kind in ('simple', 'flow')),

  -- jsonb: { steps: [{ name, method, url, headers, body, assertions, capture }] }
  config        jsonb not null default '{"steps":[]}'::jsonb,

  -- cron expression. Common values: "* * * * *", "*/5 * * * *", "0 * * * *"
  schedule      text not null default '*/5 * * * *',

  enabled       boolean not null default true,

  -- precomputed timestamp the cron picks up; set on insert/after each run
  next_run_at   timestamptz not null default now(),

  -- aggregate health (denormalised for fast list views)
  last_status   text check (last_status in ('success','failed','degraded','pending','running')),
  last_run_at   timestamptz,
  uptime_30d    numeric(5,2),

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  unique (user_id, slug)
);

create index if not exists monitors_user_id_idx on public.monitors(user_id);
create index if not exists monitors_due_idx     on public.monitors(next_run_at) where enabled = true;

alter table public.monitors enable row level security;

drop policy if exists "monitors_select_own" on public.monitors;
drop policy if exists "monitors_insert_own" on public.monitors;
drop policy if exists "monitors_update_own" on public.monitors;
drop policy if exists "monitors_delete_own" on public.monitors;

create policy "monitors_select_own" on public.monitors for select using (auth.uid() = user_id);
create policy "monitors_insert_own" on public.monitors for insert with check (auth.uid() = user_id);
create policy "monitors_update_own" on public.monitors for update using (auth.uid() = user_id);
create policy "monitors_delete_own" on public.monitors for delete using (auth.uid() = user_id);

-- ============================================================
-- runs: every execution of a monitor
-- ============================================================
create table if not exists public.runs (
  id            uuid primary key default gen_random_uuid(),
  monitor_id    uuid not null references public.monitors(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,

  status        text not null check (status in ('running','success','failed','degraded')),
  region        text default 'iad1',
  duration_ms   integer,

  -- jsonb array: [{ step, status, status_code, duration_ms, assertions: [...], error }]
  step_results  jsonb not null default '[]'::jsonb,
  error_message text,

  trigger       text not null default 'schedule' check (trigger in ('schedule','manual','webhook')),
  started_at    timestamptz not null default now(),
  completed_at  timestamptz
);

create index if not exists runs_monitor_id_started_idx on public.runs(monitor_id, started_at desc);
create index if not exists runs_user_id_started_idx    on public.runs(user_id, started_at desc);

alter table public.runs enable row level security;

drop policy if exists "runs_select_own" on public.runs;
drop policy if exists "runs_insert_own" on public.runs;

create policy "runs_select_own" on public.runs for select using (auth.uid() = user_id);
create policy "runs_insert_own" on public.runs for insert with check (auth.uid() = user_id);

-- ============================================================
-- incidents: opened when a monitor fails, resolved when it recovers
-- ============================================================
create table if not exists public.incidents (
  id            uuid primary key default gen_random_uuid(),
  monitor_id    uuid not null references public.monitors(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,

  title         text not null,
  summary       text,
  severity      text not null default 'minor' check (severity in ('minor','major','critical')),
  status        text not null default 'open' check (status in ('open','acknowledged','resolved')),

  opened_at     timestamptz not null default now(),
  resolved_at   timestamptz,

  first_run_id  uuid references public.runs(id) on delete set null
);

create index if not exists incidents_monitor_idx     on public.incidents(monitor_id, opened_at desc);
create index if not exists incidents_user_open_idx   on public.incidents(user_id, status) where status = 'open';

alter table public.incidents enable row level security;

drop policy if exists "incidents_select_own" on public.incidents;
drop policy if exists "incidents_insert_own" on public.incidents;
drop policy if exists "incidents_update_own" on public.incidents;
drop policy if exists "incidents_delete_own" on public.incidents;

create policy "incidents_select_own" on public.incidents for select using (auth.uid() = user_id);
create policy "incidents_insert_own" on public.incidents for insert with check (auth.uid() = user_id);
create policy "incidents_update_own" on public.incidents for update using (auth.uid() = user_id);
create policy "incidents_delete_own" on public.incidents for delete using (auth.uid() = user_id);

-- ============================================================
-- api_keys (CLI / CI integration)
-- ============================================================
create table if not exists public.api_keys (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  prefix        text not null,
  key_hash      text not null unique,
  last_used_at  timestamptz,
  created_at    timestamptz not null default now(),
  revoked_at    timestamptz
);

create index if not exists api_keys_user_idx on public.api_keys(user_id);

alter table public.api_keys enable row level security;

drop policy if exists "api_keys_select_own" on public.api_keys;
drop policy if exists "api_keys_insert_own" on public.api_keys;
drop policy if exists "api_keys_delete_own" on public.api_keys;

create policy "api_keys_select_own" on public.api_keys for select using (auth.uid() = user_id);
create policy "api_keys_insert_own" on public.api_keys for insert with check (auth.uid() = user_id);
create policy "api_keys_delete_own" on public.api_keys for delete using (auth.uid() = user_id);

-- ============================================================
-- updated_at trigger
-- ============================================================
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists monitors_touch_updated_at on public.monitors;
create trigger monitors_touch_updated_at
  before update on public.monitors
  for each row execute function public.touch_updated_at();
