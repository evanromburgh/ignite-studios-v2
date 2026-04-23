<template>
  <div class="min-h-screen bg-theme-bg flex flex-col items-center justify-center gap-6 px-5 sm:px-8 md:px-16 pt-[7.5rem] sm:pt-[11rem] sm:pb-20">
    <div class="text-center w-full max-w-5xl">
      <h1 class="text-2xl sm:text-4xl font-black text-theme-text-primary tracking-tight leading-tight mb-4">
        {{ isFinalizing ? 'Finalizing Payment...' : 'Your Reservation Confirmed' }}
      </h1>
      <p class="text-zinc-400 text-base sm:text-lg mb-8 max-w-[42rem] mx-auto text-center">
        {{
          isFinalizing
            ? 'Please wait while we confirm your payment and finalize your reservation.'
            : 'Congratulations on securing your unit. Our sales team will contact you within 24 hours to complete the process.'
        }}
      </p>

      <div
        v-if="!isFinalizing && unit"
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
              R {{ formatZarInteger(unit.price) }}
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
        <p v-if="isFinalizing">Finalizing your payment confirmation. This usually takes a few seconds.</p>
        <p v-else>Thank you for your payment. You can view your reservations below.</p>
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
import { mapSupabaseUnitRow, type SupabaseUnitRow } from '~/utils/mapUnitRow'
import { formatZarInteger } from '~/utils/formatZar'
import { getUnitsBucketPublicUrl } from '~/utils/unitsStorage'

const route = useRoute()
const { $supabase } = useNuxtApp()
const config = useRuntimeConfig()
const unit = ref<Unit | null>(null)
const isFinalizing = ref(true)

type ReservationSnapshot = {
  status: string | null
  unit_id: string | null
}

function resolvePaymentReference() {
  const urlParams = new URLSearchParams(route.fullPath.includes('?') ? route.fullPath.split('?')[1] : '')
  let paymentRef = urlParams.get('ref') || urlParams.get('m_payment_id') || (typeof localStorage !== 'undefined' ? localStorage.getItem('payment_reference') : null)
  if (paymentRef) {
    try {
      paymentRef = decodeURIComponent(paymentRef)
    } catch {
      // use as-is
    }
  }
  return paymentRef?.trim() || null
}

async function confirmPayment(paymentRef: string) {
  const supabaseUrl = String(config.public.supabaseUrl ?? '').trim().replace(/\/$/, '')
  const supabaseAnonKey = String(config.public.supabaseAnonKey ?? '').trim()
  if (!supabaseUrl || !supabaseAnonKey) return

  const { data: { session } } = await $supabase.auth.getSession()
  const accessToken = session?.access_token?.trim()
  if (!accessToken) return

  await $fetch(`${supabaseUrl}/functions/v1/confirm-payment`, {
    method: 'POST',
    body: { paymentReference: paymentRef },
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      apikey: supabaseAnonKey,
    },
  }).catch(() => {})
}

async function pollReservation(paymentRef: string): Promise<ReservationSnapshot | null> {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const { data } = await $supabase
      .from('reservations')
      .select('status, unit_id')
      .eq('paystack_reference', paymentRef)
      .maybeSingle<ReservationSnapshot>()

    if (data?.status === 'paid') return data
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  return null
}

async function loadUnit(unitId: string) {
  const { data, error: err } = await $supabase
    .from('units')
    .select('*')
    .eq('id', unitId)
    .single()
  if (!err && data) {
    unit.value = mapSupabaseUnitRow(data as SupabaseUnitRow, (path) =>
      getUnitsBucketPublicUrl($supabase, path),
    )
  }
}

onMounted(async () => {
  const paymentRef = resolvePaymentReference()
  if (!paymentRef) {
    isFinalizing.value = false
    return
  }

  try {
    await confirmPayment(paymentRef)
    const reservation = await pollReservation(paymentRef)
    if (reservation?.unit_id) {
      await loadUnit(reservation.unit_id)
    }
  } catch (e: unknown) {
    console.warn('Could not fetch unit for success page:', e)
  } finally {
    isFinalizing.value = false
  }
})
</script>
