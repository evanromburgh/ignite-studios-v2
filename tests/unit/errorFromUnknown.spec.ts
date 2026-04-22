import { describe, expect, it } from 'vitest'
import { errorMessageFromUnknown, httpStatusFromUnknown } from '~/utils/errorFromUnknown'

describe('httpStatusFromUnknown', () => {
  it('reads statusCode', () => {
    expect(httpStatusFromUnknown({ statusCode: 401 })).toBe(401)
  })
  it('reads status', () => {
    expect(httpStatusFromUnknown({ status: 404 })).toBe(404)
  })
  it('returns undefined for non-objects', () => {
    expect(httpStatusFromUnknown(null)).toBeUndefined()
  })
})

describe('errorMessageFromUnknown', () => {
  it('prefers data.error string', () => {
    expect(
      errorMessageFromUnknown({ data: { error: 'nope' } }, 'fallback'),
    ).toBe('nope')
  })
  it('uses data.message when no error string', () => {
    expect(
      errorMessageFromUnknown({ data: { message: 'hello' } }, 'fallback'),
    ).toBe('hello')
  })
  it('uses top-level message', () => {
    expect(errorMessageFromUnknown({ message: 'top' }, 'fallback')).toBe('top')
  })
  it('uses Error.message', () => {
    expect(errorMessageFromUnknown(new Error('e'), 'fallback')).toBe('e')
  })
  it('falls back', () => {
    expect(errorMessageFromUnknown({}, 'fb')).toBe('fb')
  })
})
