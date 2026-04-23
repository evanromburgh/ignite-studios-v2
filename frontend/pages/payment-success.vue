<template>
  <div class="min-h-screen bg-theme-bg flex flex-col items-center justify-center gap-6 px-5 sm:px-8 md:px-16 pt-[7.5rem] sm:pt-[11rem] sm:pb-20">
    <div class="text-center w-full max-w-5xl">
      <h1 class="text-2xl sm:text-4xl font-black text-theme-text-primary tracking-tight leading-tight mb-4">
        Your Reservation Confirmed
      </h1>
      <p class="text-zinc-400 text-base sm:text-lg mb-8 max-w-[42rem] mx-auto text-center">
        Congratulations on securing your unit. Our sales team will contact you within 24 hours to complete the process.
      </p>
      <div class="max-w-md mx-auto text-zinc-500 text-sm">
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
