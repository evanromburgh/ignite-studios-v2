<template>
  <div>
    <AuthPortal v-if="!user && !authLoading" />

    <div v-else class="min-h-screen">
      <!-- One-time toast after returning from payment cancel (bottom-right, compact) -->
      <!-- One-time toast after returning from payment cancel (bottom-right, compact) -->
      <div
        v-if="showPaymentCancelledToast"
        class="fixed bottom-4 right-4 z-[100] max-w-[18rem] rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-200 px-3 py-2 flex items-center justify-between gap-2 shadow-lg"
      >
        <p class="text-xs font-medium whitespace-nowrap">Payment cancelled. The unit remains available.</p>
        <button
          type="button"
          class="shrink-0 text-amber-400 hover:text-white transition-colors p-0.5"
          aria-label="Dismiss"
          @click="showPaymentCancelledToast = false"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <!-- Hero header: dark overlay over blurred bg, title + unit count; height so bg ends at filter middle -->
      <header class="relative w-full overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black" aria-hidden="true" />
        <div class="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920')] bg-cover bg-center opacity-30" style="filter: blur(2px);" aria-hidden="true" />
        <div class="relative px-5 sm:px-8 md:px-24 lg:px-40 xl:px-56 pt-[15rem] pb-[15rem]">
          <h1 class="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight mb-2">
            Browse Units
          </h1>
          <p class="text-base sm:text-lg text-zinc-400 font-medium">
            {{ totalUnits }} APARTMENTS
          </p>
        </div>
      </header>

      <!-- Filter controls section -->
      <section class="w-[75%] mx-auto -mt-[9.5rem] pb-6">
        <FilterBar
          :filters="filters"
          :view-mode="viewMode"
          :available-count="availableCount"
          :total-units="totalUnits"
          :unit-types="unitTypes"
          :floor-options="floorOptions"
          :direction-options="directionOptions"
          :sample-unit-numbers="sampleUnitNumbers"
          @update:filters="filters = $event"
          @update:view-mode="viewMode = $event"
        />
      </section>

      <!-- Unit results section -->
      <section class="w-[75%] mx-auto pb-10">
        <div v-if="unitsLoading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
          <div
            v-for="i in 8"
            :key="i"
            class="aspect-[3/4] bg-white/[0.03] rounded-xl border border-white/5"
          />
        </div>

        <div v-else-if="unitsError" class="text-red-400 text-sm">
          {{ unitsError }}
        </div>

        <div v-else-if="displayedUnits.length === 0" class="text-center py-48 bg-white/[0.01] backdrop-blur-3xl rounded-xl border border-white/5 shadow-inner">
          <h3 class="text-2xl md:text-3xl font-black text-zinc-300 uppercase tracking-[0.5em]">No Matches</h3>
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <UnitCard
            v-for="unit in displayedUnits"
            :key="unit.id"
            :unit="unit"
            :is-wishlisted="wishlistIds.includes(unit.id)"
            :server-clock-offset-ms="serverClockOffsetMs"
            :current-user-id="user?.id ?? null"
            :reserving-unit-id="reservingUnitId"
            @select="onSelectUnit"
            @reserve="onReserveUnit"
            @toggle-wishlist="onToggleWishlist"
          />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import AuthPortal from '~/components/AuthPortal.vue'
import UnitCard from '~/components/UnitCard.vue'
import FilterBar from '~/components/FilterBar.vue'
import { useAuth } from '~/composables/useAuth'
import { useUnits } from '~/composables/useUnits'
import { useUnitFilters } from '~/composables/useUnitFilters'
import { useWishlist } from '~/composables/useWishlist'
import type { Unit, SearchFilters, ViewMode } from '~/types'

const { user, authLoading, sessionRef } = useAuth()
const { units, loading: unitsLoading, error: unitsError } = useUnits()
const { wishlistIds, toggle: toggleWishlist } = useWishlist()
const { filters, viewMode } = useUnitFilters()
const { serverClockOffsetMs } = useServerClock()
const reservingUnitId = ref<string | null>(null)
const showPaymentCancelledToast = ref(false)
const { $supabase } = useNuxtApp()
// Use session from useAuth when ready; also cache from our own getSession() so we have it as soon as possible
const sessionCache = ref<{ access_token: string } | null>(null)

watch(user, (u) => {
  if (!u) return
  if (sessionRef.value) sessionCache.value = sessionRef.value
  $supabase.auth.getSession().then(({ data: { session } }) => {
    if (session?.access_token) sessionCache.value = { access_token: session.access_token }
    // Warm acquire-lock only with a real unit ID when we have one (e.g. from units list);
    // avoid calling with a fake ID so we don't get a 404 in the console.
  }).catch(() => {})
}, { immediate: true })

const displayedUnits = computed(() => {
  let list = units.value.filter((unit) => {
    const matchesPrice =
      (filters.value.maxPrice === 'all' || unit.price <= Number(filters.value.maxPrice)) &&
      (filters.value.minPrice === 'all' || unit.price >= Number(filters.value.minPrice))
    const matchesBeds =
      filters.value.bedrooms === 'all' || unit.bedrooms.toString() === filters.value.bedrooms
    const matchesBaths =
      filters.value.bathrooms === 'all' ||
      unit.bathrooms.toString() === filters.value.bathrooms
    const matchesStatus =
      filters.value.status === 'all' || unit.status === filters.value.status
    const matchesSearch =
      !filters.value.searchQuery?.trim() ||
      unit.unitNumber.toLowerCase().includes(filters.value.searchQuery!.toLowerCase())
    const matchesLayout =
      !filters.value.layout || filters.value.layout === 'any' || unit.unitType === filters.value.layout
    const matchesFloor =
      !filters.value.floor || filters.value.floor === 'any' || (unit.floor ?? '') === filters.value.floor
    const matchesDirection =
      !filters.value.direction || filters.value.direction === 'any' || (unit.direction ?? '') === filters.value.direction
    const matchesParking =
      !filters.value.parking || filters.value.parking === 'any' || unit.parking.toString() === filters.value.parking
    const matchesWishlist =
      (filters.value.wishlistFilter ?? 'all') === 'all' || wishlistIds.value.includes(unit.id)
    return matchesPrice && matchesBeds && matchesBaths && matchesStatus && matchesSearch && matchesLayout && matchesFloor && matchesDirection && matchesParking && matchesWishlist
  })
  const by = filters.value.orderBy ?? 'unitNumber'
  const dir = filters.value.orderDir ?? 'asc'
  list = [...list].sort((a, b) => {
    let aVal: string | number
    let bVal: string | number
    if (by === 'unitNumber') {
      aVal = a.unitNumber
      bVal = b.unitNumber
    } else if (by === 'price') {
      aVal = a.price
      bVal = b.price
    } else {
      aVal = a.bedrooms
      bVal = b.bedrooms
    }
    const cmp = typeof aVal === 'number' ? (aVal as number) - (bVal as number) : (aVal < bVal ? -1 : aVal > bVal ? 1 : 0)
    return dir === 'asc' ? cmp : -cmp
  })
  return list
})

const totalUnits = computed(() => units.value.length)
const availableCount = computed(
  () => units.value.filter((u) => u.status === 'Available').length,
)
const unitTypes = computed(() => {
  const set = new Set(units.value.map((u) => u.unitType).filter(Boolean))
  return Array.from(set).sort()
})
const floorOptions = computed(() => {
  const set = new Set(units.value.map((u) => u.floor).filter((f): f is string => Boolean(f)))
  return Array.from(set).sort()
})
const directionOptions = computed(() => {
  const set = new Set(units.value.map((u) => u.direction).filter((d): d is string => Boolean(d)))
  return Array.from(set).sort()
})
const sampleUnitNumbers = computed(() => {
  const list = units.value
  if (list.length === 0) return ''
  if (list.length === 1) return list[0].unitNumber
  const first = list[0].unitNumber
  const last = list[list.length - 1].unitNumber
  return first === last ? first : `${first}, ${last}`
})

function onSelectUnit(unit: Unit) {
  navigateTo(`/unit/${unit.unitNumber}`)
}

function onReserveUnit(unit: Unit) {
  reservingUnitId.value = unit.id
  const token = sessionCache.value?.access_token ?? sessionRef.value?.access_token
  if (token) {
    doAcquireLock(unit, token)
    return
  }
  $supabase.auth.getSession().then(({ data: { session } }) => {
    if (!session) {
      reservingUnitId.value = null
      return
    }
    if (session?.access_token) sessionCache.value = { access_token: session.access_token }
    doAcquireLock(unit, session.access_token)
  })
}

async function doAcquireLock(unit: Unit, token: string) {
  try {
    const res = await $fetch<{ lockExpiresAt?: string }>('/api/units/acquire-lock', {
      method: 'POST',
      body: { unitId: unit.id },
      headers: { Authorization: `Bearer ${token}` },
    })
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('ignite_reserve_unitId', unit.id)
      if (res?.lockExpiresAt) sessionStorage.setItem('ignite_reserve_lockExpiresAt', res.lockExpiresAt)
      sessionStorage.setItem('ignite_reserve_token', token)
    }
    await navigateTo(`/reserve/${unit.unitNumber}`)
  } catch (e: any) {
    const msg = e?.data?.message || e?.message || 'Could not reserve unit.'
    console.error(msg)
    alert(msg)
  } finally {
    reservingUnitId.value = null
  }
}

function onToggleWishlist(unitId: string) {
  toggleWishlist(unitId)
}

onMounted(() => {
  if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('show_payment_cancelled_toast')) {
    sessionStorage.removeItem('show_payment_cancelled_toast')
    showPaymentCancelledToast.value = true
  }
})
</script>
