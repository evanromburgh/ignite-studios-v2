import type { Unit } from '~/types'
import { CONFIG } from '~/config'

/** Fields read from Supabase `units` rows (extra columns allowed). */
export interface SupabaseUnitRow {
  id: string
  unit_number: string
  bedrooms: number
  bathrooms: number
  parking: number
  size_sqm: number
  price: number
  status: Unit['status']
  unit_type: string
  floor?: string | null
  direction?: string | null
  /** Storage object key or absolute URL (`units` bucket). */
  image_key_1?: string | null
  /** Legacy absolute image URL column retained for backward compatibility. */
  image_url?: string | null
  image_key_2?: string | null
  image_key_3?: string | null
  floorplan_key?: string | null
  viewers?: Record<string, number | string> | null
  lock_expires_at?: string | Date | null
  locked_by?: string | null
}

function parseLockExpiresAt(raw: unknown): number | undefined {
  if (raw == null) return undefined
  const ms = raw instanceof Date ? raw.getTime() : new Date(raw as string | number).getTime()
  return Number.isNaN(ms) ? undefined : ms
}

function filterViewersByPresenceTtl(
  rawViewers: Record<string, number | string>,
  nowMs: number,
  ttlMs: number,
): Record<string, number> {
  const viewers: Record<string, number> = {}
  for (const [key, value] of Object.entries(rawViewers)) {
    const t = typeof value === 'number' ? value : Number(value)
    if (!Number.isNaN(t) && nowMs - t <= ttlMs) {
      viewers[key] = t
    }
  }
  return viewers
}

/**
 * Maps a Supabase `units` row to `Unit`, resolving storage URLs via `getPublicUrl`.
 * Viewer timestamps are filtered with the same TTL as the catalog (`CONFIG.PRESENCE_TTL_MS`).
 */
export function mapSupabaseUnitRow(
  row: SupabaseUnitRow,
  getPublicUrl: (path: string | null | undefined) => string | null,
  options?: { nowMs?: number },
): Unit {
  const now = options?.nowMs ?? Date.now()
  const rawViewers = row.viewers ?? {}
  const viewers = filterViewersByPresenceTtl(rawViewers, now, CONFIG.PRESENCE_TTL_MS)

  const lockExpiresAt = parseLockExpiresAt(row.lock_expires_at)

  return {
    id: row.id,
    unitNumber: row.unit_number,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    parking: row.parking,
    sizeSqm: row.size_sqm,
    price: row.price,
    status: row.status,
    unitType: row.unit_type,
    floor: row.floor ?? null,
    direction: row.direction ?? null,
    imageUrl: (getPublicUrl(row.image_key_1 ?? row.image_url) ?? '') as string,
    imageUrl2: getPublicUrl(row.image_key_2),
    imageUrl3: getPublicUrl(row.image_key_3),
    floorplanUrl: getPublicUrl(row.floorplan_key),
    viewers,
    lockExpiresAt,
    lockedBy: row.locked_by ?? undefined,
  }
}
