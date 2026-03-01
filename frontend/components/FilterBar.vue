<template>
  <div class="mb-10 sm:mb-14">
    <div class="liquid-glass-dark filter-bar rounded-xl p-5 sm:p-6 md:p-8 mb-6 sm:mb-8 border border-white/5 shadow-inner">
      <div class="space-y-6">
        <!-- 5×3 grid at lg: each control in its own cell; Price Range spans 2 cols; Clear All in row 3 col 5 -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <!-- Row 1 -->
          <div class="lg:col-span-1">
            <label class="flex items-center gap-2 text-xs font-medium text-zinc-500 capitalize mb-2">
              <svg class="w-[13px] h-[13px] text-zinc-500 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search Unit
            </label>
            <input
              type="text"
:placeholder="`e.g. ${sampleUnitNumbersPlaceholder}`"
              class="w-full h-11 pl-4 pr-4 bg-white/[0.03] border border-white/5 rounded-lg text-zinc-300 placeholder-zinc-500 placeholder:normal-case text-[13px] font-medium capitalize focus:border-zinc-500 focus:outline-none transition-colors"
              :value="filters.searchQuery ?? ''"
              @input="onSearchInput($event)"
            />
          </div>
          <div class="lg:col-span-1">
            <label class="flex items-center gap-2 text-xs font-medium text-zinc-500 capitalize mb-2">
              <svg class="w-[13px] h-[13px] text-zinc-500 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                <path d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              Order By
            </label>
            <select
              class="h-11 w-full bg-white/[0.03] border border-white/5 rounded-lg px-4 text-zinc-300 text-[13px] font-medium capitalize appearance-none cursor-pointer focus:border-zinc-500 focus:outline-none"
              :value="filters.orderBy ?? 'unitNumber'"
              @change="onOrderByChange($event)"
            >
              <option value="unitNumber" class="bg-zinc-950">Unit Number</option>
              <option value="price" class="bg-zinc-950">Price</option>
              <option value="bedrooms" class="bg-zinc-950">Beds</option>
            </select>
          </div>
          <div class="lg:col-span-1">
            <label class="flex items-center gap-2 text-xs font-medium text-zinc-500 capitalize mb-2">Sort</label>
            <button
              type="button"
              class="h-11 w-full bg-white/[0.03] border border-white/5 rounded-lg px-4 text-zinc-300 text-[13px] font-medium capitalize flex items-center justify-center cursor-pointer focus:border-zinc-500 focus:outline-none hover:bg-white/[0.05] transition-colors"
              :aria-pressed="(filters.orderDir ?? 'asc') === 'desc'"
              aria-label="Sort order"
              @click="onSortToggle"
            >
              {{ (filters.orderDir ?? 'asc') === 'asc' ? 'ASC ↑' : 'DESC ↓' }}
            </button>
          </div>
          <!-- Price Range spans 2 cols -->
          <div class="lg:col-span-2 flex flex-col justify-end min-h-[4.125rem] overflow-visible">
            <label for="price-slider" class="flex items-center justify-center text-xs font-medium text-zinc-500 mb-1 text-center shrink-0">
              Price Range
            </label>
            <div id="price-slider" class="price-slider w-full mt-2 flex-1 min-h-0 relative flex flex-col justify-end pb-0 slider-target slider-horizontal px-[1.8rem] -mt-[1.25rem]">
              <div class="slider-base relative w-full h-3 overflow-visible shrink-0">
                <div class="slider-connects absolute inset-0 pointer-events-none">
                  <div
                    class="slider-connect absolute top-1/2 -translate-y-1/2 h-[4px] rounded-full bg-white/5"
                    :style="{ left: minPercent + '%', width: (maxPercent - minPercent) + '%' }"
                  />
                </div>
                <div class="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[4px] rounded-full bg-white/[0.03] pointer-events-none" aria-hidden="true" />
                <input
                  type="range"
                  :min="effectivePriceRange.min"
                  :max="effectivePriceRange.max"
                  :step="PRICE_STEP"
                  :value="priceMinValue"
                  class="price-range-input price-range-input-min"
                  aria-label="Minimum price"
                  :aria-valuemin="effectivePriceRange.min"
                  :aria-valuemax="priceMaxValue"
                  :aria-valuenow="priceMinValue"
                  :aria-valuetext="'R' + formatPriceShort(priceMinValue)"
                  @input="onPriceMinInput($event)"
                >
                <input
                  type="range"
                  :min="effectivePriceRange.min"
                  :max="effectivePriceRange.max"
                  :step="PRICE_STEP"
                  :value="priceMaxValue"
                  class="price-range-input price-range-input-max"
                  aria-label="Maximum price"
                  :aria-valuemin="priceMinValue"
                  :aria-valuemax="effectivePriceRange.max"
                  :aria-valuenow="priceMaxValue"
                  :aria-valuetext="'R' + formatPriceShort(priceMaxValue)"
                  @input="onPriceMaxInput($event)"
                >
                <div
                  class="slider-origin absolute top-1/2 z-0 pointer-events-none"
                  :style="{ left: minPercent + '%', transform: 'translate(-50%, -50%)' }"
                >
                  <div class="slider-handle slider-handle-lower w-3.5 h-3.5 rounded-full bg-white/5 shadow-sm flex flex-col items-center" role="presentation">
                    <div class="slider-tooltip slider-tooltip-top absolute bottom-full left-1/2 -translate-x-1/2 mb-1 flex flex-col items-center">
                      <span class="slider-tooltip-pill rounded-[0.35rem] bg-white/5 px-2 py-1 text-[11px] font-bold text-white whitespace-nowrap shadow-sm">R{{ formatPriceShort(priceMinValue) }}</span>
                      <span class="slider-tooltip-arrow w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-white/5 -mt-px" />
                    </div>
                  </div>
                </div>
                <div
                  class="slider-origin absolute top-1/2 z-0 pointer-events-none"
                  :style="{ left: maxPercent + '%', transform: 'translate(-50%, -50%)' }"
                >
                  <div class="slider-handle slider-handle-upper w-3.5 h-3.5 rounded-full bg-white/5 shadow-sm flex flex-col items-center" role="presentation">
                    <div class="slider-tooltip slider-tooltip-top absolute bottom-full left-1/2 -translate-x-1/2 mb-1 flex flex-col items-center">
                      <span class="slider-tooltip-pill rounded-[0.35rem] bg-white/5 px-2 py-1 text-[11px] font-bold text-white whitespace-nowrap shadow-sm">R{{ formatPriceShort(priceMaxValue) }}</span>
                      <span class="slider-tooltip-arrow w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-white/5 -mt-px" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Row 2 -->
          <div class="lg:col-span-1">
            <label class="flex items-center gap-2 text-xs font-medium text-zinc-500 capitalize mb-2">
              <svg class="w-[13px] h-[13px] text-zinc-500 flex-shrink-0" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M2.5 8a5.5 5.5 0 0 1 8.25-4.764.5.5 0 0 0 .5-.866A6.5 6.5 0 1 0 14.5 8a.5.5 0 0 0-1 0 5.5 5.5 0 1 1-11 0"/>
                <path d="M15.354 3.354a.5.5 0 0 0-.708-.708L8 9.293 5.354 6.646a.5.5 0 1 0-.708.708l3 3a.5.5 0 0 0 .708 0z"/>
              </svg>
              Availability
            </label>
            <select
              class="h-11 w-full bg-white/[0.03] border border-white/5 rounded-lg px-4 text-zinc-300 text-[13px] font-medium capitalize appearance-none cursor-pointer focus:border-zinc-500 focus:outline-none"
              :value="filters.status"
              @change="onStatusChange($event)"
            >
              <option value="all" class="bg-zinc-950">All</option>
              <option value="Available" class="bg-zinc-950">Available</option>
              <option value="Reserved" class="bg-zinc-950">Reserved</option>
              <option value="Sold" class="bg-zinc-950">Sold</option>
            </select>
          </div>
          <div class="lg:col-span-1">
            <label class="flex items-center gap-2 text-xs font-medium text-zinc-500 capitalize mb-2">
              <IconLayout class="w-[13px] h-[13px] text-zinc-500 flex-shrink-0" />
              Layout
            </label>
            <select
              class="h-11 w-full bg-white/[0.03] border border-white/5 rounded-lg px-4 text-zinc-300 text-[13px] font-medium capitalize appearance-none cursor-pointer focus:border-zinc-500 focus:outline-none"
              :value="filters.layout ?? 'any'"
              @change="onLayoutChange($event)"
            >
              <option value="any" class="bg-zinc-950">Any</option>
              <option v-for="t in layoutOptions" :key="t" :value="t" class="bg-zinc-950">{{ t }}</option>
            </select>
          </div>
          <div class="lg:col-span-1">
            <label class="flex items-center gap-2 text-xs font-medium text-zinc-500 capitalize mb-2">
              <svg class="w-[13px] h-[13px] text-zinc-500 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Floor
            </label>
            <select
              class="h-11 w-full bg-white/[0.03] border border-white/5 rounded-lg px-4 text-zinc-300 text-[13px] font-medium capitalize appearance-none cursor-pointer focus:border-zinc-500 focus:outline-none"
              :value="filters.floor ?? 'any'"
              @change="onFloorChange($event)"
            >
              <option value="any" class="bg-zinc-950">Any</option>
              <option v-for="f in floorOptions" :key="f" :value="f" class="bg-zinc-950">{{ f }}</option>
            </select>
          </div>
          <div class="lg:col-span-1">
            <label class="flex items-center gap-2 text-xs font-medium text-zinc-500 capitalize mb-2">
              <svg class="w-[13px] h-[13px] text-zinc-500 flex-shrink-0" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M8 16.016a7.5 7.5 0 0 0 1.962-14.74A1 1 0 0 0 9 0H7a1 1 0 0 0-.962 1.276A7.5 7.5 0 0 0 8 16.016m6.5-7.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0"/>
                <path d="m6.94 7.44 4.95-2.83-2.83 4.95-4.949 2.83 2.828-4.95z"/>
              </svg>
              Direction
            </label>
            <select
              class="h-11 w-full bg-white/[0.03] border border-white/5 rounded-lg px-4 text-zinc-300 text-[13px] font-medium capitalize appearance-none cursor-pointer focus:border-zinc-500 focus:outline-none"
              :value="filters.direction ?? 'any'"
              @change="onDirectionChange($event)"
            >
              <option value="any" class="bg-zinc-950">Any</option>
              <option v-for="d in directionOptions" :key="d" :value="d" class="bg-zinc-950">{{ d }}</option>
            </select>
          </div>
          <div class="lg:col-span-1">
            <label class="flex items-center gap-2 text-xs font-medium text-zinc-500 capitalize mb-2">
              <IconCar class="w-[13px] h-[13px] text-zinc-500 flex-shrink-0" />
              Parking
            </label>
            <select
              class="h-11 w-full bg-white/[0.03] border border-white/5 rounded-lg px-4 text-zinc-300 text-[13px] font-medium capitalize appearance-none cursor-pointer focus:border-zinc-500 focus:outline-none"
              :value="filters.parking ?? 'any'"
              @change="onParkingChange($event)"
            >
              <option value="any" class="bg-zinc-950">Any</option>
              <option value="0" class="bg-zinc-950">0</option>
              <option value="1" class="bg-zinc-950">1</option>
              <option value="2" class="bg-zinc-950">2</option>
            </select>
          </div>

          <!-- Row 3: Wishlist | empty (span 3) | Clear All -->
          <div class="lg:col-span-1">
            <label class="flex items-center gap-2 text-xs font-medium text-zinc-500 capitalize mb-2">
              <IconHeart class="w-[13px] h-[13px] text-zinc-500 flex-shrink-0" />
              Wishlist
            </label>
            <select
              class="h-11 w-full bg-white/[0.03] border border-white/5 rounded-lg px-4 text-zinc-300 text-[13px] font-medium capitalize appearance-none cursor-pointer focus:border-zinc-500 focus:outline-none"
              :value="filters.wishlistFilter ?? 'all'"
              @change="onWishlistChange($event)"
            >
              <option value="all" class="bg-zinc-950">All</option>
              <option value="yes" class="bg-zinc-950">In wishlist</option>
            </select>
          </div>
          <div class="hidden lg:block lg:col-span-3" aria-hidden="true" />
          <div class="lg:col-span-1 flex justify-end items-end">
            <button
              type="button"
              class="inline-flex items-center gap-2 text-xs font-medium text-zinc-500 hover:text-zinc-300 capitalize transition-colors underline underline-offset-2"
              @click="clearAllFilters"
            >
              <svg class="w-[13px] h-[13px] flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear All Filters
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="flex justify-center mt-4 px-1">
      <p class="text-[10px] font-black text-zinc-500 capitalize">
        {{ availableCount }}
        <span class="text-zinc-600">of</span>
        {{ totalUnits }}
        <span class="text-zinc-600">units available</span>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import IconHeart from '~/components/icons/IconHeart.vue'
import IconLayout from '~/components/icons/IconLayout.vue'
import IconCar from '~/components/icons/IconCar.vue'
import type { SearchFilters, ViewMode } from '~/types'

const props = defineProps<{
  filters: SearchFilters
  viewMode: ViewMode
  availableCount: number
  totalUnits: number
  unitTypes?: string[]
  floorOptions?: string[]
  directionOptions?: string[]
  sampleUnitNumbers?: string
}>()

const emit = defineEmits<{
  'update:filters': [SearchFilters]
  'update:viewMode': [ViewMode]
}>()

const effectivePriceRange = computed(() => ({ min: 1_500_000, max: 9_000_000 }))
const PRICE_STEP = 50_000

const priceMinValue = computed(() => {
  const p = props.filters.minPrice
  if (p === 'all') return effectivePriceRange.value.min
  const v = Number(p)
  const { min, max } = effectivePriceRange.value
  return Number.isFinite(v) ? Math.max(min, Math.min(max, v)) : min
})
const priceMaxValue = computed(() => {
  const p = props.filters.maxPrice
  if (p === 'all') return effectivePriceRange.value.max
  const v = Number(p)
  const { min, max } = effectivePriceRange.value
  return Number.isFinite(v) ? Math.max(min, Math.min(max, v)) : max
})
const rangeSpan = computed(() => Math.max(1, effectivePriceRange.value.max - effectivePriceRange.value.min))
const minPercent = computed(() => ((priceMinValue.value - effectivePriceRange.value.min) / rangeSpan.value) * 100)
const maxPercent = computed(() => ((priceMaxValue.value - effectivePriceRange.value.min) / rangeSpan.value) * 100)
const layoutOptions = computed(() => props.unitTypes ?? [])
const floorOptions = computed(() => props.floorOptions ?? [])
const directionOptions = computed(() => props.directionOptions ?? [])
const sampleUnitNumbersPlaceholder = computed(() => {
  const sample = props.sampleUnitNumbers?.trim()
  return sample || '101, 102'
})

function formatPriceShort(price: number) {
  if (price >= 1_000_000) return (price / 1_000_000).toFixed(1) + 'M'
  if (price >= 1_000) return (price / 1_000).toFixed(0) + 'K'
  return String(price)
}
function updateFilter(key: keyof SearchFilters, value: string | number | 'all' | undefined) {
  emit('update:filters', { ...props.filters, [key]: value } as SearchFilters)
}
function clearAllFilters() {
  emit('update:filters', {
    maxPrice: 'all', minPrice: 'all', bedrooms: 'all', bathrooms: 'all', status: 'all',
    searchQuery: '', orderBy: 'unitNumber', orderDir: 'asc', layout: 'any',
    floor: 'any', direction: 'any', parking: 'any', wishlistFilter: 'all',
  } as SearchFilters)
}
function onSearchInput(e: Event) { updateFilter('searchQuery', (e.target as HTMLInputElement).value || undefined) }
function onOrderByChange(e: Event) { updateFilter('orderBy', (e.target as HTMLSelectElement).value as SearchFilters['orderBy']) }
function onOrderDirChange(e: Event) { updateFilter('orderDir', (e.target as HTMLSelectElement).value as 'asc' | 'desc') }
function onSortToggle() {
  const next = (props.filters.orderDir ?? 'asc') === 'asc' ? 'desc' : 'asc'
  updateFilter('orderDir', next)
}
function onStatusChange(e: Event) { updateFilter('status', (e.target as HTMLSelectElement).value) }
function onLayoutChange(e: Event) { const v = (e.target as HTMLSelectElement).value; updateFilter('layout', v === 'any' ? undefined : v) }
function onFloorChange(e: Event) { const v = (e.target as HTMLSelectElement).value; updateFilter('floor', v === 'any' ? undefined : v) }
function onDirectionChange(e: Event) { const v = (e.target as HTMLSelectElement).value; updateFilter('direction', v === 'any' ? undefined : v) }
function onParkingChange(e: Event) { const v = (e.target as HTMLSelectElement).value; updateFilter('parking', v === 'any' ? undefined : v) }
function onWishlistChange(e: Event) { updateFilter('wishlistFilter', (e.target as HTMLSelectElement).value as 'all' | 'yes') }
function onPriceMinInput(e: Event) {
  const val = Number((e.target as HTMLInputElement).value)
  emit('update:filters', { ...props.filters, minPrice: val, maxPrice: Math.max(priceMaxValue.value, val) } as SearchFilters)
}
function onPriceMaxInput(e: Event) {
  const val = Number((e.target as HTMLInputElement).value)
  emit('update:filters', { ...props.filters, minPrice: Math.min(priceMinValue.value, val), maxPrice: val } as SearchFilters)
}
</script>
