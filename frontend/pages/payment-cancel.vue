<template>
  <div class="min-h-screen bg-theme-bg flex flex-col items-center justify-center gap-6 px-5 pt-[7.5rem] sm:pt-[11rem] sm:pb-20">
    <div class="flex items-center animate-pulse">
      <span class="text-2xl sm:text-4xl font-black tracking-tighter text-theme-text-primary leading-none">IGNITE</span>
      <div class="h-4 sm:h-6 w-[1px] bg-zinc-800 mx-3 sm:mx-4" />
      <span class="text-[8px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] sm:tracking-[0.5em] leading-none">STUDIOS</span>
    </div>
    <div class="w-12 h-[1px] bg-gradient-to-r from-transparent via-theme-border-strong to-transparent" />
    <p class="text-zinc-500 text-sm">Taking you back to properties...</p>
  </div>
</template>

<script setup lang="ts">
/** SessionStorage key: show one-time toast on home after returning from payment cancel */
const PAYMENT_CANCELLED_TOAST_KEY = 'show_payment_cancelled_toast'

const route = useRoute()
const config = useRuntimeConfig()

onMounted(() => {
  const urlParams = new URLSearchParams(route.fullPath.includes('?') ? route.fullPath.split('?')[1] : '')
  let paymentRef = urlParams.get('ref') || (typeof localStorage !== 'undefined' ? localStorage.getItem('payment_reference') : null)
  if (paymentRef) {
    try {
      paymentRef = decodeURIComponent(paymentRef)
    } catch {
      // use as-is
    }
  }

  const goHome = () => {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('ignite_reservation_redirecting')
      sessionStorage.setItem(PAYMENT_CANCELLED_TOAST_KEY, 'true')
    }
    window.location.href = '/'
  }

  if (!paymentRef) {
    goHome()
    return
  }

  const baseUrl = config.public.supabaseUrl as string | undefined
  if (!baseUrl) {
    goHome()
    return
  }
  const releaseUrl = `${baseUrl}/functions/v1/release-reservation-lock`
  const webhookUrl = `${baseUrl}/functions/v1/payment-webhook`

  const run = async () => {
    try {
      await $fetch(releaseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ ref: paymentRef! }).toString(),
      })
    } catch (e) {
      console.error('Failed to release unit lock:', e)
    }
    try {
      await $fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          m_payment_id: paymentRef!,
          payment_status: 'CANCELLED',
        }).toString(),
      })
    } catch (e) {
      console.error('Failed to send cancellation webhook:', e)
    }
    goHome()
  }
  run()
})
</script>
