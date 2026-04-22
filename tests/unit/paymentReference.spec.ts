import { describe, expect, it } from 'vitest'

/** Mirrors payment-success / release-lock / cancel-reservation parsing */
function parsePaymentReferenceUnitId(ref: string): string | null {
  let decoded = ref
  try {
    decoded = decodeURIComponent(ref)
  } catch {
    // use as-is
  }
  const parts = decoded.includes('|') ? decoded.split('|') : decoded.split('.')
  const unitId = parts[0]?.trim()
  if (!unitId || parts.length !== 3) return null
  return unitId
}

describe('payment reference → unitId', () => {
  const uuid = '550e8400-e29b-41d4-a716-446655440000'

  it('parses dot form (Paystack / submit-reservation)', () => {
    const ref = `${uuid}.zoho-contact-1.1710000000000`
    expect(parsePaymentReferenceUnitId(ref)).toBe(uuid)
  })

  it('parses legacy pipe form', () => {
    const ref = `${uuid}|zoho-contact-1|1710000000000`
    expect(parsePaymentReferenceUnitId(ref)).toBe(uuid)
  })

  it('returns null for wrong segment count', () => {
    expect(parsePaymentReferenceUnitId(`${uuid}.onlytwo`)).toBeNull()
  })
})
