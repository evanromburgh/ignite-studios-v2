<template>
  <div class="min-h-screen">
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
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
              Switch how you browse units: <span class="font-semibold">Grid</span>, <span class="font-semibold">List</span>, or <span class="font-semibold">Plans</span>.
            </p>
          </div>
          <div class="w-full flex justify-center">
            <div
              ref="viewSwitcherContainerRef"
              class="relative inline-flex w-full max-w-[95%] sm:max-w-xl items-center rounded-full p-1 bg-white"
              role="tablist"
              aria-label="View switcher"
            >
              <!-- Sliding pill: animates to active button -->
              <div
                class="view-switcher-pill absolute z-0 rounded-full transition-[left,width,height] duration-300 ease-out will-change-[left,width,height]"
                :style="viewSwitcherPillStyle"
              />
              <button
                type="button"
                data-view-mode="GRID"
                class="relative z-10 flex group flex-1 min-h-10 sm:min-h-8 rounded-full transition-colors duration-200 items-center justify-center gap-2 px-2 py-2 sm:py-1.5"
                :class="effectiveViewMode === 'GRID' ? 'text-white' : 'text-black'"
                :style="{ background: 'transparent' }"
                :aria-pressed="effectiveViewMode === 'GRID'"
                @click="setViewModeSmooth('GRID')"
              >
                <span class="icon-switcher-svg flex h-4 w-4 shrink-0 items-center justify-center" aria-hidden="true">
                  <svg xmlns="http://www.w3.org/2000/svg" class="block h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 16 16" shape-rendering="geometricPrecision" aria-hidden="true">
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
                :class="effectiveViewMode === 'LIST' ? 'text-white' : 'text-black'"
                :style="{ background: 'transparent' }"
                :aria-pressed="effectiveViewMode === 'LIST'"
                @click="setViewModeSmooth('LIST')"
              >
                <span class="icon-switcher-svg flex h-4 w-4 shrink-0 items-center justify-center" aria-hidden="true">
                  <svg xmlns="http://www.w3.org/2000/svg" class="block h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 16 16" shape-rendering="geometricPrecision" aria-hidden="true">
                    <path fill-rule="evenodd" d="M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m-3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2"/>
                  </svg>
                </span>
                <span class="text-[11px] sm:text-xs font-medium leading-none">List</span>
                <span class="pointer-events-none absolute inset-0 rounded-full ring-0 group-focus-visible:ring-2 group-focus-visible:ring-offset-2" style="--tw-ring-color: #000000; --tw-ring-offset-color: #FFFFFF;" />
              </button>
              <button
                type="button"
                data-view-mode="PLANS"
                class="relative z-10 flex group flex-1 min-h-10 sm:min-h-8 rounded-full transition-colors duration-200 items-center justify-center gap-2 px-2 py-2 sm:py-1.5"
                :class="effectiveViewMode === 'PLANS' ? 'text-white' : 'text-black'"
                :style="{ background: 'transparent' }"
                :aria-pressed="effectiveViewMode === 'PLANS'"
                @click="switchToPlans"
              >
                <span class="icon-switcher-svg flex h-4 w-4 shrink-0 items-center justify-center" aria-hidden="true">
                  <svg xmlns="http://www.w3.org/2000/svg" class="block h-3.5 w-3.5 shrink-0" fill="currentColor" viewBox="0 0 16 16" shape-rendering="geometricPrecision" aria-hidden="true">
                    <path d="M14.763.075A.5.5 0 0 1 15 .5v15a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5V14h-1v1.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V10a.5.5 0 0 1 .342-.474L6 7.64V4.5a.5.5 0 0 1 .276-.447l8-4a.5.5 0 0 1 .487.022M6 8.694 1 10.36V15h5zM7 15h2v-1.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5V15h2V1.309l-7 3.5z" />
                    <path d="M2 11h1v1H2zm2 0h1v1H4zm-2 2h1v1H2zm2 0h1v1H4zm4-4h1v1H8zm2 0h1v1h-1zm-2 2h1v1H8zm2 0h1v1h-1zm2-2h1v1h-1zm0 2h1v1h-1zM8 7h1v1H8zm2 0h1v1h-1zm2 0h1v1h-1zM8 5h1v1H8zm2 0h1v1h-1zm2 0h1v1h-1zm0-2h1v1h-1z" />
                  </svg>
                </span>
                <span class="text-[11px] sm:text-xs font-medium leading-none">Plans</span>
                <span class="pointer-events-none absolute inset-0 rounded-full ring-0 group-focus-visible:ring-2 group-focus-visible:ring-offset-2" style="--tw-ring-color: #000000; --tw-ring-offset-color: #FFFFFF;" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Unit results section: mobile padding; 90% centered from sm up -->
      <section class="nav-section light w-full px-4 sm:px-0 sm:w-[90%] sm:mx-auto sm:pb-20">
        <!-- Plans: mount once, then toggle with v-show to avoid expensive re-mount jank -->
        <SiteMapPlansView
          v-if="plansMounted"
          v-show="viewMode === 'PLANS'"
          :units="units"
        />

        <!-- Grid/List: keep DOM mounted, just toggle visibility -->
        <div v-show="viewMode !== 'PLANS'">
          <div
            v-show="unitsLoading"
            class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[1.25rem] animate-pulse"
          >
            <div
              v-for="i in 8"
              :key="i"
              class="aspect-[3/4] bg-zinc-200 rounded-xl"
            />
          </div>

          <div v-show="!unitsLoading && unitsError" class="text-red-600 text-sm">
            {{ unitsError }}
          </div>

          <div
            v-show="!unitsLoading && !unitsError && displayedUnits.length === 0"
            class="text-center py-48 bg-white rounded-xl border border-theme-border shadow-sm"
          >
            <h3 class="text-2xl md:text-3xl font-black text-zinc-600 uppercase tracking-[0.5em]">No Matches</h3>
          </div>

          <div
            v-show="!unitsLoading && !unitsError && displayedUnits.length > 0 && viewMode === 'GRID'"
            class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[1.25rem]"
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

          <div
            v-show="!unitsLoading && !unitsError && displayedUnits.length > 0 && viewMode === 'LIST'"
            class="space-y-3"
          >
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
</template>

<script setup lang="ts">
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Pagination, Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'
import UnitCard from '~/components/UnitCard.vue'
import UnitListRow from '~/components/UnitListRow.vue'
import FilterBar from '~/components/FilterBar.vue'
import SiteMapPlansView from '~/components/SiteMapPlansView.vue'
import { SITE_MAP_FLOORS, SITE_MAP_MASTER } from '~/data/siteMap'
import { useAuth } from '~/composables/useAuth'
import { useUnits } from '~/composables/useUnits'
import { useUnitFilters } from '~/composables/useUnitFilters'
import { useWishlist } from '~/composables/useWishlist'
import type { Unit, SearchFilters, ViewMode } from '~/types'

const { user, sessionRef } = useAuth()
const { units, loading: unitsLoading, error: unitsError } = useUnits()
const { wishlistIds, toggle: toggleWishlist } = useWishlist()
const { filters, viewMode, resetFilters } = useUnitFilters()
const { serverClockOffsetMs } = useServerClock()
const runtimeConfig = useRuntimeConfig()
const reservingUnitId = ref<string | null>(null)
const showPaymentCancelledToast = ref(false)
const showFiltersDrawer = ref(false)

const plansPreloadStarted = ref(false)
const plansMounted = ref(false)
const unitImagesPreloadStarted = ref(false)

const pendingViewMode = ref<ViewMode | null>(null)
const effectiveViewMode = computed(() => pendingViewMode.value ?? viewMode.value)

function imageSrcWithOptionalCacheBust(src: string): string {
  const bust = runtimeConfig.public.imageCacheBust
  if (!src || bust === undefined || bust === null || String(bust).length === 0) return src
  const sep = src.includes('?') ? '&' : '?'
  return `${src}${sep}v=${encodeURIComponent(String(bust))}`
}

function preloadPlansImages() {
  if (plansPreloadStarted.value) return
  if (typeof window === 'undefined') return
  plansPreloadStarted.value = true

  const urls = [
    imageSrcWithOptionalCacheBust(SITE_MAP_MASTER.imageSrc),
    ...SITE_MAP_FLOORS.flatMap((f) => [imageSrcWithOptionalCacheBust(f.imageSrc), f.mobileImageSrc ? imageSrcWithOptionalCacheBust(f.mobileImageSrc) : null]).filter(
      (u): u is string => Boolean(u),
    ),
  ]

  for (const url of urls) {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = url
    link.setAttribute('fetchpriority', 'high')
    document.head.appendChild(link)
    setTimeout(() => link.remove(), 20000)
  }
}

function preloadUnitImages() {
  if (unitImagesPreloadStarted.value) return
  if (typeof window === 'undefined') return
  if (unitsLoading.value) return

  unitImagesPreloadStarted.value = true

  // Preload only the first chunk to avoid flooding the network.
  const unitsForPreload = displayedUnits.value.slice(0, 24)
  const urls = unitsForPreload
    .map((u) => u.floorplanUrl || u.imageUrl)
    .filter((u): u is string => Boolean(u))

  for (const url of urls) {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = url
    link.setAttribute('fetchpriority', 'high')
    document.head.appendChild(link)
    setTimeout(() => link.remove(), 20000)
  }
}

function switchToPlans() {
  preloadPlansImages()
  setViewModeSmooth('PLANS')
}

const stickyFixedBarRef = ref<HTMLElement | null>(null)
const sticky = useStickyFilterbar(stickyFixedBarRef)

const viewSwitcherContainerRef = ref<HTMLElement | null>(null)
const pillStyle = ref<{ left: number; top: number; width: number; height: number; background: string }>({
  left: 0, top: 0, width: 0, height: 0, background: 'rgb(24, 24, 27)',
})

function updateViewSwitcherPillTo(mode: ViewMode) {
  const container = viewSwitcherContainerRef.value
  if (!container) return
  const activeBtn = container.querySelector<HTMLElement>(`[data-view-mode="${mode}"]`)
  if (!activeBtn) return
  const cRect = container.getBoundingClientRect()
  const bRect = activeBtn.getBoundingClientRect()
  const border = 1
  // Size and position pill so external white space (gap to container) is equal top, left, and bottom.
  // Container has p-1 (4px). Pill uses pad for top/height; for left, use pad when Grid (first tab) so left gap matches.
  const pad = 4
  const pillLeftRaw = mode === 'GRID' ? pad : bRect.left - cRect.left - border
  pillStyle.value = {
    left: Math.round(pillLeftRaw),
    top: pad,
    width: Math.round(bRect.width),
    height: Math.max(0, Math.round(cRect.height - pad * 2)),
    background: 'rgb(24, 24, 27)',
  }
}

function updateActiveViewSwitcherPill() {
  // Throttle indicator re-measurements so heavy DOM mounts don't cause jank.
  updateActiveViewSwitcherPillThrottled()
}

let setViewModeRafId: number | null = null
let pillUpdateRafId: number | null = null
function updateActiveViewSwitcherPillThrottled() {
  // During a view switch transition we already move the pill to the target.
  // Let the CSS animation finish without re-measuring (which can cause the last-frame stutter).
  if (pendingViewMode.value !== null) return
  if (pillUpdateRafId !== null) return
  pillUpdateRafId = requestAnimationFrame(() => {
    pillUpdateRafId = null
    updateViewSwitcherPillTo(effectiveViewMode.value)
  })
}

let pendingClearTimeoutId: ReturnType<typeof setTimeout> | null = null
let setViewModeDelayTimeoutId: ReturnType<typeof setTimeout> | null = null
function setViewModeSmooth(next: ViewMode) {
  // 1) Move pill immediately so the transition starts even if the view content is heavy.
  // 2) Defer `viewMode` until the next frame to avoid stutter from DOM work.
  const shouldMountPlans = next === 'PLANS'

  updateViewSwitcherPillTo(next)
  pendingViewMode.value = next

  if (setViewModeRafId !== null) cancelAnimationFrame(setViewModeRafId)
  if (setViewModeDelayTimeoutId) clearTimeout(setViewModeDelayTimeoutId)
  if (pendingClearTimeoutId) clearTimeout(pendingClearTimeoutId)

  // Use two RAFs: let CSS transition start before we mount heavy content.
  setViewModeRafId = requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      // Extra buffer so the pill animation completes before expensive view work.
      setViewModeDelayTimeoutId = setTimeout(() => {
        if (shouldMountPlans) plansMounted.value = true
        viewMode.value = next
        setViewModeRafId = null
        setViewModeDelayTimeoutId = null

        pendingClearTimeoutId = setTimeout(() => {
          pendingViewMode.value = null
          pendingClearTimeoutId = null
        }, 120)
      }, 330)
    })
  })
}

const viewSwitcherPillStyle = computed(() => ({
  left: `${pillStyle.value.left}px`,
  top: `${pillStyle.value.top}px`,
  width: `${pillStyle.value.width}px`,
  height: `${pillStyle.value.height}px`,
  background: pillStyle.value.background,
}))

watch(viewMode, (m) => {
  // While a transition is in progress we already moved the pill; avoid re-measuring.
  if (pendingViewMode.value === null) updateViewSwitcherPillTo(m)
})
watch(viewSwitcherContainerRef, (el) => {
  if (el) updateActiveViewSwitcherPill()
}, { flush: 'post' })
let viewSwitcherResizeCleanup: (() => void) | null = null
onMounted(() => {
  updateActiveViewSwitcherPill()
  const container = viewSwitcherContainerRef.value
  if (container && typeof ResizeObserver !== 'undefined') {
    const ro = new ResizeObserver(updateActiveViewSwitcherPill)
    ro.observe(container)
    viewSwitcherResizeCleanup = () => ro.disconnect()
  }
})
onUnmounted(() => {
  if (setViewModeRafId !== null) cancelAnimationFrame(setViewModeRafId)
  setViewModeRafId = null
  if (setViewModeDelayTimeoutId) clearTimeout(setViewModeDelayTimeoutId)
  setViewModeDelayTimeoutId = null
  if (pillUpdateRafId !== null) cancelAnimationFrame(pillUpdateRafId)
  pillUpdateRafId = null
  if (pendingClearTimeoutId) clearTimeout(pendingClearTimeoutId)
  pendingClearTimeoutId = null
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
const { show: showBottomUrgencyStrip } = useBottomUrgencyStrip()

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

watch(unitsLoading, (loading) => {
  if (loading) return
  preloadUnitImages()
}, { immediate: true })

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
    showBottomUrgencyStrip(msg)
  } finally {
    reservingUnitId.value = null
  }
}

function onToggleWishlist(unitId: string) {
  toggleWishlist(unitId)
}

function syncBrowseBodyScrollLock() {
  if (typeof document === 'undefined') return
  const locked = showFiltersDrawer.value
  document.body.style.overflow = locked ? 'hidden' : ''
}

watch(showFiltersDrawer, syncBrowseBodyScrollLock)

onMounted(() => {
  if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('show_payment_cancelled_toast')) {
    sessionStorage.removeItem('show_payment_cancelled_toast')
    showPaymentCancelledToast.value = true
  }
})

onBeforeUnmount(() => {
  if (typeof document !== 'undefined') {
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
