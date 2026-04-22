<template>
  <button
    :type="type"
    :disabled="loading || disabled"
    :class="buttonClass"
  >
    <span v-if="loading" class="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
    <span v-else>{{ label }}</span>
  </button>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string
    loading?: boolean
    disabled?: boolean
    type?: 'button' | 'submit' | 'reset'
    buttonClass?: string
  }>(),
  {
    loading: false,
    disabled: false,
    type: 'button',
    buttonClass:
      'w-full h-12 bg-[#18181B] text-[#ffffff] font-black text-[11px] uppercase tracking-wider rounded-lg hover:bg-[#27272a] transition-all flex items-center justify-center disabled:opacity-50',
  },
)
</script>
