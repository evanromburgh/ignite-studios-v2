<template>
  <div class="space-y-10">
    <!-- Master: aerial + building hotspot (Block G) -->
    <div class="relative w-full overflow-hidden rounded-xl">
      <img
        :src="SITE_MAP_MASTER.imageSrc"
        alt=""
        class="w-full h-auto pointer-events-none block select-none"
        loading="lazy"
        draggable="false"
      >
      <svg
        class="absolute inset-0 z-[1] h-full w-full pointer-events-auto"
        :viewBox="SITE_MAP_MASTER.viewBox"
        preserveAspectRatio="none"
        role="img"
        aria-label="Site map: select building to view floor plans"
      >
        <defs>
          <mask
            :id="masterMapDimMaskId"
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="1"
            height="1"
          >
            <rect
              x="0"
              y="0"
              width="1"
              height="1"
              fill="white"
            />
            <path
              v-for="b in SITE_MAP_MASTER.buildings"
              :key="`master-dim-hole-${b.id}`"
              :d="b.pathD"
              fill="black"
            />
          </mask>
        </defs>
        <!-- Dim everything except building footprint (mask hole); hit-target path is painted above. -->
        <rect
          x="0"
          y="0"
          width="1"
          height="1"
          fill="black"
          class="pointer-events-none transition-opacity duration-200 ease-out"
          :class="masterBuildingSpotlit ? 'opacity-[0.28]' : 'opacity-0'"
          :mask="`url(#${masterMapDimMaskId})`"
        />
        <path
          v-for="b in SITE_MAP_MASTER.buildings"
          :key="b.id"
          :d="b.pathD"
          fill="transparent"
          class="master-building-hit cursor-pointer outline-none stroke-white stroke-[3px] transition-[stroke-width] duration-200 [stroke-dasharray:7px_5px] [stroke-linecap:butt] [stroke-linejoin:miter] [vector-effect:non-scaling-stroke] [paint-order:stroke_fill] hover:stroke-0 focus-visible:stroke-0"
          tabindex="0"
          :aria-label="`${b.label}: go to floor plans`"
          @click="onBuildingActivate"
          @keydown.enter.prevent="onBuildingActivate"
          @keydown.space.prevent="onBuildingActivate"
          @mouseenter="onMasterBuildingSpotlightEnter"
          @mouseleave="onMasterBuildingSpotlightLeave"
          @focus="onMasterBuildingSpotlightEnter"
          @blur="onMasterBuildingSpotlightLeave"
        />
      </svg>
      <!-- Block G: persistent map pin (always visible; pointer-events-none so polygon stays clickable). -->
      <div
        v-if="blockGBuilding"
        class="pointer-events-none absolute inset-0 z-[2]"
        aria-hidden="true"
      >
        <div
          class="site-map-master-pin absolute flex flex-col items-center"
          :style="masterBlockGPinPositionStyle"
        >
          <div class="site-map-master-pin-bob flex flex-col items-center">
            <div
              class="site-map-master-pin-bubble flex w-[clamp(4rem,17vw,5.5rem)] flex-col items-center rounded-[999px] rounded-b-md bg-white px-2 pb-2 pt-2 font-sans shadow-[0_6px_18px_rgba(0,0,0,0.2)] sm:w-[5.5rem] sm:px-2.5 sm:pb-2.5 sm:pt-2.5"
            >
              <img
                src="/favicon.png"
                alt=""
                class="h-[clamp(1.45rem,6.5vmin,2rem)] w-auto max-w-[78%] shrink-0 object-contain object-center select-none"
                width="48"
                height="48"
                loading="lazy"
                draggable="false"
              >
              <span
                class="mt-1 text-center text-[clamp(0.52rem,2.1vmin,0.8rem)] font-semibold uppercase leading-tight tracking-widest text-[#18181B] sm:text-[0.8rem]"
              >{{ blockGBuilding.label }}</span>
            </div>
            <div
              class="site-map-master-pin-pointer -mt-px h-0 w-0 border-x-[clamp(0.55rem,2.4vw,0.7rem)] border-t-[clamp(0.7rem,3vmin,0.9rem)] border-x-transparent border-t-white sm:border-x-[0.7rem] sm:border-t-[0.9rem]"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Floor plans: stacked sections (one per level); scroll target for master map -->
    <div
      id="site-map-floor-plans"
      class="scroll-mt-24 space-y-10 sm:scroll-mt-28 outline-none"
      tabindex="-1"
    >
      <section
        v-for="floor in SITE_MAP_FLOORS"
        :key="floor.id"
        :id="floorSectionId(floor.id)"
        class="scroll-mt-24 flex min-h-[28rem] flex-col rounded-2xl bg-white p-16 sm:min-h-[32rem] md:min-h-[36rem]"
        :aria-labelledby="`plan-frame-heading-${floor.id}`"
      >
        <ClientOnly>
          <div class="plan-frame relative grid min-h-0 w-full flex-1 grid-rows-[auto_minmax(0,1fr)_auto]">
            <!-- Block G out of flow so row height is only the top facing line (better vertical centering of plan). -->
            <header
              class="plan-frame-header pointer-events-auto absolute left-0 top-0 z-10 max-w-[min(100%,20rem)] text-left sm:max-w-[min(100%,24rem)]"
            >
              <div :id="`plan-frame-heading-${floor.id}`">
                <p class="font-sans text-2xl font-semibold uppercase leading-tight tracking-wide text-zinc-900 sm:text-3xl">
                  {{ SITE_MAP_PLAN_FRAME.buildingTitle }}
                </p>
                <p class="font-sans text-sm font-medium capitalize leading-snug text-zinc-700 sm:text-base">
                  {{ floor.label }}
                </p>
              </div>
            </header>
            <div class="flex shrink-0 justify-center">
              <p
                class="text-center text-[10px] font-semibold uppercase leading-tight tracking-wide text-zinc-800 sm:text-xs md:text-sm"
              >
                {{ SITE_MAP_PLAN_FRAME.facing.top }}
              </p>
            </div>

            <div class="flex min-h-0 min-w-0 items-center justify-center py-12">
              <div
                class="plan-frame-grid grid w-full max-w-full grid-cols-[auto_minmax(0,10fr)_auto] items-center gap-x-1 gap-y-2 sm:gap-x-2"
              >
              <p
                class="col-start-1 row-start-1 min-w-0 max-w-full justify-self-start self-center text-start text-[10px] font-semibold uppercase leading-tight tracking-wide text-zinc-800 [overflow-wrap:anywhere] [writing-mode:vertical-rl] sm:text-xs md:text-sm rotate-180"
              >
                {{ SITE_MAP_PLAN_FRAME.facing.left }}
              </p>

              <div class="col-start-2 row-start-1 min-h-0 min-w-0">
                <ZoomablePlan
                  :image-src="floor.imageSrc"
                  :image-alt="`${SITE_MAP_PLAN_FRAME.buildingTitle} ${floor.label} plan`"
                  :view-box="floor.viewBox"
                >
                  <template #default>
              <g v-if="floor.units.length">
                <template v-for="u in floor.units" :key="u.unitNumber">
                  <a
                    v-if="isPlanUnitClickable(resolvePlanUnit(u.unitNumber))"
                    :href="`/unit/${encodeURIComponent(u.unitNumber)}`"
                    class="plan-unit-hit cursor-pointer outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600/70"
                    tabindex="0"
                    :aria-label="`Unit ${u.unitNumber}, open details`"
                    @click="onUnitHotspotClick($event, u.unitNumber)"
                    @mouseenter="onPlanBadgePointerEnter(floor.id, u.unitNumber)"
                    @mouseleave="onPlanBadgePointerLeave(floor.id, u.unitNumber)"
                    @focus="onPlanBadgePointerEnter(floor.id, u.unitNumber)"
                    @blur="onPlanBadgePointerLeave(floor.id, u.unitNumber)"
                  >
                    <path
                      :d="u.pathD"
                      stroke="none"
                      class="pointer-events-auto plan-unit-hit-fill"
                    />
                  </a>
                  <path
                    v-else
                    :d="u.pathD"
                    :fill="planUnitStaticFill(resolvePlanUnit(u.unitNumber))"
                    stroke="none"
                    class="pointer-events-none"
                    role="presentation"
                    aria-hidden="true"
                  />
                </template>
              </g>
            </template>
            <template #overlay>
              <div
                v-for="u in floor.units"
                :key="`ovl-${floor.id}-${u.unitNumber}`"
                class="plan-html-badge pointer-events-none absolute box-border"
                :style="planHtmlBadgePositionStyle(u.pathD)"
              >
                <!-- Inner face counter-rotates on mobile so labels stay upright while ZoomablePlan uses rotate-90. -->
                <div
                  class="plan-html-badge-face flex aspect-square h-auto w-[clamp(1.2rem,4.8vmin,2.2rem)] min-h-0 min-w-0 shrink-0 origin-center flex-col items-center justify-center rounded-full px-0.5 py-px text-center font-sans transition-[background-color] duration-150 ease-out max-sm:-rotate-90 max-sm:motion-reduce:rotate-0 motion-reduce:transition-none sm:w-[clamp(2.125rem,11vmin,3.75rem)] sm:px-2 sm:py-0.5"
                  :style="planHtmlBadgeFaceStyle(isPlanBadgeActive(floor.id, u.unitNumber), resolvePlanUnit(u.unitNumber))"
                >
                <template v-if="planBadgeKind(resolvePlanUnit(u.unitNumber)) === 'available'">
                  <span
                    class="max-w-[95%] truncate text-[clamp(0.4rem,1.75vmin,0.65rem)] font-bold leading-none tracking-tight text-white sm:text-[clamp(0.65rem,3.4vmin,0.9375rem)]"
                  >{{ u.unitNumber }}</span>
                  <span
                    class="mt-px max-w-[95%] truncate text-[clamp(0.32rem,1.35vmin,0.52rem)] font-semibold leading-none text-white/95 sm:mt-0.5 sm:text-[clamp(0.5rem,2.3vmin,0.625rem)]"
                  >{{ formatPlanBadgePrice(resolvePlanUnit(u.unitNumber)?.price ?? 0) }}</span>
                </template>
                <template v-else-if="planBadgeKind(resolvePlanUnit(u.unitNumber)) === 'locked'">
                  <span
                    class="max-w-[95%] truncate text-[clamp(0.4rem,1.75vmin,0.65rem)] font-bold leading-none tracking-tight text-white sm:text-[clamp(0.65rem,3.4vmin,0.9375rem)]"
                  >{{ u.unitNumber }}</span>
                  <span
                    class="mt-px max-w-[95%] text-center text-[clamp(0.3rem,1.25vmin,0.5rem)] font-semibold leading-[1.05] text-white/95 sm:mt-0.5 sm:text-[clamp(0.42rem,2vmin,0.625rem)]"
                  >{{ planBadgeStatusLine(resolvePlanUnit(u.unitNumber)) }}</span>
                </template>
                <template v-else-if="planBadgeKind(resolvePlanUnit(u.unitNumber)) === 'heldByDeveloper'">
                  <span
                    class="max-w-[95%] truncate text-[clamp(0.4rem,1.75vmin,0.65rem)] font-bold leading-none text-zinc-900 sm:text-[clamp(0.65rem,3.4vmin,0.9375rem)]"
                  >{{ u.unitNumber }}</span>
                  <span
                    class="mt-px max-w-[95%] text-center text-[clamp(0.3rem,1.25vmin,0.5rem)] font-semibold leading-[1.05] text-zinc-500 [overflow-wrap:anywhere] sm:mt-0.5 sm:text-[clamp(0.42rem,2vmin,0.625rem)]"
                  >{{ planBadgeStatusLine(resolvePlanUnit(u.unitNumber)) }}</span>
                </template>
                <template v-else-if="planBadgeKind(resolvePlanUnit(u.unitNumber)) === 'sold'">
                  <span
                    class="max-w-[95%] truncate text-[clamp(0.4rem,1.75vmin,0.65rem)] font-bold leading-none tracking-tight text-white sm:text-[clamp(0.65rem,3.4vmin,0.9375rem)]"
                  >{{ u.unitNumber }}</span>
                  <span
                    class="mt-px max-w-[95%] text-center text-[clamp(0.3rem,1.25vmin,0.5rem)] font-semibold leading-[1.05] text-white/95 [overflow-wrap:anywhere] sm:mt-0.5 sm:text-[clamp(0.42rem,2vmin,0.625rem)]"
                  >{{ planBadgeStatusLine(resolvePlanUnit(u.unitNumber)) }}</span>
                </template>
                <template v-else>
                  <span
                    class="max-w-[95%] truncate text-[clamp(0.4rem,1.75vmin,0.65rem)] font-bold leading-none text-zinc-900 sm:text-[clamp(0.65rem,3.4vmin,0.9375rem)]"
                  >{{ u.unitNumber }}</span>
                  <span
                    class="mt-px text-[clamp(0.32rem,1.35vmin,0.52rem)] font-medium leading-none text-zinc-400 sm:mt-0.5 sm:text-[clamp(0.5rem,2.3vmin,0.625rem)]"
                  >—</span>
                </template>
                </div>
              </div>
            </template>
                </ZoomablePlan>
              </div>

              <p
                class="col-start-3 row-start-1 min-w-0 max-w-full justify-self-end self-center text-end text-[10px] font-semibold uppercase leading-tight tracking-wide text-zinc-800 [overflow-wrap:anywhere] [writing-mode:vertical-rl] sm:text-xs md:text-sm"
              >
                {{ SITE_MAP_PLAN_FRAME.facing.right }}
              </p>
              </div>
            </div>

            <div class="shrink-0">
              <p
                class="min-w-0 text-center text-[10px] font-semibold uppercase leading-tight tracking-wide text-zinc-800 sm:text-xs md:text-sm"
              >
                {{ SITE_MAP_PLAN_FRAME.facing.bottom }}
              </p>
            </div>

            <!-- North: out of flow (same box as Block G) so it doesn’t add height to the footer row. -->
            <div
              class="pointer-events-none absolute bottom-0 left-0 z-[1] flex min-w-0 items-end justify-start pb-0.5 sm:pb-1"
              role="img"
              aria-label="North orientation"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 380.701 338.056"
                class="h-8 w-auto max-w-[min(4rem,18vw)] shrink-0 text-zinc-900 select-none sm:h-10 md:h-12"
                aria-hidden="true"
                focusable="false"
              >
                <polygon fill="currentColor" points="117.991 185.588 154.855 253.166 0 206.302 129.465 109.42 117.991 185.588" />
                <path fill="currentColor" d="M44.654,142.958l19.425-14.536c4.598-16.667,12.07-32.6,22.284-47.18,23.449-33.472,58.528-55.808,98.777-62.895s80.848,1.923,114.319,25.372c33.472,23.449,55.808,58.528,62.896,98.777,7.087,40.249-1.923,80.848-25.372,114.319-23.449,33.472-58.528,55.808-98.777,62.896-40.249,7.087-80.848-1.923-114.319-25.372-14.591-10.222-27.064-22.655-37.082-36.761l-23.216-7.026c33.901,61.593,104.291,97.789,177.392,84.917,91.922-16.186,153.318-103.826,137.131-195.747C361.926,47.798,274.287-13.597,182.365,2.589,109.275,15.459,55.49,73.505,44.654,142.958Z" />
                <path fill="currentColor" d="M273.73,113.547l15.227,86.475-13.218,2.328-57.996-50.159,10.311,58.556-15.936,2.806-15.227-86.475,13.218-2.328,57.996,50.159-10.311-58.556,15.936-2.806Z" />
              </svg>
            </div>
          </div>
          <template #fallback>
            <div class="h-64 w-full animate-pulse rounded-xl bg-zinc-100" />
          </template>
        </ClientOnly>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Unit } from '~/types'
import { SITE_MAP_FLOORS, SITE_MAP_MASTER, SITE_MAP_PLAN_FRAME } from '~/data/siteMap'
import ZoomablePlan from '~/components/ZoomablePlan.client.vue'
import { approximatePathAnchor, approximatePathPinAbove } from '~/utils/siteMapGeometry'

const blockGBuilding = SITE_MAP_MASTER.buildings.find((b) => b.id === 'block-g')

/** Unique mask id when multiple site map instances exist on a page. */
const masterMapDimMaskId = useId()

const masterBuildingSpotlit = ref(false)

function onMasterBuildingSpotlightEnter() {
  masterBuildingSpotlit.value = true
}

function onMasterBuildingSpotlightLeave() {
  masterBuildingSpotlit.value = false
}

const masterBlockGPinPositionStyle = computed(() => {
  const b = blockGBuilding
  if (!b) return {} as Record<string, string>
  const { x, y } = approximatePathPinAbove(b.pathD, 0.016)
  return {
    left: `${x * 100}%`,
    top: `${y * 100}%`,
    transform: 'translate(-50%, -100%)',
  }
})

const props = defineProps<{
  units: Unit[]
}>()

const planBadgeActiveKey = ref<string | null>(null)
const nowMs = ref(Date.now())
let nowTicker: ReturnType<typeof setInterval> | null = null

function floorSectionId(floorId: string) {
  return `site-map-floor-${floorId}`
}

function resolvePlanUnit(unitNumber: string): Unit | undefined {
  return props.units.find((u) => u.unitNumber === unitNumber)
}

function planBadgeCompoundKey(floorId: string, unitNumber: string) {
  return `${floorId}:${unitNumber}`
}

function onPlanBadgePointerEnter(floorId: string, unitNumber: string) {
  planBadgeActiveKey.value = planBadgeCompoundKey(floorId, unitNumber)
}

function onPlanBadgePointerLeave(floorId: string, unitNumber: string) {
  const k = planBadgeCompoundKey(floorId, unitNumber)
  if (planBadgeActiveKey.value === k) planBadgeActiveKey.value = null
}

function isPlanBadgeActive(floorId: string, unitNumber: string) {
  return planBadgeActiveKey.value === planBadgeCompoundKey(floorId, unitNumber)
}

/**
 * Badge anchor in overlay (translate only) — kept separate so the face can apply its own transform (e.g. counter-rotate on mobile).
 */
function planHtmlBadgePositionStyle(pathD: string): Record<string, string> {
  const { x, y } = approximatePathAnchor(pathD)
  return {
    left: `${x * 100}%`,
    top: `${y * 100}%`,
    transform: 'translate(-50%, -50%)',
    zIndex: '5',
    boxSizing: 'border-box',
  }
}

/** Circle colors / border; inline so dynamic values are not purged by Tailwind. */
function planHtmlBadgeFaceStyle(hovered: boolean, unit: Unit | undefined): Record<string, string> {
  const k = planBadgeKind(unit)
  const style: Record<string, string> = {}
  if (k === 'available') {
    style.backgroundColor = hovered ? '#047857' : '#18181B'
    style.boxShadow = '0 1px 2px rgba(0,0,0,0.08)'
  } else if (k === 'locked') {
    style.backgroundColor = '#a16207'
    style.boxShadow = '0 1px 2px rgba(0,0,0,0.08)'
  } else if (k === 'sold') {
    style.backgroundColor = '#8f2424'
    style.boxShadow = '0 1px 2px rgba(0,0,0,0.08)'
  } else if (k === 'heldByDeveloper') {
    style.backgroundColor = '#ffffff'
    style.border = '1px solid #d4d4d8'
    style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)'
  } else {
    style.backgroundColor = '#ffffff'
    style.border = '1px solid #e4e4e7'
  }
  return style
}

type PlanBadgeKind = 'available' | 'locked' | 'heldByDeveloper' | 'sold' | 'unknown'

function isUnitLockActive(unit: Unit | undefined): boolean {
  if (!unit?.lockExpiresAt || !unit?.lockedBy) return false
  return unit.lockExpiresAt > nowMs.value
}

/** Only available units navigate / open the details popup; other statuses are display-only on the plan. */
function isPlanUnitClickable(unit: Unit | undefined): boolean {
  if (!unit) return true
  if (isUnitLockActive(unit)) return false
  return unit.status === 'Available'
}

function planBadgeKind(unit: Unit | undefined): PlanBadgeKind {
  if (!unit) return 'unknown'
  if (isUnitLockActive(unit)) return 'locked'
  if (unit.status === 'Available') return 'available'
  if (unit.status === 'Held by Developer') return 'heldByDeveloper'
  // Reserved uses same red “SOLD” treatment as Sold on the plan map.
  if (unit.status === 'Reserved') return 'sold'
  return 'sold'
}

/** Second line on plan badge: status instead of price (sold / held-by-developer copy). */
function planBadgeStatusLine(unit: Unit | undefined): string {
  if (!unit) return '—'
  if (isUnitLockActive(unit)) return 'LOCK'
  if (unit.status === 'Held by Developer') return 'HELD'
  if (unit.status === 'Reserved' || unit.status === 'Sold') return 'SOLD'
  return unit.status.toUpperCase()
}

function formatPlanBadgePrice(price: number): string {
  if (price >= 1_000_000) return `R${(price / 1_000_000).toFixed(2)}m`
  if (price >= 1_000) return `R${Math.round(price / 1_000)}k`
  return `R${Math.round(price)}`
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function scrollToFloorPlans() {
  const el = document.getElementById('site-map-floor-plans')
  el?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
}

function onBuildingActivate() {
  scrollToFloorPlans()
}

function onUnitHotspotClick(ev: MouseEvent, unitNumber: string) {
  if (ev.metaKey || ev.ctrlKey || ev.shiftKey) return
  ev.preventDefault()
  const unit = props.units.find((u) => u.unitNumber === unitNumber)
  if (!isPlanUnitClickable(unit)) return
  navigateTo(`/unit/${encodeURIComponent(unitNumber)}`)
}

function planUnitStaticFill(unit: Unit | undefined): string {
  if (!unit) return 'rgba(113, 113, 122, 0.05)'
  const k = planBadgeKind(unit)
  if (k === 'locked') return 'rgba(161, 98, 7, 0.12)' // #a16207
  if (k === 'sold') return 'rgba(143, 36, 36, 0.12)' // #8f2424
  if (k === 'heldByDeveloper') return 'rgba(113, 113, 122, 0.05)' // match available base polygon
  return 'rgba(113, 113, 122, 0.05)'
}

onMounted(() => {
  nowTicker = setInterval(() => {
    nowMs.value = Date.now()
  }, 1000)
})

onBeforeUnmount(() => {
  if (nowTicker) clearInterval(nowTicker)
  nowTicker = null
})

if (import.meta.dev) {
  watch(
    () => props.units,
    (list) => {
      const set = new Set(list.map((u) => u.unitNumber))
      for (const floor of SITE_MAP_FLOORS) {
        for (const h of floor.units) {
          if (!set.has(h.unitNumber)) {
            console.warn(`[siteMap] Hotspot unit "${h.unitNumber}" (${floor.id}) missing from loaded units`)
          }
        }
      }
    },
    { immediate: true },
  )
}
</script>

<style scoped>
/* White dashes read on pale roofs; thin viewBox stroke + tiny dasharray was nearly invisible. */
.master-building-hit {
  filter: drop-shadow(0 0 1px rgb(0 0 0 / 0.9)) drop-shadow(0 0 6px rgb(0 0 0 / 0.35));
}

.master-building-hit:hover,
.master-building-hit:focus-visible {
  filter: none;
}

@keyframes site-map-master-pin-bob {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-0.45rem);
  }
}

.site-map-master-pin-bob {
  animation: site-map-master-pin-bob 2s ease-in-out infinite;
  will-change: transform;
}

.plan-unit-hit .plan-unit-hit-fill {
  fill: rgba(113, 113, 122, 0.05);
  transition: fill 0.15s ease-out;
}

.plan-unit-hit:hover .plan-unit-hit-fill,
.plan-unit-hit:focus-visible .plan-unit-hit-fill {
  fill: rgba(4, 120, 87, 0.1);
}

@media (prefers-reduced-motion: reduce) {
  .plan-html-badge-face {
    transition: none !important;
  }

  .plan-unit-hit .plan-unit-hit-fill {
    transition: none;
  }

  .site-map-master-pin-bob {
    animation: none !important;
    will-change: auto;
  }
}
</style>
