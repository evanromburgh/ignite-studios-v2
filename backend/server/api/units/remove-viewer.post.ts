export default defineEventHandler(async (event) => {
  if (event.method !== 'POST') {
    throw createError({ statusCode: 405, message: 'Method not allowed' })
  }

  const authHeader = getHeader(event, 'authorization')
  const token = authHeader?.replace(/^Bearer\s+/i, '')?.trim()
  if (!token) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const body = await readBody(event).catch(() => null)
  const unitId = typeof body?.unitId === 'string' ? body.unitId.trim() : ''
  const sessionId = typeof body?.sessionId === 'string' ? body.sessionId.trim() : ''

  if (!unitId || !sessionId) {
    throw createError({ statusCode: 400, message: 'unitId and sessionId are required' })
  }

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

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token)

  if (authError || !user) {
    throw createError({ statusCode: 401, message: 'Invalid or expired session' })
  }

  const { data, error } = await supabase
    .from('units')
    .select('viewers')
    .eq('id', unitId)
    .single()

  if (error) {
    console.error('[remove-viewer] fetch viewers error', error)
    throw createError({ statusCode: 500, message: 'Failed to update viewers' })
  }

  const viewers =
    data && typeof data.viewers === 'object' && data.viewers !== null
      ? (data.viewers as Record<string, number>)
      : {}

  const now = Date.now()
  const PRESENCE_TTL_MS = 45_000
  const pruned: Record<string, number> = {}

  for (const [sid, ts] of Object.entries(viewers)) {
    if (sid === sessionId) continue
    const t = typeof ts === 'number' ? ts : Number(ts)
    if (!Number.isNaN(t) && now - t <= PRESENCE_TTL_MS) {
      pruned[sid] = t
    }
  }

  const { error: updateError } = await supabase
    .from('units')
    .update({ viewers: pruned })
    .eq('id', unitId)

  if (updateError) {
    console.error('[remove-viewer] update viewers error', updateError)
    throw createError({ statusCode: 500, message: 'Failed to update viewers' })
  }

  return { ok: true }
})

