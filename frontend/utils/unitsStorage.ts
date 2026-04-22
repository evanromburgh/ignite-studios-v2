import type { SupabaseClient } from '@supabase/supabase-js'

const DEFAULT_BUCKET = 'units'

/**
 * Path inside the `units` bucket. Strips stray newlines and leading slashes only —
 * do not strip `units/`; that can be a real folder inside the bucket.
 */
export function normalizeUnitsBucketObjectKey(path: string | null | undefined): string | null {
  if (path == null) return null
  let p = String(path).trim()
  if (!p) return null
  p = p.replace(/\r\n?/g, '').replace(/\n/g, '').trim()
  if (!p) return null
  if (/^https?:\/\//i.test(p)) return p
  p = p.replace(/^\/+/, '')
  return p || null
}

/** Public URL for an object key in the units storage bucket (or absolute http(s) `path`). */
export function getUnitsBucketPublicUrl(
  supabase: SupabaseClient,
  path: string | null | undefined,
  bucket: string = DEFAULT_BUCKET,
): string | null {
  const key = normalizeUnitsBucketObjectKey(path)
  if (!key) return null
  if (/^https?:\/\//i.test(key)) return key
  const { data } = supabase.storage.from(bucket).getPublicUrl(key)
  return data.publicUrl ?? null
}
