-- Atomic claim: pull a batch of due monitors and immediately advance their
-- next_run_at so a second cron invocation can never grab the same row.
--
-- Uses SELECT ... FOR UPDATE SKIP LOCKED so two cron invocations running
-- concurrently each get their own batch with zero contention.
--
-- The 70-second bump on next_run_at is a "claim lease" — even if the run
-- itself takes a while, no other cron pass will pick this monitor up. The
-- runner will rewrite next_run_at to the real next-fire time when it finishes.

create or replace function public.claim_due_monitors(p_batch int default 25)
returns setof public.monitors
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with due as (
    select id
    from public.monitors
    where enabled = true
      and next_run_at <= now()
    order by next_run_at asc
    for update skip locked
    limit p_batch
  )
  update public.monitors m
  set next_run_at = now() + interval '70 seconds',
      updated_at = now()
  from due
  where m.id = due.id
  returning m.*;
end;
$$;

revoke all on function public.claim_due_monitors(int) from public, anon, authenticated;
grant execute on function public.claim_due_monitors(int) to service_role;
