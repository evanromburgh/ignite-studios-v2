import type { H3Event } from 'h3'
import { getHeader } from 'h3'

/** Bearer token from `Authorization` header, or null if missing. */
export function readBearerToken(event: H3Event): string | null {
  const raw = getHeader(event, 'authorization')
  const token = raw?.replace(/^Bearer\s+/i, '')?.trim()
  return token || null
}
