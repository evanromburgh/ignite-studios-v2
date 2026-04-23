-- ============================================================================
-- Profile Zoho sync foundation
-- - Add profile-level Zoho linkage identifiers
-- - Add dedicated profile sync queue (latest-wins by user_id)
-- - Backfill profile Zoho IDs from reservations history where possible
-- ============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS zoho_lead_id TEXT,
  ADD COLUMN IF NOT EXISTS zoho_contact_id TEXT;

CREATE TABLE IF NOT EXISTS public.zoho_profile_sync_jobs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'retry', 'succeeded', 'failed', 'cancelled')),
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  max_attempts INTEGER NOT NULL DEFAULT 8 CHECK (max_attempts > 0),
  run_after TIMESTAMPTZ NOT NULL DEFAULT now(),
  locked_at TIMESTAMPTZ,
  last_error TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS zoho_profile_sync_jobs_due_idx
  ON public.zoho_profile_sync_jobs (status, run_after)
  WHERE status IN ('pending', 'retry');

ALTER TABLE public.zoho_profile_sync_jobs ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS zoho_profile_sync_jobs_updated_at ON public.zoho_profile_sync_jobs;
CREATE TRIGGER zoho_profile_sync_jobs_updated_at
BEFORE UPDATE ON public.zoho_profile_sync_jobs
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

WITH latest_contact_ids AS (
  SELECT DISTINCT ON (r.user_id)
    r.user_id,
    r.zoho_contact_id
  FROM public.reservations r
  WHERE r.zoho_contact_id IS NOT NULL
  ORDER BY
    r.user_id,
    COALESCE(r.paid_at, r.updated_at, r.created_at) DESC,
    r.created_at DESC
),
latest_lead_ids AS (
  SELECT DISTINCT ON (r.user_id)
    r.user_id,
    r.zoho_lead_id
  FROM public.reservations r
  WHERE r.zoho_lead_id IS NOT NULL
  ORDER BY
    r.user_id,
    COALESCE(r.paid_at, r.updated_at, r.created_at) DESC,
    r.created_at DESC
),
backfill_source AS (
  SELECT
    COALESCE(c.user_id, l.user_id) AS user_id,
    c.zoho_contact_id,
    l.zoho_lead_id
  FROM latest_contact_ids c
  FULL OUTER JOIN latest_lead_ids l
    ON l.user_id = c.user_id
)
UPDATE public.profiles p
SET
  zoho_contact_id = COALESCE(p.zoho_contact_id, b.zoho_contact_id),
  zoho_lead_id = COALESCE(p.zoho_lead_id, b.zoho_lead_id)
FROM backfill_source b
WHERE p.id = b.user_id
  AND (
    (p.zoho_contact_id IS NULL AND b.zoho_contact_id IS NOT NULL)
    OR
    (p.zoho_lead_id IS NULL AND b.zoho_lead_id IS NOT NULL)
  );
