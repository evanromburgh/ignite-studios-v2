<template>
  <div>
    <div :class="['filter-bar', 'filter-bar--light', embedded ? 'filter-bar--embedded p-5' : 'rounded-lg p-5']">
      <div class="space-y-6">
        <!-- Mobile: 2 cols with Search/Price full width; lg: 5×3 grid -->
        <div class="grid grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div class="col-span-1 lg:col-span-1 order-1 lg:order-none">
            <label class="flex items-center gap-2 text-xs font-medium text-zinc-500 capitalize mb-2">
              <svg class="w-[13px] h-[13px] text-zinc-500 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search Unit
            </label>
            <input
              type="text"
              placeholder="e.g. 701, 848"
              class="w-full h-[2.375rem] pl-4 pr-4 bg-theme-input-bg border border-theme-border rounded-lg text-zinc-300 placeholder-zinc-500 placeholder:normal-case text-[12px] font-medium capitalize focus:border-zinc-500 focus:outline-none transition-colors"
              :value="filters.searchQuery ?? ''"
              @input="onSearchInput($event)"
            />
          </div>
          <div class="lg:col-span-1 order-2 lg:order-none">
            <label class="flex items-center gap-2 text-xs font-medium text-zinc-500 capitalize mb-2">
              <svg class="w-[13px] h-[13px] text-zinc-500 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                <path d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              Order By
            </label>
            <select
              class="h-[2.375rem] w-full bg-theme-input-bg border border-theme-border rounded-lg px-4 text-zinc-300 text-[12px] font-medium capitalize appearance-none cursor-pointer focus:border-zinc-500 focus:outline-none"
              :value="filters.orderBy ?? 'unitNumber'"
              @change="onOrderByChange($event)"
            >
              <option value="unitNumber" class="bg-theme-input-bg text-theme-text-primary">Unit Number</option>
              <option value="price" class="bg-theme-input-bg text-theme-text-primary">Price</option>
              <option value="bedrooms" class="bg-theme-input-bg text-theme-text-primary">Beds</option>
            </select>
          </div>
          <div class="col-span-1 lg:col-span-1 order-3 lg:order-none">
            <label class="flex items-center gap-2 text-xs font-medium text-zinc-500 capitalize mb-2">Sort</label>
            <button
              type="button"
              class="h-[2.375rem] w-full bg-theme-input-bg border border-theme-border rounded-lg px-4 text-zinc-300 text-[12px] font-medium capitalize flex items-center justify-center cursor-pointer focus:border-zinc-500 focus:outline-none hover:bg-theme-input-bg transition-colors"
              :aria-pressed="(filters.orderDir ?? 'asc') === 'desc'"
              aria-label="Sort order"
              @click="onSortToggle"
            >
              {{ (filters.orderDir ?? 'asc') === 'asc' ? 'ASC ↑' : 'DESC ↓' }}
            </button>
          </div>
          <!-- Price Range: full width on mobile, 2 cols on lg -->
          <div class="col-span-2 lg:col-span-2 order-5 lg:order-none flex flex-col justify-end min-h-[4.125rem] overflow-visible">
            <label for="price-slider" class="flex items-center justify-center text-xs font-medium text-zinc-500 mt-1 mb-2 text-center shrink-0">
              Price Range
            </label>
            <div id="price-slider" class="price-slider w-full mt-2 flex-1 min-h-0 relative flex flex-col justify-end pb-0 slider-target slider-horizontal px-[1.8rem] -mt-[1.25rem]">
              <div class="slider-base relative w-full h-3 overflow-visible shrink-0">
                <div class="slider-connects absolute inset-0 pointer-events-none">
                  <div
                    class="slider-connect absolute top-1/2 -translate-y-1/2 h-[4px] rounded-full bg-theme-border"
                    :style="{ left: minPercent + '%', width: (maxPercent - minPercent) + '%' }"
                  />
                </div>
                <div class="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[4px] rounded-full bg-theme-input-bg pointer-events-none" aria-hidden="true" />
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
                  <div class="slider-handle slider-handle-lower w-3.5 h-3.5 rounded-full bg-theme-border shadow-sm flex flex-col items-center" role="presentation">
                    <div class="slider-tooltip slider-tooltip-top absolute bottom-full left-1/2 -translate-x-1/2 mb-1 flex flex-col items-center">
                      <span class="slider-tooltip-pill rounded-[0.35rem] bg-theme-surface-elevated px-2 py-1 text-[11px] font-bold text-theme-text-primary whitespace-nowrap shadow-sm">R{{ formatPriceShort(priceMinValue) }}</span>
                      <span class="slider-tooltip-arrow w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-theme-border -mt-px" />
                    </div>
                  </div>
                </div>
                <div
                  class="slider-origin absolute top-1/2 z-0 pointer-events-none"
                  :style="{ left: maxPercent + '%', transform: 'translate(-50%, -50%)' }"
                >
                  <div class="slider-handle slider-handle-upper w-3.5 h-3.5 rounded-full bg-theme-border shadow-sm flex flex-col items-center" role="presentation">
                    <div class="slider-tooltip slider-tooltip-top absolute bottom-full left-1/2 -translate-x-1/2 mb-1 flex flex-col items-center">
                      <span class="slider-tooltip-pill rounded-[0.35rem] bg-theme-surface-elevated px-2 py-1 text-[11px] font-bold text-theme-text-primary whitespace-nowrap shadow-sm">R{{ formatPriceShort(priceMaxValue) }}</span>
                      <span class="slider-tooltip-arrow w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-theme-border -mt-px" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Row 2 -->
          <div class="lg:col-span-1 order-4 lg:order-none">
            <label class="flex items-center gap-2 text-xs font-medium text-zinc-500 capitalize mb-2">
              <svg class="w-[13px] h-[13px] text-zinc-500 flex-shrink-0" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M2.5 8a5.5 5.5 0 0 1 8.25-4.764.5.5 0 0 0 .5-.866A6.5 6.5 0 1 0 14.5 8a.5.5 0 0 0-1 0 5.5 5.5 0 1 1-11 0"/>
                <path d="M15.354 3.354a.5.5 0 0 0-.708-.708L8 9.293 5.354 6.646a.5.5 0 1 0-.708.708l3 3a.5.5 0 0 0 .708 0z"/>
              </svg>
              Status
            </label>
            <select
              class="h-[2.375rem] w-full bg-theme-input-bg border border-theme-border rounded-lg px-4 text-zinc-300 text-[12px] font-medium capitalize appearance-none cursor-pointer focus:border-zinc-500 focus:outline-none"
              :value="filters.status"
              @change="onStatusChange($event)"
            >
              <option value="all" class="bg-theme-input-bg text-theme-text-primary">All</option>
              <option value="Available" class="bg-theme-input-bg text-theme-text-primary">Available</option>
              <option value="Reserved" class="bg-theme-input-bg text-theme-text-primary">Reserved</option>
              <option value="Sold" class="bg-theme-input-bg text-theme-text-primary">Sold</option>
              <option value="Held by Developer" class="bg-theme-input-bg text-theme-text-primary">Held by Developer</option>
            </select>
          </div>
          <div class="lg:col-span-1 order-6 lg:order-none">
            <label class="flex items-center gap-2 text-xs font-medium text-zinc-500 capitalize mb-2">
              <IconLayout class="w-[13px] h-[13px] text-zinc-500 flex-shrink-0" />
              Layout
            </label>
            <select
              class="h-[2.375rem] w-full bg-theme-input-bg border border-theme-border rounded-lg px-4 text-zinc-300 text-[12px] font-medium capitalize appearance-none cursor-pointer focus:border-zinc-500 focus:outline-none"
              :value="filters.layout ?? 'any'"
              @change="onLayoutChange($event)"
            >
              <option value="any" class="bg-theme-input-bg text-theme-text-primary">Any</option>
              <option v-for="t in layoutOptions" :key="t" :value="t" class="bg-theme-input-bg text-theme-text-primary">{{ t }}</option>
            </select>
          </div>
          <div class="lg:col-span-1 order-7 lg:order-none">
            <label class="flex items-center gap-2 text-xs font-medium text-zinc-500 capitalize mb-2">
              <svg class="w-[13px] h-[13px] text-zinc-500 flex-shrink-0" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M8.235 1.559a.5.5 0 0 0-.47 0l-7.5 4a.5.5 0 0 0 0 .882L3.188 8 .264 9.559a.5.5 0 0 0 0 .882l7.5 4a.5.5 0 0 0 .47 0l7.5-4a.5.5 0 0 0 0-.882L12.813 8l2.922-1.559a.5.5 0 0 0 0-.882zm3.515 7.008L14.438 10 8 13.433 1.562 10 4.25 8.567l3.515 1.874a.5.5 0 0 0 .47 0zM8 9.433 1.562 6 8 2.567 14.438 6z"/>
              </svg>
              Floor
            </label>
            <select
              class="h-[2.375rem] w-full bg-theme-input-bg border border-theme-border rounded-lg px-4 text-zinc-300 text-[12px] font-medium capitalize appearance-none cursor-pointer focus:border-zinc-500 focus:outline-none"
              :value="filters.floor ?? 'any'"
              @change="onFloorChange($event)"
            >
              <option value="any" class="bg-theme-input-bg text-theme-text-primary">Any</option>
              <option v-for="f in floorOptions" :key="f" :value="f" class="bg-theme-input-bg text-theme-text-primary">{{ formatFloorLabel(f) }}</option>
            </select>
          </div>
          <div class="lg:col-span-1 order-8 lg:order-none">
            <label class="flex items-center gap-2 text-xs font-medium text-zinc-500 capitalize mb-2">
              <svg class="w-[13px] h-[13px] text-zinc-500 flex-shrink-0" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M8 16.016a7.5 7.5 0 0 0 1.962-14.74A1 1 0 0 0 9 0H7a1 1 0 0 0-.962 1.276A7.5 7.5 0 0 0 8 16.016m6.5-7.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0"/>
                <path d="m6.94 7.44 4.95-2.83-2.83 4.95-4.949 2.83 2.828-4.95z"/>
              </svg>
              Direction
            </label>
            <select
              class="h-[2.375rem] w-full bg-theme-input-bg border border-theme-border rounded-lg px-4 text-zinc-300 text-[12px] font-medium capitalize appearance-none cursor-pointer focus:border-zinc-500 focus:outline-none"
              :value="filters.direction ?? 'any'"
              @change="onDirectionChange($event)"
            >
              <option value="any" class="bg-theme-input-bg text-theme-text-primary">Any</option>
              <option v-for="d in directionOptions" :key="d" :value="d" class="bg-theme-input-bg text-theme-text-primary">{{ d }} Facing</option>
            </select>
          </div>
          <div class="lg:col-span-1 order-9 lg:order-none">
            <label class="flex items-center gap-2 text-xs font-medium text-zinc-500 capitalize mb-2">
              <IconCar class="w-[13px] h-[13px] text-zinc-500 flex-shrink-0" />
              Parking
            </label>
            <select
              class="h-[2.375rem] w-full bg-theme-input-bg border border-theme-border rounded-lg px-4 text-zinc-300 text-[12px] font-medium capitalize appearance-none cursor-pointer focus:border-zinc-500 focus:outline-none"
              :value="filters.parking ?? 'any'"
              @change="onParkingChange($event)"
            >
              <option value="any" class="bg-theme-input-bg text-theme-text-primary">Any</option>
              <option value="0" class="bg-theme-input-bg text-theme-text-primary">0</option>
              <option value="1" class="bg-theme-input-bg text-theme-text-primary">1</option>
              <option value="2" class="bg-theme-input-bg text-theme-text-primary">2</option>
            </select>
          </div>
          <div v-if="!hideClear" class="hidden lg:block lg:col-span-4" aria-hidden="true" />
          <div v-if="!hideClear" class="col-span-2 lg:col-span-1 order-10 lg:order-none flex justify-start lg:justify-end items-end">
            <button
              type="button"
              class="filter-bar-clear filter-bar-clear--danger h-[2.375rem] w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 text-[12px] font-medium capitalize transition-colors"
              @click="clearAllFilters"
            >
              <svg class="w-[13px] h-[13px] flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Clear All Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import IconLayout from '~/components/icons/IconLayout.vue'
import IconCar from '~/components/icons/IconCar.vue'
import type { SearchFilters, ViewMode } from '~/types'

const props = withDefaults(
  defineProps<{
    filters: SearchFilters
    viewMode: ViewMode
    unitTypes?: string[]
    floorOptions?: string[]
    directionOptions?: string[]
    /** When true, no inner card (background/shadow); use parent as content width (e.g. mobile drawer). */
    embedded?: boolean
    /** When true, hide the Clear All Filters button (e.g. when drawer provides its own row). */
    hideClear?: boolean
  }>(),
  { embedded: false, hideClear: false },
)

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

function formatPriceShort(price: number) {
  if (price >= 1_000_000) return (price / 1_000_000).toFixed(1) + 'M'
  if (price >= 1_000) return (price / 1_000).toFixed(0) + 'K'
  return String(price)
}
function formatFloorLabel(floor: string | undefined): string {
  const raw = (floor || '').toLowerCase()
  if (!raw) return ''
  const withFloor = raw.includes('floor') ? raw : `${raw} floor`
  return withFloor.replace(/\b\w/g, (c) => c.toUpperCase())
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
function onPriceMinInput(e: Event) {
  const val = Number((e.target as HTMLInputElement).value)
  emit('update:filters', { ...props.filters, minPrice: val, maxPrice: Math.max(priceMaxValue.value, val) } as SearchFilters)
}
function onPriceMaxInput(e: Event) {
  const val = Number((e.target as HTMLInputElement).value)
  emit('update:filters', { ...props.filters, minPrice: Math.min(priceMinValue.value, val), maxPrice: val } as SearchFilters)
}
</script>
