<template>
  <!-- Mobile uses full-width plan and lets content define height. -->
  <div
    class="relative mx-auto box-border w-full max-w-full overflow-x-hidden overflow-y-visible rounded-xl bg-transparent max-sm:px-3 max-sm:overflow-hidden sm:w-[60%] sm:overflow-hidden"
  >
    <div
      class="flex w-full items-center justify-center max-sm:min-h-0 max-sm:items-center max-sm:py-0 sm:min-h-0 sm:block sm:py-0"
    >
      <div
        class="relative w-full max-w-none origin-center max-sm:w-full max-sm:shrink-0 sm:w-full sm:rotate-0"
      >
        <div
          class="relative w-full max-sm:my-4"
          :class="imageReady ? '' : 'min-h-[16rem] max-sm:min-h-[18rem]'"
        >
          <img
            :src="imageSrcResolved"
            :alt="imageAlt"
            class="pointer-events-none block h-auto w-full select-none"
            :class="imageReady ? 'opacity-100' : 'opacity-0'"
            draggable="false"
            loading="lazy"
            @load="onImageReady"
            @error="onImageReady"
          >
          <svg
            v-show="imageReady"
            class="absolute inset-0 z-[1] h-full w-full pointer-events-auto"
            :viewBox="viewBox"
            preserveAspectRatio="none"
            aria-hidden="false"
          >
            <g :transform="overlayTransform">
              <slot />
            </g>
          </svg>
          <!-- HTML layer: reliable two-line typography (SVG text breaks under non-uniform scale). -->
          <div
            v-show="imageReady"
            class="pointer-events-none absolute inset-0 z-10"
          >
            <slot name="overlay" />
          </div>
          <div
            v-if="!imageReady"
            class="absolute inset-0 rounded-md bg-zinc-100 animate-pulse"
            aria-hidden="true"
          />
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
    rotateHotspotsClockwise?: boolean
  }>(),
  {
    viewBox: '0 0 1 1',
    rotateHotspotsClockwise: false,
  },
)

const runtimeConfig = useRuntimeConfig()

const imageSrcResolved = computed(() => {
  const src = props.imageSrc
  const bust = runtimeConfig.public.imageCacheBust
  if (!src || bust === undefined || bust === null || String(bust).length === 0) return src
  const sep = src.includes('?') ? '&' : '?'
  return `${src}${sep}v=${encodeURIComponent(String(bust))}`
})

const imageReady = ref(false)

function onImageReady() {
  imageReady.value = true
}

watch(imageSrcResolved, () => {
  imageReady.value = false
}, { immediate: true })

const overlayTransform = computed(() => (props.rotateHotspotsClockwise ? 'translate(1 0) rotate(90)' : undefined))
</script>
