import { createServiceRoleSupabase } from '~/server/utils/serviceSupabase'

export type SalesMode = 'prelaunch' | 'launched'

export type AppSettingsRow = {
  sales_mode: SalesMode
  sales_opens_at: string | null
  google_analytics_id: string | null
  google_tag_manager_id: string | null
  meta_pixel_id: string | null
}

export function isPrelaunchMode(mode: string | null | undefined): boolean {
  return String(mode ?? '').trim() === 'prelaunch'
}

export async function getAppSettingsService(): Promise<AppSettingsRow> {
  const supabase = createServiceRoleSupabase()
  const { data, error } = await supabase
    .from('app_settings')
    .select('sales_mode, sales_opens_at, google_analytics_id, google_tag_manager_id, meta_pixel_id')
    .eq('id', 1)
    .maybeSingle()

  if (error) {
    console.error('[app_settings]', error)
    return {
      sales_mode: 'launched',
      sales_opens_at: null,
      google_analytics_id: null,
      google_tag_manager_id: null,
      meta_pixel_id: null,
    }
  }
  const mode = (data?.sales_mode as SalesMode) ?? 'launched'
  const at = (data?.sales_opens_at as string | null) ?? null
  const ga = (data?.google_analytics_id as string | null) ?? null
  const gtm = (data?.google_tag_manager_id as string | null) ?? null
  const meta = (data?.meta_pixel_id as string | null) ?? null
  return {
    sales_mode: mode === 'prelaunch' ? 'prelaunch' : 'launched',
    sales_opens_at: at,
    google_analytics_id: ga,
    google_tag_manager_id: gtm,
    meta_pixel_id: meta,
  }
}

export const SALES_PRELAUNCH_ERROR = {
  code: 'SALES_PRELAUNCH' as const,
  message: 'Reservations are not open yet.',
}
