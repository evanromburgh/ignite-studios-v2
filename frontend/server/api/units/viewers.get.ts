/**
 * Returns unit id + viewers for the "Currently viewing" poll.
 * Uses server-side Supabase so the response can be sent with Cache-Control: no-store,
 * avoiding cached/stale responses that break the count on Vercel (browser/CDN cache).
 */
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const supabaseUrl = (config.public.supabaseUrl as string)?.trim()
  const serviceRoleKey = (config.supabaseServiceRoleKey as string)?.trim()
  if (!supabaseUrl || !serviceRoleKey) {
    setResponseStatus(event, 500)
    return { data: [] }
  }
  setHeader(event, 'Cache-Control', 'no-store, no-cache, must-revalidate')
  setHeader(event, 'Pragma', 'no-cache')

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data, error } = await supabase.from('units').select('id, viewers').order('unit_number', { ascending: true })
  if (error) {
    console.error('[viewers.get]', error.message)
    setResponseStatus(event, 500)
    return { data: [] }
  }
  return { data: data ?? [] }
})
