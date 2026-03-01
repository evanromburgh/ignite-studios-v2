<template>
  <div class="min-h-screen">
    <div v-if="unitsLoading" class="flex items-center justify-center min-h-[60vh]">
      <p class="text-zinc-500 text-sm">Loading unit details…</p>
    </div>

    <div v-else-if="!unit">
      <div class="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <h1 class="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight mb-3">
          Unit not found
        </h1>
        <p class="text-zinc-500 text-sm max-w-md mb-6">
          We couldn’t find details for this unit. It may have been updated or removed.
        </p>
        <NuxtLink
          to="/"
          class="px-6 h-[44px] inline-flex items-center justify-center rounded-lg border border-white/10 text-[11px] font-black uppercase tracking-wide text-zinc-200 hover:bg-white/5 transition-colors"
        >
          Back to all units
        </NuxtLink>
      </div>
    </div>

    <div v-else class="pt-32 sm:pt-48 pb-0">
      <div class="max-w-[1400px] mx-auto px-5 sm:px-8">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-16">
          <!-- Left: image, price, specs, actions -->
          <div class="lg:col-span-2 space-y-4">
            <div
              class="relative overflow-hidden rounded-xl aspect-[16/10] bg-zinc-900 group shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)]"
            >
              <div
                class="flex h-full w-full transition-transform duration-500 ease-out"
                :style="{ transform: `translateX(-${activeIndex * 100}%)` }"
              >
                <div
                  v-for="(img, index) in galleryImages"
                  :key="img || index"
                  class="w-full h-full flex-shrink-0 overflow-hidden"
                >
                  <img
                    :src="img"
                    :alt="`Unit ${unit.unitNumber} image ${index + 1}`"
                    loading="lazy"
                    class="w-full h-full object-cover opacity-100 group-hover:scale-105 transition-transform duration-[3s] ease-out"
                  />
                </div>
              </div>

              <button
                v-if="galleryImages.length > 1"
                type="button"
                class="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/70 border border-white/10 flex items-center justify-center text-zinc-200 hover:bg-black/90 transition-colors"
                @click="prevImage"
              >
                <span class="sr-only">Previous</span>
                <span class="-ml-px text-xs">&lt;</span>
              </button>
              <button
                v-if="galleryImages.length > 1"
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/70 border border-white/10 flex items-center justify-center text-zinc-200 hover:bg-black/90 transition-colors"
                @click="nextImage"
              >
                <span class="sr-only">Next</span>
                <span class="ml-px text-xs">&gt;</span>
              </button>

              <!-- Indicators overlay -->
              <div
                v-if="galleryImages.length > 1"
                class="pointer-events-none absolute inset-x-0 bottom-4 flex items-center justify-center gap-3"
              >
                <button
                  v-for="(img, index) in galleryImages"
                  :key="img || index"
                  type="button"
                  class="pointer-events-auto h-2.5 rounded-full bg-black/60 transition-all duration-200"
                  :class="index === activeIndex
                    ? 'w-4 bg-black'
                    : 'w-2.5 bg-black/60 hover:bg-black/90'"
                  @click="goToImage(index)"
                >
                  <span class="sr-only">Go to slide {{ index + 1 }}</span>
                </button>
              </div>
            </div>

            <div class="px-0 sm:px-2">
              <div
                class="flex flex-col sm:flex-row items-start sm:items-baseline justify-between w-full gap-2 sm:gap-6 py-8 sm:py-16"
              >
                <span
                  class="text-2xl sm:text-4xl md:text-5xl font-semibold text-zinc-400 tracking-tight leading-none"
                >
                  Unit {{ unit.unitNumber }}
                </span>
                <div class="text-left sm:text-right">
                  <h1
                    class="text-4xl sm:text-6xl md:text-8xl font-extrabold text-white tracking-tighter leading-none"
                  >
                    R {{ formattedPrice }}
                  </h1>
                </div>
              </div>

              <div class="py-8 sm:py-16 border-y border-white/5">
                <div class="grid grid-cols-3 sm:grid-cols-5 gap-6 sm:gap-4 w-full">
                  <div class="flex flex-col items-center gap-3 sm:gap-4 group">
                    <div
                      class="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center group-hover:bg-white/[0.06] transition-all"
                    >
                      <IconBed class="w-5 h-5 sm:w-7 sm:h-7 text-zinc-500" />
                    </div>
                    <div class="text-center">
                      <span
                        class="block text-lg sm:text-2xl font-black text-white leading-none mb-1 sm:mb-2"
                      >
                        {{ unit.bedrooms }}
                      </span>
                      <span
                        class="text-[8px] sm:text-[10px] font-black text-zinc-600 uppercase tracking-wider sm:tracking-widest"
                      >
                        Beds
                      </span>
                    </div>
                  </div>
                  <div class="flex flex-col items-center gap-3 sm:gap-4 group">
                    <div
                      class="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center group-hover:bg-white/[0.06] transition-all"
                    >
                      <IconBath class="w-5 h-5 sm:w-7 sm:h-7 text-zinc-500" />
                    </div>
                    <div class="text-center">
                      <span
                        class="block text-lg sm:text-2xl font-black text-white leading-none mb-1 sm:mb-2"
                      >
                        {{ unit.bathrooms }}
                      </span>
                      <span
                        class="text-[8px] sm:text-[10px] font-black text-zinc-600 uppercase tracking-wider sm:tracking-widest"
                      >
                        Baths
                      </span>
                    </div>
                  </div>
                  <div class="flex flex-col items-center gap-3 sm:gap-4 group">
                    <div
                      class="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center group-hover:bg-white/[0.06] transition-all"
                    >
                      <IconCar class="w-5 h-5 sm:w-7 sm:h-7 text-zinc-500" />
                    </div>
                    <div class="text-center">
                      <span
                        class="block text-lg sm:text-2xl font-black text-white leading-none mb-1 sm:mb-2"
                      >
                        {{ unit.parking || 1 }}
                      </span>
                      <span
                        class="text-[8px] sm:text-[10px] font-black text-zinc-600 uppercase tracking-wider sm:tracking-widest"
                      >
                        Parking
                      </span>
                    </div>
                  </div>
                  <div class="flex flex-col items-center gap-3 sm:gap-4 group">
                    <div
                      class="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center group-hover:bg-white/[0.06] transition-all"
                    >
                      <IconLayout class="w-5 h-5 sm:w-7 sm:h-7 text-zinc-500" />
                    </div>
                    <div class="text-center">
                      <span
                        class="block text-lg sm:text-2xl font-black text-white leading-none mb-1 sm:mb-2"
                      >
                        {{ unit.unitType }}
                      </span>
                      <span
                        class="text-[8px] sm:text-[10px] font-black text-zinc-600 uppercase tracking-wider sm:tracking-widest"
                      >
                        Type
                      </span>
                    </div>
                  </div>
                  <div class="flex flex-col items-center gap-3 sm:gap-4 group">
                    <div
                      class="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center group-hover:bg-white/[0.06] transition-all"
                    >
                      <IconSize class="w-5 h-5 sm:w-7 sm:h-7 text-zinc-500" />
                    </div>
                    <div class="text-center">
                      <span
                        class="block text-lg sm:text-2xl font-black text-white leading-none mb-1 sm:mb-2"
                      >
                        {{ unit.sizeSqm }}m²
                      </span>
                      <span
                        class="text-[8px] sm:text-[10px] font-black text-zinc-600 uppercase tracking-wider sm:tracking-widest"
                      >
                        Area
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div
                class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-8 sm:pt-16 pb-0"
              >
                <div class="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
                  <button
                    type="button"
                    class="w-full sm:w-auto sm:min-w-[160px] h-[46px] flex items-center justify-center rounded-lg text-[11px] font-black uppercase tracking-normal text-center leading-none transition-all"
                    :class="isWishlisted ? 'bg-zinc-700 text-white' : 'bg-zinc-100 text-zinc-950 hover:bg-white shadow-xl'"
                    @click="onToggleWishlist"
                  >
                    {{ isWishlisted ? 'REMOVE WISHLIST' : 'ADD TO WISHLIST' }}
                  </button>
                  <button
                    type="button"
                    :disabled="returningToList"
                    class="w-full sm:w-auto sm:min-w-[160px] h-[46px] flex items-center justify-center border border-white/10 text-zinc-300 rounded-lg text-[11px] font-black uppercase tracking-normal text-center leading-none hover:bg-white/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    @click="goBackToList"
                  >
                    {{ returningToList ? 'RETURNING...' : 'RETURN TO LIST' }}
                  </button>
                </div>

                <div class="flex items-center justify-center sm:justify-end gap-3 pt-2 sm:pt-0">
                  <span
                    class="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    :class="indicatorColorClass"
                  />
                  <span
                    class="text-[10px] sm:text-[11px] font-black text-white uppercase tracking-[0.15em] sm:tracking-[0.2em]"
                  >
                    {{ statusDisplay }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Right: estimated monthly costs card -->
          <div class="lg:col-span-1 relative">
            <div class="lg:sticky lg:top-32 flex flex-col gap-8 sm:gap-10">
              <div
                class="liquid-glass group !bg-white/[0.01] hover:!bg-white/[0.03] p-6 sm:p-10 relative overflow-hidden rounded-2xl border border-white/5 hover:border-white/10 shadow-xl transition-all duration-500"
              >
                <div
                  class="absolute top-0 right-0 w-32 h-32 bg-white/[0.02] rounded-full -mr-16 -mt-16 blur-3xl transition-all"
                />

                <h2
                  class="text-lg sm:text-xl font-black text-white mb-6 sm:mb-8 tracking-tighter leading-tight group-hover:text-zinc-300 transition-colors"
                >
                  Estimated Monthly Costs
                </h2>

                <div class="flex flex-col mb-8 sm:mb-10">
                  <div
                    class="flex items-center justify-between mb-1 sm:text-[0.875rem] sm:leading-[1.1rem]"
                  >
                    <span
                      class="text-zinc-500 font-medium text-sm transition-colors tracking-tight"
                    >
                      Bond Payment
                    </span>
                    <span
                      class="text-zinc-100 font-bold text-sm text-right sm:text-[0.875rem] sm:leading-[1.1rem]"
                    >
                      R {{ formatAmount(costs.bond) }}
                    </span>
                  </div>
                  <div
                    class="flex items-center justify-between mb-1 sm:text-[0.875rem] sm:leading-[1.1rem]"
                  >
                    <span
                      class="text-zinc-500 font-medium text-sm transition-colors tracking-tight"
                    >
                      Rates &amp; Taxes
                    </span>
                    <span
                      class="text-zinc-100 font-bold text-sm text-right sm:text-[0.875rem] sm:leading-[1.1rem]"
                    >
                      R {{ formatAmount(costs.rates) }}
                    </span>
                  </div>
                  <div
                    class="flex items-center justify-between mb-6 sm:mb-8 sm:text-[0.875rem] sm:leading-[1.1rem]"
                  >
                    <span
                      class="text-zinc-500 font-medium text-sm transition-colors tracking-tight"
                    >
                      Levies
                    </span>
                    <span
                      class="text-zinc-100 font-bold text-sm text-right sm:text-[0.875rem] sm:leading-[1.1rem]"
                    >
                      R {{ formatAmount(costs.levies) }}
                    </span>
                  </div>

                  <div class="pt-6 sm:pt-8 border-t border-white/10">
                    <div class="flex items-center justify-between">
                      <span
                        class="text-white font-black text-base sm:text-xl uppercase tracking-tighter"
                      >
                        Total Monthly
                      </span>
                      <span
                        class="text-white text-base sm:text-xl font-black tracking-tighter text-right"
                      >
                        R {{ formatAmount(costs.total) }}
                      </span>
                    </div>
                  </div>
                </div>

                <div class="flex flex-col gap-3 sm:gap-4">
                  <button
                    type="button"
                    :disabled="!isAvailable"
                    class="w-full sm:w-auto sm:min-w-[160px] h-[46px] flex items-center justify-center rounded-lg text-[11px] font-black uppercase tracking-normal text-center leading-none transition-all"
                    :class="isAvailable
                      ? 'bg-zinc-100 text-zinc-950 hover:bg-white shadow-xl'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'"
                    @click="isAvailable && onReserveClick()"
                  >
                    RESERVE UNIT
                  </button>
                  <button
                    type="button"
                    class="h-[46px] flex items-center justify-center border border-white/10 text-zinc-300 rounded-lg text-[11px] font-black uppercase tracking-normal text-center leading-none hover:bg-white/5 transition-all"
                    @click="navigateTo('/contact')"
                  >
                    ENQUIRE NOW
                  </button>
                </div>
              </div>

              <div class="px-2 sm:pl-2 sm:pr-20">
                <p
                  class="text-[11px] sm:text-[12px] text-zinc-500 font-medium leading-relaxed tracking-tight text-left"
                >
                  <span class="text-white font-black">Note:</span>
                  This reservation deposit secures your unit for 7 days. Our sales team will contact you
                  within 24 hours to complete the purchase process.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { CONFIG } from '~/config'
import { useUnits } from '~/composables/useUnits'
import { useWishlist } from '~/composables/useWishlist'
import IconBed from '~/components/icons/IconBed.vue'
import IconBath from '~/components/icons/IconBath.vue'
import IconCar from '~/components/icons/IconCar.vue'
import IconSize from '~/components/icons/IconSize.vue'
import IconLayout from '~/components/icons/IconLayout.vue'
import IconHeart from '~/components/icons/IconHeart.vue'
import type { Unit } from '~/types'

const route = useRoute()
const { $supabase } = useNuxtApp()
const { units, loading: unitsLoading } = useUnits()
const { wishlistIds, toggle: toggleWishlist } = useWishlist()

const reserving = ref(false)
const returningToList = ref(false)
const activeIndex = ref(0)

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

const isAvailable = computed(() => unit.value?.status === 'Available')

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

const isWishlisted = computed(
  () => unit.value != null && wishlistIds.value.includes(unit.value.id),
)

const indicatorColorClass = computed(() => {
  if (!unit.value) return 'bg-emerald-500'
  if (unit.value.status === 'Sold')
    return 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]'
  if (unit.value.status === 'Reserved')
    return 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
  return 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)] animate-pulse'
})

const statusDisplay = computed(() => {
  if (!unit.value) return ''
  if (unit.value.status !== 'Available') return unit.value.status
  return '0 currently viewing'
})

async function goBackToList() {
  if (process.server) return
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

function prevImage() {
  if (galleryImages.value.length <= 1) return
  activeIndex.value =
    (activeIndex.value - 1 + galleryImages.value.length) % galleryImages.value.length
}

function nextImage() {
  if (galleryImages.value.length <= 1) return
  activeIndex.value =
    (activeIndex.value + 1) % galleryImages.value.length
}

function goToImage(index: number) {
  if (!galleryImages.value.length) return
  const len = galleryImages.value.length
  const normalized = ((index % len) + len) % len
  activeIndex.value = normalized
}

async function onReserveClick() {
  if (!unit.value || !isAvailable.value || reserving.value) return

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
</script>

