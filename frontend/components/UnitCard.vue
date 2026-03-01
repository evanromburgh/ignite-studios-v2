<template>
  <div
    class="group relative flex flex-col h-full rounded-xl p-4 border border-white/5 transition-all duration-500 overflow-hidden select-none cursor-default bg-zinc-900/40"
    :class="(isAvailable || isAdmin) ? 'hover:bg-zinc-800/60 hover:border-white/10' : ''"
  >
    <div class="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />

    <div v-if="showOverlay" class="absolute inset-0 z-20 bg-black/60 pointer-events-none transition-opacity duration-500" />

    <div class="flex flex-col h-full relative z-10 transition-all duration-700" :class="showOverlay ? 'opacity-30' : ''">
      <div class="relative overflow-hidden rounded-lg aspect-[3/2] mb-6 bg-white/[0.02]">
        <img
          :src="cardImageUrl"
          :alt="`Unit ${unit.unitNumber}`"
          loading="lazy"
          class="object-cover w-full h-full transition-all duration-700"
          :class="(isAvailable || isAdmin || hideReservedOverlay) ? 'opacity-70 grayscale-[20%] group-hover:opacity-100' : 'opacity-40 grayscale'"
        />
        <button
          v-if="isAvailable || isAdmin || hideReservedOverlay"
          type="button"
          class="absolute top-3 right-3 w-[36px] h-[36px] flex items-center justify-center backdrop-blur-md rounded-full border border-white/10 transition-all"
          :class="isWishlisted ? 'bg-red-500/20 text-red-500 border-red-500/30' : 'bg-black/40 text-zinc-400 hover:text-red-400'"
          @click.stop="onToggleWishlist(unit.id)"
        >
          <IconHeart class="w-4 h-4" :filled="isWishlisted" />
        </button>
      </div>

      <div class="flex-1 flex flex-col">
        <div class="flex justify-between items-baseline mb-6 px-4">
          <h3 class="text-xl font-medium text-white tracking-tight leading-none">Unit {{ unit.unitNumber }}</h3>
          <span class="text-2xl font-black text-white leading-none">R {{ formattedPrice }}</span>
        </div>

        <div class="mb-6 py-6 border-y border-white/5 px-4">
          <div class="flex items-center justify-between whitespace-nowrap overflow-hidden">
            <div class="flex items-center gap-1.5 text-[12px] text-zinc-400 font-medium uppercase tracking-wider">
              <IconBed class="w-5 h-5 text-zinc-500 flex-shrink-0" />
              <span>{{ unit.bedrooms }}</span>
            </div>
            <div class="flex items-center gap-1.5 text-[12px] text-zinc-400 font-medium uppercase tracking-wider">
              <IconBath class="w-5 h-5 text-zinc-500 flex-shrink-0" />
              <span>{{ unit.bathrooms }}</span>
            </div>
            <div class="flex items-center gap-1.5 text-[12px] text-zinc-400 font-medium uppercase tracking-wider">
              <IconCar class="w-5 h-5 text-zinc-500 flex-shrink-0" />
              <span>{{ unit.parking }}</span>
            </div>
            <div class="flex items-center gap-1.5 text-[12px] text-zinc-400 font-medium uppercase tracking-wider">
              <IconLayout class="w-5 h-5 text-zinc-500 flex-shrink-0" />
              <span>{{ unit.unitType }}</span>
            </div>
            <div class="flex items-center gap-1.5 text-[12px] text-zinc-400 font-medium uppercase tracking-wider">
              <IconSize class="w-5 h-5 text-zinc-500 flex-shrink-0" />
              <span>{{ unit.sizeSqm }}<span class="lowercase">m²</span></span>
            </div>
          </div>
        </div>

        <div class="mb-6 px-4 flex items-center justify-center text-[10px] text-zinc-500 font-black tracking-wide uppercase h-4">
          <span class="w-2 h-2 aspect-square rounded-full mr-2.5 flex-shrink-0 block" :class="indicatorColorClass" />
          <span class="leading-none" :class="isLocked ? 'text-orange-500 font-bold' : ''">{{ statusText }}</span>
        </div>

        <div class="grid grid-cols-2 gap-4 mt-auto px-0 relative z-50">
          <button
            type="button"
            :disabled="!isAvailable && !isAdmin"
            class="h-[46px] flex items-center justify-center border border-white/10 text-zinc-300 rounded-lg text-[11px] font-black uppercase tracking-normal text-center transition-colors px-2"
            :class="(!isAvailable && !isAdmin) ? 'opacity-20 pointer-events-none' : 'hover:bg-white/5'"
            @click.stop="onSelect(unit)"
          >
            LEARN MORE
          </button>
          <button
            type="button"
            :disabled="(!isAvailable && !isAdmin) || isReserving"
            class="h-[46px] flex items-center justify-center rounded-lg text-[11px] font-black uppercase tracking-normal text-center transition-all px-2"
            :class="(isAvailable || isAdmin) && !isReserving ? 'bg-white text-black hover:bg-zinc-100 shadow-xl' : 'bg-zinc-800 text-zinc-500 pointer-events-none opacity-50'"
            @click.stop="onReserve(unit)"
          >
            {{ isReserving ? 'SECURING...' : (isAvailable || isAdmin) ? 'RESERVE NOW' : isLocked ? 'LOCKED' : unit.status }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="showOverlay" class="absolute inset-0 z-[60] flex items-center justify-center pointer-events-none">
      <div class="relative flex flex-col items-center">
        <div class="px-10 h-[46px] flex items-center justify-center bg-zinc-950/90 rounded-lg border border-white/10 shadow-2xl">
          <span
            class="text-[12px] font-black uppercase tracking-[0.15em] leading-none"
            :class="overlayLabelClass"
          >
            {{ overlayLabel }}
          </span>
        </div>
        <div v-if="isLocked" class="absolute top-full mt-3 text-[11px] font-bold text-zinc-500 flex items-center gap-1.5 whitespace-nowrap">
          <span class="tabular-nums">{{ formatTime(timeLeft) }}</span>
          <span class="font-medium">remaining</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Unit } from '~/types'
import { CONFIG } from '~/config'
import IconBed from '~/components/icons/IconBed.vue'
import IconBath from '~/components/icons/IconBath.vue'
import IconCar from '~/components/icons/IconCar.vue'
import IconLayout from '~/components/icons/IconLayout.vue'
import IconSize from '~/components/icons/IconSize.vue'
import IconHeart from '~/components/icons/IconHeart.vue'

const props = withDefaults(
  defineProps<{
    unit: Unit
    isWishlisted?: boolean
    isAdmin?: boolean
    hideReservedOverlay?: boolean
    serverClockOffsetMs?: number
    /** When set, overlay is hidden if the unit is locked by this user (they are on the reserve page). */
    currentUserId?: string | null
    /** Unit id currently being reserved (shows SECURING... on the button). */
    reservingUnitId?: string | null
  }>(),
  { isWishlisted: false, isAdmin: false, hideReservedOverlay: false, serverClockOffsetMs: 0, currentUserId: undefined, reservingUnitId: null },
)

const emit = defineEmits<{
  select: [unit: Unit]
  reserve: [unit: Unit]
  toggleWishlist: [unitId: string]
}>()

const { getViewersForUnit, subscribeToViewersUpdates } = useViewersPoll()

const timeLeft = ref(0)
/** Force re-render when viewers poll updates (like old app: DOM event + presence tick for Desktop) */
const viewersTick = ref(0)
const viewerCount = computed(() => {
  viewersTick.value // depend on tick so we re-run when event fires or tick runs
  const polled = getViewersForUnit(props.unit.id)
  const viewers = polled ?? props.unit.viewers ?? {}
  return Object.keys(viewers).length
})

const cardImageUrl = computed(() => props.unit.floorplanUrl || props.unit.imageUrl)

const isLocked = computed(() => timeLeft.value > 0 && props.unit.status === 'Available')
const isReserving = computed(() => props.reservingUnitId === props.unit.id)
const isLockedByOther = computed(() => isLocked.value && (props.currentUserId == null || props.unit.lockedBy !== props.currentUserId))
const isAvailable = computed(() => props.unit.status === 'Available' && !isLocked.value)
const showOverlay = computed(() =>
  !props.isAdmin &&
  !props.hideReservedOverlay &&
  (props.unit.status !== 'Available' || isLocked.value),
)

const formattedPrice = computed(() =>
  new Intl.NumberFormat('en-US').format(props.unit.price).replace(/,/g, ' '),
)

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const statusText = computed(() => {
  if (props.unit.status === 'Sold') return `Unit ${props.unit.unitNumber} is Sold`
  if (props.unit.status === 'Reserved') return `Unit ${props.unit.unitNumber} is Reserved`
  if (isLocked.value) return `Reservation in progress (${formatTime(timeLeft.value)})`
  return `${viewerCount.value} currently viewing`
})

const indicatorColorClass = computed(() => {
  if (props.unit.status === 'Sold') return 'bg-red-500'
  if (props.unit.status === 'Reserved') return 'bg-amber-500'
  if (isLocked.value) return 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)] animate-pulse'
  return 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse'
})

const overlayLabel = computed(() => {
  if (isLocked.value) return 'Reservation In Progress'
  return props.unit.status
})

const overlayLabelClass = computed(() => {
  if (props.unit.status === 'Sold') return 'text-red-500'
  if (isLocked.value || isLockedByOther.value) return 'text-orange-500'
  if (props.unit.status === 'Reserved') return 'text-amber-500'
  return 'text-amber-500'
})

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
let presenceTickId: ReturnType<typeof setInterval> | null = null

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
  subscribeToViewersUpdates(() => {
    viewersTick.value += 1
  })
  presenceTickId = setInterval(() => {
    viewersTick.value += 1
  }, CONFIG.PRESENCE_TICK_MS)
})

onBeforeUnmount(() => {
  if (timerId) clearInterval(timerId)
  if (presenceTickId) clearInterval(presenceTickId)
})

watch(() => [props.unit.lockExpiresAt, props.serverClockOffsetMs], () => {
  if (timerId) clearInterval(timerId)
  timerId = null
  startTimer()
})
</script>
