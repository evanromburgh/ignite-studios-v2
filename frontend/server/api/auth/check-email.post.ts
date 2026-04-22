import { createServiceRoleSupabase } from '~/server/utils/serviceSupabase'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<unknown>(event)
    const raw =
      body && typeof body === 'object' && typeof (body as Record<string, unknown>).email === 'string'
        ? ((body as Record<string, unknown>).email as string).trim()
        : ''
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

    const supabase = createServiceRoleSupabase()

    // Use listUsers and find by email (getUserByEmail can be unreliable with some key types)
    const { data: { users }, error } = await supabase.auth.admin.listUsers({ perPage: 1000 })

    if (error) {
      console.error('check-email listUsers error:', error.message)
      return { exists: false }
    }

    const user = users?.find((u) => u.email?.toLowerCase() === email) ?? null
    const exists = !!user
    return { exists }
  } catch (err: unknown) {
    console.error('check-email exception:', err instanceof Error ? err.message : err)
    return { exists: false }
  }
})
