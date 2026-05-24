-- Add public sharing to monitors
alter table public.monitors
  add column if not exists public_token text unique;

create index if not exists monitors_public_token_idx on public.monitors(public_token) where public_token is not null;

-- ============================================================================
-- SECURITY: Public access view — only safe columns (NO config, NO secrets)
-- ============================================================================
-- The `config` column contains URLs, auth headers, and other sensitive data.
-- Direct RLS on the table would still allow SELECT config via REST API.
-- Solution: create a view with only safe columns, grant anon access to view only.

drop view if exists public.monitors_public cascade;
create view public.monitors_public as
  select
    id,
    user_id,
    name,
    slug,
    schedule,
    last_status,
    last_run_at,
    uptime_30d,
    public_token,
    enabled,
    created_at,
    updated_at
  from public.monitors
  where public_token is not null;

grant select on public.monitors_public to anon;

-- RLS on table: deny all direct anon access to the table itself.
-- (Users will query monitors_public view instead.)
alter table public.monitors enable row level security;
drop policy if exists "monitors_public_read" on public.monitors;
create policy "monitors_deny_anon" on public.monitors
  for select
  to anon
  using (false);

-- Public read for runs (via view lookup).
drop policy if exists "runs_public_read" on public.runs;
create policy "runs_public_read" on public.runs
  for select
  to anon
  using (
    exists (
      select 1 from public.monitors_public m
      where m.id = runs.monitor_id
    )
  );

-- Public read for incidents (via view lookup).
drop policy if exists "incidents_public_read" on public.incidents;
create policy "incidents_public_read" on public.incidents
  for select
  to anon
  using (
    exists (
      select 1 from public.monitors_public m
      where m.id = incidents.monitor_id
    )
  );
