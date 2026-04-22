/**
 * Normalize thrown values from $fetch/ofetch, createError, and Supabase-style errors for display/logging.
 */
export function httpStatusFromUnknown(e: unknown): number | undefined {
  if (!e || typeof e !== 'object') return undefined
  const o = e as Record<string, unknown>
  const sc = o.statusCode ?? o.status
  return typeof sc === 'number' ? sc : undefined
}

export function errorMessageFromUnknown(e: unknown, fallback: string): string {
  if (e instanceof Error && e.message.trim()) return e.message

  if (e && typeof e === 'object') {
    const o = e as Record<string, unknown>
    const data = o.data
    if (data && typeof data === 'object') {
      const d = data as Record<string, unknown>
      const errField = d.error
      if (typeof errField === 'string' && errField.trim()) return errField
      const msg = d.message
      if (typeof msg === 'string' && msg.trim()) return msg
    }
    if (typeof o.message === 'string' && o.message.trim()) return o.message
    const nested = o.error
    if (nested && typeof nested === 'object' && 'message' in nested) {
      const m = (nested as Record<string, unknown>).message
      if (typeof m === 'string' && m.trim()) return m
    }
  }

  return fallback
}
