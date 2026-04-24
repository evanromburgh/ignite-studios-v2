import { getAppSettingsService } from '~/server/utils/appSettings'

export default defineEventHandler(async (event) => {
  // Sales mode must never be stale across client navigations.
  setHeader(event, 'Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
  setHeader(event, 'Pragma', 'no-cache')
  setHeader(event, 'Expires', '0')
  const s = await getAppSettingsService()
  return {
    salesMode: s.sales_mode,
    salesOpensAt: s.sales_opens_at,
    googleAnalyticsId: s.google_analytics_id,
    googleTagManagerId: s.google_tag_manager_id,
    metaPixelId: s.meta_pixel_id,
  }
})
