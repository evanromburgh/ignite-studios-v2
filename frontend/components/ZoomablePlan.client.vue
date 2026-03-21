<template>
  <!-- Mobile: rotate 90° so landscape raster plans read “tall” on portrait viewports; desktop unchanged. -->
  <div
    class="relative mx-auto box-border w-[60%] max-w-full overflow-x-hidden overflow-y-visible rounded-xl bg-white max-sm:px-1 sm:overflow-hidden"
  >
    <div
      class="flex w-full items-center justify-center max-sm:min-h-0 max-sm:items-stretch max-sm:py-3 sm:min-h-0 sm:block sm:py-0"
    >
      <div
        class="relative w-full max-w-none origin-center max-sm:w-full max-sm:shrink-0 max-sm:rotate-90 max-sm:motion-reduce:rotate-0 sm:w-full sm:rotate-0"
      >
        <div class="relative w-full">
          <img
            :src="imageSrcResolved"
            :alt="imageAlt"
            class="pointer-events-none block h-auto w-full select-none"
            draggable="false"
            loading="lazy"
          >
          <svg
            class="absolute inset-0 z-[1] h-full w-full pointer-events-auto"
            :viewBox="viewBox"
            preserveAspectRatio="none"
            aria-hidden="false"
          >
            <slot />
          </svg>
          <!-- HTML layer: reliable two-line typography (SVG text breaks under non-uniform scale). -->
          <div class="pointer-events-none absolute inset-0 z-10">
            <slot name="overlay" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    imageSrc: string
    imageAlt: string
    viewBox?: string
  }>(),
  { viewBox: '0 0 1 1' },
)

const runtimeConfig = useRuntimeConfig()

const imageSrcResolved = computed(() => {
  const src = props.imageSrc
  const bust = runtimeConfig.public.imageCacheBust
  if (!src || bust === undefined || bust === null || String(bust).length === 0) return src
  const sep = src.includes('?') ? '&' : '?'
  return `${src}${sep}v=${encodeURIComponent(String(bust))}`
})
</script>
