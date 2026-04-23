/**
 * Cron-only: trigger Supabase zoho-sync-worker for reservation + profile queues.
 * Call from Vercel Cron (or any scheduler) with CRON_SECRET.
 * Example: GET /api/cron/zoho-sync with header "Authorization: Bearer <CRON_SECRET>"
 */
import { errorMessageFromUnknown, httpStatusFromUnknown } from '~/utils/errorFromUnknown'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const cronSecret = (config.cronSecret as string)?.trim()
  const authHeader = getHeader(event, 'authorization')
  const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!cronSecret || bearer !== cronSecret) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const supabaseUrl = String(config.public.supabaseUrl ?? '').trim().replace(/\/$/, '')
  const serviceRoleKey = String(config.supabaseServiceRoleKey ?? '').trim()
  const workerCronSecret = String(config.supabaseWorkerCronSecret ?? '').trim() || cronSecret

  if (!supabaseUrl || !serviceRoleKey || !workerCronSecret) {
    throw createError({ statusCode: 500, message: 'Server configuration error' })
  }

  try {
    const workerResponse = await $fetch<{
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

    return {
      ok: true,
      worker: workerResponse,
    }
  } catch (err: unknown) {
    const message = errorMessageFromUnknown(err, 'Failed to trigger zoho sync worker')
    const statusCode = httpStatusFromUnknown(err) ?? 500
    throw createError({ statusCode, message })
  }
})
