import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createError } from 'h3'

/** Service-role Supabase client (server-only). */
export function createServiceRoleSupabase(): SupabaseClient {
  const config = useRuntimeConfig()
  const supabaseUrl = (config.public.supabaseUrl as string)?.trim()
  const serviceRoleKey = (config.supabaseServiceRoleKey as string)?.trim()
  if (!supabaseUrl || !serviceRoleKey) {
    throw createError({ statusCode: 500, message: 'Server configuration error' })
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
