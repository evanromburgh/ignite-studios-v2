import type { User } from '@supabase/supabase-js'
import type { H3Event } from 'h3'
import { createServiceRoleSupabase } from '~/server/utils/serviceSupabase'
import { requireAuthenticatedRequest } from '~/server/utils/authenticatedRequest'

type AuthenticatedUnitRequest = {
  unitId: string
  user: User
  supabase: ReturnType<typeof createServiceRoleSupabase>
}

/**
 * Validates bearer auth and request body shape for unit lock endpoints.
 */
export async function requireAuthenticatedUnitRequest(event: H3Event): Promise<AuthenticatedUnitRequest> {
  const body = await readBody<unknown>(event).catch(() => null)
  const unitId =
    body && typeof body === 'object' && typeof (body as Record<string, unknown>).unitId === 'string'
      ? ((body as Record<string, unknown>).unitId as string).trim()
      : ''
  if (!unitId) {
    throw createError({ statusCode: 400, message: 'unitId is required' })
  }

  const { user, supabase } = await requireAuthenticatedRequest(event)

  return { unitId, user, supabase }
}
