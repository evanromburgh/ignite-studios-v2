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
  const nowIso = new Date().toISOString()

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)

  if (authError || !user) {
    throw createError({ statusCode: 401, message: 'Invalid or expired session' })
  }

  // Snapshot + guarded update:
  // read current lock state, then update only if row still matches snapshot.
  // This avoids brittle timestamp OR filters while remaining race-safe.
  const { data: existingUnit, error: existsError } = await supabase
    .from('units')
    .select('id, locked_by, lock_expires_at')
    .eq('id', unitId)
    .maybeSingle()

  if (existsError) {
    console.error('[acquire-lock:exists]', existsError)
    throw createError({ statusCode: 500, message: 'Failed to reserve unit' })
  }
  if (!existingUnit) {
    throw createError({ statusCode: 404, message: 'Unit not found' })
  }

  const lockedBy = (existingUnit as any).locked_by as string | null
  const lockExpiresRaw = (existingUnit as any).lock_expires_at as string | null
  const lockActive = Boolean(lockExpiresRaw && lockExpiresRaw > nowIso)
  const canAcquire = !lockActive || !lockedBy || lockedBy === user.id

  if (!canAcquire) {
    throw createError({ statusCode: 409, message: 'Unit is currently reserved by someone else. Try again shortly.' })
  }

  let guardedUpdate = supabase
    .from('units')
    .update({
      lock_expires_at: lockExpiresAt,
      locked_by: user.id,
    })
    .eq('id', unitId)

  if (lockedBy == null) guardedUpdate = guardedUpdate.is('locked_by', null)
  else guardedUpdate = guardedUpdate.eq('locked_by', lockedBy)

  if (lockExpiresRaw == null) guardedUpdate = guardedUpdate.is('lock_expires_at', null)
  else guardedUpdate = guardedUpdate.eq('lock_expires_at', lockExpiresRaw)

  const { data: updatedRows, error: setError } = await guardedUpdate.select('id')

  if (setError) {
    console.error('[acquire-lock:update]', setError)
    throw createError({ statusCode: 500, message: 'Failed to reserve unit' })
  }
  if (!updatedRows?.length) {
    // Snapshot mismatch means another request updated the row first.
    throw createError({ statusCode: 409, message: 'Unit is currently reserved by someone else. Try again shortly.' })
  }

  return { ok: true, lockExpiresAt }
})
