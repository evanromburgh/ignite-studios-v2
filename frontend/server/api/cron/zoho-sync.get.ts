/**
 * Cron-only: trigger Supabase zoho-sync-worker for reservation + profile queues.
 * Call from Vercel Cron (or any scheduler) with CRON_SECRET.
 * Example: GET /api/cron/zoho-sync with header "Authorization: Bearer <CRON_SECRET>"
 */
import { errorMessageFromUnknown, httpStatusFromUnknown } from '~/utils/errorFromUnknown'
import { triggerZohoSyncWorker } from '~/server/utils/zohoWorkerTrigger'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const cronSecret = (config.cronSecret as string)?.trim()
  const authHeader = getHeader(event, 'authorization')
  const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!cronSecret || bearer !== cronSecret) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  try {
    const workerResponse = await triggerZohoSyncWorker(config)

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
