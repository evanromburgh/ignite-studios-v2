import { describe, expect, it } from 'vitest'
import { parseReservationReference } from '../../backend/supabase/functions/_shared/reservationReference'

describe('parseReservationReference', () => {
  it('accepts valid resv_ references', () => {
    expect(parseReservationReference('resv_123')).toEqual({ reservationId: '123' })
    expect(parseReservationReference('  resv_abc-xyz  ')).toEqual({ reservationId: 'abc-xyz' })
  })

  it('rejects invalid references', () => {
    expect(parseReservationReference('')).toBeNull()
    expect(parseReservationReference('abc_123')).toBeNull()
    expect(parseReservationReference('resv_   ')).toBeNull()
  })
})
