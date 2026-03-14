<template>
  <div
    class="group relative flex flex-col h-full overflow-hidden select-none cursor-default bg-white border border-zinc-100 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-300 rounded-[0.5rem]"
    :class="(isAvailable || isAdmin) ? 'hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]' : ''"
  >
    <!-- Image: unit number and wishlist overlaid on image -->
      <div class="relative overflow-hidden aspect-[3/2] bg-[#fbfcfd] w-full">
        <img
          :src="cardImageUrl"
          :alt="`Unit ${unit.unitNumber}`"
          loading="lazy"
          class="object-cover w-full h-full transition-all duration-500 ease-out scale-[0.85] origin-center"
          :class="[
            (isAvailable || isAdmin || hideReservedOverlay) ? 'group-hover:scale-95' : 'opacity-70',
            showOverlay ? 'blur-sm' : ''
          ]"
        />
      <!-- Unit number and wishlist over the image -->
      <div class="absolute inset-0 flex items-start justify-between p-5 pointer-events-none">
        <span class="pointer-events-auto text-lg font-bold text-zinc-900 tracking-tight leading-none drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]">{{ unit.unitNumber }}</span>
        <span
          v-if="isMyUnitsCard"
          class="pointer-events-none inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-orange-500 text-white text-[10px] font-bold uppercase tracking-widest shadow-sm"
        >
          Reserved
        </span>
        <button
          v-else
          type="button"
          :disabled="!isAvailable && !isAdmin"
          class="pointer-events-auto inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-zinc-300 bg-white/95 text-zinc-600 text-[10px] font-bold uppercase tracking-widest shadow-sm transition-[background-color,color,border-color] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-red-600 hover:text-white hover:border-red-600 disabled:opacity-50 disabled:pointer-events-none disabled:text-zinc-400 disabled:hover:bg-white/95 disabled:hover:text-zinc-400 disabled:hover:border-zinc-300"
          :class="isWishlisted ? '!border-red-600 !bg-red-600 !text-white' : ''"
          @click.stop="onToggleWishlist(unit.id)"
        >
          <IconHeart class="w-3.5 h-3.5 flex-shrink-0" :filled="isWishlisted" />
          Wishlist
        </button>
      </div>
      <!-- RESERVED/Sold overlay when applicable -->
      <div
        v-if="showOverlay"
        class="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
      >
        <span class="px-9 py-3 rounded-full bg-zinc-900 text-white text-[12px] font-black uppercase tracking-[0.2em]">
          {{ overlayLabel }}
        </span>
      </div>
    </div>

    <!-- Details: left = floor, facing, unit type (dark gray); right = price -->
    <div class="flex flex-col">
      <div class="px-[1.25rem]">
        <div class="flex justify-between items-start gap-4 py-8">
          <div class="min-w-0">
            <p v-if="unit.floor" class="text-[14px] font-bold text-zinc-900 uppercase tracking-wide leading-tight">{{ (unit.floor || '').toUpperCase() }} FLOOR</p>
            <p v-if="unit.direction" class="text-[12px] text-zinc-700 mt-0.5 leading-tight">{{ unit.direction }} Facing</p>
          </div>
          <div class="text-right shrink-0">
            <p v-if="unit.originalPrice" class="text-[11px] text-zinc-400 line-through leading-tight">R {{ formattedOriginalPrice }}</p>
            <span class="text-[26px] font-bold leading-none block text-zinc-900">R {{ formattedPrice }}</span>
          </div>
        </div>

        <!-- Feature icons: 1 Bedroom, 2 Bathroom, 3 Parking, 4 Unit Type, 5 Unit Size -->
        <div class="flex items-center justify-evenly gap-4 border-t border-b border-zinc-200/80 py-8">
          <div class="group/tip relative inline-flex flex-col items-center gap-1 cursor-help text-[11px] text-zinc-700">
            <span class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 bg-zinc-800 text-white text-[11px] rounded opacity-0 pointer-events-none transition-opacity z-20 whitespace-nowrap group-hover/tip:opacity-100">
              Bedrooms
              <span class="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-zinc-800" aria-hidden="true" />
            </span>
            <IconBed class="w-4 h-4 text-zinc-700 flex-shrink-0" />
            <span>{{ unit.bedrooms }}</span>
          </div>
          <div class="group/tip relative inline-flex flex-col items-center gap-1 cursor-help text-[11px] text-zinc-700">
            <span class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 bg-zinc-800 text-white text-[11px] rounded opacity-0 pointer-events-none transition-opacity z-20 whitespace-nowrap group-hover/tip:opacity-100">
              Bathrooms
              <span class="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-zinc-800" aria-hidden="true" />
            </span>
            <IconBath class="w-4 h-4 text-zinc-700 flex-shrink-0" />
            <span>{{ unit.bathrooms }}</span>
          </div>
          <div class="group/tip relative inline-flex flex-col items-center gap-1 cursor-help text-[11px] text-zinc-700">
            <span class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 bg-zinc-800 text-white text-[11px] rounded opacity-0 pointer-events-none transition-opacity z-20 whitespace-nowrap group-hover/tip:opacity-100">
              Parking
              <span class="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-zinc-800" aria-hidden="true" />
            </span>
            <IconCar class="w-4 h-4 text-zinc-700 flex-shrink-0" />
            <span>{{ unit.parking }}</span>
          </div>
          <div class="group/tip relative inline-flex flex-col items-center gap-1 cursor-help text-[11px] text-zinc-700">
            <span class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 bg-zinc-800 text-white text-[11px] rounded opacity-0 pointer-events-none transition-opacity z-20 whitespace-nowrap group-hover/tip:opacity-100">
              Unit Type
              <span class="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-zinc-800" aria-hidden="true" />
            </span>
            <IconLayout class="w-4 h-4 text-zinc-700 flex-shrink-0" />
            <span>{{ unit.unitType || '—' }}</span>
          </div>
          <div class="group/tip relative inline-flex flex-col items-center gap-1 cursor-help text-[11px] text-zinc-700">
            <span class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 bg-zinc-800 text-white text-[11px] rounded opacity-0 pointer-events-none transition-opacity z-20 whitespace-nowrap group-hover/tip:opacity-100">
              Unit Size
              <span class="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-zinc-800" aria-hidden="true" />
            </span>
            <IconSize class="w-4 h-4 text-zinc-700 flex-shrink-0" />
            <span>{{ unit.sizeSqm }}m²</span>
          </div>
        </div>
      </div>

      <!-- Bottom section: single full-width View Details on My Units, else two buttons -->
      <div :class="isMyUnitsCard ? '' : 'grid grid-cols-2 border-zinc-200/80'">
        <button
          type="button"
          :disabled="!isMyUnitsCard && !isAvailable && !isAdmin"
          class="-mt-px pt-[calc(1.25rem+1px)] pb-5 text-[12px] font-bold uppercase tracking-widest bg-transparent text-zinc-900 hover:bg-[#18181B] hover:text-white transition-[background-color,color] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] disabled:opacity-50 disabled:pointer-events-none disabled:text-zinc-500 disabled:hover:bg-transparent text-center w-full"
          @click.stop="onSelect(unit)"
        >
          View Details
        </button>
        <button
          v-if="!isMyUnitsCard"
          type="button"
          :disabled="(!isAvailable && !isAdmin) || isReserving"
          class="-mt-px -ml-px pl-px pt-[calc(1.25rem+1px)] pb-5 text-[12px] font-bold uppercase tracking-widest bg-transparent text-zinc-900 border-l border-zinc-200/80 hover:bg-[#18181B] hover:text-white transition-[background-color,color] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] disabled:opacity-50 disabled:pointer-events-none disabled:text-zinc-500 disabled:hover:bg-transparent text-center"
          @click.stop="onReserve(unit)"
        >
          {{ reserveButtonLabel }}
        </button>
      </div>
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
    /** When true (e.g. on My Units page): no Reserved overlay, top-right shows "Reserved" label, single full-width View Details button */
    isMyUnitsCard?: boolean
  }>(),
  { isWishlisted: false, isAdmin: false, hideReservedOverlay: false, serverClockOffsetMs: 0, currentUserId: undefined, reservingUnitId: null, isMyUnitsCard: false },
)

const emit = defineEmits<{
  select: [unit: Unit]
  reserve: [unit: Unit]
  toggleWishlist: [unitId: string]
}>()

const timeLeft = ref(0)
const cardImageUrl = computed(() => props.unit.floorplanUrl || props.unit.imageUrl)

const isLocked = computed(() => timeLeft.value > 0 && props.unit.status === 'Available')
const isReserving = computed(() => props.reservingUnitId === props.unit.id)
const isAvailable = computed(() => props.unit.status === 'Available' && !isLocked.value)
const showOverlay = computed(() =>
  !props.isMyUnitsCard &&
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

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const overlayLabel = computed(() => {
  if (isLocked.value) return 'Reservation In Progress'
  return props.unit.status
})

function onSelect(unit: Unit) {
  if (!props.isMyUnitsCard && !isAvailable.value && !props.isAdmin) return
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

onMounted(() => {
  startTimer()
})

onBeforeUnmount(() => {
  if (timerId) clearInterval(timerId)
})

watch(() => [props.unit.lockExpiresAt, props.serverClockOffsetMs], () => {
  if (timerId) clearInterval(timerId)
  timerId = null
  startTimer()
})
</script>
