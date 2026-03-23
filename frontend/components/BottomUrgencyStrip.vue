<script setup lang="ts">
const { visible, message } = useBottomUrgencyStrip()
</script>

<template>
  <Teleport to="body">
    <Transition name="bottom-urgency-strip">
      <div
        v-if="visible"
        class="bottom-urgency-strip fixed left-1/2 z-[215] w-max max-w-[calc(100vw-2.5rem)] rounded-xl bg-[#922724] px-4 py-3 text-center text-white shadow-lg"
        role="alert"
        aria-live="assertive"
      >
        <p class="text-[11px] font-semibold leading-snug">
          {{ message }}
        </p>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.bottom-urgency-strip {
  bottom: 1.25rem;
  transform: translateX(-50%);
}

.bottom-urgency-strip-enter-active.bottom-urgency-strip,
.bottom-urgency-strip-leave-active.bottom-urgency-strip {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.bottom-urgency-strip-enter-from.bottom-urgency-strip,
.bottom-urgency-strip-leave-to.bottom-urgency-strip {
  opacity: 0;
  transform: translateX(-50%) translateY(10px);
}
.bottom-urgency-strip-enter-to.bottom-urgency-strip,
.bottom-urgency-strip-leave-from.bottom-urgency-strip {
  transform: translateX(-50%) translateY(0);
}
</style>
