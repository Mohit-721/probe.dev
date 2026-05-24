-- Helper RPC: returns dashboard stats for the current user.
-- Used by the dashboard overview to avoid multiple round trips.

create or replace function public.get_dashboard_stats()
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  result jsonb;
begin
  if uid is null then
    return '{}'::jsonb;
  end if;

  select jsonb_build_object(
    'monitors_total',     (select count(*) from public.monitors where user_id = uid),
    'monitors_healthy',   (select count(*) from public.monitors where user_id = uid and last_status = 'success'),
    'monitors_failing',   (select count(*) from public.monitors where user_id = uid and last_status = 'failed'),
    'monitors_degraded',  (select count(*) from public.monitors where user_id = uid and last_status = 'degraded'),
    'incidents_open',     (select count(*) from public.incidents where user_id = uid and status = 'open'),
    'runs_24h',           (select count(*) from public.runs where user_id = uid and started_at > now() - interval '24 hours'),
    'runs_24h_failed',    (select count(*) from public.runs where user_id = uid and started_at > now() - interval '24 hours' and status = 'failed'),
    'avg_duration_ms_24h',(select coalesce(round(avg(duration_ms))::int, 0) from public.runs where user_id = uid and started_at > now() - interval '24 hours' and duration_ms is not null)
  )
  into result;

  return result;
end;
$$;
