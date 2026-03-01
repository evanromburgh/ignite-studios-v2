<template>
  <div class="min-h-screen">
    <div v-if="!user || !unitNumberDisplay" class="flex items-center justify-center min-h-[60vh]">
      <p class="text-zinc-500">Redirecting…</p>
    </div>

    <div v-else class="pt-32 sm:pt-48 pb-0">
      <div class="max-w-[1400px] mx-auto px-5 sm:px-8">
        <div v-if="acquireError" class="mb-8 p-6 rounded-xl border border-orange-500/30 bg-orange-500/10 text-orange-200">
          <p class="text-sm font-bold uppercase tracking-wide">{{ acquireError }}</p>
          <NuxtLink to="/" class="inline-block mt-4 text-[11px] font-black uppercase text-white hover:underline">Browse units</NuxtLink>
        </div>
        <div v-else-if="isLockedByOther" class="mb-8 p-6 rounded-xl border border-orange-500/30 bg-orange-500/10 text-orange-200">
          <p class="text-sm font-bold uppercase tracking-wide">This unit is currently being reserved</p>
          <p class="mt-2 text-[13px] text-zinc-400">Someone else has this unit in their reservation. It will be available again when their session expires.</p>
          <NuxtLink to="/" class="inline-block mt-4 text-[11px] font-black uppercase text-white hover:underline">Browse units</NuxtLink>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-16">
          <!-- Form column -->
          <div class="lg:col-span-2">
            <header class="mb-8 sm:mb-16">
              <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-2">
                <h1 class="text-2xl sm:text-3xl md:text-5xl font-semibold text-white tracking-tighter leading-none">
                  Reserve Unit {{ unitNumberDisplay }}
                </h1>
                <div v-if="acquiringLock" class="flex items-center gap-3 sm:gap-4">
                  <span class="text-[12px] sm:text-[13px] text-zinc-500 font-medium">Securing your reservation…</span>
                </div>
                <div v-else-if="lockExpiresAtMs" class="flex items-center gap-3 sm:gap-4">
                  <div class="relative flex h-2 w-2 flex-shrink-0">
                    <span
                      class="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping"
                      :class="timerPingClass"
                    />
                    <span
                      class="relative inline-flex rounded-full h-2 w-2"
                      :class="timerMainClass"
                    />
                  </div>
                  <p class="text-[12px] sm:text-[13px] md:text-[15px] font-medium text-zinc-500 tracking-tight flex items-center gap-2 whitespace-nowrap">
                    <span class="uppercase tracking-widest font-bold text-[10px]">Reservation Expires in</span>
                    <span class="text-white font-bold tabular-nums bg-white/5 px-3 sm:px-4 py-1.5 rounded-lg border border-white/10">
                      {{ formatTime(timeLeft) }}
                    </span>
                  </p>
                </div>
              </div>
            </header>

            <form class="space-y-5 w-full mb-0" @submit.prevent="onSubmit">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-2">
                  <label class="text-[10px] sm:text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] sm:tracking-[0.1em] ml-1">First Name</label>
                  <input
                    v-model="firstName"
                    required
                    type="text"
                    class="w-full bg-white/[0.03] border border-white/5 rounded-lg px-6 h-[46px] py-0 leading-[46px] focus:border-zinc-500 focus:outline-none text-zinc-200 text-base sm:text-[0.875rem] transition-all"
                  />
                </div>
                <div class="space-y-2">
                  <label class="text-[10px] sm:text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] sm:tracking-[0.1em] ml-1">Last Name</label>
                  <input
                    v-model="lastName"
                    required
                    type="text"
                    class="w-full bg-white/[0.03] border border-white/5 rounded-lg px-6 h-[46px] py-0 leading-[46px] focus:border-zinc-500 focus:outline-none text-zinc-200 text-base sm:text-[0.875rem] transition-all"
                  />
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div class="space-y-2">
                  <label class="text-[10px] sm:text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] sm:tracking-[0.1em] ml-1">Phone Number</label>
                  <div class="relative">
                    <div class="flex items-center bg-white/[0.03] border border-white/5 rounded-lg overflow-hidden focus-within:border-zinc-500 transition-all h-[46px]">
                      <div class="relative shrink-0 h-full flex items-center">
                        <button
                          type="button"
                          class="h-full flex items-center gap-1.5 pl-4 pr-2 text-zinc-400 hover:text-zinc-200 transition-colors"
                          @click.stop="phoneCountryDropdownOpen = !phoneCountryDropdownOpen"
                        >
                          <span class="inline-flex items-center justify-center w-6 h-6 rounded-full overflow-hidden flex-shrink-0 bg-white/5" aria-hidden="true">
                            <img :src="phoneFlagUrl(selectedPhoneCountry.countryCode)" :alt="selectedPhoneCountry.countryCode" class="w-full h-full object-cover">
                          </span>
                          <span class="text-[0.875rem]">{{ formatPhoneDialCode(selectedPhoneCountry.dialCode) }} ({{ selectedPhoneCountry.countryCode }})</span>
                          <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                      <input
                        :value="phone"
                        required
                        type="tel"
                        maxlength="15"
                        class="flex-1 h-full py-0 pl-2 pr-6 bg-transparent text-zinc-200 focus:outline-none text-base sm:text-[0.875rem] leading-[46px] min-w-0"
                        @input="onPhoneInput"
                        @focus="phoneCountryDropdownOpen = false"
                      >
                    </div>
                    <div
                      v-if="phoneCountryDropdownOpen"
                      class="absolute top-full left-0 mt-1 z-[100] max-h-64 overflow-auto rounded-lg border border-white/10 bg-[#0b0b0b] shadow-xl py-1 min-w-[14rem]"
                    >
                      <button
                        v-for="(c, i) in phoneCountries"
                        :key="i"
                        type="button"
                        class="w-full flex items-center gap-2 px-4 py-2 text-left text-sm text-zinc-300 hover:bg-white/10 hover:text-white transition-colors"
                        @click.stop="selectPhoneCountry(c); phoneCountryDropdownOpen = false"
                      >
                        <span class="inline-flex items-center justify-center w-6 h-6 rounded-full overflow-hidden flex-shrink-0 bg-white/5">
                          <img :src="phoneFlagUrl(c.countryCode)" :alt="c.countryCode" class="w-full h-full object-cover">
                        </span>
                        <span>{{ formatPhoneDialCode(c.dialCode) }} ({{ c.countryCode }})</span>
                      </button>
                    </div>
                  </div>
                </div>
                <div class="space-y-2">
                  <label class="text-[10px] sm:text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] sm:tracking-[0.1em] ml-1">Email Address</label>
                  <input
                    v-model="email"
                    required
                    type="email"
                    class="w-full bg-white/[0.03] border border-white/5 rounded-lg px-6 h-[46px] py-0 leading-[46px] focus:border-zinc-500 focus:outline-none text-zinc-200 text-base sm:text-[0.875rem] transition-all"
                  />
                </div>
              </div>

              <div class="space-y-2">
                <label class="text-[10px] sm:text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] sm:tracking-[0.1em] ml-1">ID / Passport Number</label>
                <input
                  v-model="idPassport"
                  required
                  type="text"
                  class="w-full bg-white/[0.03] border border-white/5 rounded-lg px-6 h-[46px] py-0 leading-[46px] focus:border-zinc-500 focus:outline-none text-zinc-200 text-base sm:text-[0.875rem] transition-all"
                />
              </div>

              <div class="space-y-2">
                <label class="text-[10px] sm:text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] sm:tracking-[0.1em] ml-1">Reason for Buying</label>
                <select
                  v-model="reasonForBuying"
                  required
                  class="w-full bg-white/[0.03] border border-white/5 rounded-lg px-6 h-[46px] pt-[13px] pb-[13px] leading-[1.25] focus:border-zinc-500 focus:outline-none text-zinc-200 text-base sm:text-[0.875rem] transition-all appearance-none cursor-pointer"
                >
                  <option value="" disabled class="bg-zinc-900">Select reason</option>
                  <option value="Primary Residence" class="bg-zinc-900">Primary Residence</option>
                  <option value="Investment Property" class="bg-zinc-900">Investment Property</option>
                </select>
              </div>

              <div v-if="error" class="text-[10px] font-bold text-red-400 py-2">{{ error }}</div>

              <div class="flex flex-col sm:flex-row gap-3 sm:gap-6 pt-4">
                <button
                  type="submit"
                  :disabled="loading || timeLeft <= 0 || isLockedByOther || acquiringLock || !!acquireError"
                  class="w-full sm:w-auto sm:min-w-[160px] sm:flex-1 h-[46px] flex items-center justify-center rounded-lg text-[11px] font-black uppercase tracking-normal text-center leading-none transition-all bg-zinc-100 text-zinc-950 hover:bg-white shadow-xl disabled:bg-zinc-800 disabled:text-zinc-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-zinc-800 disabled:shadow-none"
                >
                  <span v-if="loading">PROCESSING...</span>
                  <span v-else-if="acquiringLock">SECURING...</span>
                  <span v-else-if="isLockedByOther">RESERVED BY SOMEONE ELSE</span>
                  <span v-else-if="timeLeft <= 0">RESERVATION EXPIRED</span>
                  <span v-else>PROCEED TO PAYMENT</span>
                </button>
                <button
                  type="button"
                  :disabled="canceling"
                  class="px-10 h-[46px] border border-white/10 text-zinc-300 text-[11px] font-black uppercase tracking-normal rounded-lg hover:bg-white/5 transition-all leading-none flex items-center justify-center disabled:opacity-70 disabled:cursor-wait"
                  @click="onCancel"
                >
                  {{ canceling ? 'CANCELING...' : 'CANCEL' }}
                </button>
              </div>
            </form>
          </div>

          <!-- Summary column -->
          <div class="lg:col-span-1">
            <div class="lg:sticky lg:top-32 flex flex-col gap-8 sm:gap-10">
              <div class="!bg-white/[0.01] hover:!bg-white/[0.03] p-6 sm:p-10 relative overflow-hidden rounded-2xl border border-white/5 hover:border-white/10 shadow-xl transition-all duration-500">
                <div class="absolute top-0 right-0 w-32 h-32 bg-white/[0.02] rounded-full -mr-16 -mt-16 blur-3xl transition-all" aria-hidden="true" />
                <h2 class="text-lg sm:text-xl font-black text-white mb-6 sm:mb-8 tracking-tighter leading-tight">
                  Reservation Summary
                </h2>
                <div class="flex flex-col">
                  <div class="flex items-center justify-between mb-1 sm:text-[0.875rem] sm:leading-[1.1rem]">
                    <span class="text-zinc-500 font-medium text-sm tracking-tight">Unit Number</span>
                    <span class="text-zinc-100 font-bold text-sm text-right whitespace-nowrap sm:text-[0.875rem] sm:leading-[1.1rem]">Unit {{ unitNumberDisplay }}</span>
                  </div>
                  <template v-if="unit">
                    <div class="flex items-center justify-between mb-1 sm:text-[0.875rem] sm:leading-[1.1rem]">
                      <span class="text-zinc-500 font-medium text-sm tracking-tight">Bedrooms</span>
                      <span class="text-zinc-100 font-bold text-sm text-right whitespace-nowrap sm:text-[0.875rem] sm:leading-[1.1rem]">{{ unit.bedrooms }}</span>
                    </div>
                    <div class="flex items-center justify-between mb-1 sm:text-[0.875rem] sm:leading-[1.1rem]">
                      <span class="text-zinc-500 font-medium text-sm tracking-tight">Bathrooms</span>
                      <span class="text-zinc-100 font-bold text-sm text-right whitespace-nowrap sm:text-[0.875rem] sm:leading-[1.1rem]">{{ unit.bathrooms }}</span>
                    </div>
                    <div class="flex items-center justify-between mb-1 sm:text-[0.875rem] sm:leading-[1.1rem]">
                      <span class="text-zinc-500 font-medium text-sm tracking-tight">Parking</span>
                      <span class="text-zinc-100 font-bold text-sm text-right whitespace-nowrap sm:text-[0.875rem] sm:leading-[1.1rem]">{{ unit.parking }}</span>
                    </div>
                    <div class="flex items-center justify-between mb-1 sm:text-[0.875rem] sm:leading-[1.1rem]">
                      <span class="text-zinc-500 font-medium text-sm tracking-tight">Unit Type</span>
                      <span class="text-zinc-100 font-bold text-sm text-right whitespace-nowrap sm:text-[0.875rem] sm:leading-[1.1rem]">{{ unit.unitType }}</span>
                    </div>
                    <div class="flex items-center justify-between mb-1 sm:text-[0.875rem] sm:leading-[1.1rem]">
                      <span class="text-zinc-500 font-medium text-sm tracking-tight">Unit Size</span>
                      <span class="text-zinc-100 font-bold text-sm text-right whitespace-nowrap sm:text-[0.875rem] sm:leading-[1.1rem]">{{ unit.sizeSqm }} m²</span>
                    </div>
                    <div class="flex items-center justify-between mb-6 sm:mb-8 sm:text-[0.875rem] sm:leading-[1.1rem]">
                      <span class="text-zinc-500 font-medium text-sm tracking-tight">Selling Price</span>
                      <span class="text-zinc-100 font-bold text-sm text-right whitespace-nowrap sm:text-[0.875rem] sm:leading-[1.1rem]">R {{ formatPrice(unit.price) }}</span>
                    </div>
                  </template>
                  <div class="pt-6 sm:pt-8 border-t border-white/10">
                    <div class="flex items-center justify-between">
                      <span class="text-white font-black text-base sm:text-xl tracking-tighter">Total Payable Now</span>
                      <span class="text-white text-base sm:text-xl font-black tracking-tighter text-right whitespace-nowrap">R {{ formatPrice(CONFIG.RESERVATION_DEPOSIT) }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="px-2 sm:pl-2 sm:pr-20">
                <p class="text-[11px] sm:text-[12px] text-zinc-500 font-medium leading-relaxed tracking-tight text-left">
                  <span class="text-white font-black">Note:</span> This reservation deposit secures your unit for 7 days. Our sales team will contact you within 24 hours to complete the purchase process.
                </p>
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

const RESERVE_UNIT_ID = 'ignite_reserve_unitId'
const RESERVE_LOCK_EXPIRES_AT = 'ignite_reserve_lockExpiresAt'
const RESERVE_TOKEN = 'ignite_reserve_token'

const route = useRoute()
const { user, authLoading, sessionRef } = useAuth()
const { $supabase } = useNuxtApp()
const { units } = useUnits()
const { effectiveNow, sync } = useServerClock()

const unitNumberDisplay = computed(() => (route.params.unitNumber as string) ?? '')
const unitId = ref('')
const lockExpiresAtMs = ref<number | null>(null)
const acquiringLock = ref(false)
const acquireError = ref<string | null>(null)
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

const timeLeft = ref(0)
const timerMainClass = computed(() => {
  if (timeLeft.value > 420) return 'bg-emerald-500'
  if (timeLeft.value > 180) return 'bg-amber-500'
  return 'bg-red-500'
})
const timerPingClass = computed(() => {
  if (timeLeft.value > 420) return 'bg-emerald-400'
  if (timeLeft.value > 180) return 'bg-amber-400'
  return 'bg-red-400'
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

// Timer countdown (use server time so timer shows 10:00 on all devices, not 13:28 from mobile clock skew)
watch(lockExpiresAtMs, (ms) => {
  if (ms == null) {
    timeLeft.value = 0
    return
  }
  const tick = () => {
    const remaining = Math.max(0, Math.floor((ms - effectiveNow()) / 1000))
    timeLeft.value = remaining
    if (remaining > 0) {
      setTimeout(tick, 1000)
    }
  }
  tick()
}, { immediate: true })

const firstName = ref('')
const lastName = ref('')
const email = ref('')
const phone = ref('')
const idPassport = ref('')
const reasonForBuying = ref('')
const loading = ref(false)
const canceling = ref(false)
const error = ref<string | null>(null)

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

  const setupBeforeUnload = () => {
    beforeUnloadHandler = () => {
      // Do not release lock when redirecting to PayFast (payment-cancel or webhook will handle cleanup)
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
    const id = sessionStorage.getItem(RESERVE_UNIT_ID) ?? ''
    const expires = sessionStorage.getItem(RESERVE_LOCK_EXPIRES_AT) ?? ''

    if (id.trim() && expires) {
      // Returning (refresh) or just navigated from list: show timer immediately like the unit overlay for others
      unitId.value = id.trim()
      const parsed = new Date(expires).getTime()
      const ms = Number.isNaN(parsed) ? null : parsed
      lockExpiresAtMs.value = ms
      setupBeforeUnload()
      if (ms != null) sync().catch(() => {}) // correct clock in background; timer already visible
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
        return
      }
      acquiringLock.value = true
      acquireError.value = null
      try {
        const { data: { session } } = await $supabase.auth.getSession()
        if (!session) {
          acquireError.value = 'Session expired. Please sign in again.'
          acquiringLock.value = false
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
      }
    }
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
    if (!supabaseUrl || !supabaseAnonKey) {
      error.value = 'App configuration error. Please try again.'
      loading.value = false
      return
    }

    const doSubmit = (accessToken: string) =>
      $fetch<{ paymentUrl?: string; paymentReference?: string; error?: string; message?: string }>(
        `${supabaseUrl}/functions/v1/submit-reservation`,
        {
          method: 'POST',
          body: {
            name: firstName.value.trim(),
            surname: lastName.value.trim(),
            email: email.value.trim(),
            phone: `+${selectedPhoneCountry.value.dialCode}${phone.value}`.trim(),
            idPassport: idPassport.value.trim(),
            reasonForBuying: reasonForBuying.value.trim(),
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

    if (payload?.paymentUrl) {
      if (typeof localStorage !== 'undefined' && payload.paymentReference) {
        localStorage.setItem('payment_reference', payload.paymentReference)
      }
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('ignite_reservation_redirecting', unitId.value || 'true')
      }
      window.location.href = payload.paymentUrl
      return
    }

    error.value = payload?.message ?? 'Reservation created. Payment link not available — please contact support.'
  } catch (e: any) {
    const status = e?.statusCode ?? e?.status
    const msg = e?.data?.error ?? e?.data?.message ?? e?.message
    error.value = status === 401 ? 'Session expired. Please sign in again.' : (msg || 'Could not submit reservation.')
  } finally {
    loading.value = false
  }
}
</script>
