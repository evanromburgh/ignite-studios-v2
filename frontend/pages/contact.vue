<template>
  <Transition name="page-fade">
    <div class="nav-section light px-5 sm:px-8 md:px-24 lg:px-40 xl:px-56 pt-32 sm:pt-48 pb-24">
      <header class="mb-10 sm:mb-16">
        <h1 class="text-4xl sm:text-5xl md:text-6xl font-black text-theme-text-primary tracking-tight mb-2">
          Secure Your Legacy
        </h1>
        <p class="text-base sm:text-lg text-zinc-500 font-normal max-w-3xl">
          Contact form and create-lead integration coming next.
        </p>
      </header>
    </div>
  </Transition>
</template>

<script setup lang="ts">
</script>

<style scoped>
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.25s ease;
}
.page-fade-enter-from,
.page-fade-leave-to {
  opacity: 0;
}
.page-fade-enter-to,
.page-fade-leave-from {
  opacity: 1;
}
</style>
