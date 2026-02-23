-- ============================================
-- Ignite Studios — Supabase Database Setup
-- ============================================
-- Run this SQL in your Supabase project's SQL Editor
-- (Dashboard > SQL Editor > New Query)


-- =====================
-- 1. PROFILES TABLE
-- =====================

CREATE TABLE IF NOT EXISTS profiles (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email               TEXT,
  display_name        TEXT,
  role                TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  wishlist_unit_ids   TEXT[] DEFAULT '{}',
  reserved_unit_ids   TEXT[] DEFAULT '{}',
  created_at          TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Ensure profile columns exist (for existing installs that ran older schema)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wishlist_unit_ids TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reserved_unit_ids TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- Auto-create a profile row when a new user signs up (phone from sign-up form)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, phone)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'display_name',
    NEW.raw_user_meta_data ->> 'phone'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- =====================
-- 2. UNITS TABLE
-- =====================

CREATE TABLE IF NOT EXISTS units (
  id              TEXT PRIMARY KEY,
  unit_number     TEXT NOT NULL,
  bedrooms        INTEGER NOT NULL DEFAULT 1,
  bathrooms       INTEGER NOT NULL DEFAULT 1,
  parking         INTEGER NOT NULL DEFAULT 1,
  size_sqm        INTEGER NOT NULL DEFAULT 50,
  price           BIGINT  NOT NULL DEFAULT 0,
  status          TEXT    NOT NULL DEFAULT 'Available'
                  CHECK (status IN ('Available', 'Reserved', 'Sold')),
  unit_type       TEXT    NOT NULL,
  image_url       TEXT    NOT NULL,
  viewers         JSONB   DEFAULT '{}'::jsonb,
  lock_expires_at BIGINT,
  locked_by       TEXT
);

ALTER TABLE units ENABLE ROW LEVEL SECURITY;

-- Everyone can read units
DROP POLICY IF EXISTS "Anyone can view units" ON units;
CREATE POLICY "Anyone can view units"
  ON units FOR SELECT
  TO authenticated
  USING (true);

-- Anyone can update viewers and lock fields (for reservations/heartbeats)
DROP POLICY IF EXISTS "Users can update viewer and lock fields" ON units;
CREATE POLICY "Users can update viewer and lock fields"
  ON units FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Only admins can insert units
DROP POLICY IF EXISTS "Admins can insert units" ON units;
CREATE POLICY "Admins can insert units"
  ON units FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Only admins can delete units
DROP POLICY IF EXISTS "Admins can delete units" ON units;
CREATE POLICY "Admins can delete units"
  ON units FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );


-- =====================
-- 3. ATOMIC LOCK FUNCTION
-- =====================
-- Prevents race conditions: only acquires lock if not already locked

CREATE OR REPLACE FUNCTION public.try_acquire_lock(
  p_unit_id TEXT,
  p_user_id TEXT,
  p_lock_expires_at BIGINT
)
RETURNS BOOLEAN AS $$
DECLARE
  rows_updated INTEGER;
  server_lock_expires_at BIGINT;
BEGIN
  -- Calculate expiration time using server time to avoid clock skew between devices
  -- Lock duration is 10 minutes (600000 milliseconds)
  server_lock_expires_at := (EXTRACT(EPOCH FROM now()) * 1000)::BIGINT + (10 * 60 * 1000);
  
  UPDATE units
  SET lock_expires_at = server_lock_expires_at,
      locked_by = p_user_id
  WHERE id = p_unit_id
    AND (lock_expires_at IS NULL OR lock_expires_at <= (EXTRACT(EPOCH FROM now()) * 1000)::BIGINT);

  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RETURN rows_updated > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Return current server time in milliseconds (for client clock sync so timer shows 10:00)
CREATE OR REPLACE FUNCTION public.get_server_time_ms()
RETURNS BIGINT AS $$
  SELECT (EXTRACT(EPOCH FROM now()) * 1000)::BIGINT;
$$ LANGUAGE sql SECURITY DEFINER;


-- =====================
-- 4. PENDING RESERVATIONS (maps unit+contact to user for payment webhook)
-- =====================
CREATE TABLE IF NOT EXISTS pending_reservations (
  unit_id         TEXT NOT NULL,
  zoho_contact_id TEXT NOT NULL,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (unit_id, zoho_contact_id)
);

-- Service role / edge functions use service key; no RLS needed for server-side only table
ALTER TABLE pending_reservations ENABLE ROW LEVEL SECURITY;

-- No policies: only service role (submit-reservation, payment-webhook) accesses this table


-- =====================
-- 5. MIGRATION: Drop old wishlists table (wishlist now lives in profiles.wishlist_unit_ids)
-- =====================
DROP TABLE IF EXISTS wishlists CASCADE;


-- =====================
-- 6. ENABLE REALTIME
-- =====================
-- Note: These commands may fail if tables are already in the publication, which is fine

DO $$
BEGIN
  -- Add tables to realtime publication if not already added
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'units'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE units;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
  END IF;
  
END $$;
