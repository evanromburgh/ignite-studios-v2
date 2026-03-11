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
      <!-- Hero header: Swiper slider (same structure as reference) -->
      <header class="nav-section dark relative min-h-screen h-svh sm:h-screen overflow-hidden group bg-theme-bg">
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
        <div class="relative z-20 flex min-h-screen flex-col justify-center px-5 sm:px-8 md:px-24 lg:px-40 xl:px-56 pt-16 sm:pt-24 pb-[11rem] sm:pb-32 pointer-events-none">
          <h1 class="text-center text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight mb-2">
            Browse Units
          </h1>
          <p class="text-center text-base sm:text-lg text-zinc-300 font-normal">
            66 APARTMENTS
          </p>
        </div>
        <!-- Filter bar: not inside hero; rendered fixed or anchored below -->
      </header>

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

      <!-- Choose your view (above unit cards) — matches reference structure and styling -->
      <div class="mt-[5rem] mb-[2.5rem] w-full flex justify-center px-2">
        <div class="w-full max-w-lg flex flex-col items-center">
          <div class="text-center mb-[1.25rem]">
            <p class="text-[11px] font-semibold uppercase tracking-[0.25em]" style="color: rgb(0, 0, 0);">
              Choose your view
            </p>
            <p class="mt-1 text-[13px]" style="color: rgb(0, 0, 0);">
              <span class="hidden sm:inline">
                Switch how you browse units: <span class="font-semibold">Grid</span>, <span class="font-semibold">List</span>, <span class="font-semibold">Elevation</span>, or <span class="font-semibold">Floor</span>.
              </span>
            </p>
          </div>
          <div class="w-full flex justify-center">
            <div
              ref="viewSwitcherContainerRef"
              class="relative inline-flex w-full items-center rounded-full p-1 shadow-sm"
              role="tablist"
              aria-label="View switcher"
              style="background: rgb(255, 255, 255); border: 1px solid rgb(255, 255, 255);"
            >
              <!-- Sliding pill: animates to active button -->
              <div
                class="view-switcher-pill absolute z-0 rounded-full transition-all duration-300 ease-out"
                :style="viewSwitcherPillStyle"
              />
              <button
                type="button"
                data-view-mode="GRID"
                class="relative z-10 flex group flex-1 min-h-8 rounded-full transition-colors duration-200 items-center justify-center gap-2 px-2 py-1.5"
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
                <span class="text-[11px] sm:text-xs font-medium">Grid</span>
                <span class="pointer-events-none absolute inset-0 rounded-full ring-0 group-focus-visible:ring-2 group-focus-visible:ring-offset-2" style="--tw-ring-color: #000000; --tw-ring-offset-color: #FFFFFF;" />
              </button>
              <button
                type="button"
                data-view-mode="LIST"
                class="relative z-10 flex group flex-1 min-h-8 rounded-full transition-colors duration-200 items-center justify-center gap-2 px-2 py-1.5"
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
                <span class="text-[11px] sm:text-xs font-medium">List</span>
                <span class="pointer-events-none absolute inset-0 rounded-full ring-0 group-focus-visible:ring-2 group-focus-visible:ring-offset-2" style="--tw-ring-color: #000000; --tw-ring-offset-color: #FFFFFF;" />
              </button>
              <button
                type="button"
                data-view-mode="ELEVATION"
                class="hidden sm:flex relative z-10 group flex-1 min-h-8 rounded-full transition-colors duration-200 items-center justify-center gap-2 px-2 py-1.5"
                :class="viewMode === 'ELEVATION' ? 'text-white' : 'text-black'"
                :style="{ background: 'transparent' }"
                aria-pressed="viewMode === 'ELEVATION'"
                @click="viewMode = 'ELEVATION'"
              >
                <span class="shrink-0 w-[14px] h-[14px] flex items-center justify-center" aria-hidden="true">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-full h-full shrink-0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </span>
                <span class="text-[11px] sm:text-xs font-medium">Elevation</span>
                <span class="pointer-events-none absolute inset-0 rounded-full ring-0 group-focus-visible:ring-2 group-focus-visible:ring-offset-2" style="--tw-ring-color: #000000; --tw-ring-offset-color: #FFFFFF;" />
              </button>
              <button
                type="button"
                data-view-mode="FLOOR"
                class="hidden sm:flex relative z-10 group flex-1 min-h-8 rounded-full transition-colors duration-200 items-center justify-center gap-2 px-2 py-1.5"
                :class="viewMode === 'FLOOR' ? 'text-white' : 'text-black'"
                :style="{ background: 'transparent' }"
                aria-pressed="viewMode === 'FLOOR'"
                @click="viewMode = 'FLOOR'"
              >
                <span class="shrink-0 w-[14px] h-[14px] flex items-center justify-center" aria-hidden="true">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-full h-full shrink-0" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                    <path d="M8.235 1.559a.5.5 0 0 0-.47 0l-7.5 4a.5.5 0 0 0 0 .882L3.188 8 .264 9.559a.5.5 0 0 0 0 .882l7.5 4a.5.5 0 0 0 .47 0l7.5-4a.5.5 0 0 0 0-.882L12.813 8l2.922-1.559a.5.5 0 0 0 0-.882zm3.515 7.008L14.438 10 8 13.433 1.562 10 4.25 8.567l3.515 1.874a.5.5 0 0 0 .47 0zM8 9.433 1.562 6 8 2.567 14.438 6z"/>
                  </svg>
                </span>
                <span class="text-[11px] sm:text-xs font-medium">Floor</span>
                <span class="pointer-events-none absolute inset-0 rounded-full ring-0 group-focus-visible:ring-2 group-focus-visible:ring-offset-2" style="--tw-ring-color: #000000; --tw-ring-offset-color: #FFFFFF;" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Unit results section -->
      <section class="nav-section light w-[75%] mx-auto pb-10">
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

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[1.25rem]">
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
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Pagination, Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'
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
    pillStyle.value = {
      left: bRect.left - cRect.left - border,
      top: bRect.top - cRect.top - border,
      width: bRect.width,
      height: bRect.height,
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

onMounted(() => {
  if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('show_payment_cancelled_toast')) {
    sessionStorage.removeItem('show_payment_cancelled_toast')
    showPaymentCancelledToast.value = true
  }
})
</script>

<style scoped>
.filterbar-container {
  @apply w-[75%] sm:w-3/4 mx-auto;
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
