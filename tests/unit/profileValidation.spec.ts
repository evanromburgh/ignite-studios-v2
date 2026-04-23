import { describe, expect, it } from 'vitest'
import { parseProfileUpdateInput } from '~/utils/profileUpdate'

describe('parseProfileUpdateInput', () => {
  it('accepts required profile fields with allowed reason', () => {
    const parsed = parseProfileUpdateInput({
      firstName: 'Evan',
      lastName: 'Romburgh',
      phone: '074 558 8877',
      idPassport: 'A1234567',
      reasonForBuying: 'Purchasing to Live',
    })

    expect(parsed).toEqual({
      firstName: 'Evan',
      lastName: 'Romburgh',
      phone: '+27745588877',
      idPassport: 'A1234567',
      reasonForBuying: 'Purchasing to Live',
    })
  })

  it('rejects payload when reason is outside allowed values', () => {
    const parsed = parseProfileUpdateInput({
      firstName: 'Evan',
      lastName: 'Romburgh',
      phone: '0745588877',
      idPassport: 'A1234567',
      reasonForBuying: 'Other',
    })

    expect(parsed).toBeNull()
  })

  it('rejects payload when a required field is missing', () => {
    const parsed = parseProfileUpdateInput({
      firstName: 'Evan',
      lastName: '',
      phone: '0745588877',
      idPassport: 'A1234567',
      reasonForBuying: 'Purchasing as an investment',
    })

    expect(parsed).toBeNull()
  })
})
