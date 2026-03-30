<template>
  <div class="bg-theme-bg">
    <Teleport to="body">
      <Transition name="reserve-expiry">
        <div
          v-if="showExpiryModal"
          class="fixed inset-0 z-[3200] flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reserve-expiry-modal-title"
          aria-describedby="reserve-expiry-modal-desc"
        >
          <div
            class="absolute inset-0 bg-black/75 backdrop-blur-sm"
            aria-hidden="true"
            @click="dismissExpiryModalToHome"
          />
          <div
            ref="expiryModalPanelRef"
            class="reserve-expiry-panel relative z-10 w-full max-w-md rounded-2xl border border-zinc-200 bg-[#ffffff] px-8 py-10 shadow-2xl text-center text-[#18181B]"
            @click.stop
          >
            <p class="sr-only" role="alert" aria-live="assertive">
              Reservation expired. Your hold on this unit has ended.
            </p>
            <h2
              id="reserve-expiry-modal-title"
              class="text-xl sm:text-2xl font-semibold text-[#18181B] tracking-tight leading-tight mb-3"
            >
              Reservation Expired
            </h2>
            <p
              id="reserve-expiry-modal-desc"
              class="text-[13px] text-[#18181B] leading-relaxed mb-8"
            >
              Your hold on this unit has ended and someone else may reserve it. Browse other units, or you can try to reserve this unit again if it is still available.
            </p>
            <button
              type="button"
              class="w-full h-12 flex items-center justify-center bg-[#18181B] text-[#ffffff] font-black text-[11px] uppercase tracking-wider rounded-lg hover:bg-zinc-800 transition-colors"
              @click="dismissExpiryModalToHome"
            >
              Browse units
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="reserve-urgency">
        <div
          v-if="showUrgencyBanner"
          class="reserve-urgency-banner fixed left-1/2 z-[210] w-max max-w-[calc(100vw-2.5rem)] rounded-xl bg-[#922724] px-4 py-3 text-center text-white shadow-lg"
          role="status"
          aria-live="polite"
        >
          <p class="text-[11px] font-semibold leading-snug">
            Time is running out! Complete payment soon to keep this unit reserved.
          </p>
        </div>
      </Transition>
    </Teleport>

    <div v-if="!user || !unitNumberDisplay" class="flex items-center justify-center min-h-[60svh]">
      <p class="text-zinc-500">Redirecting…</p>
    </div>

    <div v-else-if="!reserveFlowReady" class="flex items-center justify-center min-h-[60svh]">
      <p class="text-zinc-500">Loading…</p>
    </div>

    <div
      v-else-if="showBlockedMinimal"
      class="pt-[7.5rem] sm:pt-[11rem] sm:pb-20 bg-theme-bg min-h-[60svh] flex flex-col items-center justify-center px-4 sm:px-6"
    >
      <div class="w-full max-w-md text-center">
        <h1 class="text-2xl sm:text-3xl font-semibold text-theme-text-primary tracking-tight leading-tight">
          {{ blockedTitle }}
        </h1>
        <p v-if="blockedDescription" class="mt-4 text-[13px] sm:text-sm text-zinc-500 leading-relaxed">
          {{ blockedDescription }}
        </p>
        <NuxtLink
          to="/"
          class="mt-10 inline-flex h-12 min-w-[12rem] items-center justify-center rounded-lg bg-[#18181B] px-8 text-[11px] font-black uppercase tracking-wider text-white hover:bg-zinc-800 transition-colors"
        >
          Browse units
        </NuxtLink>
      </div>
    </div>

    <div v-else class="pt-[7.5rem] sm:pt-[11rem] sm:pb-20 bg-theme-bg">
      <div class="w-full mx-auto px-4 sm:px-6 lg:px-12">
        <div class="md:flex md:gap-12 md:items-center">
          <!-- Left: unit image (matches Unit page proportions) -->
          <div class="md:w-[60%]">
            <div class="relative w-full overflow-hidden rounded-2xl bg-[#18181B] group aspect-[3/2] flex items-center justify-center">
              <img
                v-if="unit?.floorplanUrl"
                :src="unit.floorplanUrl"
                :alt="`Unit ${unit.unitNumber} floorplan`"
                class="max-h-full max-w-full object-contain object-center"
                loading="lazy"
              />
              <img
                v-else-if="unit?.imageUrl"
                :src="unit.imageUrl"
                :alt="`Unit ${unit.unitNumber} image`"
                class="w-full h-full object-cover object-center"
                loading="lazy"
              />
              <div
                v-else
                class="flex items-center justify-center w-full h-full text-sm text-zinc-500"
              >
                Floorplan coming soon for Unit {{ unitNumberDisplay }}.
              </div>
            </div>
          </div>

          <!-- Right: reservation content (same width as Unit details panel) -->
          <div class="mt-10 md:mt-0 md:w-[40%] md:flex md:items-center">
            <div class="flex flex-col items-stretch w-full">
              <div class="rounded-3xl px-0 md:px-20 text-center">
                <h1 class="text-4xl sm:text-5xl font-semibold text-theme-text-primary tracking-tight leading-none mb-6">
                  Reserve Unit {{ unitNumberDisplay }}
                </h1>
                <p class="text-[12px] sm:text-[13px] text-zinc-500 max-w-[30rem] mx-auto mb-4">
                  Please pay the
                  <span class="font-semibold text-theme-text-primary">
                    non-refundable reservation fee of <span class="whitespace-nowrap">R10 000</span>
                  </span>
                  to secure your unit before the time runs out.
                </p>
                <div
                  v-if="unit"
                  class="my-8 rounded-2xl bg-transparent"
                >
                  <p class="text-sm sm:text-base font-semibold text-theme-text-primary mb-5">
                    Selling price: R {{ formatPrice(unit.price) }}
                  </p>
                  <div class="flex items-center justify-evenly gap-0 rounded-2xl bg-[#ffffff] py-8">
                    <div
                      class="group/tip relative inline-flex flex-col items-center gap-1 cursor-help text-[11px] text-zinc-700"
                    >
                      <span
                        class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 bg-zinc-800 text-white text-[11px] rounded opacity-0 pointer-events-none transition-opacity z-20 whitespace-nowrap group-hover/tip:opacity-100"
                      >
                        Bedrooms
                        <span
                          class="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-zinc-800"
                          aria-hidden="true"
                        />
                      </span>
                      <IconBed class="w-4 h-4 text-zinc-700 flex-shrink-0" />
                      <span class="font-semibold text-theme-text-primary">
                        {{ unit.bedrooms }}
                      </span>
                    </div>
                    <div
                      class="group/tip relative inline-flex flex-col items-center gap-1 cursor-help text-[11px] text-zinc-700"
                    >
                      <span
                        class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 bg-zinc-800 text-white text-[11px] rounded opacity-0 pointer-events-none transition-opacity z-20 whitespace-nowrap group-hover/tip:opacity-100"
                      >
                        Bathrooms
                        <span
                          class="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-zinc-800"
                          aria-hidden="true"
                        />
                      </span>
                      <IconBath class="w-4 h-4 text-zinc-700 flex-shrink-0" />
                      <span class="font-semibold text-theme-text-primary">
                        {{ unit.bathrooms }}
                      </span>
                    </div>
                    <div
                      class="group/tip relative inline-flex flex-col items-center gap-1 cursor-help text-[11px] text-zinc-700"
                    >
                      <span
                        class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 bg-zinc-800 text-white text-[11px] rounded opacity-0 pointer-events-none transition-opacity z-20 whitespace-nowrap group-hover/tip:opacity-100"
                      >
                        Parking
                        <span
                          class="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-zinc-800"
                          aria-hidden="true"
                        />
                      </span>
                      <IconCar class="w-4 h-4 text-zinc-700 flex-shrink-0" />
                      <span class="font-semibold text-theme-text-primary">
                        {{ unit.parking || 1 }}
                      </span>
                    </div>
                    <div
                      class="group/tip relative inline-flex flex-col items-center gap-1 cursor-help text-[11px] text-zinc-700"
                    >
                      <span
                        class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 bg-zinc-800 text-white text-[11px] rounded opacity-0 pointer-events-none transition-opacity z-20 whitespace-nowrap group-hover/tip:opacity-100"
                      >
                        Unit Type
                        <span
                          class="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-zinc-800"
                          aria-hidden="true"
                        />
                      </span>
                      <IconLayout class="w-4 h-4 text-zinc-700 flex-shrink-0" />
                      <span class="font-semibold text-theme-text-primary">
                        {{ unit.unitType || '—' }}
                      </span>
                    </div>
                    <div
                      class="group/tip relative inline-flex flex-col items-center gap-1 cursor-help text-[11px] text-zinc-700"
                    >
                      <span
                        class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 bg-zinc-800 text-white text-[11px] rounded opacity-0 pointer-events-none transition-opacity z-20 whitespace-nowrap group-hover/tip:opacity-100"
                      >
                        Unit Size
                        <span
                          class="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-zinc-800"
                          aria-hidden="true"
                        />
                      </span>
                      <IconSize class="w-4 h-4 text-zinc-700 flex-shrink-0" />
                      <span class="font-semibold text-theme-text-primary">
                        {{ unit.sizeSqm }}m²
                      </span>
                    </div>
                  </div>
                </div>

                <div class="rounded-2xl max-w-xs mx-auto mb-8">
                  <p class="text-[10px] font-black tracking-[0.25em] text-zinc-400 uppercase mb-0">
                    Expires in
                  </p>
                  <div class="inline-flex items-center justify-center gap-2">
                    <span class="text-4xl font-black text-theme-text-primary tabular-nums">
                      {{ formatTime(timeLeft) }}
                    </span>
                  </div>
                </div>

                <div v-if="error" class="text-[11px] font-bold text-red-500 mb-4">
                  {{ error }}
                </div>

                <div class="mt-2 flex flex-col gap-3">
                  <button
                    type="button"
                    :disabled="loading || timeLeft <= 0 || isLockedByOther || acquiringLock || !!acquireError"
                    class="w-full h-12 flex items-center justify-center bg-[#18181B] text-[#ffffff] font-black text-[11px] uppercase tracking-wider rounded-lg hover:bg-[#27272a] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    @click="onSubmit"
                  >
                    <span v-if="loading">Processing…</span>
                    <span v-else-if="acquiringLock">Securing…</span>
                    <span v-else-if="isLockedByOther">Reserved by someone else</span>
                    <span v-else-if="timeLeft <= 0">Reservation expired</span>
                    <span v-else>Proceed to payment</span>
                  </button>

                  <button
                    type="button"
                    :disabled="canceling"
                    class="mt-2 self-center inline-flex items-center justify-center text-[10px] font-black uppercase tracking-wide text-zinc-400 hover:text-zinc-600 disabled:opacity-60"
                    @click="onCancel"
                  >
                    Cancel reservation
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CONFIG } from '~/config'
import { phoneCountries, formatPhoneDialCode } from '~/data/phoneCountries'
import IconBed from '~/components/icons/IconBed.vue'
import IconBath from '~/components/icons/IconBath.vue'
import IconCar from '~/components/icons/IconCar.vue'
import IconSize from '~/components/icons/IconSize.vue'
import IconLayout from '~/components/icons/IconLayout.vue'

const RESERVE_UNIT_ID = 'ignite_reserve_unitId'
const RESERVE_LOCK_EXPIRES_AT = 'ignite_reserve_lockExpiresAt'
const RESERVE_TOKEN = 'ignite_reserve_token'

const route = useRoute()
const { user, authLoading, sessionRef } = useAuth()
const { $supabase } = useNuxtApp()
const { units, loading: unitsLoading } = useUnits()
const { effectiveNow, sync } = useServerClock()

const unitNumberDisplay = computed(() => (route.params.unitNumber as string) ?? '')
const unitId = ref('')
const lockExpiresAtMs = ref<number | null>(null)
const acquiringLock = ref(false)
const acquireError = ref<string | null>(null)
/** False until session/lock bootstrap in onMounted finishes (avoids false "unit not found" before units load). */
const reserveFlowReady = ref(false)
/** Stored for beforeunload release when tab is closed. */
const accessTokenRef = ref<string | null>(null)
let beforeUnloadHandler: (() => void) | null = null

const unit = computed(() => {
  const id = unitId.value
  const num = unitNumberDisplay.value
  if (id) return units.value.find((u) => u.id === id) ?? null
  if (num) return units.value.find((u) => u.unitNumber === num) ?? null
  return null
})

/** True if unit is locked by another user (realtime); blocks submit and shows message. */
const isLockedByOther = computed(() => {
  const u = unit.value
  if (!u?.lockedBy || !user.value) return false
  if (u.lockedBy === user.value.id) return false
  if (u.lockExpiresAt == null) return false
  return u.lockExpiresAt > effectiveNow()
})

/** Current user holds an active lock for this page (session refresh or successful acquire). */
const ownLockActive = computed(() => {
  if (!unitId.value || lockExpiresAtMs.value == null) return false
  return lockExpiresAtMs.value > effectiveNow()
})

/** Unit is sold / reserved / held — not a temporary lock by another browser. */
const isUnitNoLongerAvailableCopy = computed(() => {
  const err = acquireError.value?.trim() ?? ''
  if (err.includes('no longer available')) return true
  const u = unit.value
  if (!u || ownLockActive.value) return false
  return u.status !== 'Available'
})

/** Same copy for realtime lock + 409 from acquire-lock (no separate “API error” headline). */
const isSomeoneElseReservingCopy = computed(() => {
  if (isUnitNoLongerAvailableCopy.value) return false
  if (isLockedByOther.value) return true
  const err = acquireError.value?.trim() ?? ''
  return err.includes('currently being reserved')
})

/** Minimal text + CTA when user cannot use checkout (not when they have an active hold). */
const showBlockedMinimal = computed(() => {
  if (!reserveFlowReady.value) return false
  if (acquiringLock.value) return false
  if (ownLockActive.value) return false
  if (isUnitNoLongerAvailableCopy.value) return true
  if (isLockedByOther.value) return true
  if (acquireError.value) return true
  return false
})

const blockedTitle = computed(() => {
  if (isUnitNoLongerAvailableCopy.value) {
    return 'This unit is no longer available'
  }
  if (isSomeoneElseReservingCopy.value) {
    return 'This unit is currently being reserved'
  }
  return acquireError.value ?? 'Unable to reserve this unit'
})

const blockedDescription = computed(() => {
  if (isUnitNoLongerAvailableCopy.value) {
    return 'This unit has already been reserved or is not available for sale.'
  }
  if (isSomeoneElseReservingCopy.value) {
    return 'Someone else is currently reserving this unit. It may become available again when their session expires, or sooner if they cancel or their payment does not complete.'
  }
  return ''
})

const timeLeft = ref(0)
const expiryHandled = ref(false)

const URGENCY_THRESHOLD_SEC = 120
const showExpiryModal = ref(false)
const expiryModalPanelRef = ref<HTMLElement | null>(null)

const showUrgencyBanner = computed(() => {
  if (timeLeft.value <= 0 || timeLeft.value > URGENCY_THRESHOLD_SEC) return false
  if (!lockExpiresAtMs.value || acquireError.value || isLockedByOther.value) return false
  return true
})

function formatPrice(price: number) {
  return new Intl.NumberFormat('en-US').format(price).replace(/,/g, ' ')
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

function clearReserveSession() {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem(RESERVE_UNIT_ID)
    sessionStorage.removeItem(RESERVE_LOCK_EXPIRES_AT)
    sessionStorage.removeItem(RESERVE_TOKEN)
  }
}

/** Release lock on server and clear sessionStorage. Call when leaving the page (navigate, refresh, close, sign out). Uses keepalive so the request can complete even during unload. */
function releaseLockAndClear() {
  const id = unitId.value
  const token = accessTokenRef.value
  clearReserveSession()
  if (!id || !token) return
  try {
    fetch('/api/units/release-lock', {
      method: 'POST',
      body: JSON.stringify({ unitId: id }),
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      keepalive: true,
    }).catch(() => {})
  } catch {
    // ignore
  }
}

/** Awaitable release so navigation can wait for server to unlock the unit (then everyone sees it unlocked). */
async function releaseLockAndClearAsync(): Promise<void> {
  const id = unitId.value
  clearReserveSession()
  unitId.value = ''
  if (!id) return
  const { data: { session } } = await $supabase.auth.getSession()
  if (!session) return
  try {
    await $fetch('/api/units/release-lock', {
      method: 'POST',
      body: { unitId: id },
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
  } catch {
    // ignore
  }
}

let expiryModalKeydownCleanup: (() => void) | null = null
let expiryModalBodyOverflowUndo: (() => void) | null = null

function getExpiryModalFocusables(container: HTMLElement | null): HTMLElement[] {
  if (!container) return []
  return Array.from(
    container.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]'),
  )
}

function dismissExpiryModalToHome() {
  showExpiryModal.value = false
  navigateTo('/', { replace: true })
}

watch(showExpiryModal, (open) => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return

  expiryModalKeydownCleanup?.()
  expiryModalKeydownCleanup = null

  if (!open) {
    expiryModalBodyOverflowUndo?.()
    expiryModalBodyOverflowUndo = null
    return
  }

  const prevOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  expiryModalBodyOverflowUndo = () => {
    document.body.style.overflow = prevOverflow
  }

  void nextTick(() => {
    const panel = expiryModalPanelRef.value
    const list = getExpiryModalFocusables(panel)
    list[0]?.focus()

    const onKeydown = (e: KeyboardEvent) => {
      if (!showExpiryModal.value) return
      if (e.key === 'Escape') {
        e.preventDefault()
        dismissExpiryModalToHome()
        return
      }
      if (e.key !== 'Tab') return
      const p = expiryModalPanelRef.value
      const focusables = getExpiryModalFocusables(p)
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement as HTMLElement | null
      if (e.shiftKey) {
        if (active === first || (p && active && !p.contains(active))) {
          e.preventDefault()
          last.focus()
        }
      } else if (active === last || (p && active && !p.contains(active))) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeydown, true)
    expiryModalKeydownCleanup = () => document.removeEventListener('keydown', onKeydown, true)
  })
})

// Timer countdown (use server time so timer shows 10:00 on all devices, not 13:28 from mobile clock skew)
watch(lockExpiresAtMs, (ms) => {
  if (ms == null) {
    timeLeft.value = 0
    expiryHandled.value = false
    return
  }
  const tick = () => {
    const remaining = Math.max(0, Math.floor((ms - effectiveNow()) / 1000))
    timeLeft.value = remaining
    if (remaining <= 0) {
      if (!expiryHandled.value) {
        expiryHandled.value = true
        releaseLockAndClear()
        showExpiryModal.value = true
      }
      return
    }
    setTimeout(tick, 1000)
  }
  tick()
}, { immediate: true })

const firstName = ref('')
const lastName = ref('')
const email = ref('')
const phone = ref('')
const idPassport = ref('')
const reasonForBuying = ref('')
const profileIdPassport = ref('')
const profileReasonForBuying = ref('')
const loading = ref(false)
const canceling = ref(false)
const error = ref<string | null>(null)

declare global {
  interface Window {
    PaystackPop?: {
      new (): {
        newTransaction: (opts: {
          key: string
          email: string
          amount: number
          ref: string
          currency?: string
          onSuccess: (tx: { reference: string }) => void
          onCancel: () => void
        }) => void
      }
    }
  }
}

async function loadPaystackScript() {
  if (typeof window === 'undefined') return
  if (window.PaystackPop) return
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://js.paystack.co/v2/inline.js'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Paystack'))
    document.body.appendChild(script)
  })
}

// Phone country selector (same as AuthPortal)
const phoneCountryDropdownOpen = ref(false)
const selectedPhoneCountry = ref(
  phoneCountries.find((c) => c.countryCode === 'ZA') ?? phoneCountries[0],
)

function phoneFlagUrl(countryCode: string) {
  const code = countryCode.toLowerCase()
  return `https://flagcdn.com/w40/${code}.png`
}

function selectPhoneCountry(c: { dialCode: string; countryCode: string }) {
  selectedPhoneCountry.value = c
}

function onPhoneInput(event: Event) {
  const target = event.target as HTMLInputElement
  let digits = target.value.replace(/\D/g, '')
  if (digits.startsWith('0')) digits = digits.substring(1)
  const current = selectedPhoneCountry.value
  if (digits.startsWith(current.dialCode)) {
    phone.value = digits.slice(current.dialCode.length)
  } else {
    phone.value = digits
  }
  if (phone.value.startsWith('0')) {
    phone.value = phone.value.substring(1)
  }
}

// Redirect if not logged in — delay slightly so client session can rehydrate after navigation
watch([user, authLoading], ([u, loading]) => {
  if (loading) return
  if (u) return
  const t = setTimeout(() => {
    if (!user.value) navigateTo('/')
  }, 150)
  return () => clearTimeout(t)
}, { immediate: true })

// Read reservation context: from sessionStorage (refresh) or acquire lock on load (just clicked Reserve Now).
// Show timer immediately when we have lockExpiresAt (same as unit overlay for other users); sync server clock in background.
onMounted(async () => {
  // Token passed from list/unit page; keep in sessionStorage until we leave so refresh still has it
  if (typeof sessionStorage !== 'undefined') {
    const storedToken = sessionStorage.getItem(RESERVE_TOKEN)
    if (storedToken) accessTokenRef.value = storedToken
  }
  if (sessionRef.value) accessTokenRef.value = sessionRef.value.access_token
  $supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) accessTokenRef.value = session.access_token
  })

  // Preload Paystack script so the popup appears faster on click
  loadPaystackScript().catch(() => {})

  // Load ID/Passport and Reason for Buying from profiles so reservation can reuse signup data
  try {
    if (user.value?.id) {
      const { data } = await $supabase
        .from('profiles')
        .select('id_passport_number, reason_for_buying')
        .eq('id', user.value.id)
        .single()
      if (data) {
        profileIdPassport.value = (data.id_passport_number as string | null) ?? ''
        profileReasonForBuying.value = (data.reason_for_buying as string | null) ?? ''
      }
    }
  } catch {
    // ignore profile fetch errors; reservation will fall back to form values
  }

  const setupBeforeUnload = () => {
    beforeUnloadHandler = () => {
      // Do not release lock when redirecting to checkout (payment-cancel or webhook will handle cleanup)
      if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('ignite_reservation_redirecting')) {
        return
      }
      const id = sessionStorage.getItem(RESERVE_UNIT_ID) || unitId.value
      const token = accessTokenRef.value
      if (id && token) {
        fetch('/api/units/release-lock', {
          method: 'POST',
          body: JSON.stringify({ unitId: id }),
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          keepalive: true,
        }).catch(() => {})
      }
      clearReserveSession()
    }
    window.addEventListener('beforeunload', beforeUnloadHandler)
  }

  if (typeof sessionStorage !== 'undefined') {
    await new Promise<void>((resolve) => {
      if (!unitsLoading.value) {
        resolve()
        return
      }
      const stop = watch(
        () => unitsLoading.value,
        (v) => {
          if (!v) {
            stop()
            resolve()
          }
        },
      )
    })

    const id = sessionStorage.getItem(RESERVE_UNIT_ID) ?? ''
    const expires = sessionStorage.getItem(RESERVE_LOCK_EXPIRES_AT) ?? ''

    if (id.trim() && expires) {
      const storedUnit = units.value.find((u) => u.id === id.trim())
      if (storedUnit && storedUnit.status !== 'Available') {
        acquireError.value = 'This unit is no longer available for reservation.'
        clearReserveSession()
        reserveFlowReady.value = true
        return
      }
      // Returning (refresh) or just navigated from list: show timer immediately like the unit overlay for others
      unitId.value = id.trim()
      const parsed = new Date(expires).getTime()
      const ms = Number.isNaN(parsed) ? null : parsed
      lockExpiresAtMs.value = ms
      setupBeforeUnload()
      if (ms != null) sync().catch(() => {}) // correct clock in background; timer already visible
      reserveFlowReady.value = true
    } else {
      // Just clicked Reserve Now: acquire lock on this page
      const num = unitNumberDisplay.value
      if (!num) {
        navigateTo('/', { replace: true })
        return
      }
      const matchedUnit = units.value.find((u) => u.unitNumber === num)
      if (!matchedUnit) {
        acquireError.value = 'Unit not found. Please go back and try again.'
        reserveFlowReady.value = true
        return
      }
      if (matchedUnit.status !== 'Available') {
        acquireError.value = 'This unit is no longer available for reservation.'
        reserveFlowReady.value = true
        return
      }
      acquiringLock.value = true
      acquireError.value = null
      try {
        const { data: { session } } = await $supabase.auth.getSession()
        if (!session) {
          acquireError.value = 'Session expired. Please sign in again.'
          return
        }
        // Acquire lock only; server clock offset is shared and usually already set from the list page
        const res = await $fetch<{ lockExpiresAt?: string }>('/api/units/acquire-lock', {
          method: 'POST',
          body: { unitId: matchedUnit.id },
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        accessTokenRef.value = session.access_token
        sync().catch(() => {}) // fire-and-forget for direct visits; list page already synced
        unitId.value = matchedUnit.id
        sessionStorage.setItem(RESERVE_UNIT_ID, matchedUnit.id)
        if (res?.lockExpiresAt) {
          sessionStorage.setItem(RESERVE_LOCK_EXPIRES_AT, res.lockExpiresAt)
          const ms = new Date(res.lockExpiresAt).getTime()
          lockExpiresAtMs.value = Number.isNaN(ms) ? null : ms
        } else {
          lockExpiresAtMs.value = null
        }
        setupBeforeUnload()
      } catch (e: any) {
        const msg = e?.data?.message || e?.message || 'Could not reserve unit. It may have been taken.'
        acquireError.value = msg
      } finally {
        acquiringLock.value = false
        reserveFlowReady.value = true
      }
    }
  } else {
    reserveFlowReady.value = true
  }

  if (user.value) {
    const u = user.value
    if (u.firstName) firstName.value = u.firstName
    if (u.lastName) lastName.value = u.lastName
    if (!firstName.value && !lastName.value && u.displayName) {
      const display = u.displayName.trim()
      const firstSpace = display.indexOf(' ')
      if (firstSpace > 0) {
        firstName.value = display.slice(0, firstSpace)
        lastName.value = display.slice(firstSpace + 1).trim()
      } else {
        firstName.value = display
      }
    }
    if (u.email) email.value = u.email
    if (u.phone) {
      const raw = u.phone.trim()
      let digits = raw.replace(/\D/g, '')
      if (digits.startsWith('0')) digits = digits.substring(1)
      const za = phoneCountries.find((c) => c.countryCode === 'ZA')
      if (za && digits.startsWith(za.dialCode) && digits.length > za.dialCode.length) {
        selectedPhoneCountry.value = za
        phone.value = digits.slice(za.dialCode.length).replace(/^0+/, '')
      } else if (digits.length <= 15) {
        phone.value = digits
      }
    }
  }
})

// Close phone dropdown when clicking outside
watch(phoneCountryDropdownOpen, (open) => {
  if (!open) return
  const close = () => {
    phoneCountryDropdownOpen.value = false
    document.removeEventListener('mousedown', close)
  }
  document.addEventListener('mousedown', close)
})

// Release lock when leaving the page (navigate to another page, refresh will have cleared via beforeunload)
onBeforeUnmount(() => {
  expiryModalKeydownCleanup?.()
  expiryModalKeydownCleanup = null
  expiryModalBodyOverflowUndo?.()
  expiryModalBodyOverflowUndo = null
  if (beforeUnloadHandler) {
    window.removeEventListener('beforeunload', beforeUnloadHandler)
    beforeUnloadHandler = null
  }
  releaseLockAndClear()
})

// Wait for server to release the lock before allowing navigation (so the unit unlocks for everyone).
// When user clicked Cancel we already fired release in onCancel, so skip the wait and navigate immediately.
onBeforeRouteLeave(async (_to, _from, next) => {
  if (canceling.value) {
    next()
    return
  }
  await releaseLockAndClearAsync()
  next()
})

async function onCancel() {
  canceling.value = true
  const id = unitId.value
  let token = accessTokenRef.value
  if (!token) {
    const { data: { session } } = await $supabase.auth.getSession()
    token = session?.access_token ?? null
  }
  if (id && token) {
    try {
      await $fetch('/api/units/release-lock', {
        method: 'POST',
        body: { unitId: id },
        headers: { Authorization: `Bearer ${token}` },
      })
    } catch {
      // Stored token may be invalid/expired (e.g. 401); retry with fresh session so we still unlock
      const { data: { session } } = await $supabase.auth.getSession()
      if (session?.access_token) {
        try {
          await $fetch('/api/units/release-lock', {
            method: 'POST',
            body: { unitId: id },
            headers: { Authorization: `Bearer ${session.access_token}` },
          })
        } catch {
          // ignore
        }
      }
    }
  } else if (id) {
    // No token at all (e.g. refreshed page); must wait for getSession to unlock
    const { data: { session } } = await $supabase.auth.getSession()
    if (session?.access_token) {
      try {
        await $fetch('/api/units/release-lock', {
          method: 'POST',
          body: { unitId: id },
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
      } catch {
        // ignore
      }
    }
  }
  clearReserveSession()
  await navigateTo('/')
}

async function onSubmit() {
  if (!unitId.value || !unitNumberDisplay.value || isLockedByOther.value) return
  error.value = null
  loading.value = true
  try {
    // Ensure required fields are populated even though we no longer show the form
    if (!firstName.value && user.value?.firstName) firstName.value = user.value.firstName
    if (!lastName.value && user.value?.lastName) lastName.value = user.value.lastName
    if (!email.value && user.value?.email) email.value = user.value.email
    if (!phone.value && user.value?.phone) {
      const raw = user.value.phone.trim()
      let digits = raw.replace(/\D/g, '')
      if (digits.startsWith('0')) digits = digits.substring(1)
      const za = phoneCountries.find((c) => c.countryCode === 'ZA')
      if (za && digits.startsWith(za.dialCode) && digits.length > za.dialCode.length) {
        selectedPhoneCountry.value = za
        phone.value = digits.slice(za.dialCode.length).replace(/^0+/, '')
      } else if (digits.length <= 15) {
        phone.value = digits
      }
    }
    if (!idPassport.value) idPassport.value = 'Pending'
    if (!reasonForBuying.value) reasonForBuying.value = 'Not specified'

    // Match portal: get session at submit time, and refresh if missing (portal does this in reservationService)
    let token = accessTokenRef.value?.trim() ?? null
    if (!token) {
      try {
        const { data: { session } } = await $supabase.auth.getSession()
        token = session?.access_token?.trim() ?? null
      } catch {
        // getSession can timeout (NavigatorLockAcquireTimeoutError); try localStorage fallback
      }
    }
    if (!token) {
      const { data: { session: refreshed } } = await $supabase.auth.refreshSession()
      token = refreshed?.access_token?.trim() ?? null
      if (token) accessTokenRef.value = token
    }
    if (!token && typeof localStorage !== 'undefined') {
      // Fallback when getSession/refreshSession fail (e.g. lock timeout): read same storage Supabase uses
      const config = useRuntimeConfig()
      const url = (config.public.supabaseUrl as string)?.trim() ?? ''
      const projectRef = url.replace(/^https?:\/\//, '').split('.')[0]
      const storageKey = projectRef ? `sb-${projectRef}-auth-token` : null
      if (storageKey) {
        try {
          const raw = localStorage.getItem(storageKey)
          const parsed = raw ? JSON.parse(raw) : null
          const accessToken = parsed?.currentSession?.access_token ?? parsed?.access_token ?? null
          if (accessToken) {
            token = accessToken.trim()
            accessTokenRef.value = token
          }
        } catch {
          // ignore
        }
      }
    }
    if (!token) {
      error.value = 'Session expired. Please sign in again.'
      loading.value = false
      return
    }

    const config = useRuntimeConfig()
    const supabaseUrl = (config.public.supabaseUrl as string)?.trim()
    const supabaseAnonKey = (config.public.supabaseAnonKey as string)?.trim()
    const paystackKey = (config.public.paystackPublicKey as string | undefined)?.trim() ?? ''
    if (!supabaseUrl || !supabaseAnonKey || !paystackKey) {
      error.value = 'App configuration error. Please try again.'
      loading.value = false
      return
    }

    const idPassportToSend = (profileIdPassport.value || idPassport.value).trim()
    const reasonToSend = (profileReasonForBuying.value || reasonForBuying.value).trim()

    const doSubmit = (accessToken: string) =>
      $fetch<{
        paymentUrl?: string
        paymentReference?: string
        error?: string
        message?: string
        email?: string
        amountInCents?: number
        currency?: string
      }>(
        `${supabaseUrl}/functions/v1/submit-reservation`,
        {
          method: 'POST',
          body: {
            name: firstName.value.trim(),
            surname: lastName.value.trim(),
            email: email.value.trim(),
            phone: `+${selectedPhoneCountry.value.dialCode}${phone.value}`.trim(),
            idPassport: idPassportToSend,
            reasonForBuying: reasonToSend,
            unitId: unitId.value,
            unitNumber: unitNumberDisplay.value,
          },
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
            apikey: supabaseAnonKey,
          },
        },
      )

    let res: Awaited<ReturnType<typeof doSubmit>>
    try {
      res = await doSubmit(token)
    } catch (firstErr: any) {
      if (firstErr?.statusCode === 401 || firstErr?.status === 401) {
        const { data: { session } } = await $supabase.auth.refreshSession()
        const freshToken = session?.access_token?.trim() ?? null
        if (freshToken && freshToken !== token) {
          accessTokenRef.value = freshToken
          res = await doSubmit(freshToken)
        } else {
          throw firstErr
        }
      } else {
        throw firstErr
      }
    }

    const payload = res
    if (payload?.error) {
      error.value = payload.error || 'Something went wrong.'
      return
    }

    // Prefer inline Paystack popup using payment reference returned by submit-reservation
    if (
      paystackKey &&
      payload?.paymentReference &&
      payload?.email &&
      typeof payload?.amountInCents === 'number'
    ) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('payment_reference', payload.paymentReference)
      }
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('ignite_reservation_redirecting', unitId.value || 'true')
      }
      try {
        await loadPaystackScript()
        const Pop = window.PaystackPop
        if (!Pop) {
          throw new Error('Paystack popup not available')
        }
        const paystack = new Pop()
        paystack.newTransaction({
          key: paystackKey,
          email: payload.email,
          amount: payload.amountInCents,
          ref: payload.paymentReference,
          currency: payload.currency || 'ZAR',
          onSuccess: () => {
            error.value = null
            navigateTo('/payment-success')
          },
          onCancel: () => {
            // Best-effort cancel hook so Zoho + Supabase are updated
            $fetch(`${supabaseUrl}/functions/v1/cancel-reservation`, {
              method: 'POST',
              body: { paymentReference: payload.paymentReference },
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
                apikey: supabaseAnonKey,
              },
            }).catch(() => {})
            navigateTo('/', { replace: true })
          },
        })
      } catch (e: any) {
        error.value = e?.message || 'Could not open payment. Please try again.'
      }
      return
    }

    error.value =
      payload?.message ?? 'Reservation created. Payment link not available — please contact support.'
  } catch (e: any) {
    const status = e?.statusCode ?? e?.status
    const msg = e?.data?.error ?? e?.data?.message ?? e?.message
    error.value = status === 401 ? 'Session expired. Please sign in again.' : (msg || 'Could not submit reservation.')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.reserve-expiry-enter-active,
.reserve-expiry-leave-active {
  transition: opacity 0.22s ease;
}
.reserve-expiry-enter-from,
.reserve-expiry-leave-to {
  opacity: 0;
}
.reserve-expiry-enter-active .reserve-expiry-panel,
.reserve-expiry-leave-active .reserve-expiry-panel {
  transition: transform 0.22s ease, opacity 0.22s ease;
}
.reserve-expiry-enter-from .reserve-expiry-panel,
.reserve-expiry-leave-to .reserve-expiry-panel {
  opacity: 0;
  transform: scale(0.97) translateY(8px);
}

/* Bottom inset matches .browsing-anchor and .chat-widget (1.25rem) */
.reserve-urgency-banner {
  bottom: 1.25rem;
  transform: translateX(-50%);
}

.reserve-urgency-enter-active.reserve-urgency-banner,
.reserve-urgency-leave-active.reserve-urgency-banner {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.reserve-urgency-enter-from.reserve-urgency-banner,
.reserve-urgency-leave-to.reserve-urgency-banner {
  opacity: 0;
  transform: translateX(-50%) translateY(10px);
}
.reserve-urgency-enter-to.reserve-urgency-banner,
.reserve-urgency-leave-from.reserve-urgency-banner {
  transform: translateX(-50%) translateY(0);
}
</style>
