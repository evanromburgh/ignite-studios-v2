const PRESENCE_TTL_MS = 45_000

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const supabaseUrl = (config.public.supabaseUrl as string | undefined)?.trim()
  const serviceRoleKey = (config.supabaseServiceRoleKey as string | undefined)?.trim()

  if (!supabaseUrl || !serviceRoleKey) {
    throw createError({ statusCode: 500, message: 'Server configuration error' })
  }

  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

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
      if (!Number.isNaN(t) && now - t <= PRESENCE_TTL_MS) {
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
