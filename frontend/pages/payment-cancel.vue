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
const { $supabase } = useNuxtApp()

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
  const cancelUrl = `${baseUrl}/functions/v1/cancel-reservation`
  const supabaseAnonKey = (config.public.supabaseAnonKey as string | undefined)?.trim() ?? ''

  const run = async () => {
    try {
      const { data: { session } } = await $supabase.auth.getSession()
      const accessToken = session?.access_token?.trim() ?? ''
      if (!accessToken || !supabaseAnonKey) {
        goHome()
        return
      }

      await $fetch(cancelUrl, {
        method: 'POST',
        body: { paymentReference: paymentRef },
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          apikey: supabaseAnonKey,
        },
      }).catch((e: unknown) => {
        console.error('Failed to cancel reservation:', e)
      })
    } catch (e: unknown) {
      console.error('Failed to resolve session for cancellation:', e)
    }
    goHome()
  }
  run()
})
</script>
