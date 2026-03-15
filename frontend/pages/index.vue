<template>
  <div>
    <AuthPortal v-if="!user" />

    <div v-else class="min-h-screen">
      <!-- One-time toast after returning from payment cancel (bottom-right, compact) -->
      <!-- One-time toast after returning from payment cancel (bottom-right, compact) -->
      <div
        v-if="showPaymentCancelledToast"
        class="fixed bottom-4 right-4 z-[100] max-w-[18rem] rounded-lg border border-amber-400 bg-amber-50 text-amber-900 px-3 py-2 flex items-center justify-between gap-2 shadow-lg"
      >
        <p class="text-xs font-medium whitespace-nowrap">Payment cancelled. The unit remains available.</p>
        <button
          type="button"
          class="shrink-0 text-amber-600 hover:text-amber-800 transition-colors p-0.5"
          aria-label="Dismiss"
          @click="showPaymentCancelledToast = false"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <!-- Hero header: Swiper slider; use svh on mobile so it fits within visible viewport (avoids iOS browser chrome overflow) -->
      <header class="nav-section dark relative min-h-svh h-svh sm:min-h-screen sm:h-screen overflow-hidden group bg-theme-bg">
        <div class="absolute inset-0 z-10">
          <ClientOnly>
            <Swiper
              :modules="heroSwiperModules"
              class="hero-swiper h-full w-full"
              :pagination="{ clickable: true }"
              :autoplay="{ delay: 5000, disableOnInteraction: false }"
              :loop="true"
              :grab-cursor="true"
              :speed="500"
            >
              <SwiperSlide v-for="(slide, idx) in heroSlides" :key="idx">
                <div class="relative h-full w-full overflow-hidden bg-zinc-800">
                  <div class="absolute inset-0 z-10 pointer-events-none bg-black/40" aria-hidden="true" />
                  <picture class="w-full h-full pointer-events-none block">
                    <source
                      media="(min-width: 640px)"
                      :srcset="slide"
                    >
                    <img
                      :src="slide"
                      :alt="`Slide ${idx + 1}`"
                      class="w-full h-full object-cover ken-burns select-none"
                      :loading="idx === 0 ? 'eager' : 'lazy'"
                    >
                  </picture>
                </div>
              </SwiperSlide>
            </Swiper>
            <template #fallback>
              <div
                class="absolute inset-0 bg-cover bg-center"
                :style="{ backgroundImage: `url(${heroSlides[0]})` }"
                aria-hidden="true"
              />
            </template>
          </ClientOnly>
        </div>
        <div class="relative z-20 flex min-h-full flex-col justify-center items-center px-5 pt-0 pb-0 sm:pt-24 sm:pb-32 sm:px-8 md:px-24 lg:px-40 xl:px-56 pointer-events-none">
          <h1 class="text-center text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight mb-2">
            Browse Units
          </h1>
          <p class="text-center text-base sm:text-lg text-zinc-300 font-normal">
            66 APARTMENTS
          </p>
        </div>
        <!-- Filter bar: not inside hero; rendered fixed or anchored below -->
      </header>

      <!-- Sticky filterbar: desktop/tablet only (sm and up); mobile uses Filters drawer below -->
      <div class="hidden sm:block">
        <!-- Sticky filterbar: anchor slot (in-flow when scrolled past threshold) -->
        <div
          class="relative z-30 w-full pointer-events-auto"
          :style="sticky.anchorWrapperStyle"
        >
          <div v-if="sticky.isAnchored" class="filterbar-container">
            <FilterBar
              :filters="filters"
              :view-mode="viewMode"
              :unit-types="unitTypes"
              :floor-options="floorOptions"
              :direction-options="directionOptions"
              @update:filters="filters = $event"
              @update:view-mode="viewMode = $event"
            />
          </div>
          <div v-else :style="{ height: sticky.barHeightPx }" aria-hidden="true" />
        </div>

        <!-- Sticky filterbar: fixed at bottom until anchor threshold -->
        <div
          v-show="!sticky.isAnchored"
          ref="stickyFixedBarRef"
          class="z-20 pointer-events-auto"
          :style="sticky.fixedBarStyle"
        >
          <div class="filterbar-container">
            <FilterBar
              :filters="filters"
              :view-mode="viewMode"
              :unit-types="unitTypes"
              :floor-options="floorOptions"
              :direction-options="directionOptions"
              @update:filters="filters = $event"
              @update:view-mode="viewMode = $event"
            />
          </div>
        </div>
      </div>

      <!-- Mobile only: Filters button in flow just below hero (opens bottom sheet) -->
      <div class="w-full px-4 pt-4 pb-2 sm:hidden">
        <button
          type="button"
          class="w-full h-12 rounded-xl bg-[#ffffff] text-[#18181B] text-[12px] font-bold uppercase tracking-widest hover:bg-zinc-100 transition-colors flex items-center justify-center gap-2"
          aria-label="Open filters"
          @click="showFiltersDrawer = true"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Show Filters
        </button>
      </div>

      <!-- Mobile: bottom sheet with FilterBar -->
      <Teleport to="body">
        <Transition name="filters-drawer">
          <div
            v-if="showFiltersDrawer"
            class="fixed inset-0 z-[200] sm:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Filter units"
          >
            <div
              class="absolute inset-0 bg-black/40"
              aria-hidden="true"
              @click="showFiltersDrawer = false"
            />
            <div class="absolute bottom-0 left-0 right-0 max-h-[88vh] overflow-hidden bg-white rounded-t-2xl shadow-2xl flex flex-col filters-drawer-panel">
              <div class="filters-drawer-scroll flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 pb-6">
                <FilterBar
                  :embedded="true"
                  :hide-clear="true"
                  :filters="filters"
                  :view-mode="viewMode"
                  :unit-types="unitTypes"
                  :floor-options="floorOptions"
                  :direction-options="directionOptions"
                  @update:filters="filters = $event"
                  @update:view-mode="viewMode = $event"
                />
                <div class="mt-4 flex items-center justify-between">
                  <button
                    type="button"
                    class="filter-bar-clear inline-flex items-center gap-2 text-xs font-medium text-zinc-500 hover:text-zinc-300 capitalize transition-colors underline underline-offset-2"
                    @click="resetFilters()"
                  >
                    <svg class="w-[13px] h-[13px] flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Clear All Filters
                  </button>
                  <button
                    type="button"
                    class="text-xs font-medium text-zinc-500 hover:text-zinc-300 capitalize transition-colors underline underline-offset-2"
                    @click="showFiltersDrawer = false"
                  >
                    Hide Filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>

      <!-- Choose your view (above unit cards) — matches reference structure and styling -->
      <div class="mt-8 sm:mt-[5rem] mb-[2.5rem] w-full flex justify-center px-2">
        <div class="w-full max-w-lg flex flex-col items-center">
          <div class="text-center mb-[1.25rem]">
            <p class="text-[11px] font-semibold uppercase tracking-[0.25em]" style="color: rgb(0, 0, 0);">
              Choose your view
            </p>
            <p class="mt-1 text-[13px]" style="color: rgb(0, 0, 0);">
              Switch how you browse units: <span class="font-semibold">Grid</span> or <span class="font-semibold">List</span>.
            </p>
          </div>
          <div class="w-full flex justify-center">
            <div
              ref="viewSwitcherContainerRef"
              class="relative inline-flex w-full max-w-[85%] sm:max-w-none items-center rounded-full p-1 bg-white"
              role="tablist"
              aria-label="View switcher"
            >
              <!-- Sliding pill: animates to active button -->
              <div
                class="view-switcher-pill absolute z-0 rounded-full transition-all duration-300 ease-out"
                :style="viewSwitcherPillStyle"
              />
              <button
                type="button"
                data-view-mode="GRID"
                class="relative z-10 flex group flex-1 min-h-10 sm:min-h-8 rounded-full transition-colors duration-200 items-center justify-center gap-2 px-2 py-2 sm:py-1.5"
                :class="viewMode === 'GRID' ? 'text-white' : 'text-black'"
                :style="{ background: 'transparent' }"
                aria-pressed="viewMode === 'GRID'"
                @click="viewMode = 'GRID'"
              >
                <span class="shrink-0 w-[14px] h-[14px] flex items-center justify-center" aria-hidden="true">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-full h-full shrink-0" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                    <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5zM2.5 2a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5zm6.5.5A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5zM1 10.5A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5zm6.5.5A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5z"/>
                  </svg>
                </span>
                <span class="text-[11px] sm:text-xs font-medium leading-none">Grid</span>
                <span class="pointer-events-none absolute inset-0 rounded-full ring-0 group-focus-visible:ring-2 group-focus-visible:ring-offset-2" style="--tw-ring-color: #000000; --tw-ring-offset-color: #FFFFFF;" />
              </button>
              <button
                type="button"
                data-view-mode="LIST"
                class="relative z-10 flex group flex-1 min-h-10 sm:min-h-8 rounded-full transition-colors duration-200 items-center justify-center gap-2 px-2 py-2 sm:py-1.5"
                :class="viewMode === 'LIST' ? 'text-white' : 'text-black'"
                :style="{ background: 'transparent' }"
                aria-pressed="viewMode === 'LIST'"
                @click="viewMode = 'LIST'"
              >
                <span class="shrink-0 w-[14px] h-[14px] flex items-center justify-center" aria-hidden="true">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-full h-full shrink-0" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                    <path fill-rule="evenodd" d="M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m-3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2"/>
                  </svg>
                </span>
                <span class="text-[11px] sm:text-xs font-medium leading-none">List</span>
                <span class="pointer-events-none absolute inset-0 rounded-full ring-0 group-focus-visible:ring-2 group-focus-visible:ring-offset-2" style="--tw-ring-color: #000000; --tw-ring-offset-color: #FFFFFF;" />
              </button>
              <!-- Elevation and Floor view modes temporarily removed -->
            </div>
          </div>
        </div>
      </div>

      <!-- Unit results section: full width + padding on mobile; 75% centered from sm up -->
      <section class="nav-section light w-full px-4 sm:w-[75%] sm:mx-auto pb-16">
        <div v-if="unitsLoading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[1.25rem] animate-pulse">
          <div
            v-for="i in 8"
            :key="i"
            class="aspect-[3/4] bg-zinc-200 rounded-xl"
          />
        </div>

        <div v-else-if="unitsError" class="text-red-600 text-sm">
          {{ unitsError }}
        </div>

        <div v-else-if="displayedUnits.length === 0" class="text-center py-48 bg-white rounded-xl border border-theme-border shadow-sm">
          <h3 class="text-2xl md:text-3xl font-black text-zinc-600 uppercase tracking-[0.5em]">No Matches</h3>
        </div>

        <div v-else>
          <div
            v-if="viewMode === 'GRID'"
            class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[1.25rem]"
          >
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

          <div v-else-if="viewMode === 'LIST'" class="space-y-3">
            <UnitListRow
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
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Pagination, Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'
import AuthPortal from '~/components/AuthPortal.vue'
import UnitCard from '~/components/UnitCard.vue'
import UnitListRow from '~/components/UnitListRow.vue'
import FilterBar from '~/components/FilterBar.vue'
import { useAuth } from '~/composables/useAuth'
import { useUnits } from '~/composables/useUnits'
import { useUnitFilters } from '~/composables/useUnitFilters'
import { useWishlist } from '~/composables/useWishlist'
import type { Unit, SearchFilters, ViewMode } from '~/types'

const { user, authLoading, sessionRef } = useAuth()
const { units, loading: unitsLoading, error: unitsError } = useUnits()
const { wishlistIds, toggle: toggleWishlist } = useWishlist()
const { filters, viewMode, resetFilters } = useUnitFilters()
const { serverClockOffsetMs } = useServerClock()
const reservingUnitId = ref<string | null>(null)
const showPaymentCancelledToast = ref(false)
const showFiltersDrawer = ref(false)

const stickyFixedBarRef = ref<HTMLElement | null>(null)
const sticky = useStickyFilterbar(stickyFixedBarRef)

const viewSwitcherContainerRef = ref<HTMLElement | null>(null)
const pillStyle = ref<{ left: number; top: number; width: number; height: number; background: string }>({
  left: 0, top: 0, width: 0, height: 0, background: 'rgb(24, 24, 27)',
})

function updateViewSwitcherPill() {
  nextTick(() => {
    const container = viewSwitcherContainerRef.value
    if (!container) return
    const activeBtn = container.querySelector<HTMLElement>(`[data-view-mode="${viewMode.value}"]`)
    if (!activeBtn) return
    const cRect = container.getBoundingClientRect()
    const bRect = activeBtn.getBoundingClientRect()
    const border = 1
    // Size and position pill so external white space (gap to container) is equal top, left, and bottom.
    // Container has p-1 (4px). Pill uses pad for top/height; for left, use pad when Grid (first tab) so left gap matches.
    const pad = 4
    const pillLeft = viewMode.value === 'GRID' ? pad : bRect.left - cRect.left - border
    pillStyle.value = {
      left: pillLeft,
      top: pad,
      width: bRect.width,
      height: cRect.height - pad * 2,
      background: 'rgb(24, 24, 27)',
    }
  })
}

const viewSwitcherPillStyle = computed(() => ({
  left: `${pillStyle.value.left}px`,
  top: `${pillStyle.value.top}px`,
  width: `${pillStyle.value.width}px`,
  height: `${pillStyle.value.height}px`,
  background: pillStyle.value.background,
}))

watch(viewMode, updateViewSwitcherPill)
watch(viewSwitcherContainerRef, (el) => {
  if (el) updateViewSwitcherPill()
}, { flush: 'post' })
let viewSwitcherResizeCleanup: (() => void) | null = null
onMounted(() => {
  updateViewSwitcherPill()
  const container = viewSwitcherContainerRef.value
  if (container && typeof ResizeObserver !== 'undefined') {
    const ro = new ResizeObserver(updateViewSwitcherPill)
    ro.observe(container)
    viewSwitcherResizeCleanup = () => ro.disconnect()
  }
})
onUnmounted(() => {
  viewSwitcherResizeCleanup?.()
})

const heroSlides = [
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1920',
]
const heroSwiperModules = [Pagination, Autoplay]
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

watch(showFiltersDrawer, (open) => {
  if (typeof document === 'undefined') return
  document.body.style.overflow = open ? 'hidden' : ''
})

onMounted(() => {
  if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('show_payment_cancelled_toast')) {
    sessionStorage.removeItem('show_payment_cancelled_toast')
    showPaymentCancelledToast.value = true
  }
})

onBeforeUnmount(() => {
  if (showFiltersDrawer.value && typeof document !== 'undefined') {
    document.body.style.overflow = ''
  }
})
</script>

<style scoped>
/* Mobile filters drawer: backdrop fade + panel slide up */
.filters-drawer-enter-active,
.filters-drawer-leave-active {
  transition: opacity 0.25s ease;
}
.filters-drawer-enter-active > div.absolute.bottom-0,
.filters-drawer-leave-active > div.absolute.bottom-0 {
  transition: transform 0.3s ease;
}
.filters-drawer-enter-from,
.filters-drawer-leave-to {
  opacity: 0;
}
.filters-drawer-enter-from > div.absolute.bottom-0,
.filters-drawer-leave-to > div.absolute.bottom-0 {
  transform: translateY(100%);
}
.filters-drawer-enter-to > div.absolute.bottom-0,
.filters-drawer-leave-from > div.absolute.bottom-0 {
  transform: translateY(0);
}

/* Mobile drawer: single scroll container on GPU layer to prevent icon shake on scroll */
.filters-drawer-panel {
  -webkit-overflow-scrolling: touch;
}
.filters-drawer-scroll {
  -webkit-overflow-scrolling: touch;
  transform: translateZ(0);
  backface-visibility: hidden;
}

/* Full width + padding on mobile; 3/4 centered from sm up (desktop unchanged) */
.filterbar-container {
  @apply w-full px-4 sm:w-3/4 sm:mx-auto;
}
/* Pagination bottom-right: inactive = small semi-transparent circles, active = elongated pill (match reference) */
.hero-swiper :deep(.swiper-pagination) {
  left: auto;
  right: 1.25rem;
  bottom: 1.25rem;
  width: auto;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.hero-swiper :deep(.swiper-pagination-bullet) {
  background: white;
  opacity: 0.45;
  width: 0.5rem;
  height: 0.5rem;
  margin: 0;
  border-radius: 9999px;
  transition: width 0.25s ease, height 0.25s ease, opacity 0.25s ease, border-radius 0.25s ease;
}
.hero-swiper :deep(.swiper-pagination-bullet-active) {
  opacity: 1;
  width: 1.5rem;
  height: 0.5rem;
  border-radius: 9999px;
}

/* Mobile: smoother pill animation and consistent bullet appearance (no clipping) */
@media (max-width: 639px) {
  .hero-swiper :deep(.swiper-pagination) {
    overflow: visible;
    min-width: 0;
  }
  .hero-swiper :deep(.swiper-pagination-bullet) {
    flex-shrink: 0;
    transform: translateZ(0);
    backface-visibility: hidden;
    transition: width 0.3s ease-out, height 0.3s ease-out, opacity 0.3s ease-out, border-radius 0.3s ease-out;
  }
  .hero-swiper :deep(.swiper-pagination-bullet-active) {
    width: 1.5rem;
    height: 0.5rem;
    border-radius: 9999px;
  }
}

/* Ken Burns: slow zoom on slide images */
.ken-burns {
  animation: ken-burns 12s ease-out both;
}
@keyframes ken-burns {
  from {
    transform: scale(1);
  }
  to {
    transform: scale(1.08);
  }
}
</style>
