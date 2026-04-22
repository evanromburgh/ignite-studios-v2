import { describe, expect, it } from 'vitest'
import { extractBearerToken } from '../../backend/supabase/functions/_shared/auth'

describe('extractBearerToken', () => {
  it('extracts token from a valid Bearer header', () => {
    expect(extractBearerToken('Bearer abc.def.ghi')).toBe('abc.def.ghi')
  })

  it('handles extra spaces and case-insensitive prefix', () => {
    expect(extractBearerToken('  bEaReR    token-123   '.trim())).toBe('token-123')
  })

  it('returns null for missing or invalid headers', () => {
    expect(extractBearerToken(null)).toBeNull()
    expect(extractBearerToken('')).toBeNull()
    expect(extractBearerToken('Basic xyz')).toBeNull()
    expect(extractBearerToken('Bearer   ')).toBeNull()
  })
})
