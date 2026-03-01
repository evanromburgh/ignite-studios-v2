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

  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    throw createError({ statusCode: 401, message: 'Invalid or expired session' })
  }

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
