<template>
  <div>
    <AuthPortal v-if="!user" />

    <div v-else class="nav-section light min-h-screen pt-[11rem] pb-16 sm:pb-20">
      <header class="mb-10 sm:mb-16 px-5 sm:px-8 md:px-24 lg:px-40 xl:px-56">
        <h1 class="text-4xl sm:text-5xl md:text-6xl font-black text-theme-text-primary tracking-tight mb-2">
          My Units
        </h1>
        <p class="text-base sm:text-lg text-zinc-500 font-normal max-w-3xl">
          Units you have reserved. View details or manage your reservation.
        </p>
      </header>

      <section class="px-5 sm:px-8 md:px-24 lg:px-40 xl:px-56 pb-0">
        <div v-if="(reservedIdsLoading || unitsLoading) && reservedUnits.length === 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[1.25rem] animate-pulse">
          <div
            v-for="i in 6"
            :key="i"
            class="aspect-[3/4] bg-theme-input-bg rounded-xl border border-theme-border"
          />
        </div>

        <div v-else-if="unitsError" class="text-red-400 text-sm">
          {{ unitsError }}
        </div>

        <div v-else-if="reservedIdsError" class="text-amber-400 text-sm">
          Could not load your reservations. {{ reservedIdsError }}
        </div>

        <div v-else-if="reservedUnits.length === 0" class="text-center py-48 bg-theme-surface backdrop-blur-3xl rounded-xl border border-theme-border shadow-inner">
          <h3 class="text-2xl md:text-3xl font-black text-zinc-300 uppercase tracking-[0.3em] mb-4">No reserved units</h3>
          <p class="text-zinc-500 font-medium mb-8">Reserve a unit from the Properties page and complete payment to see it here.</p>
          <NuxtLink
            to="/"
            class="inline-flex items-center justify-center h-12 px-6 rounded-lg bg-white text-black text-sm font-black uppercase tracking-wider hover:bg-zinc-100 transition-colors"
          >
            Browse Units
          </NuxtLink>
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[1.25rem]">
          <UnitCard
            v-for="unit in reservedUnits"
            :key="unit.id"
            :unit="unit"
            :is-wishlisted="wishlistIds.includes(unit.id)"
            :server-clock-offset-ms="serverClockOffsetMs"
            :current-user-id="user?.id ?? null"
            :reserving-unit-id="reservingUnitId"
            :is-my-units-card="true"
            @select="onSelectUnit"
            @reserve="onReserveUnit"
            @toggle-wishlist="onToggleWishlist"
          />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import AuthPortal from '~/components/AuthPortal.vue'
import UnitCard from '~/components/UnitCard.vue'
import { useAuth } from '~/composables/useAuth'
import { useUnits } from '~/composables/useUnits'
import { useReservedUnitIds } from '~/composables/useReservedUnitIds'
import { useWishlist } from '~/composables/useWishlist'
import type { Unit } from '~/types'

const { user, sessionRef } = useAuth()
const { units, loading: unitsLoading, error: unitsError } = useUnits()
const { reservedUnitIds, loading: reservedIdsLoading, error: reservedIdsError, refetch: refetchReserved } = useReservedUnitIds()
const { wishlistIds, toggle: toggleWishlist } = useWishlist()
const { serverClockOffsetMs } = useServerClock()
const reservingUnitId = ref<string | null>(null)
const { $supabase } = useNuxtApp()
const sessionCache = ref<{ access_token: string } | null>(null)

const reservedUnits = computed(() => {
  const ids = reservedUnitIds.value
  if (ids.length === 0) return []
  return units.value.filter((u) => ids.includes(u.id))
})

watch(user, (u) => {
  if (!u) return
  if (sessionRef.value) sessionCache.value = sessionRef.value
  $supabase.auth.getSession().then(({ data: { session } }) => {
    if (session?.access_token) sessionCache.value = { access_token: session.access_token }
  }).catch(() => {})
}, { immediate: true })

onMounted(() => {
  refetchReserved()
})

function onSelectUnit(unit: Unit) {
  navigateTo(`/unit/${unit.unitNumber}`)
}

function onReserveUnit(unit: Unit) {
  reservingUnitId.value = unit.id
  const token = sessionCache.value?.access_token ?? sessionRef.value?.access_token
  if (token) {
    doAcquireLock(unit, token)
    return
  }
  $supabase.auth.getSession().then(({ data: { session } }) => {
    if (!session) {
      reservingUnitId.value = null
      return
    }
    if (session?.access_token) sessionCache.value = { access_token: session.access_token }
    doAcquireLock(unit, session.access_token)
  })
}

async function doAcquireLock(unit: Unit, token: string) {
  try {
    const res = await $fetch<{ lockExpiresAt?: string }>('/api/units/acquire-lock', {
      method: 'POST',
      body: { unitId: unit.id },
      headers: { Authorization: `Bearer ${token}` },
    })
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('ignite_reserve_unitId', unit.id)
      if (res?.lockExpiresAt) sessionStorage.setItem('ignite_reserve_lockExpiresAt', res.lockExpiresAt)
      sessionStorage.setItem('ignite_reserve_token', token)
    }
    await navigateTo(`/reserve/${unit.unitNumber}`)
  } catch (e: any) {
    const msg = e?.data?.message || e?.message || 'Could not open reservation.'
    console.error(msg)
    alert(msg)
  } finally {
    reservingUnitId.value = null
  }
}

function onToggleWishlist(unitId: string) {
  toggleWishlist(unitId)
}
</script>
