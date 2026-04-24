import { CONFIG } from '~/config'
import { getAppSettingsService, isPrelaunchMode, SALES_PRELAUNCH_ERROR } from '~/server/utils/appSettings'
import { requireAuthenticatedUnitRequest } from '~/server/utils/authenticatedUnitRequest'

type UnitLockSnapshot = {
  id: string
  status: string | null
  locked_by: string | null
  lock_expires_at: string | null
}

export default defineEventHandler(async (event) => {
  const { unitId, user, supabase } = await requireAuthenticatedUnitRequest(event)

  const settings = await getAppSettingsService()
  if (isPrelaunchMode(settings.sales_mode)) {
    throw createError({
      statusCode: 403,
      message: SALES_PRELAUNCH_ERROR.message,
      data: { code: SALES_PRELAUNCH_ERROR.code },
    })
  }

  const lockExpiresAt = new Date(Date.now() + CONFIG.LOCK_DURATION_MS).toISOString()
  const nowIso = new Date().toISOString()

  // Snapshot + guarded update:
  // read current lock state, then update only if row still matches snapshot.
  // This avoids brittle timestamp OR filters while remaining race-safe.
  const { data: existingUnit, error: existsError } = await supabase
    .from('units')
    .select('id, locked_by, lock_expires_at, status')
    .eq('id', unitId)
    .maybeSingle()

  if (existsError) {
    console.error('[acquire-lock:exists]', existsError)
    throw createError({ statusCode: 500, message: 'Failed to reserve unit' })
  }
  if (!existingUnit) {
    throw createError({ statusCode: 404, message: 'Unit not found' })
  }

  const row = existingUnit as UnitLockSnapshot
  const unitStatus = String(row.status ?? '').trim()
  if (unitStatus !== 'Available') {
    throw createError({ statusCode: 409, message: 'This unit is no longer available for reservation.' })
  }

  const lockedBy = row.locked_by
  const lockExpiresRaw = row.lock_expires_at
  const lockActive = Boolean(lockExpiresRaw && lockExpiresRaw > nowIso)
  const canAcquire = !lockActive || !lockedBy || lockedBy === user.id

  if (!canAcquire) {
    throw createError({ statusCode: 409, message: 'This unit is currently being reserved. Try again shortly.' })
  }

  let guardedUpdate = supabase
    .from('units')
    .update({
      lock_expires_at: lockExpiresAt,
      locked_by: user.id,
    })
    .eq('id', unitId)
    .eq('status', 'Available')

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
    throw createError({ statusCode: 409, message: 'This unit is currently being reserved. Try again shortly.' })
  }

  return { ok: true, lockExpiresAt }
})
