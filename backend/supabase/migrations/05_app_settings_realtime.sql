-- Realtime: push `app_settings` changes to the browser so sales mode updates without polling.
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_settings;
