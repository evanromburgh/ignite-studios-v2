-- ============================================================================
-- Global app settings (single row): sales phase + optional public countdown target
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.app_settings (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  sales_mode TEXT NOT NULL DEFAULT 'launched' CHECK (sales_mode IN ('prelaunch', 'launched')),
  sales_opens_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.app_settings (id, sales_mode, sales_opens_at)
VALUES (1, 'launched', NULL)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read app settings" ON public.app_settings;
CREATE POLICY "Anyone can read app settings"
  ON public.app_settings
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Inserts/updates/deletes: no policy for anon/authenticated → denied. Service role bypasses RLS for admin API.

COMMENT ON TABLE public.app_settings IS 'Singleton row (id=1). sales_mode prelaunch|launched; sales_opens_at for hero countdown (UTC in DB, edited as SAST in app).';

GRANT SELECT ON TABLE public.app_settings TO anon, authenticated;
