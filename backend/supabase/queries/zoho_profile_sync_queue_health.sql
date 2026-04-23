-- Read-only queue health checks for profile sync jobs.
-- Run in Supabase SQL Editor when you want to verify scheduler/worker health.

-- 1) Jobs that look stuck or overdue
select
  id,
  user_id,
  status,
  attempt_count,
  max_attempts,
  run_after,
  locked_at,
  last_error,
  updated_at
from public.zoho_profile_sync_jobs
where
  (status in ('pending', 'retry') and run_after <= now() - interval '10 minutes')
  or (status = 'processing' and locked_at <= now() - interval '10 minutes')
order by run_after asc;

-- 2) Quick queue health summary
select
  status,
  count(*) as jobs,
  min(run_after) as oldest_run_after,
  max(updated_at) as last_update
from public.zoho_profile_sync_jobs
group by status
order by status;
