<script setup lang="ts">
const route = useRoute()
// Only redirect bare /reserve to home; /reserve/803 etc. must show the child page.
if (route.path === '/reserve' || route.path === '/reserve/') {
  await navigateTo('/', { replace: true })
}
</script>

<template>
  <NuxtPage />
</template>
