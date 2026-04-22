/**
 * Cron-only: prune stale viewer entries from units.viewers.
 * Call from Vercel Cron (or any scheduler) every 5 min with CRON_SECRET.
 * Example: GET /api/cron/prune-viewers with header "Authorization: Bearer <CRON_SECRET>"
 */
import { CONFIG } from '~/config'
import { createServiceRoleSupabase } from '~/server/utils/serviceSupabase'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const cronSecret = (config.cronSecret as string)?.trim()
  const authHeader = getHeader(event, 'authorization')
  const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!cronSecret || bearer !== cronSecret) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const supabase = createServiceRoleSupabase()

  const { data: units, error: fetchError } = await supabase
    .from('units')
    .select('id, viewers')

  if (fetchError || !units?.length) {
    return { ok: true, pruned: 0 }
  }

  const now = Date.now()
  let updated = 0

  for (const row of units) {
    const raw = row.viewers
    if (!raw || typeof raw !== 'object') continue

    const pruned: Record<string, number> = {}
    for (const [sid, ts] of Object.entries(raw as Record<string, unknown>)) {
      const t = typeof ts === 'number' ? ts : Number(ts)
      if (!Number.isNaN(t) && now - t <= CONFIG.PRESENCE_TTL_MS) {
        pruned[sid] = t
      }
    }

    if (Object.keys(pruned).length !== Object.keys(raw as object).length) {
      const { error } = await supabase
        .from('units')
        .update({ viewers: pruned })
        .eq('id', row.id)
      if (!error) updated += 1
    }
  }

  return { ok: true, pruned: updated }
})
