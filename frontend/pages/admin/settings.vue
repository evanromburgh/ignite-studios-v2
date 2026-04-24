<template>
  <div class="nav-section light w-full px-4 sm:px-[5rem] pt-[7.5rem] sm:pt-[11rem] sm:pb-20">
      <header class="mb-10 sm:mb-16 text-center">
        <h1 class="text-4xl sm:text-5xl md:text-6xl font-black text-theme-text-primary tracking-tight mb-2">
          Sales Mode and Tracking
        </h1>
        <p class="text-base sm:text-lg text-zinc-500 font-normal max-w-3xl mx-auto">
          Manage Sales Mode and Tracking Codes.
        </p>
      </header>

      <div v-if="authLoading" class="mb-4 text-center">
        <p class="text-zinc-500 text-sm">
          Loading admin panel&hellip;
        </p>
      </div>

      <div
        class="max-w-6xl mx-auto"
        style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr));gap:1.5rem;"
      >
        <section
          class="relative flex flex-col h-full rounded-[0.75rem] px-6 py-6 sm:px-8 sm:py-8 border border-zinc-200 bg-white"
        >
          <div class="flex h-full flex-col justify-between gap-8">
            <div class="space-y-2">
              <h2 class="text-lg font-black text-zinc-900 tracking-tight">
                Sales Mode
              </h2>

              <div class="flex flex-wrap gap-3">
                <label class="inline-flex items-center gap-2 cursor-pointer">
                  <input v-model="salesForm.mode" type="radio" value="prelaunch" class="accent-zinc-900">
                  <span class="text-sm text-zinc-800">Prelaunch</span>
                </label>
                <label class="inline-flex items-center gap-2 cursor-pointer">
                  <input v-model="salesForm.mode" type="radio" value="launched" class="accent-zinc-900">
                  <span class="text-sm text-zinc-800">Launched</span>
                </label>
              </div>
            </div>

            <div class="h-px bg-zinc-200" />

            <div class="space-y-2 w-full">
              <span class="text-[10px] sm:text-[11px] font-semibold text-zinc-500 uppercase tracking-[0.2em] block">
                Sales open (date &amp; time, SAST)
              </span>
              <div class="flex flex-col sm:flex-row gap-3 sm:items-end">
                <div class="flex-1 min-w-0 flex flex-col gap-1">
                  <label class="text-[10px] text-zinc-500 block">Date</label>
                  <div class="relative">
                    <input
                      v-model="salesForm.sastDate"
                      type="date"
                      class="admin-datetime-input w-full bg-theme-input-bg border border-theme-border rounded-lg px-3 h-10 text-sm text-zinc-900 appearance-none"
                    >
                    <svg class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div class="w-full sm:w-32 shrink-0 flex flex-col gap-1">
                  <label class="text-[10px] text-zinc-500 block">Time</label>
                  <div class="relative">
                    <input
                      v-model="salesForm.sastTime"
                      type="time"
                      class="admin-datetime-input w-full bg-theme-input-bg border border-theme-border rounded-lg px-3 h-10 text-sm text-zinc-900 appearance-none"
                    >
                    <svg class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l2.5 2.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
              <label class="inline-flex items-center gap-2 text-xs text-zinc-700 cursor-pointer">
                <input v-model="salesForm.clearCountdown" type="checkbox" class="accent-zinc-900 rounded">
                Clear countdown (hero block hidden while still prelaunch)
              </label>
            </div>

            <div class="h-px bg-zinc-200" />

            <div class="space-y-3">
              <p v-if="salesMessage" class="text-sm" :class="salesMessageType === 'success' ? 'text-emerald-700' : 'text-red-600'">
                {{ salesMessage }}
              </p>

              <button
                type="button"
                :disabled="salesSaving"
                class="inline-flex items-center justify-center h-11 px-9 rounded-lg text-[11px] font-black uppercase tracking-[0.2em] bg-zinc-900 text-white hover:bg-zinc-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                @click="saveSalesSettings"
              >
                <span
                  v-if="salesSaving"
                  class="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2"
                />
                Save sales settings
              </button>
            </div>
          </div>
        </section>

        <section
          class="relative flex flex-col h-full gap-4 rounded-[0.75rem] px-6 py-6 sm:px-8 sm:py-8 border border-zinc-200 bg-white"
        >
          <h2 class="text-lg font-black text-zinc-900 tracking-tight">
            Tracking
          </h2>
          <p class="text-xs text-zinc-600">
            Paste tracking IDs (for example: G-XXXX, GTM-XXXX, or a Meta Pixel ID).
          </p>

          <div class="space-y-4">
            <div class="space-y-2">
              <label class="text-[10px] sm:text-[11px] font-semibold text-zinc-500 uppercase tracking-[0.2em] block">
                Google Analytics (GA4 ID)
              </label>
              <input
                v-model="trackingForm.googleAnalyticsId"
                type="text"
                placeholder="G-XXXXXXXXXX"
                class="w-full bg-theme-input-bg border border-theme-border rounded-lg px-3 h-10 text-sm text-zinc-900"
              >
              <p v-if="trackingForm.googleAnalyticsId.trim()" class="text-[11px]" :class="gaValid ? 'text-emerald-700' : 'text-red-600'">
                {{ gaValid ? 'Valid GA4 ID' : 'Invalid GA4 ID format (expected G-XXXXXXXXXX)' }}
              </p>
            </div>

            <div class="space-y-2">
              <label class="text-[10px] sm:text-[11px] font-semibold text-zinc-500 uppercase tracking-[0.2em] block">
                Google Tag Manager (Container ID)
              </label>
              <input
                v-model="trackingForm.googleTagManagerId"
                type="text"
                placeholder="GTM-XXXXXXX"
                class="w-full bg-theme-input-bg border border-theme-border rounded-lg px-3 h-10 text-sm text-zinc-900"
              >
              <p v-if="trackingForm.googleTagManagerId.trim()" class="text-[11px]" :class="gtmValid ? 'text-emerald-700' : 'text-red-600'">
                {{ gtmValid ? 'Valid GTM container ID' : 'Invalid GTM ID format (expected GTM-XXXXXXX)' }}
              </p>
            </div>

            <div class="space-y-2">
              <label class="text-[10px] sm:text-[11px] font-semibold text-zinc-500 uppercase tracking-[0.2em] block">
                Meta Pixel ID
              </label>
              <input
                v-model="trackingForm.metaPixelId"
                type="text"
                placeholder="123456789012345"
                class="w-full bg-theme-input-bg border border-theme-border rounded-lg px-3 h-10 text-sm text-zinc-900"
              >
              <p v-if="trackingForm.metaPixelId.trim()" class="text-[11px]" :class="metaValid ? 'text-emerald-700' : 'text-red-600'">
                {{ metaValid ? 'Valid Meta Pixel ID' : 'Invalid Meta Pixel ID (numbers only)' }}
              </p>
            </div>

            <p v-if="trackingMessage" class="text-sm" :class="trackingMessageType === 'success' ? 'text-emerald-700' : 'text-red-600'">
              {{ trackingMessage }}
            </p>

            <button
              type="button"
              :disabled="trackingSaving || !canSaveTracking"
              class="inline-flex items-center justify-center h-11 px-9 rounded-lg text-[11px] font-black uppercase tracking-[0.2em] bg-zinc-900 text-white hover:bg-zinc-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              @click="saveTrackingSettings"
            >
              <span
                v-if="trackingSaving"
                class="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2"
              />
              Save tracking
            </button>
          </div>
        </section>
      </div>
    </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['admin-only'],
})

import { useAuth } from '~/composables/useAuth'
import { APP_SETTINGS_DATA_KEY } from '~/composables/useSalesMode'
import { utcIsoToSastDateTimeParts } from '~/utils/sastTime'
import type { SalesMode } from '~/composables/useSalesMode'

const { user, authLoading } = useAuth()
const salesSaving = ref(false)
const salesMessage = ref('')
const salesMessageType = ref<'success' | 'error' | ''>('')
const trackingSaving = ref(false)
const trackingMessage = ref('')
const trackingMessageType = ref<'success' | 'error' | ''>('')
const salesForm = reactive({
  mode: 'launched' as SalesMode,
  sastDate: '',
  sastTime: '',
  clearCountdown: false,
})
const trackingForm = reactive({
  googleAnalyticsId: '',
  googleTagManagerId: '',
  metaPixelId: '',
})

function isValidGaId(id: string): boolean {
  return /^G-[A-Z0-9]{4,}$/i.test(id)
}

function isValidGtmId(id: string): boolean {
  return /^GTM-[A-Z0-9]{4,}$/i.test(id)
}

function isValidMetaPixelId(id: string): boolean {
  return /^\d{8,20}$/.test(id)
}

const gaValid = computed(() => {
  const value = trackingForm.googleAnalyticsId.trim()
  return !value || isValidGaId(value)
})

const gtmValid = computed(() => {
  const value = trackingForm.googleTagManagerId.trim()
  return !value || isValidGtmId(value)
})

const metaValid = computed(() => {
  const value = trackingForm.metaPixelId.trim()
  return !value || isValidMetaPixelId(value)
})

const canSaveTracking = computed(() => gaValid.value && gtmValid.value && metaValid.value)

async function loadSalesFormFromApi() {
  try {
    const s = await $fetch<{
      salesMode: SalesMode
      salesOpensAt: string | null
      googleAnalyticsId: string | null
      googleTagManagerId: string | null
      metaPixelId: string | null
    }>('/api/app-settings')
    salesForm.mode = s.salesMode === 'prelaunch' ? 'prelaunch' : 'launched'
    salesForm.clearCountdown = !s.salesOpensAt
    const parts = utcIsoToSastDateTimeParts(s.salesOpensAt)
    salesForm.sastDate = parts.date
    salesForm.sastTime = parts.time
    trackingForm.googleAnalyticsId = s.googleAnalyticsId ?? ''
    trackingForm.googleTagManagerId = s.googleTagManagerId ?? ''
    trackingForm.metaPixelId = s.metaPixelId ?? ''
  } catch {
    // keep defaults
  }
}

watch(
  user,
  (u) => {
    if (u?.role === 'admin') void loadSalesFormFromApi()
  },
  { immediate: true },
)

type AdminAppSettingsResponse = {
  ok: boolean
  salesMode: SalesMode
  salesOpensAt: string | null
  googleAnalyticsId: string | null
  googleTagManagerId: string | null
  metaPixelId: string | null
}

async function persistSettings(): Promise<AdminAppSettingsResponse> {
  const { data: { session } } = await useNuxtApp().$supabase.auth.getSession()
  if (!session?.access_token) {
    throw new Error('MISSING_SESSION')
  }

  const updated = await $fetch<AdminAppSettingsResponse>('/api/admin/app-settings', {
    method: 'PUT',
    body: {
      salesMode: salesForm.mode,
      clearSalesOpensAt: salesForm.clearCountdown,
      salesOpensAtDate: salesForm.sastDate,
      salesOpensAtTime: salesForm.sastTime,
      googleAnalyticsId: trackingForm.googleAnalyticsId,
      googleTagManagerId: trackingForm.googleTagManagerId,
      metaPixelId: trackingForm.metaPixelId,
    },
    headers: { Authorization: `Bearer ${session.access_token}` },
  })

  const appEntry = useNuxtData<{
    salesMode: SalesMode
    salesOpensAt: string | null
    googleAnalyticsId: string | null
    googleTagManagerId: string | null
    metaPixelId: string | null
  }>(APP_SETTINGS_DATA_KEY)
  appEntry.data.value = {
    salesMode: updated.salesMode === 'prelaunch' ? 'prelaunch' : 'launched',
    salesOpensAt: updated.salesOpensAt,
    googleAnalyticsId: updated.googleAnalyticsId,
    googleTagManagerId: updated.googleTagManagerId,
    metaPixelId: updated.metaPixelId,
  }

  return updated
}

async function saveSalesSettings() {
  if (salesSaving.value || !user.value || user.value.role !== 'admin') return
  salesMessage.value = ''
  salesMessageType.value = ''
  salesSaving.value = true
  try {
    await persistSettings()
    await loadSalesFormFromApi()
    salesMessage.value = 'Sales settings saved.'
    salesMessageType.value = 'success'
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'MISSING_SESSION') {
      salesMessage.value = 'You must be signed in to save settings.'
      salesMessageType.value = 'error'
    } else {
      const err = e as { data?: { message?: string } }
      salesMessage.value = err?.data?.message ?? 'Could not save sales settings. Try again.'
      salesMessageType.value = 'error'
    }
  } finally {
    salesSaving.value = false
  }
}

async function saveTrackingSettings() {
  if (trackingSaving.value || !user.value || user.value.role !== 'admin') return
  trackingMessage.value = ''
  trackingMessageType.value = ''
  trackingSaving.value = true
  try {
    await persistSettings()
    trackingMessage.value = 'Tracking settings saved.'
    trackingMessageType.value = 'success'
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'MISSING_SESSION') {
      trackingMessage.value = 'You must be signed in to save tracking.'
      trackingMessageType.value = 'error'
    } else {
      const err = e as { data?: { message?: string } }
      trackingMessage.value = err?.data?.message ?? 'Could not save tracking settings. Try again.'
      trackingMessageType.value = 'error'
    }
  } finally {
    trackingSaving.value = false
  }
}
</script>

<style scoped>
/* iOS Safari centers native date/time values and applies a different control look. */
.admin-datetime-input {
  -webkit-appearance: none;
  appearance: none;
  text-align: left;
  padding-right: 2rem;
  line-height: 1.25rem;
  font-variant-numeric: tabular-nums;
  position: relative;
}

.admin-datetime-input::-webkit-date-and-time-value {
  text-align: left;
  min-height: 1.25rem;
}

.admin-datetime-input::-webkit-datetime-edit {
  text-align: left;
  padding: 0;
}

.admin-datetime-input::-webkit-datetime-edit-fields-wrapper {
  display: flex;
  justify-content: flex-start;
  align-items: center;
}

.admin-datetime-input::-webkit-datetime-edit-text,
.admin-datetime-input::-webkit-datetime-edit-year-field,
.admin-datetime-input::-webkit-datetime-edit-month-field,
.admin-datetime-input::-webkit-datetime-edit-day-field,
.admin-datetime-input::-webkit-datetime-edit-hour-field,
.admin-datetime-input::-webkit-datetime-edit-minute-field {
  color: #18181b;
  padding: 0;
}

/* Keep native iOS picker affordance visible (calendar/clock icons). */
.admin-datetime-input::-webkit-calendar-picker-indicator {
  opacity: 0;
  width: 0;
  height: 0;
  margin: 0;
  padding: 0;
  pointer-events: none;
}
</style>

