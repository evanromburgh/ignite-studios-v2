<template>
  <div
    class="group relative w-full overflow-hidden select-none cursor-default bg-white border border-zinc-100 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-300 rounded-[0.75rem]"
    :class="(isAvailable || isAdmin) ? 'hover:shadow-[0_2px_10px_rgba(0,0,0,0.06)]' : ''"
  >
    <div class="flex flex-col sm:grid sm:grid-cols-3 sm:items-center gap-4 sm:gap-0 px-4 sm:px-6 py-6">
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
      <div class="flex items-center justify-center gap-4 sm:gap-6 border-t sm:border-t-0 border-zinc-200/80 pt-4 sm:pt-0 sm:px-6 min-w-0">
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
            :disabled="(!isAvailable && !isAdmin) || isReserving"
            class="h-[46px] min-w-[150px] px-6 text-[12px] font-bold uppercase tracking-widest bg-transparent text-zinc-900 rounded-lg hover:bg-[#18181B] hover:text-white hover:rounded-lg transition-[background-color,color,border-radius] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] disabled:opacity-50 disabled:pointer-events-none disabled:text-zinc-500 disabled:hover:bg-transparent text-center"
            @click.stop="onReserve(unit)"
          >
            {{ reserveButtonLabel }}
          </button>
          <button
            type="button"
            :disabled="!isAvailable && !isAdmin"
            class="h-9 w-9 inline-flex items-center justify-center rounded-full border border-zinc-300 bg-white/95 text-zinc-600 transition-[background-color,color,border-color] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-red-600 hover:text-white hover:border-red-600 disabled:opacity-50 disabled:pointer-events-none disabled:text-zinc-400 disabled:hover:bg-white/95 disabled:hover:text-zinc-400 disabled:hover:border-zinc-300"
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
    <div v-if="showOverlay" class="absolute inset-0 flex items-center justify-center pointer-events-none bg-white/60 backdrop-blur-[1px]">
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

const props = withDefaults(
  defineProps<{
    unit: Unit
    isWishlisted?: boolean
    isAdmin?: boolean
    hideReservedOverlay?: boolean
    serverClockOffsetMs?: number
    currentUserId?: string | null
    reservingUnitId?: string | null
  }>(),
  { isWishlisted: false, isAdmin: false, hideReservedOverlay: false, serverClockOffsetMs: 0, currentUserId: undefined, reservingUnitId: null },
)

const emit = defineEmits<{
  select: [unit: Unit]
  reserve: [unit: Unit]
  toggleWishlist: [unitId: string]
}>()

const timeLeft = ref(0)
const isLocked = computed(() => timeLeft.value > 0 && props.unit.status === 'Available')
const isReserving = computed(() => props.reservingUnitId === props.unit.id)
const isAvailable = computed(() => props.unit.status === 'Available' && !isLocked.value)

const showOverlay = computed(() =>
  !props.isAdmin &&
  !props.hideReservedOverlay &&
  (props.unit.status !== 'Available' || isLocked.value),
)

const formattedPrice = computed(() =>
  new Intl.NumberFormat('en-US').format(props.unit.price).replace(/,/g, ' '),
)
const formattedOriginalPrice = computed(() =>
  props.unit.originalPrice
    ? new Intl.NumberFormat('en-US').format(props.unit.originalPrice).replace(/,/g, ' ')
    : '',
)

const reserveButtonLabel = computed(() => {
  if (isReserving.value) return 'Securing...'
  if (props.unit.status === 'Available' && !isLocked.value) return 'Reserve Now'
  if (isLocked.value) return 'Locked'
  return props.unit.status
})

const overlayLabel = computed(() => {
  if (isLocked.value) return 'Reservation In Progress'
  return props.unit.status
})

function formatFloorLabel(floor: string | null | undefined): string {
  const raw = (floor || '').trim()
  if (!raw) return ''
  const lower = raw.toLowerCase()
  const withFloor = lower.includes('floor') ? lower : `${lower} floor`
  return withFloor.replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatFacingLabel(direction: string | null | undefined): string {
  const raw = (direction || '').trim()
  if (!raw) return ''
  const lower = raw.toLowerCase()
  const withFacing = lower.includes('facing') ? lower : `${lower} facing`
  return withFacing.replace(/\b\w/g, (c) => c.toUpperCase())
}

function onSelect(unit: Unit) {
  if (!isAvailable.value && !props.isAdmin) return
  emit('select', unit)
}

function onReserve(unit: Unit) {
  if (!isAvailable.value && !props.isAdmin) return
  emit('reserve', unit)
}

function onToggleWishlist(unitId: string) {
  emit('toggleWishlist', unitId)
}

let timerId: ReturnType<typeof setInterval> | null = null
function startTimer() {
  if (!props.unit.lockExpiresAt) {
    timeLeft.value = 0
    return
  }
  const effectiveNow = () => Date.now() + props.serverClockOffsetMs
  const update = () => {
    timeLeft.value = Math.max(0, Math.floor((props.unit.lockExpiresAt! - effectiveNow()) / 1000))
  }
  update()
  timerId = setInterval(update, 1000)
}

onMounted(() => { startTimer() })
onBeforeUnmount(() => { if (timerId) clearInterval(timerId) })
watch(() => [props.unit.lockExpiresAt, props.serverClockOffsetMs], () => {
  if (timerId) clearInterval(timerId)
  timerId = null
  startTimer()
})
</script>

