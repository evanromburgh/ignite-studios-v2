import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'
import { getUnitsBucketPublicUrl, normalizeUnitsBucketObjectKey } from '../../frontend/utils/unitsStorage'

describe('unitsStorage', () => {
  describe('normalizeUnitsBucketObjectKey', () => {
    it('trims and strips newlines', () => {
      expect(normalizeUnitsBucketObjectKey('  foo\nbar  ')).toBe('foobar')
    })

    it('returns absolute URLs unchanged', () => {
      expect(normalizeUnitsBucketObjectKey('https://cdn.example/x.png')).toBe('https://cdn.example/x.png')
    })

    it('strips leading slashes for bucket keys', () => {
      expect(normalizeUnitsBucketObjectKey('/a/b')).toBe('a/b')
    })

    it('returns null for empty input', () => {
      expect(normalizeUnitsBucketObjectKey(null)).toBeNull()
      expect(normalizeUnitsBucketObjectKey('')).toBeNull()
    })
  })

  describe('getUnitsBucketPublicUrl', () => {
    it('returns null when key normalizes to null', () => {
      const supabase = { storage: { from: vi.fn() } } as unknown as SupabaseClient
      expect(getUnitsBucketPublicUrl(supabase, null)).toBeNull()
      expect(supabase.storage.from).not.toHaveBeenCalled()
    })

    it('returns absolute URL without calling storage', () => {
      const supabase = { storage: { from: vi.fn() } } as unknown as SupabaseClient
      const url = 'https://cdn.example/k.png'
      expect(getUnitsBucketPublicUrl(supabase, url)).toBe(url)
      expect(supabase.storage.from).not.toHaveBeenCalled()
    })

    it('uses supabase storage for relative keys', () => {
      const getPublicUrl = vi.fn((key: string) => ({ data: { publicUrl: `https://proj.supabase.co/storage/v1/object/public/units/${key}` } }))
      const supabase = {
        storage: {
          from: vi.fn(() => ({ getPublicUrl })),
        },
      } as unknown as SupabaseClient

      expect(getUnitsBucketPublicUrl(supabase, 'folder/img.webp')).toBe(
        'https://proj.supabase.co/storage/v1/object/public/units/folder/img.webp',
      )
      expect(supabase.storage.from).toHaveBeenCalledWith('units')
      expect(getPublicUrl).toHaveBeenCalledWith('folder/img.webp')
    })
  })
})
