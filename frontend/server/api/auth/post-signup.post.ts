import { createServiceRoleSupabase } from '~/server/utils/serviceSupabase'

type Body = {
  userId?: string
  email?: string
  firstName?: string
  lastName?: string
  phone?: string
  idPassport?: string
  reasonForBuying?: string
}

export default defineEventHandler(async (event) => {
  const body = (await readBody(event).catch(() => null)) as Body | null
  const userId = String(body?.userId ?? '').trim()
  const email = String(body?.email ?? '').trim().toLowerCase()
  const firstName = String(body?.firstName ?? '').trim()
  const lastName = String(body?.lastName ?? '').trim()
  const phone = String(body?.phone ?? '').trim()
  const idPassport = String(body?.idPassport ?? '').trim()
  const reasonForBuying = String(body?.reasonForBuying ?? '').trim()

  if (!userId || !email || !firstName || !lastName) {
    throw createError({ statusCode: 400, message: 'Missing required signup fields' })
  }

  const supabase = createServiceRoleSupabase()

  const { data: userRes, error: userErr } = await supabase.auth.admin.getUserById(userId)
  if (userErr || !userRes.user) {
    throw createError({ statusCode: 404, message: 'User not found' })
  }

  const authEmail = String(userRes.user.email ?? '').trim().toLowerCase()
  if (!authEmail || authEmail !== email) {
    throw createError({ statusCode: 400, message: 'User/email mismatch' })
  }

  const createdMs = userRes.user.created_at ? new Date(userRes.user.created_at).getTime() : NaN
  if (Number.isFinite(createdMs) && Date.now() - createdMs > 30 * 60 * 1000) {
    throw createError({ statusCode: 403, message: 'Post-signup window expired' })
  }

  const updates: Record<string, string> = {
    first_name: firstName,
    last_name: lastName,
  }
  if (phone) updates.phone = phone
  if (idPassport) updates.id_passport_number = idPassport
  if (reasonForBuying) updates.reason_for_buying = reasonForBuying

  const { error: profileErr } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)

  if (profileErr) {
    console.error('post-signup: profile update failed', profileErr.message)
  }

  const config = useRuntimeConfig()
  const supabaseUrl = String(config.public.supabaseUrl ?? '').trim()
  const serviceRoleKey = String(config.supabaseServiceRoleKey ?? '').trim()

  if (!supabaseUrl || !serviceRoleKey) {
    return { ok: true, profileUpdated: !profileErr, leadSynced: false }
  }

  try {
    await $fetch(`${supabaseUrl.replace(/\/$/, '')}/functions/v1/create-lead`, {
      method: 'POST',
      body: {
        firstName,
        lastName,
        email,
        phone,
        idPassport,
        reasonForBuying,
      },
      headers: {
        'Content-Type': 'application/json',
        apikey: serviceRoleKey,
      },
    })
    return { ok: true, profileUpdated: !profileErr, leadSynced: true }
  } catch (err: unknown) {
    console.error('post-signup: create-lead call failed', err)
    return { ok: true, profileUpdated: !profileErr, leadSynced: false }
  }
})
