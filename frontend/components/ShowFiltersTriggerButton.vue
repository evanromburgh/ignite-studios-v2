<template>
  <button
    type="button"
    class="w-full h-12 rounded-xl text-[12px] font-bold uppercase tracking-widest transition-[background-color,color] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] flex items-center justify-center gap-2 shadow-sm"
    :class="toneClasses"
    aria-label="Open filters"
    @click="$emit('click')"
  >
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
    Show Filters
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    tone?: 'light' | 'dark'
  }>(),
  {
    tone: 'dark',
  },
)

const toneClasses = computed(() =>
  props.tone === 'light'
    ? 'bg-white text-[#18181B] hover:bg-[#18181B] hover:text-white'
    : 'bg-[#18181B] text-white hover:bg-zinc-800',
)

defineEmits<{ click: [] }>()
</script>
