<template>
  <div class="w-full">
    <!-- Step labels: only current step is white; past/future steps are zinc-500 -->
    <div class="flex items-center justify-between mb-1">
      <span
        class="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] sm:tracking-[0.1em] transition-colors"
        :class="currentStep === 1 ? 'text-white' : 'text-zinc-500'"
      >
        STEP 1
      </span>
      <span
        class="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] sm:tracking-[0.1em] transition-colors"
        :class="currentStep === 2 ? 'text-white' : 'text-zinc-500'"
      >
        STEP 2
      </span>
      <span
        class="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] sm:tracking-[0.1em] transition-colors"
        :class="currentStep === 3 ? 'text-white' : 'text-zinc-500'"
      >
        STEP 3
      </span>
    </div>
    <!-- Progress bar: fill by width so both ends stay rounded; longer transition to see it animate -->
    <div class="w-full mt-1.5 h-[0.35rem] rounded-full overflow-hidden bg-white/10">
      <div
        class="h-full bg-white rounded-full transition-[width] duration-500 ease-out"
        :style="{ width: fillWidth }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  /** Which step is active (for label highlight) */
  currentStep: 1 | 2 | 3
  /** Which step the bar fill shows (can lag behind for animation after step content is visible) */
  fillStep?: 1 | 2 | 3
}>()

const stepForFill = computed(() => props.fillStep ?? props.currentStep)

// Step 1 = 16%, Step 2 = 50%, Step 3 = 84%. Width-based fill so both ends stay rounded.
const STEP_WIDTHS: Record<1 | 2 | 3, string> = {
  1: '16%',
  2: '50%',
  3: '84%',
}
const fillWidth = computed(() => STEP_WIDTHS[stepForFill.value])
</script>
