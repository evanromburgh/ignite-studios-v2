import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  console.log('[check-email] API called')
  try {
    const body = await readBody(event)
    const raw = typeof body?.email === 'string' ? body.email.trim() : ''
    const email = raw.toLowerCase()

    if (!email) {
      throw createError({ statusCode: 400, message: 'Email is required' })
    }

    const config = useRuntimeConfig()
    const supabaseUrl = (config.public.supabaseUrl as string)?.trim()
    const serviceRoleKey = (config.supabaseServiceRoleKey as string)?.trim()

    if (!serviceRoleKey || !supabaseUrl) {
      console.warn('check-email: missing SUPABASE_SERVICE_ROLE_KEY or NUXT_PUBLIC_SUPABASE_URL')
      return { exists: false }
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })

    // Use listUsers and find by email (getUserByEmail can be unreliable with some key types)
    const { data: { users }, error } = await supabase.auth.admin.listUsers({ perPage: 1000 })

    if (error) {
      console.error('check-email listUsers error:', error.message)
      return { exists: false }
    }

    const user = users?.find((u) => u.email?.toLowerCase() === email) ?? null
    const exists = !!user
    console.log('check-email:', email, '-> exists:', exists)
    return { exists }
  } catch (err: any) {
    console.error('check-email exception:', err?.message ?? err)
    return { exists: false }
  }
})
