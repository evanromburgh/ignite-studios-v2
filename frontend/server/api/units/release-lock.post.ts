import { requireAuthenticatedUnitRequest } from '~/server/utils/authenticatedUnitRequest'

export default defineEventHandler(async (event) => {
  const { unitId, user, supabase } = await requireAuthenticatedUnitRequest(event)

  const { error: updateError } = await supabase
    .from('units')
    .update({ lock_expires_at: null, locked_by: null })
    .eq('id', unitId)
    .eq('locked_by', user.id)

  if (updateError) {
    console.error('[release-lock]', updateError)
    throw createError({ statusCode: 500, message: 'Failed to release reservation' })
  }

  return { ok: true }
})
