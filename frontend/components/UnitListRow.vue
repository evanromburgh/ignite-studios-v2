<template>
  <div
    class="group relative w-full overflow-hidden select-none cursor-default bg-white border border-zinc-100 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-300 rounded-[0.75rem]"
    :class="(isAvailable || isAdmin) ? 'hover:shadow-[0_2px_10px_rgba(0,0,0,0.06)]' : ''"
  >
    <!-- Mobile layout: compact list card -->
    <div class="sm:hidden">
      <div class="flex items-start justify-between px-5 py-5">
        <span class="text-[20px] font-semibold text-[#18181B] tracking-tight leading-none">
          {{ unit.unitNumber }}
        </span>
        <span class="text-[20px] font-bold text-[#18181B] tracking-tight leading-none">
          R {{ formattedPrice }}
        </span>
      </div>

      <div class="px-5">
        <div class="border-t border-zinc-200/80 py-5">
          <div class="grid grid-cols-2 gap-x-6 gap-y-3">
            <div>
              <p class="text-[12px] text-[#18181B] leading-tight">Bedrooms</p>
              <p class="text-[12px] font-semibold text-[#18181B] leading-tight">{{ unit.bedrooms }}</p>
            </div>
            <div>
              <p class="text-[12px] text-[#18181B] leading-tight">Bathrooms</p>
              <p class="text-[12px] font-semibold text-[#18181B] leading-tight">{{ unit.bathrooms }}</p>
            </div>
            <div>
              <p class="text-[12px] text-[#18181B] leading-tight">Parking</p>
              <p class="text-[12px] font-semibold text-[#18181B] leading-tight">{{ unit.parking }}</p>
            </div>
            <div>
              <p class="text-[12px] text-[#18181B] leading-tight">Type</p>
              <p class="text-[12px] font-semibold text-[#18181B] leading-tight">{{ unit.unitType || '—' }}</p>
            </div>
            <div>
              <p class="text-[12px] text-[#18181B] leading-tight">Unit Size</p>
              <p class="text-[12px] font-semibold text-[#18181B] leading-tight">{{ unit.sizeSqm }}m²</p>
            </div>
            <div>
              <p class="text-[12px] text-[#18181B] leading-tight">Direction</p>
              <p class="text-[12px] font-semibold text-[#18181B] leading-tight">{{ formatFacingLabel(unit.direction) || '—' }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="px-5 pb-5">
        <button
          type="button"
          :disabled="!isAvailable && !isAdmin"
          class="h-10 w-full px-4 text-[12px] font-bold uppercase tracking-widest bg-[#18181B] text-white transition-[background-color,color] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] disabled:opacity-50 disabled:pointer-events-none disabled:text-zinc-400 disabled:bg-zinc-800 text-center"
          :class="'rounded-md'"
          @click.stop="onSelect(unit)"
        >
          View Details
        </button>
      </div>
    </div>

    <!-- Desktop/tablet layout (original list row) -->
    <div class="hidden sm:flex sm:flex-col sm:grid sm:grid-cols-3 sm:items-center gap-4 sm:gap-0 px-4 sm:px-6 py-6">
      <!-- Left: unit + floor + direction on one line, price below -->
      <div class="min-w-0 flex flex-col gap-2 flex-shrink-0 sm:pr-6">
        <div class="flex flex-wrap items-baseline gap-x-4 gap-y-0 leading-tight">
          <span class="text-[14px] font-extrabold tracking-[0.22em] uppercase text-zinc-900">
            Unit {{ unit.unitNumber }}
          </span>
          <span class="inline-flex items-baseline gap-x-1 text-[12px]">
            <span v-if="unit.floor" class="font-semibold text-zinc-600">
              {{ formatFloorLabel(unit.floor) }}
            </span>
            <span v-if="unit.floor && unit.direction" class="text-zinc-300" aria-hidden="true">•</span>
            <span v-if="unit.direction" class="font-semibold text-zinc-600">
              {{ formatFacingLabel(unit.direction) }}
            </span>
          </span>
        </div>
        <div class="text-left">
          <p v-if="unit.originalPrice" class="text-[11px] text-zinc-400 line-through leading-tight">
            R {{ formattedOriginalPrice }}
          </p>
          <p class="text-[20px] sm:text-[24px] font-bold leading-none text-zinc-900">
            R {{ formattedPrice }}
          </p>
        </div>
      </div>

      <!-- Middle: icons -->
      <div class="flex items-center justify-center gap-6 sm:gap-14 border-t sm:border-t-0 border-zinc-200/80 pt-4 sm:pt-0 sm:px-6 min-w-0">
        <div class="group/tip relative inline-flex items-center gap-2 cursor-help text-[12px] text-zinc-700">
          <span class="sr-only">Bedrooms</span>
          <IconBed class="w-4 h-4 text-zinc-700 flex-shrink-0" />
          <span class="font-semibold">{{ unit.bedrooms }}</span>
          <span class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-zinc-800 text-white text-[11px] rounded opacity-0 pointer-events-none transition-opacity z-20 whitespace-nowrap group-hover/tip:opacity-100">
            Bedrooms
            <span class="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-zinc-800" aria-hidden="true" />
          </span>
        </div>
        <div class="group/tip relative inline-flex items-center gap-2 cursor-help text-[12px] text-zinc-700">
          <span class="sr-only">Bathrooms</span>
          <IconBath class="w-4 h-4 text-zinc-700 flex-shrink-0" />
          <span class="font-semibold">{{ unit.bathrooms }}</span>
          <span class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-zinc-800 text-white text-[11px] rounded opacity-0 pointer-events-none transition-opacity z-20 whitespace-nowrap group-hover/tip:opacity-100">
            Bathrooms
            <span class="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-zinc-800" aria-hidden="true" />
          </span>
        </div>
        <div class="group/tip relative inline-flex items-center gap-2 cursor-help text-[12px] text-zinc-700">
          <span class="sr-only">Parking</span>
          <IconCar class="w-4 h-4 text-zinc-700 flex-shrink-0" />
          <span class="font-semibold">{{ unit.parking }}</span>
          <span class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-zinc-800 text-white text-[11px] rounded opacity-0 pointer-events-none transition-opacity z-20 whitespace-nowrap group-hover/tip:opacity-100">
            Parking
            <span class="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-zinc-800" aria-hidden="true" />
          </span>
        </div>
        <div class="group/tip relative inline-flex items-center gap-2 cursor-help text-[12px] text-zinc-700">
          <span class="sr-only">Unit Type</span>
          <IconLayout class="w-4 h-4 text-zinc-700 flex-shrink-0" />
          <span class="font-semibold">{{ unit.unitType || '—' }}</span>
          <span class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-zinc-800 text-white text-[11px] rounded opacity-0 pointer-events-none transition-opacity z-20 whitespace-nowrap group-hover/tip:opacity-100">
            Unit Type
            <span class="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-zinc-800" aria-hidden="true" />
          </span>
        </div>
        <div class="group/tip relative inline-flex items-center gap-2 cursor-help text-[12px] text-zinc-700">
          <span class="sr-only">Unit Size</span>
          <IconSize class="w-4 h-4 text-zinc-700 flex-shrink-0" />
          <span class="font-semibold">{{ unit.sizeSqm }}m²</span>
          <span class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-zinc-800 text-white text-[11px] rounded opacity-0 pointer-events-none transition-opacity z-20 whitespace-nowrap group-hover/tip:opacity-100">
            Unit Size
            <span class="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-zinc-800" aria-hidden="true" />
          </span>
        </div>
      </div>

      <!-- Right: actions -->
      <div class="flex items-center justify-end gap-3 sm:gap-4 w-full sm:w-auto border-t sm:border-t-0 pt-4 sm:pt-0 flex-shrink-0 sm:pl-6">
        <div class="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            :disabled="!isAvailable && !isAdmin"
            class="h-[46px] min-w-[140px] px-6 text-[12px] font-bold uppercase tracking-widest bg-transparent text-zinc-900 rounded-lg hover:bg-[#18181B] hover:text-white hover:rounded-lg transition-[background-color,color,border-radius] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] disabled:opacity-50 disabled:pointer-events-none disabled:text-zinc-500 disabled:hover:bg-transparent text-center"
            @click.stop="onSelect(unit)"
          >
            View Details
          </button>
          <span class="h-5 w-px bg-zinc-200/80" aria-hidden="true" />
          <button
            type="button"
            :disabled="(!isAvailable && !isAdmin) || (!prelaunchMode && isReserving)"
            class="h-[46px] min-w-[150px] px-6 text-[12px] font-bold uppercase tracking-widest bg-transparent text-zinc-900 rounded-lg hover:bg-[#18181B] hover:text-white hover:rounded-lg transition-[background-color,color,border-radius] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] disabled:opacity-50 disabled:pointer-events-none disabled:text-zinc-500 disabled:hover:bg-transparent text-center"
            @click.stop="onPrimaryAction(unit)"
          >
            {{ prelaunchMode ? 'Enquire now' : reserveButtonLabel }}
          </button>
          <button
            type="button"
            :disabled="!isAvailable && !isAdmin"
            class="hidden sm:inline-flex touch-manipulation h-9 w-9 items-center justify-center rounded-full border border-zinc-300 bg-white/95 text-zinc-600 transition-[background-color,color,border-color] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] [@media(hover:hover)]:hover:bg-red-600 [@media(hover:hover)]:hover:text-white [@media(hover:hover)]:hover:border-red-600 disabled:opacity-50 disabled:pointer-events-none disabled:text-zinc-400 disabled:[@media(hover:hover)]:hover:bg-white/95 disabled:[@media(hover:hover)]:hover:text-zinc-400 disabled:[@media(hover:hover)]:hover:border-zinc-300"
            :class="isWishlisted ? '!border-red-600 !bg-red-600 !text-white' : ''"
            aria-label="Toggle wishlist"
            @click.stop="onToggleWishlist(unit.id)"
          >
            <IconHeart class="w-4 h-4" :filled="isWishlisted" />
          </button>
        </div>
      </div>
    </div>

    <!-- Reserved/Sold/Locked banner (no unit type image in list view) -->
    <div v-if="showOverlay" class="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/25 backdrop-blur-[2px]">
      <span class="px-7 py-2 rounded-full bg-zinc-900 text-white text-[11px] font-black uppercase tracking-[0.2em]">
        {{ overlayLabel }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Unit } from '~/types'
import IconBed from '~/components/icons/IconBed.vue'
import IconBath from '~/components/icons/IconBath.vue'
import IconCar from '~/components/icons/IconCar.vue'
import IconSize from '~/components/icons/IconSize.vue'
import IconLayout from '~/components/icons/IconLayout.vue'
import IconHeart from '~/components/icons/IconHeart.vue'
import { formatZarInteger } from '~/utils/formatZar'
import { formatFacingLabel, formatFloorLabel } from '~/utils/unitLabels'

const props = withDefaults(
  defineProps<{
    unit: Unit
    isWishlisted?: boolean
    isAdmin?: boolean
    hideReservedOverlay?: boolean
    serverClockOffsetMs?: number
    currentUserId?: string | null
    reservingUnitId?: string | null
    prelaunchMode?: boolean
  }>(),
  { isWishlisted: false, isAdmin: false, hideReservedOverlay: false, serverClockOffsetMs: 0, currentUserId: undefined, reservingUnitId: null, prelaunchMode: false },
)

const emit = defineEmits<{
  select: [unit: Unit]
  reserve: [unit: Unit]
  enquire: [unit: Unit]
  toggleWishlist: [unitId: string]
}>()

const { timeLeft } = useLockCountdown(
  computed(() => props.unit.lockExpiresAt),
  computed(() => props.serverClockOffsetMs),
)
const isLocked = computed(() => timeLeft.value > 0 && props.unit.status === 'Available')
const isReserving = computed(() => props.reservingUnitId === props.unit.id)
const isAvailable = computed(() => props.unit.status === 'Available' && !isLocked.value)
const prelaunchWishlistDisabled = computed(
  () => !isAvailable.value && !props.isAdmin,
)

const showOverlay = computed(() =>
  !props.isAdmin &&
  !props.hideReservedOverlay &&
  (props.unit.status !== 'Available' || isLocked.value),
)

const formattedPrice = computed(() => formatZarInteger(props.unit.price))
const formattedOriginalPrice = computed(() =>
  props.unit.originalPrice ? formatZarInteger(props.unit.originalPrice) : '',
)

const reserveButtonLabel = computed(() => {
  if (isReserving.value) return 'Securing...'
  return 'Reserve Now'
})

const overlayLabel = computed(() => {
  if (isLocked.value) return 'Reservation In Progress'
  return props.unit.status
})

function onSelect(unit: Unit) {
  if (!isAvailable.value && !props.isAdmin) return
  emit('select', unit)
}

function onReserve(unit: Unit) {
  if (!isAvailable.value && !props.isAdmin) return
  emit('reserve', unit)
}

function onPrimaryAction(unit: Unit) {
  if (props.prelaunchMode) {
    if (!isAvailable.value && !props.isAdmin) return
    emit('enquire', unit)
    return
  }
  onReserve(unit)
}

function onToggleWishlist(unitId: string) {
  emit('toggleWishlist', unitId)
}
</script>

