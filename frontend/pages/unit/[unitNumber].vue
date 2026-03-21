<template>
  <div class="min-h-screen bg-theme-bg">
    <div v-if="unitsLoading" class="flex items-center justify-center min-h-[60vh]">
      <p class="text-zinc-500 text-sm">Loading unit details…</p>
    </div>

    <div v-else-if="!unit">
      <div class="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <h1 class="text-2xl sm:text-3xl md:text-4xl font-black text-theme-text-primary mb-3">
          Unit not found
        </h1>
        <p class="text-zinc-500 text-sm max-w-md mb-6">
          We couldn’t find details for this unit. It may have been updated or removed.
        </p>
        <NuxtLink
          to="/"
          class="px-6 h-[44px] inline-flex items-center justify-center rounded-lg border border-theme-border-strong text-[11px] font-black uppercase text-zinc-200 hover:bg-theme-input-bg transition-colors"
        >
          Back to all units
        </NuxtLink>
      </div>
    </div>

    <div v-else class="pt-16 sm:pt-24 pb-16 sm:pb-20 bg-theme-bg">
      <div class="w-full mx-auto px-4 sm:px-6 lg:px-12">
        <div class="h-[5rem] flex items-center">
          <NuxtLink
            to="/"
            class="inline-flex items-center gap-1.5 text-zinc-500 text-[11px] font-bold uppercase tracking-wider hover:text-zinc-700 transition-colors"
          >
            <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Back to all units
          </NuxtLink>
        </div>
        <div ref="layoutRow" class="md:flex md:gap-12">
          <!-- Left: media, elevation, context -->
          <div ref="leftColumn" class="md:w-[60%] space-y-6">
            <!-- Media carousel – Swiper (like Nuxt UI UCarousel) so scroll/snap is handled by the library = no shift -->
            <div class="relative w-full overflow-hidden rounded-2xl bg-theme-bg group aspect-[3/2]">
              <Swiper
                :modules="[Autoplay]"
                class="unit-gallery-swiper h-full w-full"
                :slides-per-view="1"
                :space-between="0"
                :autoplay="galleryImages.length > 1 ? { delay: 5000, disableOnInteraction: false } : false"
                @swiper="onGallerySwiper"
                @real-index-change="onGallerySlideChange"
              >
                <SwiperSlide
                  v-for="(img, index) in galleryImages"
                  :key="img || index"
                  class="!h-full"
                >
                  <div
                    class="h-full w-full overflow-hidden flex items-center justify-center"
                    :class="index === floorplanIndex ? 'bg-zinc-900' : 'bg-theme-bg'"
                  >
                    <img
                      :src="img"
                      :alt="`Unit ${unit.unitNumber} image ${index + 1}`"
                      loading="lazy"
                      :class="[
                        'cursor-zoom-in',
                        index === floorplanIndex
                          ? 'max-h-full max-w-full object-contain object-center'
                          : 'w-full h-full object-cover object-center',
                      ]"
                      @click="openLightbox(index)"
                    >
                  </div>
                </SwiperSlide>
              </Swiper>

              <!-- Carousel controls -->
              <button
                v-if="galleryImages.length > 1"
                type="button"
                class="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center text-white hover:text-zinc-200 transition-colors"
                @click="prevImage"
              >
                <span class="sr-only">Previous image</span>
                <svg class="w-8 h-8 drop-shadow-md" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M15 5l-7 7 7 7" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </button>
              <button
                v-if="galleryImages.length > 1"
                type="button"
                class="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center text-white hover:text-zinc-200 transition-colors"
                @click="nextImage"
              >
                <span class="sr-only">Next image</span>
                <svg class="w-8 h-8 drop-shadow-md" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M9 5l7 7-7 7" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </button>

              <!-- Indicators – styled to match hero swiper pagination -->
              <div
                v-if="galleryImages.length > 1"
                class="pointer-events-none absolute right-5 bottom-3 sm:bottom-4 flex items-center justify-end gap-2"
              >
                <button
                  v-for="(img, index) in galleryImages"
                  :key="img || index"
                  type="button"
                  class="pointer-events-auto h-2 rounded-full bg-white transition-all duration-200"
                  :class="index === activeIndex ? 'w-6 opacity-100' : 'w-2 opacity-40 hover:opacity-75'"
                  @click="goToImage(index)"
                >
                  <span class="sr-only">Go to slide {{ index + 1 }}</span>
                </button>
              </div>
            </div>

            <!-- Caption -->
            <p class="text-[11px] text-zinc-400 italic text-center">
              All imagery is illustrative and subject to final design.
            </p>

            <!-- Thumbnails – fill width of main image, equal columns, 1rem gaps -->
            <div
              v-if="galleryImages.length > 1"
              class="grid grid-cols-4 gap-4 w-full"
            >
              <button
                v-for="(img, index) in galleryImages"
                :key="img || index"
                type="button"
                class="aspect-square w-full min-w-0 overflow-hidden rounded-lg transition-opacity hover:opacity-100 flex items-center justify-center"
                :class="[
                  activeIndex === index ? 'opacity-100' : 'opacity-25',
                  index === floorplanIndex ? 'border border-theme-border' : '',
                ]"
                @click="goToImage(index)"
              >
                <img
                  :src="img"
                  :alt="`Thumbnail ${index + 1}`"
                  loading="lazy"
                  :class="[
                    'rounded-lg',
                    index === floorplanIndex ? 'max-w-full max-h-full object-contain' : 'w-full h-full object-cover',
                  ]"
                />
              </button>
            </div>

          </div>

          <!-- Right: details / stats / CTAs -->
          <div class="mt-10 md:mt-0 md:w-[40%] relative">
            <!-- When sticky, reserve space so when we unfix the panel scrolls as normal content -->
            <div
              v-if="isRightPanelFixed && panelInitialHeight != null"
              :style="{ height: `${panelInitialHeight}px`, minHeight: `${panelInitialHeight}px` }"
              aria-hidden="true"
            />
            <!-- Details card: whole right section -->
            <div
              ref="rightPanel"
              :class="isRightPanelFixed ? 'fixed z-30' : ''"
              :style="rightPanelStyle"
            >
              <!-- Tag row -->
              <div class="flex flex-wrap items-center gap-2">
                <span
                  class="bg-zinc-900/80 text-zinc-50 text-[10px] font-black uppercase px-3 py-1 rounded-full"
                >
                  Unit {{ unit.unitNumber }}
                </span>
                <span
                  v-if="unit.unitType"
                  class="bg-white text-theme-text-primary text-[10px] font-bold uppercase px-3 py-1 rounded-full"
                >
                  {{ unit.unitType }} layout
                </span>
                <span
                  v-if="unit.status !== 'Available'"
                  class="text-[10px] font-bold uppercase px-3 py-1 rounded-full"
                  :class="unit.status === 'Sold'
                    ? 'border border-red-500 text-red-400'
                    : 'bg-orange-500 text-white'"
                >
                  {{ unit.status }}
                </span>
              </div>

              <!-- Price block -->
              <div class="mt-8">
                <div class="flex items-baseline justify-between gap-4 mb-1">
                  <h1
                    class="text-4xl sm:text-5xl lg:text-6xl font-black text-theme-text-primary leading-none"
                  >
                    R {{ formattedPrice }}
                  </h1>
                </div>

                <!-- Development / layout copy -->
                <p class="mt-3 text-sm text-zinc-400">
                  Ignite Studios. Property Sales, Reimagined.
                </p>
                <p class="mt-1 text-sm text-theme-text-primary">
                  <span class="font-semibold">Unit: </span>
                  <span class="font-medium">{{ unit.unitNumber }}</span>
                  <span class="text-zinc-500" aria-hidden="true"> · </span>
                  <span class="font-semibold">Layout: </span>
                  <span class="font-medium">{{ unit.unitType || '—' }}</span>
                </p>
              </div>

              <!-- Quick stats -->
              <div class="mt-8 grid grid-cols-4 gap-3 pt-8 border-t border-theme-border">
                <div class="text-center">
                  <p class="text-[9px] uppercase font-bold text-zinc-500 mb-1">
                    Floor
                  </p>
                  <p class="text-sm font-semibold text-theme-text-primary">
                    {{ unit.floor || '—' }}
                  </p>
                </div>
                <div class="text-center">
                  <p class="text-[9px] uppercase font-bold text-zinc-500 mb-1">
                    Facing
                  </p>
                  <p class="text-sm font-semibold text-theme-text-primary">
                    {{ unit.direction || '—' }}
                  </p>
                </div>
                <div class="text-center">
                  <p class="text-[9px] uppercase font-bold text-zinc-500 mb-1">
                    Levies
                  </p>
                  <p class="text-sm font-semibold text-theme-text-primary">
                    R {{ formatAmount(costs.levies) }}
                  </p>
                </div>
                <div class="text-center">
                  <p class="text-[9px] uppercase font-bold text-zinc-500 mb-1">
                    Rates
                  </p>
                  <p class="text-sm font-semibold text-theme-text-primary">
                    R {{ formatAmount(costs.rates) }}
                  </p>
                </div>
              </div>

              <!-- Feature icons -->
              <div
                class="mt-8 mb-8 border border-theme-border rounded-2xl bg-theme-surface/60 py-8"
              >
                <div class="flex items-center justify-evenly gap-0">
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

              <!-- Cost estimates row -->
              <div class="mt-8">
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 text-left sm:text-center">
                  <div>
                    <p class="text-[9px] uppercase font-bold text-zinc-500 mb-1">
                      Est. bond cost
                    </p>
                    <p class="text-sm sm:text-base font-semibold text-theme-text-primary">
                      R {{ formatAmount(rentalEstimates.bond) }}
                      <span class="text-[10px] text-zinc-500 ml-1">pm</span>
                    </p>
                  </div>
                  <div>
                    <p class="text-[9px] uppercase font-bold text-zinc-500 mb-1">
                      Est. short term rental
                    </p>
                    <p class="text-sm sm:text-base font-semibold text-theme-text-primary">
                      R {{ formatAmount(rentalEstimates.shortTerm) }}
                      <span class="text-[10px] text-zinc-500 ml-1">pm</span>
                    </p>
                  </div>
                  <div>
                    <p class="text-[9px] uppercase font-bold text-zinc-500 mb-1">
                      Est. long term rental
                    </p>
                    <p class="text-sm sm:text-base font-semibold text-theme-text-primary">
                      R {{ formatAmount(rentalEstimates.longTerm) }}
                      <span class="text-[10px] text-zinc-500 ml-1">pm</span>
                    </p>
                  </div>
                </div>

                <!-- Primary CTAs -->
                <div class="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-6">
                  <button
                    type="button"
                    :disabled="!canReserve"
                    class="w-full sm:w-auto sm:flex-[0.65] sm:min-w-[130px] h-12 flex items-center justify-center bg-[#18181B] text-[#ffffff] font-black text-[11px] uppercase tracking-wider rounded-lg hover:bg-[#27272a] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    @click="canReserve && onReserveClick()"
                  >
                    {{ isLockedByOther ? 'Reservation in Progress' : 'Reserve unit' }}
                  </button>
                  <button
                    type="button"
                    :disabled="!isAvailable"
                    class="w-full sm:w-auto sm:flex-[0.35] sm:min-w-[170px] h-12 inline-flex items-center justify-center gap-1.5 bg-theme-bg border border-zinc-300 text-zinc-600 font-black text-[11px] uppercase tracking-wider rounded-lg shadow-sm transition-[background-color,color,border-color] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-red-600 hover:text-white hover:border-red-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-theme-bg disabled:hover:text-zinc-600 disabled:hover:border-zinc-300"
                    :class="isWishlisted ? '!border-red-600 !bg-red-600 !text-white' : ''"
                    @click="isAvailable && onToggleWishlist()"
                  >
                    <IconHeart class="w-3.5 h-3.5 flex-shrink-0 -mt-[1px]" :filled="isWishlisted" />
                    <span class="leading-none">
                      {{ isWishlisted ? 'Remove from wishlist' : 'Add to wishlist' }}
                    </span>
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Image lightbox -->
    <div
      v-if="lightboxOpen && galleryImages.length"
      class="fixed inset-0 z-[200] bg-black/90 flex flex-col"
      @click="closeLightbox"
    >
      <button
        type="button"
        class="absolute top-4 right-4 z-[210] flex items-center justify-center text-white hover:text-zinc-200 transition-colors"
        aria-label="Close image"
        @click.stop="closeLightbox"
      >
        <svg class="w-8 h-8 drop-shadow-md" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M6 6l12 12" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M18 6l-12 12" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <button
        v-if="galleryImages.length > 1"
        type="button"
        class="absolute left-4 top-1/2 -translate-y-1/2 z-[210] flex items-center justify-center text-white hover:text-zinc-200 transition-colors"
        aria-label="Previous image"
        @click.stop="lightboxPrev"
      >
        <svg class="w-8 h-8 drop-shadow-md" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M15 5l-7 7 7 7" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <button
        v-if="galleryImages.length > 1"
        type="button"
        class="absolute right-4 top-1/2 -translate-y-1/2 z-[210] flex items-center justify-center text-white hover:text-zinc-200 transition-colors"
        aria-label="Next image"
        @click.stop="lightboxNext"
      >
        <svg class="w-8 h-8 drop-shadow-md" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M9 5l7 7-7 7" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <div class="flex-1 flex items-center justify-center px-4 py-8">
        <img
          :src="galleryImages[lightboxIndex]"
          :alt="`Unit ${unit?.unitNumber} image ${lightboxIndex + 1}`"
          class="max-h-full max-w-full object-contain rounded-2xl shadow-2xl"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Autoplay } from 'swiper/modules'
import 'swiper/css'
import { CONFIG } from '~/config'
import { useUnits } from '~/composables/useUnits'
import { useWishlist } from '~/composables/useWishlist'
import { useAuth } from '~/composables/useAuth'
import IconBed from '~/components/icons/IconBed.vue'
import IconBath from '~/components/icons/IconBath.vue'
import IconCar from '~/components/icons/IconCar.vue'
import IconSize from '~/components/icons/IconSize.vue'
import IconLayout from '~/components/icons/IconLayout.vue'
import IconHeart from '~/components/icons/IconHeart.vue'
import type { Unit } from '~/types'

const route = useRoute()
const { units, loading: unitsLoading } = useUnits()
const { wishlistIds, toggle: toggleWishlist } = useWishlist()
const { user } = useAuth()

const reserving = ref(false)
const returningToList = ref(false)
const activeIndex = ref(0)
const heroAutoplayId = ref<number | null>(null)
const gallerySwiper = ref<{ slidePrev: () => void; slideNext: () => void; slideTo: (i: number) => void } | null>(null)

// Lightbox state
const lightboxOpen = ref(false)
const lightboxIndex = ref(0)

// Right panel sticky behavior (measured, fixed alignment)
const layoutRow = ref<HTMLElement | null>(null)
const leftColumn = ref<HTMLElement | null>(null)
const rightPanel = ref<HTMLElement | null>(null)
const isRightPanelFixed = ref(false)
const rightPanelStyle = ref<Record<string, string>>({})

const panelInitialTop = ref<number | null>(null)
const panelInitialLeft = ref<number | null>(null)
const panelInitialWidth = ref<number | null>(null)
const panelInitialHeight = ref<number | null>(null)
const rowBottom = ref<number | null>(null)

function measureRightPanel() {
  const el = rightPanel.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const scrollY = window.scrollY || window.pageYOffset
  panelInitialTop.value = rect.top + scrollY
  panelInitialLeft.value = rect.left
  panelInitialWidth.value = rect.width
  panelInitialHeight.value = rect.height

  const rowEl = layoutRow.value
  const leftEl = leftColumn.value
  if (leftEl) {
    const leftRect = leftEl.getBoundingClientRect()
    rowBottom.value = leftRect.bottom + scrollY
  } else if (rowEl) {
    const rowRect = rowEl.getBoundingClientRect()
    rowBottom.value = rowRect.bottom + scrollY
  }
}

function updateRightPanelPosition() {
  if (
    panelInitialTop.value == null ||
    panelInitialLeft.value == null ||
    panelInitialWidth.value == null
  ) {
    measureRightPanel()
    if (
      panelInitialTop.value == null ||
      panelInitialLeft.value == null ||
      panelInitialWidth.value == null
    ) {
      return
    }
  }

  // Match the gap from nav border to content: nav height + "Back to all units" row (pt-6 + link + mb-1.1rem ≈ 66px).
  const navHeight = typeof window !== 'undefined' && window.innerWidth >= 640 ? 96 : 64
  const backRowHeight = 80 // 5rem
  const offsetTop = navHeight + backRowHeight
  const scrollY = window.scrollY || window.pageYOffset

  // Before we reach the panel's original top, normal flow (no sticky, no absolute)
  if (scrollY + offsetTop < panelInitialTop.value) {
    isRightPanelFixed.value = false
    rightPanelStyle.value = {}
    return
  }

  // Once we've scrolled past the original top, keep it fixed only until
  // the bottom of the left column. Past that, pin to bottom of right column
  // so it scrolls with the page (no jump) instead of snapping to flow position.
  if (rowBottom.value != null && panelInitialHeight.value != null) {
    const rowBottomViewport = rowBottom.value - scrollY
    const maxTop = rowBottomViewport - panelInitialHeight.value
    if (maxTop < offsetTop) {
      isRightPanelFixed.value = false
      rightPanelStyle.value = {
        position: 'absolute',
        bottom: '0',
        left: '0',
        width: '100%',
      }
      return
    }
  }

  let top = offsetTop
  if (rowBottom.value != null && panelInitialHeight.value != null) {
    const rowBottomViewport = rowBottom.value - scrollY
    const maxTop = rowBottomViewport - panelInitialHeight.value
    if (maxTop < top) {
      top = Math.max(maxTop, 0)
    }
  }

  isRightPanelFixed.value = true
  rightPanelStyle.value = {
    position: 'fixed',
    top: `${top}px`,
    left: `${panelInitialLeft.value}px`,
    width: `${panelInitialWidth.value}px`,
    zIndex: '30',
  }
}

function handleResize() {
  // Re-measure and re-apply on resize
  isRightPanelFixed.value = false
  rightPanelStyle.value = {}
  panelInitialTop.value = null
  panelInitialLeft.value = null
  panelInitialWidth.value = null
  panelInitialHeight.value = null
  measureRightPanel()
  updateRightPanelPosition()
}

const unitNumberParam = computed(
  () => (route.params.unitNumber as string | undefined)?.toString() ?? '',
)

const unit = computed<Unit | null>(() => {
  const target = unitNumberParam.value.trim().toLowerCase()
  if (!target) return null
  return units.value.find((u) => u.unitNumber.toLowerCase() === target) ?? null
})

const galleryImages = computed(() => {
  if (!unit.value) return []
  const urls: string[] = []

  if (unit.value.imageUrl) urls.push(unit.value.imageUrl)
  if (unit.value.imageUrl2) urls.push(unit.value.imageUrl2)
  if (unit.value.imageUrl3) urls.push(unit.value.imageUrl3)
  if (unit.value.floorplanUrl) urls.push(unit.value.floorplanUrl)

  return urls
})

const floorplanIndex = computed(() => {
  if (!unit.value || !unit.value.floorplanUrl) return -1
  // Floorplan is appended last in galleryImages
  return galleryImages.value.length - 1
})

const isAvailable = computed(() => unit.value?.status === 'Available')
const isLockedByOther = computed(() => {
  const u = unit.value
  if (!u?.lockedBy || !u.lockExpiresAt) return false
  if (user.value?.id && u.lockedBy === user.value.id) return false
  return u.lockExpiresAt > Date.now()
})
const canReserve = computed(() => isAvailable.value && !isLockedByOther.value)

const formattedPrice = computed(() =>
  unit.value ? formatAmount(unit.value.price) : '',
)

const costs = computed(() => {
  if (!unit.value) {
    return { bond: 0, rates: 0, levies: 0, total: 0 }
  }
  const bond = unit.value.price * CONFIG.BOND_RATE
  const rates = CONFIG.RATES_BASE + unit.value.price * CONFIG.RATES_MULTIPLIER
  const levies = unit.value.sizeSqm * CONFIG.LEVY_PER_SQM
  const total = bond + rates + levies
  return {
    bond: Math.round(bond),
    rates: Math.round(rates),
    levies: Math.round(levies),
    total: Math.round(total),
  }
})

const rentalEstimates = computed(() => {
  if (!unit.value) {
    return { bond: 0, shortTerm: 0, longTerm: 0 }
  }
  const bond = costs.value.bond
  // Simple multipliers to provide indicative short/long-term rentals
  const shortTerm = Math.round(bond * 1.27)
  const longTerm = Math.round(bond * 0.86)
  return { bond, shortTerm, longTerm }
})

const isWishlisted = computed(
  () => unit.value != null && wishlistIds.value.includes(unit.value.id),
)

const indicatorColorClass = computed(() => {
  if (!unit.value) return 'bg-emerald-500'
  if (unit.value.status === 'Sold')
    return 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]'
  if (unit.value.status === 'Reserved' || unit.value.status === 'Held by Developer')
    return 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
  return 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)] animate-pulse'
})

const statusDisplay = computed(() => {
  if (!unit.value) return ''
  if (unit.value.status === 'Sold' || unit.value.status === 'Reserved' || unit.value.status === 'Held by Developer') {
    return unit.value.status
  }
  // For available units we only show the indicator dot, no text label
  return ''
})

async function goBackToList() {
  returningToList.value = true
  await navigateTo('/')
}

function formatAmount(value: number): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  })
    .format(Math.round(value))
    .replace(/,/g, ' ')
}

function onToggleWishlist() {
  if (!unit.value) return
  toggleWishlist(unit.value.id)
}

function onGallerySwiper(swiper: any) {
  gallerySwiper.value = swiper
}

function onGallerySlideChange(swiper: any) {
  activeIndex.value = swiper.realIndex
}

function prevImage() {
  if (gallerySwiper.value) {
    gallerySwiper.value.slidePrev()
    return
  }
  if (galleryImages.value.length <= 1) return
  activeIndex.value =
    (activeIndex.value - 1 + galleryImages.value.length) % galleryImages.value.length
}

function nextImage() {
  if (gallerySwiper.value) {
    gallerySwiper.value.slideNext()
    return
  }
  if (galleryImages.value.length <= 1) return
  activeIndex.value =
    (activeIndex.value + 1) % galleryImages.value.length
}

function goToImage(index: number) {
  if (gallerySwiper.value) {
    gallerySwiper.value.slideTo(index)
    activeIndex.value = index
    lightboxIndex.value = index
    return
  }
  if (!galleryImages.value.length) return
  const len = galleryImages.value.length
  const normalized = ((index % len) + len) % len
  activeIndex.value = normalized
  lightboxIndex.value = normalized
}

function openLightbox(index: number) {
  if (!galleryImages.value.length) return
  lightboxIndex.value = index
  lightboxOpen.value = true
}

function closeLightbox() {
  lightboxOpen.value = false
}

function lightboxPrev() {
  if (!galleryImages.value.length) return
  const len = galleryImages.value.length
  lightboxIndex.value = (lightboxIndex.value - 1 + len) % len
}

function lightboxNext() {
  if (!galleryImages.value.length) return
  const len = galleryImages.value.length
  lightboxIndex.value = (lightboxIndex.value + 1) % len
}

async function onReserveClick() {
  if (!unit.value || !canReserve.value || reserving.value) return

  reserving.value = true
  try {
    const { $supabase } = useNuxtApp()
    const {
      data: { session },
    } = await $supabase.auth.getSession()
    if (!session) {
      await navigateTo('/')
      return
    }

    const res = await $fetch<{ lockExpiresAt?: string }>('/api/units/acquire-lock', {
      method: 'POST',
      body: { unitId: unit.value.id },
      headers: { Authorization: `Bearer ${session.access_token}` },
    })

    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('ignite_reserve_unitId', unit.value.id)
      if (res?.lockExpiresAt) {
        sessionStorage.setItem('ignite_reserve_lockExpiresAt', res.lockExpiresAt)
      }
      sessionStorage.setItem('ignite_reserve_token', session.access_token)
    }

    await navigateTo(`/reserve/${unit.value.unitNumber}`)
  } catch (e: any) {
    const msg = e?.data?.message || e?.message || 'Could not reserve unit.'
    console.error(msg)
    alert(msg)
  } finally {
    reserving.value = false
  }
}

onMounted(() => {
  measureRightPanel()
  updateRightPanelPosition()
  window.addEventListener('scroll', updateRightPanelPosition, { passive: true })
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateRightPanelPosition)
  window.removeEventListener('resize', handleResize)
  if (heroAutoplayId.value != null && typeof window !== 'undefined') {
    window.clearInterval(heroAutoplayId.value)
  }
})
</script>

<style scoped>
.unit-gallery-swiper :deep(.swiper-wrapper),
.unit-gallery-swiper :deep(.swiper-slide) {
  height: 100%;
}
</style>

