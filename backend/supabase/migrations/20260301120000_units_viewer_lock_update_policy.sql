-- Allow authenticated users to update units (viewers + lock fields for reservation flow).
-- Matches old app: "Users can update viewer and lock fields" so heartbeats and lock acquire/release work from the client.
DROP POLICY IF EXISTS "Users can update viewer and lock fields" ON public.units;
CREATE POLICY "Users can update viewer and lock fields"
  ON public.units FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
