<template>
  <div class="nav-section light pt-[7.5rem] sm:pt-[11rem] sm:pb-20">
    <!-- Match Properties (index) horizontal inset from sm up -->
    <div class="w-full px-4 sm:px-[5rem]">
      <header class="mb-10 sm:mb-16 text-center">
        <h1 class="text-4xl sm:text-5xl md:text-6xl font-black text-theme-text-primary tracking-tight mb-2">
          My Selections
        </h1>
        <p class="text-base sm:text-lg text-zinc-500 font-normal max-w-3xl mx-auto">
          Your saved units, all in one place.
        </p>
      </header>

      <section class="pb-0">
        <div v-if="wishlistLoading && wishlistUnits.length === 0" class="grid grid-cols-[repeat(auto-fill,minmax(min(100%,24rem),1fr))] gap-[1.25rem] animate-pulse">
          <div
            v-for="i in 6"
            :key="i"
            class="aspect-[3/4] bg-theme-input-bg rounded-xl border border-theme-border"
          />
        </div>

        <div v-else-if="unitsError" class="text-red-400 text-sm">
          {{ unitsError }}
        </div>

        <div v-else-if="wishlistError" class="text-amber-400 text-sm">
          Could not load wishlist. {{ wishlistError }} Make sure the wishlists table exists (run the migration in README).
        </div>

        <div v-else-if="wishlistUnits.length === 0" class="text-center py-48 bg-theme-surface backdrop-blur-3xl rounded-xl border border-theme-border shadow-inner">
          <h3 class="text-2xl md:text-3xl font-black text-zinc-300 uppercase tracking-[0.3em] mb-4">No saved units</h3>
          <p class="text-zinc-500 font-medium mb-8">Save units from the Properties page to see them here.</p>
          <NuxtLink
            to="/"
            class="inline-flex items-center justify-center h-12 px-6 rounded-lg bg-white text-black text-sm font-black uppercase tracking-wider hover:bg-zinc-100 transition-colors"
          >
            Browse Units
          </NuxtLink>
        </div>

        <UnitCardsGrid
          v-else
          :units="wishlistUnits"
          :always-wishlisted="true"
          :server-clock-offset-ms="serverClockOffsetMs"
          :current-user-id="user?.id ?? null"
          :reserving-unit-id="reservingUnitId"
          @select="onSelectUnit"
          @reserve="onReserveUnit"
          @toggle-wishlist="onToggleWishlist"
        />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import UnitCardsGrid from '~/components/UnitCardsGrid.vue'
import { useAuth } from '~/composables/useAuth'
import { useReserveUnitFlow } from '~/composables/useReserveUnitFlow'
import { useUnits } from '~/composables/useUnits'
import { useWishlist } from '~/composables/useWishlist'
import type { Unit } from '~/types'

const { user } = useAuth()
const { units, loading: unitsLoading, error: unitsError } = useUnits()
const { wishlistIds, loading: wishlistLoading, error: wishlistError, toggle: toggleWishlist } = useWishlist()
const { serverClockOffsetMs } = useServerClock()
const { reservingUnitId, reserveUnit } = useReserveUnitFlow({
  fallbackErrorMessage: 'Could not reserve unit.',
  warmAcquireLock: true,
})

const wishlistUnits = computed(() => {
  const ids = wishlistIds.value
  if (ids.length === 0) return []
  return units.value.filter((u) => ids.includes(u.id))
})

function onSelectUnit(unit: Unit) {
  navigateTo(`/unit/${unit.unitNumber}`)
}

function onReserveUnit(unit: Unit) {
  reserveUnit(unit)
}

function onToggleWishlist(unitId: string) {
  toggleWishlist(unitId)
}
</script>
