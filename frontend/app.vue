<script setup lang="ts">
import AuthPortal from '~/components/AuthPortal.vue'

const { user, authLoading } = useAuth()
const { pending: salesModePending } = useSalesMode()
const { loading: unitsLoading } = useUnits()
const { faviconUrl, logoLightUrl } = useBranding()
const route = useRoute()

useHead({
  link: [{ rel: 'icon', type: 'image/png', href: faviconUrl }],
})

// Track auth transitions (sign in / sign out) so we also show the loader
// between the AuthPortal and the main app.
const authTransitionLoading = ref(false)
// Show splash during real route navigations.
const routeLoading = ref(false)
// Only use authLoading for initial bootstrap; ignore later passive auth checks.
const initialAuthResolved = ref(false)
let removeBeforeEach: (() => void) | null = null
let removeAfterEach: (() => void) | null = null

const requiresUnitsBootstrap = computed(() =>
  route.path === '/' ||
  route.path === '/wishlist' ||
  route.path === '/reservations' ||
  route.path.startsWith('/unit/'),
)
const initialDataLoading = computed(() => {
  if (!user.value) return false
  if (!requiresUnitsBootstrap.value) return false
  return salesModePending.value || unitsLoading.value
})

const isLoading = computed(
  () =>
    (authLoading.value && (!initialAuthResolved.value || !user.value)) ||
    initialDataLoading.value ||
    routeLoading.value ||
    authTransitionLoading.value,
)
const appShellKey = computed(() => `app-shell:${route.path}`)

const showLoader = ref(false)
let loaderStartedAt: number | null = null
let removePageShowListener: (() => void) | null = null

function isMobileViewport() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(max-width: 639px)').matches
}

function forceTopOnMobile() {
  if (typeof window === 'undefined') return
  if (!isMobileViewport()) return
  requestAnimationFrame(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  })
}

// When the auth user changes (null -> user on sign in, or user -> null on sign out),
// briefly trigger the loader so the transition between AuthPortal and the main app
// also passes through the same splash.
watch(() => user.value?.id ?? null, (nextUserId, prevUserId) => {
  if ((!prevUserId && nextUserId) || (prevUserId && !nextUserId)) {
    authTransitionLoading.value = true
    setTimeout(() => {
      authTransitionLoading.value = false
    }, 400)
  }
  // Keep auth transitions deterministic on mobile: always start from top.
  if (!prevUserId && nextUserId) {
    forceTopOnMobile()
  }
})

watch(
  authLoading,
  (loading) => {
    if (!loading) initialAuthResolved.value = true
  },
  { immediate: true },
)

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

onMounted(() => {
  const router = useRouter()
  removeBeforeEach = router.beforeEach((to, from, next) => {
    // Treat only real page navigations as route-loading.
    // Query-only updates (filters/view mode) should not flash the global loader.
    if (to.path !== from.path) {
      routeLoading.value = true
    }
    next()
  })
  removeAfterEach = router.afterEach(() => {
    routeLoading.value = false
  })

  // Mobile hard refresh/back-forward cache can preserve scroll; reset to top.
  forceTopOnMobile()
  if (typeof window !== 'undefined') {
    const onPageShow = () => forceTopOnMobile()
    window.addEventListener('pageshow', onPageShow)
    removePageShowListener = () => window.removeEventListener('pageshow', onPageShow)
  }
})

onBeforeUnmount(() => {
  removeBeforeEach?.()
  removeBeforeEach = null
  removeAfterEach?.()
  removeAfterEach = null
  removePageShowListener?.()
  removePageShowListener = null
})
</script>

<template>
  <div class="min-h-screen bg-[#18181B] relative">
    <!-- Full-screen loading splash (shown while auth or route is loading) -->
    <div
      v-if="showLoader"
      class="fixed inset-0 z-[9999] flex items-center justify-center bg-[#18181B] text-white"
    >
      <img
        :src="logoLightUrl"
        alt="Ignite Studios"
        class="h-7 w-auto sm:h-11"
      />
    </div>

    <!-- App content always rendered underneath; loader simply covers it when active -->
    <div class="min-h-screen bg-theme-bg">
      <NuxtLayout :key="appShellKey">
        <NuxtPage />
      </NuxtLayout>
      <AuthPortal v-if="!user && !authLoading" />
    </div>
  </div>
</template>

<style scoped>
/* No transitions for now: loader appears/disappears instantly. */
</style>
