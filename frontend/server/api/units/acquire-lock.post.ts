import { createClient } from '@supabase/supabase-js'

const LOCK_DURATION_MS = 10 * 60 * 1000 // 10 minutes

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
  if (!unitId) {
    throw createError({ statusCode: 400, message: 'unitId is required' })
  }

  const config = useRuntimeConfig()
  const supabaseUrl = (config.public.supabaseUrl as string)?.trim()
  const serviceRoleKey = (config.supabaseServiceRoleKey as string)?.trim()
  if (!supabaseUrl || !serviceRoleKey) {
    throw createError({ statusCode: 500, message: 'Server configuration error' })
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const lockExpiresAt = new Date(Date.now() + LOCK_DURATION_MS).toISOString()

  // Run auth and unit fetch in parallel to reduce latency (one fewer round-trip)
  const [{ data: { user }, error: authError }, { data: unit, error: fetchError }] = await Promise.all([
    supabase.auth.getUser(token),
    supabase.from('units').select('id, lock_expires_at, locked_by').eq('id', unitId).single(),
  ])

  if (authError || !user) {
    throw createError({ statusCode: 401, message: 'Invalid or expired session' })
  }
  if (fetchError || !unit) {
    throw createError({ statusCode: 404, message: 'Unit not found' })
  }

  const now = new Date().toISOString()
  const isLockedByOther = unit.locked_by != null && unit.locked_by !== user.id && unit.lock_expires_at != null && unit.lock_expires_at > now
  if (isLockedByOther) {
    throw createError({ statusCode: 409, message: 'Unit is currently reserved by someone else. Try again shortly.' })
  }

  const { error: setError } = await supabase
    .from('units')
    .update({
      lock_expires_at: lockExpiresAt,
      locked_by: user.id,
    })
    .eq('id', unitId)

  if (setError) {
    console.error('[acquire-lock]', setError)
    throw createError({ statusCode: 500, message: 'Failed to reserve unit' })
  }

  return { ok: true, lockExpiresAt }
})
