import { getAppSettingsService } from '~/server/utils/appSettings'

export default defineEventHandler(async () => {
  const s = await getAppSettingsService()
  return {
    salesMode: s.sales_mode,
    salesOpensAt: s.sales_opens_at,
    googleAnalyticsId: s.google_analytics_id,
    googleTagManagerId: s.google_tag_manager_id,
    metaPixelId: s.meta_pixel_id,
  }
})
