import type { User } from '@supabase/supabase-js'
import type { H3Event } from 'h3'
import { readBearerToken } from '~/server/utils/bearer'
import { createServiceRoleSupabase } from '~/server/utils/serviceSupabase'

type AuthenticatedRequestContext = {
  user: User
  supabase: ReturnType<typeof createServiceRoleSupabase>
}

export async function requireAuthenticatedRequest(event: H3Event): Promise<AuthenticatedRequestContext> {
  const token = readBearerToken(event)
  if (!token) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const supabase = createServiceRoleSupabase()
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)

  if (authError || !user) {
    throw createError({ statusCode: 401, message: 'Invalid or expired session' })
  }

  return { user, supabase }
}
