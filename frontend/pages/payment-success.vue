<template>
  <div class="min-h-screen bg-theme-bg flex flex-col items-center justify-center gap-6 px-5 sm:px-8 md:px-16 pt-[7.5rem] sm:pt-[11rem] sm:pb-20">
    <div class="text-center w-full max-w-5xl">
      <h1 class="text-2xl sm:text-4xl font-black text-theme-text-primary tracking-tight leading-tight mb-4">
        Your Reservation Confirmed
      </h1>
      <p class="text-zinc-400 text-base sm:text-lg mb-8 max-w-[42rem] mx-auto text-center">
        Congratulations on securing your unit. Our sales team will contact you within 24 hours to complete the process.
      </p>

      <div
        v-if="unit"
        class="group relative grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-xl p-4 border border-theme-border bg-theme-surface overflow-hidden w-full max-w-4xl mx-auto text-left"
      >
        <div class="absolute inset-0 bg-gradient-to-br from-theme-input-bg to-transparent pointer-events-none" />
        <div class="relative sm:col-span-2">
          <div class="relative overflow-hidden rounded-lg aspect-[3/2] bg-theme-input-bg">
            <img
              :src="unit.imageUrl"
              :alt="`Unit ${unit.unitNumber}`"
              class="object-cover w-full h-full opacity-70 grayscale-[20%] group-hover:opacity-100 transition-opacity duration-300"
            >
          </div>
        </div>
        <div class="flex flex-col gap-4 relative z-10">
          <div class="rounded-lg bg-theme-input-bg border border-theme-border p-6">
            <p class="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-1.5">
              Your reservation
            </p>
            <h3 class="text-xl font-medium text-theme-text-primary tracking-tight leading-none mb-2">
              Unit {{ unit.unitNumber }}
            </h3>
            <p class="text-lg text-zinc-400 mb-6">
              R {{ formatPrice(unit.price) }}
            </p>
            <div class="pt-6 border-t border-theme-border flex flex-col gap-2 text-sm">
              <p class="text-zinc-500">
                <span class="text-zinc-400">Bedrooms:</span> {{ unit.bedrooms }}
              </p>
              <p class="text-zinc-500">
                <span class="text-zinc-400">Bathrooms:</span> {{ unit.bathrooms }}
              </p>
              <p class="text-zinc-500">
                <span class="text-zinc-400">Parking:</span> {{ unit.parking }}
              </p>
              <p class="text-zinc-500">
                <span class="text-zinc-400">Unit Type:</span> {{ unit.unitType }}
              </p>
              <p class="text-zinc-500">
                <span class="text-zinc-400">Unit Size:</span> {{ unit.sizeSqm }} m²
              </p>
            </div>
          </div>
          <div class="flex items-center justify-center rounded-lg bg-emerald-500/15 px-3 py-1.5">
            <span class="text-sm font-semibold text-emerald-400">Deposit Paid</span>
          </div>
        </div>
      </div>

      <div v-else class="max-w-md mx-auto text-zinc-500 text-sm">
        <p>Thank you for your payment. You can view your reservations below.</p>
      </div>
    </div>

    <NuxtLink
      to="/reservations"
      class="mt-4 h-[46px] px-8 bg-white text-black text-[11px] font-black uppercase tracking-widest rounded-lg hover:bg-zinc-200 transition-all inline-flex items-center justify-center"
    >
      My Reservations
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import type { Unit } from '~/types'

const route = useRoute()
const { $supabase } = useNuxtApp()
const unit = ref<Unit | null>(null)
const storageBucket = 'units'

function formatPrice(price: number) {
  return new Intl.NumberFormat('en-US').format(price).replace(/,/g, ' ')
}

function getPublicUrl(path: string | null | undefined): string | null {
  if (!path) return null
  const { data } = $supabase.storage.from(storageBucket).getPublicUrl(path)
  return data.publicUrl ?? null
}

function mapRow(row: any): Unit {
  let lockExpiresAt: number | undefined
  if (row.lock_expires_at != null) {
    const ms = new Date(row.lock_expires_at).getTime()
    if (!Number.isNaN(ms)) lockExpiresAt = ms
  }
  const rawViewers = (row.viewers as Record<string, number>) ?? {}
  return {
    id: row.id,
    unitNumber: row.unit_number,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    parking: row.parking,
    sizeSqm: row.size_sqm,
    price: row.price,
    status: row.status,
    unitType: row.unit_type,
    floor: row.floor ?? null,
    direction: row.direction ?? null,
    imageUrl: (getPublicUrl(row.image_key_1) ?? '') as string,
    imageUrl2: getPublicUrl(row.image_key_2),
    imageUrl3: getPublicUrl(row.image_key_3),
    floorplanUrl: getPublicUrl(row.floorplan_key),
    viewers: rawViewers,
    lockExpiresAt,
    lockedBy: row.locked_by,
  }
}

onMounted(async () => {
  const urlParams = new URLSearchParams(route.fullPath.includes('?') ? route.fullPath.split('?')[1] : '')
  let paymentRef = urlParams.get('ref') || urlParams.get('m_payment_id') || (typeof localStorage !== 'undefined' ? localStorage.getItem('payment_reference') : null)
  if (paymentRef) {
    try {
      paymentRef = decodeURIComponent(paymentRef)
    } catch {
      // use as-is
    }
  }
  if (!paymentRef) {
    return
  }
  // Reference format: unitId|zohoContactId|timestamp (same as submit-reservation / payment-webhook)
  const parts = paymentRef.split('|')
  const unitId = parts[0]?.trim()
  if (!unitId) {
    return
  }
  try {
    const { data, error: err } = await $supabase
      .from('units')
      .select('*')
      .eq('id', unitId)
      .single()
    if (!err && data) {
      unit.value = mapRow(data)
    }
  } catch (e) {
    console.warn('Could not fetch unit for success page:', e)
  }
})
</script>
