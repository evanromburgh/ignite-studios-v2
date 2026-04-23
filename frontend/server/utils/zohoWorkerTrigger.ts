export async function triggerZohoSyncWorker(config: ReturnType<typeof useRuntimeConfig>) {
  const supabaseUrl = String(config.public.supabaseUrl ?? '').trim().replace(/\/$/, '')
  const serviceRoleKey = String(config.supabaseServiceRoleKey ?? '').trim()
  const cronSecret = String(config.cronSecret ?? '').trim()
  const workerCronSecret = String(config.supabaseWorkerCronSecret ?? '').trim() || cronSecret

  if (!supabaseUrl || !serviceRoleKey || !workerCronSecret) {
    throw createError({ statusCode: 500, message: 'Server configuration error' })
  }

  return $fetch<{
    ok: boolean
    reservation: { processed: number; succeeded: number; retried: number; failed: number }
    profile: { processed: number; succeeded: number; retried: number; failed: number }
  }>(`${supabaseUrl}/functions/v1/zoho-sync-worker`, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      'x-cron-secret': workerCronSecret,
    },
    body: {},
  })
}
