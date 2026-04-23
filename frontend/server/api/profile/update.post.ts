import { requireAuthenticatedRequest } from '~/server/utils/authenticatedRequest'
import { enqueueProfileSyncJob } from '~/server/utils/profileSyncJob'
import { triggerZohoSyncWorker } from '~/server/utils/zohoWorkerTrigger'
import { parseProfileUpdateInput } from '~/utils/profileUpdate'
import { createError, defineEventHandler, readBody, type H3Event } from 'h3'

type Dependencies = {
  requireAuthenticatedRequest: typeof requireAuthenticatedRequest
  parseProfileUpdateInput: typeof parseProfileUpdateInput
  enqueueProfileSyncJob: typeof enqueueProfileSyncJob
  triggerZohoSyncWorker: typeof triggerZohoSyncWorker
  readBody: typeof readBody
  useRuntimeConfig: () => ReturnType<typeof useRuntimeConfig>
}

const defaultDependencies: Dependencies = {
  requireAuthenticatedRequest,
  parseProfileUpdateInput,
  enqueueProfileSyncJob,
  triggerZohoSyncWorker,
  readBody,
  useRuntimeConfig: () => useRuntimeConfig(),
}

export async function handleProfileUpdate(event: H3Event, deps: Dependencies = defaultDependencies) {
  const { user, supabase } = await deps.requireAuthenticatedRequest(event)
  const body = await deps.readBody<unknown>(event).catch(() => null)
  const parsed = deps.parseProfileUpdateInput(body)

  if (!parsed) {
    throw createError({ statusCode: 400, message: 'Invalid profile update payload' })
  }

  const { error: profileErr } = await supabase
    .from('profiles')
    .update({
      first_name: parsed.firstName,
      last_name: parsed.lastName,
      phone: parsed.phone,
      id_passport_number: parsed.idPassport,
      reason_for_buying: parsed.reasonForBuying,
    })
    .eq('id', user.id)

  if (profileErr) {
    console.error('[profile/update] profiles update failed', profileErr)
    throw createError({ statusCode: 500, message: 'Unable to update profile right now' })
  }

  const { error: queueErr } = await deps.enqueueProfileSyncJob(supabase, user.id)

  if (queueErr) {
    console.error('[profile/update] queue upsert failed', queueErr)
    throw createError({ statusCode: 500, message: 'Unable to update profile right now' })
  }

  try {
    await deps.triggerZohoSyncWorker(deps.useRuntimeConfig())
  } catch (err) {
    // Best-effort immediate trigger. Cron/scheduler still guarantees eventual processing.
    console.warn('[profile/update] immediate worker trigger failed', err)
  }

  const { error: authUpdateErr } = await supabase.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...(user.user_metadata ?? {}),
      first_name: parsed.firstName,
      last_name: parsed.lastName,
      phone: parsed.phone,
    },
  })

  if (authUpdateErr) {
    console.error('[profile/update] auth metadata update failed', authUpdateErr)
  }

  return {
    ok: true,
  }
}

export default defineEventHandler((event) => handleProfileUpdate(event))
