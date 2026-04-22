<template>
  <div class="mt-6 rounded-lg bg-theme-input-bg border border-theme-border px-4 py-4 mb-6">
    <div class="flex items-center justify-between gap-2">
      <div>
        <p class="text-[10px] sm:text-[11px] font-medium text-zinc-500 uppercase tracking-[0.05em]">{{ title }}</p>
        <p class="text-[13px] font-medium text-theme-text-primary mt-0.5">{{ email }}</p>
      </div>
      <button
        type="button"
        class="text-xs text-zinc-500 hover:text-zinc-300 shrink-0 transition-colors"
        @click="$emit('action')"
      >
        {{ actionText }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    email: string
    actionText?: string
  }>(),
  { actionText: 'Change' },
)

defineEmits<{
  action: []
}>()
</script>
