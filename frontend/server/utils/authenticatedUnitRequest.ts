import type { User } from '@supabase/supabase-js'
import type { H3Event } from 'h3'
import { readBearerToken } from '~/server/utils/bearer'
import { createServiceRoleSupabase } from '~/server/utils/serviceSupabase'

type AuthenticatedUnitRequest = {
  unitId: string
  user: User
  supabase: ReturnType<typeof createServiceRoleSupabase>
}

/**
 * Validates bearer auth and request body shape for unit lock endpoints.
 */
export async function requireAuthenticatedUnitRequest(event: H3Event): Promise<AuthenticatedUnitRequest> {
  const token = readBearerToken(event)
  if (!token) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const body = await readBody<unknown>(event).catch(() => null)
  const unitId =
    body && typeof body === 'object' && typeof (body as Record<string, unknown>).unitId === 'string'
      ? ((body as Record<string, unknown>).unitId as string).trim()
      : ''
  if (!unitId) {
    throw createError({ statusCode: 400, message: 'unitId is required' })
  }

  const supabase = createServiceRoleSupabase()
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)

  if (authError || !user) {
    throw createError({ statusCode: 401, message: 'Invalid or expired session' })
  }

  return { unitId, user, supabase }
}
