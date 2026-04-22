import { describe, expect, it } from 'vitest'
import { CONFIG } from '../../frontend/config'
import { mapSupabaseUnitRow, type SupabaseUnitRow } from '../../frontend/utils/mapUnitRow'

const baseRow: SupabaseUnitRow = {
  id: 'u1',
  unit_number: '101',
  bedrooms: 2,
  bathrooms: 1,
  parking: 1,
  size_sqm: 55,
  price: 1_000_000,
  status: 'Available',
  unit_type: 'A',
  floor: '3',
  direction: 'N',
  image_key_1: 'a.jpg',
  image_key_2: null,
  image_key_3: null,
  floorplan_key: 'fp.pdf',
  viewers: {},
  locked_by: undefined,
}

describe('mapSupabaseUnitRow', () => {
  const getPublicUrl = (path: string | null | undefined) => {
    if (path == null) return null
    if (/^https?:\/\//i.test(path)) return path
    return `https://cdn/${path}`
  }

  it('maps core fields and storage URLs', () => {
    const u = mapSupabaseUnitRow(baseRow, getPublicUrl)
    expect(u.id).toBe('u1')
    expect(u.unitNumber).toBe('101')
    expect(u.imageUrl).toBe('https://cdn/a.jpg')
    expect(u.imageUrl2).toBeNull()
    expect(u.floorplanUrl).toBe('https://cdn/fp.pdf')
  })

  it('falls back to legacy image_url when image_key_1 is missing', () => {
    const row: SupabaseUnitRow = {
      ...baseRow,
      image_key_1: null,
      image_url: 'https://example.com/unit.webp',
    }
    const u = mapSupabaseUnitRow(row, getPublicUrl)
    expect(u.imageUrl).toBe('https://example.com/unit.webp')
  })

  it('parses lock_expires_at from Date and ISO string', () => {
    const d = new Date('2020-01-02T00:00:00.000Z')
    expect(mapSupabaseUnitRow({ ...baseRow, lock_expires_at: d }, getPublicUrl).lockExpiresAt).toBe(d.getTime())
    expect(
      mapSupabaseUnitRow({ ...baseRow, lock_expires_at: '2021-06-15T12:00:00.000Z' }, getPublicUrl).lockExpiresAt,
    ).toBe(new Date('2021-06-15T12:00:00.000Z').getTime())
  })

  it('drops viewers older than presence TTL', () => {
    const now = 1_000_000
    const fresh = now - 1000
    const stale = now - CONFIG.PRESENCE_TTL_MS - 1
    const row: SupabaseUnitRow = {
      ...baseRow,
      viewers: { a: fresh, b: stale, c: String(fresh) },
    }
    const u = mapSupabaseUnitRow(row, getPublicUrl, { nowMs: now })
    expect(Object.keys(u.viewers ?? {})).toEqual(['a', 'c'])
    expect(u.viewers?.a).toBe(fresh)
    expect(u.viewers?.c).toBe(fresh)
  })
})
