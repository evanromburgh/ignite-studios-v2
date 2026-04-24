import type { ComputedRef, Ref } from 'vue'

export type SalesMode = 'prelaunch' | 'launched'

export type AppSettingsPublic = {
  salesMode: SalesMode
  salesOpensAt: string | null
  googleAnalyticsId: string | null
  googleTagManagerId: string | null
  metaPixelId: string | null
}

/** Same key as `useAsyncData` in `useSalesMode` — use with `useNuxtData` after admin updates. */
export const APP_SETTINGS_DATA_KEY = 'app-settings-public'

function normalize(data: AppSettingsPublic | null): AppSettingsPublic {
  const mode: SalesMode = data?.salesMode === 'prelaunch' ? 'prelaunch' : 'launched'
  const at = data?.salesOpensAt ?? null
  return {
    salesMode: mode,
    salesOpensAt: at,
    googleAnalyticsId: data?.googleAnalyticsId?.trim() || null,
    googleTagManagerId: data?.googleTagManagerId?.trim() || null,
    metaPixelId: data?.metaPixelId?.trim() || null,
  }
}

/**
 * Global sales phase (DB-backed), safe for SSR + client. Single fetch per load via Nuxt payload.
 */
export function useSalesMode(): {
  salesMode: ComputedRef<SalesMode>
  salesOpensAt: ComputedRef<string | null>
  googleAnalyticsId: ComputedRef<string | null>
  googleTagManagerId: ComputedRef<string | null>
  metaPixelId: ComputedRef<string | null>
  isPrelaunch: ComputedRef<boolean>
  /** Hero block: prelaunch and a target instant is set */
  showHeroCountdown: ComputedRef<boolean>
  reservationsAllowed: ComputedRef<boolean>
  pending: Ref<boolean>
  error: Ref<Error | null>
  refresh: (opts?: { dedupe?: boolean }) => Promise<void>
} {
  const { data, pending, error, refresh } = useAsyncData(
    APP_SETTINGS_DATA_KEY,
    () => $fetch<AppSettingsPublic>('/api/app-settings'),
    {
      default: () => ({
        salesMode: 'launched' as const,
        salesOpensAt: null,
        googleAnalyticsId: null,
        googleTagManagerId: null,
        metaPixelId: null,
      }),
    },
  )

  const normalized = computed(() => normalize(data.value ?? null))

  const salesMode = computed(() => normalized.value.salesMode)
  const salesOpensAt = computed(() => normalized.value.salesOpensAt)
  const googleAnalyticsId = computed(() => normalized.value.googleAnalyticsId)
  const googleTagManagerId = computed(() => normalized.value.googleTagManagerId)
  const metaPixelId = computed(() => normalized.value.metaPixelId)
  const isPrelaunch = computed(() => normalized.value.salesMode === 'prelaunch')
  const showHeroCountdown = computed(
    () => isPrelaunch.value && Boolean(normalized.value.salesOpensAt),
  )
  const reservationsAllowed = computed(() => !isPrelaunch.value)

  return {
    salesMode,
    salesOpensAt,
    googleAnalyticsId,
    googleTagManagerId,
    metaPixelId,
    isPrelaunch,
    showHeroCountdown,
    reservationsAllowed,
    pending,
    error,
    refresh,
  }
}
