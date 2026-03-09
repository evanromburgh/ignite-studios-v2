<template>
  <div ref="container" class="w-6 h-6 eye-lottie"></div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import lottie from 'lottie-web'
import eyeAnimation from '~/assets/dark_eye.json'

const container = ref<HTMLDivElement | null>(null)
let anim: lottie.AnimationItem | null = null

onMounted(() => {
  if (!container.value) return

  // Load the dark eye animation from bundled JSON (no network fetch)
  anim = lottie.loadAnimation({
    container: container.value,
    renderer: 'svg',
    loop: true,
    autoplay: true,
    animationData: eyeAnimation as unknown as object,
    rendererSettings: {
      preserveAspectRatio: 'xMidYMid meet',
    },
  })

  // Slow down playback to 50% speed
  anim.setSpeed(0.5)
})

onBeforeUnmount(() => {
  if (anim) {
    anim.destroy()
    anim = null
  }
})
</script>

<style scoped>
.eye-lottie {
  width: 1.5rem;
  height: 1.5rem;
}
</style>

