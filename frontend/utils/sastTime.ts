/** South Africa Standard Time — Africa/Johannesburg (no DST, UTC+2). */

export const SAST_TIMEZONE = 'Africa/Johannesburg' as const

const MS_PER_HOUR = 3_600_000

export type CountdownParts = { days: number; hours: number; minutes: number; seconds: number }

/**
 * Remaining time from `nowMs` to `targetIso` (UTC instant). If target is in the past or
 * missing, returns zeros (clamped, no negative components).
 */
export function remainingCountdownParts(targetIso: string | null | undefined, nowMs: number): CountdownParts {
  if (!targetIso) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  }
  const targetMs = Date.parse(targetIso)
  if (!Number.isFinite(targetMs)) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  }
  const raw = targetMs - nowMs
  if (raw <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  }
  const totalSec = Math.floor(raw / 1000)
  const days = Math.floor(totalSec / 86_400)
  let rest = totalSec - days * 86_400
  const hours = Math.floor(rest / 3600)
  rest -= hours * 3600
  const minutes = Math.floor(rest / 60)
  const seconds = rest - minutes * 60
  return { days, hours, minutes, seconds }
}

/**
 * Interprets a local calendar date + time in SAST as an absolute UTC instant (ISO string).
 * `date` = YYYY-MM-DD, `time` = HH:mm (24h).
 */
export function sastLocalToUtcIso(date: string, time: string): string {
  const d = String(date).trim()
  const t = String(time).trim()
  const [y, m, day] = d.split('-').map((x) => Number(x))
  const [hh, mm] = t.split(':').map((x) => Number(x))
  if (![y, m, day, hh, mm].every((n) => Number.isFinite(n))) {
    throw new Error('Invalid SAST date or time')
  }
  const utcMs = Date.UTC(y, m - 1, day, hh, mm, 0, 0) - 2 * MS_PER_HOUR
  return new Date(utcMs).toISOString()
}

/** UTC instant → SAST `date` and `time` parts for form inputs. */
export function utcIsoToSastDateTimeParts(iso: string | null | undefined): { date: string; time: string } {
  if (!iso) return { date: '', time: '' }
  const ms = Date.parse(iso)
  if (!Number.isFinite(ms)) return { date: '', time: '' }
  const sast = new Date(ms + 2 * MS_PER_HOUR)
  const y = sast.getUTCFullYear()
  const m = String(sast.getUTCMonth() + 1).padStart(2, '0')
  const d = String(sast.getUTCDate()).padStart(2, '0')
  const hh = String(sast.getUTCHours()).padStart(2, '0')
  const min = String(sast.getUTCMinutes()).padStart(2, '0')
  return { date: `${y}-${m}-${d}`, time: `${hh}:${min}` }
}
