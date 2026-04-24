-- Admin-configured tracking codes for GA4 / GTM / Meta Pixel.
ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS google_analytics_id TEXT,
  ADD COLUMN IF NOT EXISTS google_tag_manager_id TEXT,
  ADD COLUMN IF NOT EXISTS meta_pixel_id TEXT;
