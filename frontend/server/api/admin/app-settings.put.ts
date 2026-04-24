import { createError, readBody } from 'h3'
import { requireAuthenticatedRequest } from '~/server/utils/authenticatedRequest'
import { createServiceRoleSupabase } from '~/server/utils/serviceSupabase'
import type { SalesMode } from '~/server/utils/appSettings'
import { sastLocalToUtcIso } from '~/utils/sastTime'

type Body = {
  salesMode?: string
  salesOpensAtDate?: string | null
  salesOpensAtTime?: string | null
  clearSalesOpensAt?: boolean
  googleAnalyticsId?: string | null
  googleTagManagerId?: string | null
  metaPixelId?: string | null
}

function parseSalesMode(raw: string | undefined): SalesMode {
  return String(raw ?? '').trim() === 'prelaunch' ? 'prelaunch' : 'launched'
}

function normalizeTrackingCode(raw: string | null | undefined): string | null {
  const code = String(raw ?? '').trim()
  return code ? code : null
}

export default defineEventHandler(async (event) => {
  const { user } = await requireAuthenticatedRequest(event)
  const supabase = createServiceRoleSupabase()

  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileErr || !profile) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }
  if (String(profile.role) !== 'admin') {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const body = await readBody<Body>(event).catch(() => ({} as Body))
  const salesMode = parseSalesMode(body.salesMode)

  const { data: current } = await supabase
    .from('app_settings')
    .select('sales_opens_at, google_analytics_id, google_tag_manager_id, meta_pixel_id')
    .eq('id', 1)
    .single()

  let salesOpensAt: string | null = (current?.sales_opens_at as string | null) ?? null
  const hasGoogleAnalyticsId = Object.prototype.hasOwnProperty.call(body, 'googleAnalyticsId')
  const hasGoogleTagManagerId = Object.prototype.hasOwnProperty.call(body, 'googleTagManagerId')
  const hasMetaPixelId = Object.prototype.hasOwnProperty.call(body, 'metaPixelId')

  const googleAnalyticsId = hasGoogleAnalyticsId
    ? normalizeTrackingCode(body.googleAnalyticsId)
    : (current?.google_analytics_id as string | null) ?? null
  const googleTagManagerId = hasGoogleTagManagerId
    ? normalizeTrackingCode(body.googleTagManagerId)
    : (current?.google_tag_manager_id as string | null) ?? null
  const metaPixelId = hasMetaPixelId
    ? normalizeTrackingCode(body.metaPixelId)
    : (current?.meta_pixel_id as string | null) ?? null

  if (body.clearSalesOpensAt) {
    salesOpensAt = null
  } else {
    const d = (body.salesOpensAtDate ?? '').trim()
    const t = (body.salesOpensAtTime ?? '').trim()
    if (d && t) {
      try {
        salesOpensAt = sastLocalToUtcIso(d, t)
      } catch {
        throw createError({ statusCode: 400, message: 'Invalid SAST date or time' })
      }
    } else if (d || t) {
      throw createError({ statusCode: 400, message: 'Provide both date and time in SAST, or clear the countdown' })
    }
  }

  const { error: updateErr } = await supabase
    .from('app_settings')
    .update({
      sales_mode: salesMode,
      sales_opens_at: salesOpensAt,
      google_analytics_id: googleAnalyticsId,
      google_tag_manager_id: googleTagManagerId,
      meta_pixel_id: metaPixelId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1)

  if (updateErr) {
    console.error('[admin/app-settings]', updateErr)
    throw createError({ statusCode: 500, message: 'Failed to update settings' })
  }

  return {
    ok: true,
    salesMode,
    salesOpensAt,
    googleAnalyticsId,
    googleTagManagerId,
    metaPixelId,
  }
})
