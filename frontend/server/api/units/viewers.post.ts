/**
 * Returns unit id + viewers for the "Currently viewing" poll.
 * POST is used so browsers/proxies never cache the response (desktop was getting stale GET cache).
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
    console.error('[viewers.post]', error.message)
    setResponseStatus(event, 500)
    return { data: [] }
  }
  return { data: data ?? [] }
})
