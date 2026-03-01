<template>
  <div>
    <AuthPortal v-if="!user && !authLoading" />

    <div v-else class="min-h-screen">
      <header class="mb-12 sm:mb-24 px-5 sm:px-8 md:px-24 lg:px-40 xl:px-56 pt-8 sm:pt-12">
        <h1 class="text-4xl sm:text-7xl md:text-9xl font-black text-white tracking-tighter leading-[0.8] mb-6 sm:mb-10">
          MY<br>
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-zinc-300 via-zinc-100 to-zinc-500 opacity-90">SELECTIONS</span>
        </h1>
        <p class="text-base sm:text-xl text-zinc-500 font-light max-w-4xl">
          Your saved units, all in one place.
        </p>
      </header>

      <section class="px-5 sm:px-8 md:px-24 lg:px-40 xl:px-56 pb-10">
        <div v-if="wishlistLoading && wishlistUnits.length === 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
          <div
            v-for="i in 6"
            :key="i"
            class="aspect-[3/4] bg-white/[0.03] rounded-xl border border-white/5"
          />
        </div>

        <div v-else-if="unitsError" class="text-red-400 text-sm">
          {{ unitsError }}
        </div>

        <div v-else-if="wishlistError" class="text-amber-400 text-sm">
          Could not load wishlist. {{ wishlistError }} Make sure the wishlists table exists (run the migration in README).
        </div>

        <div v-else-if="wishlistUnits.length === 0" class="text-center py-48 bg-white/[0.01] backdrop-blur-3xl rounded-xl border border-white/5 shadow-inner">
          <h3 class="text-2xl md:text-3xl font-black text-zinc-300 uppercase tracking-[0.3em] mb-4">No saved units</h3>
          <p class="text-zinc-500 font-medium mb-8">Save units from the Properties page to see them here.</p>
          <NuxtLink
            to="/"
            class="inline-flex items-center justify-center h-12 px-6 rounded-lg bg-white text-black text-sm font-black uppercase tracking-wider hover:bg-zinc-100 transition-colors"
          >
            Browse Units
          </NuxtLink>
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <UnitCard
            v-for="unit in wishlistUnits"
            :key="unit.id"
            :unit="unit"
            :is-wishlisted="true"
            :server-clock-offset-ms="serverClockOffsetMs"
            :current-user-id="user?.id ?? null"
            :reserving-unit-id="reservingUnitId"
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
import { useWishlist } from '~/composables/useWishlist'
import type { Unit } from '~/types'

const { user, authLoading, sessionRef } = useAuth()
const { units, loading: unitsLoading, error: unitsError } = useUnits()
const { wishlistIds, loading: wishlistLoading, error: wishlistError, toggle: toggleWishlist } = useWishlist()
const { serverClockOffsetMs } = useServerClock()
const reservingUnitId = ref<string | null>(null)
const { $supabase } = useNuxtApp()
const sessionCache = ref<{ access_token: string } | null>(null)

watch(user, (u) => {
  if (!u) return
  if (sessionRef.value) sessionCache.value = sessionRef.value
  $supabase.auth.getSession().then(({ data: { session } }) => {
    if (session?.access_token) sessionCache.value = { access_token: session.access_token }
    if (session?.access_token && !hasWarmedAcquireLock) {
      hasWarmedAcquireLock = true
      $fetch('/api/units/acquire-lock', {
        method: 'POST',
        body: { unitId: '00000000-0000-0000-0000-000000000000' },
        headers: { Authorization: `Bearer ${session.access_token}` },
      }).catch(() => {})
    }
  }).catch(() => {})
}, { immediate: true })

let hasWarmedAcquireLock = false

const wishlistUnits = computed(() => {
  const ids = wishlistIds.value
  if (ids.length === 0) return []
  return units.value.filter((u) => ids.includes(u.id))
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
    const msg = e?.data?.message || e?.message || 'Could not reserve unit.'
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
