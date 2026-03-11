<script setup lang="ts">
import AuthPortal from '~/components/AuthPortal.vue'
import logoLight from '~/assets/branding/logo_light.svg'

const { user, authLoading } = useAuth()

// Track route navigation so we can show the same loading splash
// whenever the user switches pages.
const routeLoading = ref(false)

// Track auth transitions (sign in / sign out) so we also show the loader
// between the AuthPortal and the main app.
const authTransitionLoading = ref(false)

if (process.client) {
  const router = useRouter()
  router.beforeEach((to, from, next) => {
    if (to.fullPath !== from.fullPath) {
      routeLoading.value = true
    }
    next()
  })
  router.afterEach(() => {
    routeLoading.value = false
  })
}

const isLoading = computed(
  () => authLoading.value || routeLoading.value || authTransitionLoading.value,
)

const showLoader = ref(false)
let loaderStartedAt: number | null = null

// When the auth user changes (null -> user on sign in, or user -> null on sign out),
// briefly trigger the loader so the transition between AuthPortal and the main app
// also passes through the same splash.
watch(user, (val, prev) => {
  if ((!prev && val) || (prev && !val)) {
    authTransitionLoading.value = true
    setTimeout(() => {
      authTransitionLoading.value = false
    }, 400)
  }
})

watch(isLoading, (value) => {
  if (value) {
    // Start loader immediately if not already shown
    if (!showLoader.value) {
      showLoader.value = true
      loaderStartedAt = Date.now()
    }
  } else {
    // Underlying work finished; keep loader for at least 500ms total
    const started = loaderStartedAt
    if (started == null) {
      showLoader.value = false
      return
    }
    const elapsed = Date.now() - started
    const remaining = Math.max(0, 500 - elapsed)
    setTimeout(() => {
      // Only hide if nothing new has started meanwhile
      if (!isLoading.value) {
        showLoader.value = false
        loaderStartedAt = null
      }
    }, remaining)
  }
}, { immediate: true })
</script>

<template>
  <div class="min-h-screen bg-[#18181B] relative">
    <!-- Full-screen loading splash (shown while auth or route is loading) -->
    <div
      v-if="showLoader"
      class="fixed inset-0 z-[9999] flex items-center justify-center bg-[#18181B] text-white"
    >
      <img
        :src="logoLight"
        alt="Ignite Studios"
        class="h-11 w-auto"
      />
    </div>

    <!-- App content always rendered underneath; loader simply covers it when active -->
    <div class="min-h-screen bg-theme-bg">
      <template v-if="!user">
        <AuthPortal />
      </template>
      <template v-else>
        <NuxtLayout>
          <NuxtPage />
        </NuxtLayout>
      </template>
    </div>
  </div>
</template>

<style scoped>
/* No transitions for now: loader appears/disappears instantly. */
</style>
