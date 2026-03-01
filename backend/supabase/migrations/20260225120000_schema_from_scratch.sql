-- =============================================================================
-- Portal schema from scratch (single migration for new Supabase project)
-- Run this only on an empty project. Tables: profiles, units, wishlists, pending_reservations.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. PROFILES (1:1 with auth.users)
-- -----------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  phone TEXT,
  reserved_unit_ids UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'Extended user profile; id matches auth.users. Role and phone for portal; reserved_unit_ids updated by payment-webhook.';

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Service role can insert/update (e.g. payment-webhook appends to reserved_unit_ids)
-- No INSERT policy for anon/authenticated: profile is created by trigger on signup.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 2. UNITS (property units; realtime)
-- -----------------------------------------------------------------------------
CREATE TABLE public.units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_number TEXT NOT NULL,
  bedrooms INT NOT NULL,
  bathrooms INT NOT NULL,
  parking INT NOT NULL,
  size_sqm NUMERIC NOT NULL,
  price NUMERIC NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Available', 'Reserved', 'Sold')),
  unit_type TEXT NOT NULL,
  image_url TEXT,
  viewers JSONB NOT NULL DEFAULT '{}',
  lock_expires_at TIMESTAMPTZ,
  locked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.units IS 'Property units for listing; lock fields for reservation flow; status updated by payment-webhook.';
COMMENT ON COLUMN public.units.viewers IS 'E.g. { "grid": 2 } for viewer counts by context.';
COMMENT ON COLUMN public.units.lock_expires_at IS 'When the current reservation lock expires; null if not locked.';
COMMENT ON COLUMN public.units.locked_by IS 'User id holding the reservation lock.';

CREATE INDEX units_unit_number_idx ON public.units (unit_number);
CREATE INDEX units_status_idx ON public.units (status);
CREATE INDEX units_lock_expires_at_idx ON public.units (lock_expires_at) WHERE lock_expires_at IS NOT NULL;

ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read units"
  ON public.units FOR SELECT
  TO anon, authenticated
  USING (true);

-- INSERT/UPDATE/DELETE: no policy for anon/authenticated → only service role (and triggers) can write.

ALTER PUBLICATION supabase_realtime ADD TABLE public.units;

-- -----------------------------------------------------------------------------
-- 3. WISHLISTS (user ↔ unit)
-- -----------------------------------------------------------------------------
CREATE TABLE public.wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, unit_id)
);

COMMENT ON TABLE public.wishlists IS 'Saved/favorited units per user.';

CREATE INDEX wishlists_user_id_idx ON public.wishlists (user_id);
CREATE INDEX wishlists_unit_id_idx ON public.wishlists (unit_id);

ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wishlist"
  ON public.wishlists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wishlist"
  ON public.wishlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own wishlist"
  ON public.wishlists FOR DELETE
  USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 4. PENDING_RESERVATIONS (Zoho + PayFast flow)
-- -----------------------------------------------------------------------------
CREATE TABLE public.pending_reservations (
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  zoho_contact_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  zoho_reservation_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (unit_id, zoho_contact_id)
);

COMMENT ON TABLE public.pending_reservations IS 'Links unit + Zoho contact + user until payment completes. submit-reservation upserts and sets zoho_reservation_id; payment-webhook reads then deletes.';

CREATE INDEX pending_reservations_user_id_idx ON public.pending_reservations (user_id);

ALTER TABLE public.pending_reservations ENABLE ROW LEVEL SECURITY;

-- No policies: only edge functions (service role) read/write this table.

-- -----------------------------------------------------------------------------
-- Optional: updated_at trigger for profiles (and units if you want)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER units_updated_at
  BEFORE UPDATE ON public.units
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
