<template>
  <div class="nav-section light bg-theme-bg pt-[7.5rem] pb-0 sm:pt-[11rem] sm:pb-20">
    <div class="w-full px-4 sm:px-[5rem]">
      <div class="w-full rounded-none border-0 bg-transparent p-0 sm:rounded-xl sm:border sm:border-theme-border sm:bg-white sm:p-10 lg:p-20">
      <div class="grid w-full gap-0 lg:grid-cols-2 lg:gap-0">
        <section class="flex flex-col justify-center">
          <h1 class="mb-2 text-center text-4xl font-black tracking-tight text-theme-text-primary sm:mb-8 sm:text-5xl lg:text-left">
            Your Reservation <br>Confirmed
          </h1>
          <p class="mt-0 mb-10 pr-0 text-center text-base leading-relaxed text-[#71717a] sm:text-lg lg:mb-0 lg:pr-20 lg:text-left">
            Congratulations on securing your unit. Our sales team will contact you within 24 hours to complete the process.
          </p>
          <div class="mt-10 hidden flex-wrap items-center gap-4 lg:flex">
            <NuxtLink
              to="/reservations"
              class="inline-flex h-12 min-w-[12rem] items-center justify-center rounded-lg bg-[#18181B] px-8 text-[11px] font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-zinc-800"
            >
              View Reservations
            </NuxtLink>
            <NuxtLink
              to="/"
              class="inline-flex h-[52px] items-center justify-center px-3 text-[11px] font-black uppercase tracking-widest text-theme-text-primary underline underline-offset-4 transition-opacity hover:opacity-70"
            >
              Back to Home
            </NuxtLink>
          </div>
        </section>

        <section class="flex flex-col gap-5">
          <div class="rounded-2xl bg-[#ffffff] sm:bg-[#f5f5f4] p-6 sm:p-8">
            <div class="flex items-center justify-between gap-4">
              <div>
                <p class="text-[13px] text-zinc-500 sm:font-semibold sm:uppercase sm:tracking-[0.2em] sm:text-zinc-400">
                  Deposit Paid
                </p>
                <p class="mt-0 text-[30px] leading-[1.875rem] font-black text-zinc-900 sm:text-4xl sm:leading-tight">
                  R{{ formattedDepositAmount }}
                </p>
              </div>
              <div class="flex h-10 w-10 items-center justify-center rounded-full bg-[#18181B] text-[#ffffff] sm:h-14 sm:w-14">
                <svg class="h-5 w-5 sm:h-7 sm:w-7" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>

          <div class="rounded-2xl bg-[#ffffff] sm:bg-[#f5f5f4] p-6 sm:p-8">
            <h2 class="text-2xl font-black text-zinc-900">
              {{ unitDetailsHeading }}
            </h2>
            <dl class="mt-6 space-y-4 text-[13px] sm:text-base">
              <div class="flex items-center justify-between gap-4 border-b border-zinc-300 pb-3">
                <dt class="text-zinc-500">
                  Bedrooms
                </dt>
                <dd class="font-semibold text-zinc-900">
                  {{ unitDetails.bedrooms }}
                </dd>
              </div>
              <div class="flex items-center justify-between gap-4 border-b border-zinc-300 pb-3">
                <dt class="text-zinc-500">
                  Bathrooms
                </dt>
                <dd class="font-semibold text-zinc-900">
                  {{ unitDetails.bathrooms }}
                </dd>
              </div>
              <div class="flex items-center justify-between gap-4 border-b border-zinc-300 pb-3">
                <dt class="text-zinc-500">
                  Parking
                </dt>
                <dd class="font-semibold text-zinc-900">
                  {{ unitDetails.parking }}
                </dd>
              </div>
              <div class="flex items-center justify-between gap-4 border-b border-zinc-300 pb-3">
                <dt class="text-zinc-500">
                  Unit Type
                </dt>
                <dd class="font-semibold text-zinc-900">
                  {{ unitDetails.unitType }}
                </dd>
              </div>
              <div class="flex items-center justify-between gap-4">
                <dt class="text-zinc-500">
                  Unit Size
                </dt>
                <dd class="font-semibold text-zinc-900">
                  {{ unitDetails.unitSize }}
                </dd>
              </div>
            </dl>
          </div>
        </section>

        <div class="mt-10 flex flex-col items-center gap-4 lg:hidden">
          <NuxtLink
            to="/reservations"
            class="inline-flex h-12 w-full items-center justify-center rounded-lg bg-[#18181B] px-8 text-[11px] font-black uppercase tracking-wider text-white transition-colors hover:bg-zinc-800"
          >
            View Reservations
          </NuxtLink>
          <NuxtLink
            to="/"
            class="inline-flex items-center justify-center text-[10px] font-black uppercase tracking-wide text-zinc-400 transition-colors hover:text-zinc-600"
          >
            Back to Home
          </NuxtLink>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatZarInteger } from '~/utils/formatZar'

interface ReservationDetailsRow {
  unit_id: string
  amount_cents: number
}

interface UnitDetailsRow {
  unit_number: string
  bedrooms: number
  bathrooms: number
  parking: number
  unit_type: string
  size_sqm: number
}

const route = useRoute()
const { $supabase } = useNuxtApp()

const depositAmount = ref(10_000)
const unitDetails = ref({
  unitNumber: '—',
  bedrooms: '—',
  bathrooms: '—',
  parking: '—',
  unitType: '—',
  unitSize: '—',
})

const formattedDepositAmount = computed(() => formatZarInteger(depositAmount.value))
const unitDetailsHeading = computed(() =>
  unitDetails.value.unitNumber !== '—'
    ? `Unit ${unitDetails.value.unitNumber} Details`
    : 'Unit Details',
)

function decodeReference(reference: string): string {
  try {
    return decodeURIComponent(reference)
  } catch {
    return reference
  }
}

function getPaymentReferenceFromRouteOrStorage(): string {
  const routeRef = String(route.query.ref ?? '').trim()
  if (routeRef) return decodeReference(routeRef)
  if (typeof localStorage === 'undefined') return ''
  const stored = String(localStorage.getItem('payment_reference') ?? '').trim()
  return stored ? decodeReference(stored) : ''
}

function bedroomLabel(bedrooms: number): string {
  if (bedrooms === 0) return 'Studio'
  if (bedrooms === 1) return '1'
  return String(bedrooms)
}

function unitTypeLabel(row: UnitDetailsRow): string {
  const type = String(row.unit_type ?? '').trim()
  if (type) return type
  if (row.bedrooms === 0) return 'Studio'
  if (row.bedrooms === 1) return '1 Bedroom'
  return `${row.bedrooms} Bedroom`
}

onMounted(async () => {
  let reservationQuery = $supabase
    .from('reservations')
    .select('unit_id, amount_cents, created_at')
    .eq('status', 'paid')
    .order('created_at', { ascending: false })
    .limit(1)

  const paymentReference = getPaymentReferenceFromRouteOrStorage()
  if (paymentReference) {
    reservationQuery = $supabase
      .from('reservations')
      .select('unit_id, amount_cents')
      .eq('paystack_reference', paymentReference)
      .eq('status', 'paid')
      .limit(1)
  }

  const { data: reservationRows, error: reservationError } = await reservationQuery
  if (reservationError || !reservationRows?.length) {
    return
  }

  const reservation = reservationRows[0] as ReservationDetailsRow
  depositAmount.value = Math.max(0, Math.round((reservation.amount_cents ?? 0) / 100))

  const { data: unitRow, error: unitError } = await $supabase
    .from('units')
    .select('unit_number, bedrooms, bathrooms, parking, unit_type, size_sqm')
    .eq('id', reservation.unit_id)
    .maybeSingle()

  if (unitError || !unitRow) {
    return
  }

  const typedUnit = unitRow as UnitDetailsRow
  unitDetails.value = {
    ...unitDetails.value,
    unitNumber: typedUnit.unit_number || '—',
    bedrooms: bedroomLabel(typedUnit.bedrooms),
    bathrooms: String(typedUnit.bathrooms ?? '—'),
    parking: String(typedUnit.parking ?? '—'),
    unitType: unitTypeLabel(typedUnit),
    unitSize: typedUnit.size_sqm ? `${typedUnit.size_sqm}m²` : '—',
  }
})
</script>
