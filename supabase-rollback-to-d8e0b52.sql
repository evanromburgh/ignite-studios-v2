-- ============================================
-- Rollback: Remove objects added after d8e0b52
-- ============================================
-- Run this in Supabase SQL Editor so the database matches supabase-setup.sql from d8e0b52.
-- Each block is safe to run even if the object doesn't exist (IF EXISTS / DO block).

-- 1. Drop trigger (if you ever ran the broadcast-from-DB approach)
DROP TRIGGER IF EXISTS broadcast_unit_viewers_trigger ON units;

-- 2. Drop broadcast function (if you ran it)
DROP FUNCTION IF EXISTS public.broadcast_unit_viewers();

-- 3. Remove unit_viewers from realtime publication (if added), then drop table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'unit_viewers') THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE unit_viewers;
  END IF;
END $$;
DROP TABLE IF EXISTS unit_viewers CASCADE;

-- 4. Drop viewer-related functions
DROP FUNCTION IF EXISTS public.prune_stale_viewers();
DROP FUNCTION IF EXISTS public.remove_unit_viewer(text, text);
DROP FUNCTION IF EXISTS public.merge_unit_viewer(text, text);

-- 5. Revert units table replica identity to default (if you ever set REPLICA IDENTITY FULL)
ALTER TABLE units REPLICA IDENTITY DEFAULT;
