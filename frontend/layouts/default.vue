<template>
  <div class="min-h-screen bg-theme-bg text-theme-text-primary relative">
    <div class="min-h-screen flex flex-col">
        <!-- Mobile menu backdrop -->
        <div
          role="presentation"
          aria-hidden="!showMobileMenu"
          class="lg:hidden fixed inset-0 z-[140] bg-black/20 backdrop-blur-[5px] transition-opacity duration-300"
          :class="showMobileMenu ? 'opacity-100' : 'opacity-0 pointer-events-none'"
          @click="showMobileMenu = false"
        />

        <nav
      class="fixed top-0 left-0 right-0 z-[150] flex flex-col transition-all duration-300"
      :class="navBackgroundClass"
    >
      <div class="pl-5 pr-5 sm:pl-8 sm:pr-8 md:px-24 h-16 sm:h-24 flex items-center justify-between flex-shrink-0">
        <NuxtLink
          to="/"
          class="cursor-pointer flex items-center shrink-0"
        >
          <img
            :src="logoSrc"
            alt="Ignite Studios"
            class="h-5 sm:h-6 w-auto"
          />
        </NuxtLink>

        <div class="flex items-center gap-3 sm:gap-4">
          <!-- Desktop: main links always visible; profile only when logged in -->
          <div class="hidden lg:flex items-center space-x-10 mr-6">
            <NuxtLink
              to="/"
              class="h-[46px] px-2 text-[12px] uppercase tracking-[0.15em] transition-colors flex items-center"
              :class="navLinkClass(isPropertiesPage)"
            >
              Properties
            </NuxtLink>
            <NuxtLink
              v-if="user"
              to="/wishlist"
              class="h-[46px] px-2 text-[12px] uppercase tracking-[0.15em] transition-colors flex items-center"
              :class="navLinkClass(isWishlistPage)"
            >
              Wishlist
            </NuxtLink>
            <NuxtLink
              v-if="user"
              to="/reservations"
              class="h-[46px] px-2 text-[12px] uppercase tracking-[0.15em] transition-colors flex items-center"
              :class="navLinkClass(isReservationsPage)"
            >
              My Units
            </NuxtLink>
            <NuxtLink
              to="/documents"
              class="h-[46px] px-2 text-[12px] uppercase tracking-[0.15em] transition-colors flex items-center"
              :class="navLinkClass(isDocumentsPage)"
            >
              Downloads
            </NuxtLink>
          </div>

          <template v-if="user">
            <div ref="userMenuRef" class="relative">
              <button
                type="button"
                title="Profile Settings"
                class="w-9 h-9 sm:w-[46px] sm:h-[46px] flex items-center justify-center rounded-full transition-all group relative pointer-events-none lg:pointer-events-auto cursor-default lg:cursor-pointer"
                :class="profileButtonClass"
                @click="showUserMenu = !showUserMenu"
              >
                <span class="relative z-10 text-[9px] sm:text-[10px] font-black">
                  {{ userInitials }}
                </span>
              </button>

              <div
                v-if="showUserMenu"
                class="hidden lg:block absolute top-full right-0 mt-3 sm:mt-[1.3rem] w-56 sm:w-64 bg-theme-overlay-dropdown rounded-xl p-2 border border-theme-border shadow-xl z-[200]"
              >
                <NuxtLink
                  to="/profile"
                  class="w-full flex items-center px-4 h-12 rounded-lg text-theme-text-muted hover:bg-zinc-100 hover:text-theme-text-primary transition-all group mb-1"
                  @click="showUserMenu = false"
                >
                  <span class="text-[10px] font-black uppercase tracking-widest">
                    My Profile
                  </span>
                  <svg
                    class="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10s-3.516.68-4.168 1.332c-.678.678-.83 1.418-.832 1.664z" />
                  </svg>
                </NuxtLink>
                <div class="h-px bg-theme-border mx-2 my-1" />
                <button
                  type="button"
                  class="w-full flex items-center px-4 h-12 rounded-lg text-theme-text-muted hover:bg-zinc-100 hover:text-theme-text-primary transition-all group"
                  @click="handleLogout"
                >
                  <span class="text-[10px] font-black uppercase tracking-widest">
                    {{ isLoggingOut ? 'Ending Session...' : 'Sign Out' }}
                  </span>
                  <svg class="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </template>

          <button
            type="button"
            class="lg:hidden w-5 h-5 sm:w-[46px] sm:h-[46px] flex items-center justify-center rounded-lg relative shrink-0"
            aria-label="Toggle navigation menu"
            @click="showMobileMenu = !showMobileMenu"
          >
            <div class="w-5 h-5 relative flex items-center justify-center">
              <span
                class="absolute block w-5 h-0.5 transition-all duration-300 ease-in-out"
                :class="[showMobileMenu ? 'rotate-45 top-[9px]' : 'top-[3px]', mobileIconBarClass]"
              />
              <span
                class="absolute block w-5 h-0.5 transition-all duration-300 ease-in-out top-[9px]"
                :class="[showMobileMenu ? 'opacity-0 scale-0' : 'opacity-100 scale-100', mobileIconBarClass]"
              />
              <span
                class="absolute block w-5 h-0.5 transition-all duration-300 ease-in-out"
                :class="[showMobileMenu ? '-rotate-45 top-[9px]' : 'top-[15px]', mobileIconBarClass]"
              />
            </div>
          </button>
        </div>
      </div>

      <!-- Mobile menu -->
      <div
        class="lg:hidden overflow-hidden transition-all duration-300 ease-in-out"
        :class="showMobileMenu ? 'max-h-[70vh] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'"
      >
        <div class="flex flex-col items-stretch pt-0 pb-6 pl-5 pr-5 sm:pl-8 sm:pr-8">
          <div class="w-full flex">
            <NuxtLink to="/" class="w-full max-w-xs mx-auto h-12 flex items-center text-[12px] uppercase tracking-wider" :class="navLinkClass(isPropertiesPage)" @click="showMobileMenu = false">
              Properties
            </NuxtLink>
          </div>
          <div class="w-full h-px bg-white/10 my-1" />
          <div class="w-full flex">
            <NuxtLink to="/documents" class="w-full max-w-xs mx-auto h-12 flex items-center text-[12px] uppercase tracking-wider" :class="navLinkClass(isDocumentsPage)" @click="showMobileMenu = false">
              Downloads
            </NuxtLink>
          </div>
          <template v-if="user">
            <div class="w-full h-px bg-white/10 my-1" />
            <div class="w-full flex">
              <NuxtLink to="/wishlist" class="w-full max-w-xs mx-auto h-12 flex items-center text-[12px] uppercase tracking-wider" :class="navLinkClass(isWishlistPage)" @click="showMobileMenu = false">
                Wishlist
              </NuxtLink>
            </div>
            <div class="w-full h-px bg-white/10 my-1" />
            <div class="w-full flex">
              <NuxtLink to="/reservations" class="w-full max-w-xs mx-auto h-12 flex items-center text-[12px] uppercase tracking-wider" :class="navLinkClass(isReservationsPage)" @click="showMobileMenu = false">
                My Units
              </NuxtLink>
            </div>
            <div class="w-full h-px bg-white/10 my-1" />
            <div class="w-full flex">
              <button type="button" class="w-full max-w-xs mx-auto h-12 flex items-center justify-between text-[12px] font-black uppercase tracking-widest" :class="isLoggingOut ? 'text-theme-text-muted' : 'text-red-500'" @click="handleLogoutMobile">
                {{ isLoggingOut ? 'Ending Session...' : 'Sign Out' }}
                <svg v-if="!isLoggingOut" class="w-4 h-4 ml-auto shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </template>
        </div>
      </div>
    </nav>

    <main class="w-full pt-0">
      <slot />
    </main>

    <!-- Browsing badge – Nuxt DevTools bar styling -->
    <div
      class="browsing-anchor"
      aria-live="polite"
    >
      <div class="browsing-panel group">
        <div class="browsing-icon-button flex-shrink-0">
          <IconEyeLottie />
        </div>
        <div class="browsing-sep" />
        <div class="browsing-label">
          <span class="browsing-label-main">{{ onlineCount }}</span>
          <span class="browsing-label-secondary">Currently Viewing</span>
        </div>
      </div>
    </div>

    <footer class="bg-black text-white px-5 sm:px-8 md:px-24 pt-12 sm:pt-20 pb-10 sm:pb-20 text-[11px]">
      <div class="w-full space-y-10">
        <div>
          <img
            :src="logoLight"
            alt="Ignite Studios"
            class="h-6 w-auto mb-6"
          />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-16">
          <!-- Contact -->
          <div class="space-y-2">
            <h3 class="text-[11px] font-black uppercase tracking-[0.2em] mb-3">
              Contact
            </h3>
            <a
              href="mailto:info@ignitestudios.co.za"
              class="text-[12px] font-medium tracking-normal text-zinc-200 hover:text-white transition-colors"
            >
              info@ignitestudios.co.za
            </a>
          </div>

          <!-- Quick links -->
          <div class="space-y-2">
            <h3 class="text-[11px] font-black uppercase tracking-[0.2em] mb-3">
              Quick Links
            </h3>
            <NuxtLink
              to="/wishlist"
              class="block text-[12px] font-medium tracking-normal text-zinc-300 hover:text-white transition-colors mb-1"
            >
              Wishlist
            </NuxtLink>
            <NuxtLink
              to="/reservations"
              class="block text-[12px] font-medium tracking-normal text-zinc-300 hover:text-white transition-colors mb-1"
            >
              My Units
            </NuxtLink>
            <NuxtLink
              to="/documents"
              class="block text-[12px] font-medium tracking-normal text-zinc-300 hover:text-white transition-colors"
            >
              Downloads
            </NuxtLink>
          </div>

          <!-- Terms -->
          <div class="space-y-2">
            <h3 class="text-[11px] font-black uppercase tracking-[0.2em] mb-3">
              Terms &amp; Conditions
            </h3>
            <span class="block text-[12px] font-medium tracking-normal text-zinc-300 mb-1">
              Privacy Policy
            </span>
            <span class="block text-[12px] font-medium tracking-normal text-zinc-300 mb-1">
              Disclaimer
            </span>
            <span class="block text-[12px] font-medium tracking-normal text-zinc-300">
              Cookie Settings
            </span>
          </div>

          <!-- Back to top -->
          <div class="flex lg:items-start lg:justify-end items-center justify-start">
            <button
              type="button"
              class="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-300 hover:text-white transition-colors"
              @click="scrollToTop"
            >
              Back to top
            </button>
          </div>
        </div>

        <div class="mt-10 pt-10 border-t border-white/10 flex items-center justify-between text-[10px] text-zinc-500">
          <span>&copy; {{ new Date().getFullYear() }} Ignite Studios</span>
        </div>
      </div>
    </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick } from 'vue'
import IconEyeLottie from '~/components/icons/IconEyeLottie.client.vue'
import logoLight from '~/assets/branding/logo_light.svg'
import logoDark from '~/assets/branding/logo_dark.svg'

const route = useRoute()
const { user, logout } = useAuth()
const { onlineCount } = useGlobalPresence()

const showUserMenu = ref(false)
const isPropertiesPage = computed(() => route.path === '/' || route.path === '')
const isDocumentsPage = computed(() => route.path === '/documents')
const isReservationsPage = computed(() => route.path === '/reservations')
const isWishlistPage = computed(() => route.path === '/wishlist')

const showMobileMenu = ref(false)
const userMenuRef = ref<HTMLElement | null>(null)
const isLoggingOut = ref(false)
const scrolled = ref(false)
const currentNavTheme = ref<'dark' | 'light'>(isPropertiesPage.value ? 'dark' : 'light')

const isDarkNavTheme = computed(() => currentNavTheme.value === 'dark')

const navBackgroundClass = computed(() => {
  if (scrolled.value) {
    return 'bg-theme-overlay-nav/95 backdrop-blur-xl border-b border-white/10 shadow-sm'
  }
  if (!isPropertiesPage.value) {
    return 'bg-transparent border-b border-theme-border'
  }
  return 'bg-transparent border-b border-transparent'
})

function navLinkClass(isActive: boolean) {
  if (isDarkNavTheme.value) {
    return isActive ? 'text-white font-semibold' : 'text-white font-normal'
  }
  return isActive ? 'text-[#18181B] font-semibold' : 'text-[#18181B] font-normal'
}

const mobileIconBarClass = computed(() =>
  isDarkNavTheme.value ? 'bg-white' : 'bg-[#18181B]',
)

const logoSrc = computed(() => (isDarkNavTheme.value ? logoLight : logoDark))

const profileButtonClass = computed(() => {
  if (!user.value) return ''

  if (isDarkNavTheme.value) {
    // Dark nav theme (white logo/text): always solid white circle with dark text
    return 'bg-white text-[#18181B]'
  }

  // Light nav theme (dark logo/text): always solid dark circle with white text
  return 'bg-[#18181B] text-white hover:bg-[#27272a]'
})

function updateScrolledAndTheme() {
  scrolled.value = window.scrollY > 20

  if (typeof window === 'undefined') return

  const navEl = document.querySelector<HTMLElement>('nav')
  const navHeight = navEl?.offsetHeight ?? 96

  // Special-case properties page: hero slider (dark) then light content.
  // Keep dark theme while the nav bar overlaps the dark hero section.
  if (isPropertiesPage.value) {
    const hero = document.querySelector<HTMLElement>('.nav-section.dark')
    if (hero) {
      const heroTop = hero.offsetTop
      const heroBottom = heroTop + hero.offsetHeight
      const navBottom = window.scrollY + navHeight
      currentNavTheme.value = navBottom <= heroBottom ? 'dark' : 'light'
      return
    }
  }

  const sections = Array.from(
    document.querySelectorAll<HTMLElement>('.nav-section'),
  )
  if (!sections.length) {
    currentNavTheme.value = 'light'
    return
  }

  let darkCoveringNav = false
  let themeCoveringNav: 'dark' | 'light' | null = null

  sections.forEach((el) => {
    const rect = el.getBoundingClientRect()
    const theme: 'dark' | 'light' = el.classList.contains('dark') ? 'dark' : 'light'

    // Section intersects the vertical space behind the nav bar
    const intersectsNav = rect.top < navHeight && rect.bottom > 0
    if (!intersectsNav) return

    if (theme === 'dark') {
      darkCoveringNav = true
    }
    if (!themeCoveringNav) {
      themeCoveringNav = theme
    }
  })

  if (darkCoveringNav) {
    currentNavTheme.value = 'dark'
  } else if (themeCoveringNav) {
    currentNavTheme.value = themeCoveringNav
  } else {
    const firstTheme: 'dark' | 'light' =
      sections[0].classList.contains('dark') ? 'dark' : 'light'
    currentNavTheme.value = firstTheme
  }
}

const userInitials = computed(() => {
  if (!user.value) return '?'
  if (user.value.displayName) {
    return user.value.displayName.split(' ').map(n => n[0]).join('').toUpperCase()
  }
  return user.value.email ? user.value.email[0].toUpperCase() : '?'
})

function onClickOutside(e: MouseEvent) {
  if (userMenuRef.value && !userMenuRef.value.contains(e.target as Node)) {
    showUserMenu.value = false
  }
}

function handleLogout() {
  showUserMenu.value = false
  isLoggingOut.value = true
  logout().finally(() => { isLoggingOut.value = false })
}

function handleLogoutMobile() {
  showMobileMenu.value = false
  isLoggingOut.value = true
  logout().finally(() => { isLoggingOut.value = false })
}

onMounted(() => {
  document.addEventListener('mousedown', onClickOutside)
  window.addEventListener('resize', onResize)
  window.addEventListener('scroll', updateScrolledAndTheme, { passive: true })
  updateScrolledAndTheme()
})

// Re-evaluate theme when route changes (e.g., navigating between pages)
watch(
  () => route.fullPath,
  async () => {
    await nextTick()
    updateScrolledAndTheme()
  },
)

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onClickOutside)
  window.removeEventListener('resize', onResize)
  window.removeEventListener('scroll', updateScrolledAndTheme)
  document.body.style.overflow = ''
})

function onResize() {
  if (window.innerWidth >= 1024) showMobileMenu.value = false
  updateScrolledAndTheme()
}

watch(showMobileMenu, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})

function scrollToTop() {
  if (typeof window === 'undefined') return
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<style scoped>
/* Nuxt DevTools bar styling */
.browsing-anchor {
  --browsing-widget-bg: var(--theme-surface-elevated);
  --browsing-widget-fg: var(--theme-text-primary);
  --browsing-widget-border: var(--theme-border-strong);
  --browsing-widget-shadow: rgba(0, 0, 0, 0.3);
  position: fixed;
  left: 1.25rem;
  bottom: 1.25rem;
  z-index: 200;
  pointer-events: auto;
}

.browsing-panel {
  border: 1px solid var(--browsing-widget-border);
  background-color: var(--browsing-widget-bg);
  backdrop-filter: blur(10px);
  height: 30px;
  color: var(--browsing-widget-fg);
  box-shadow: 2px 2px 8px var(--browsing-widget-shadow);
  user-select: none;
  border-radius: 100px;
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: 80px; /* show icon + number by default */
  padding: 2px 10px;
  transition: max-width 0.6s, padding 0.5s;
  overflow: hidden;
}

.browsing-panel:hover {
  max-width: 180px;
  padding: 2px 10px;
}

.browsing-icon-button {
  width: 26px;
  height: 26px;
  border-radius: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.8;
  flex-shrink: 0;
}

.browsing-panel:hover .browsing-icon-button {
  opacity: 1;
}

.browsing-sep {
  border-left: 1px solid rgba(136, 136, 136, 0.2);
  width: 1px;
  height: 10px;
  flex-shrink: 0;
}

.browsing-label {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0;
  font-size: 0.8em;
  line-height: 1em;
  white-space: nowrap;
  min-width: 0;
}

.browsing-label-main {
  opacity: 0.8;
  margin-left: 4px; /* balance space between separator and number */
  font-size: 0.75em;
}

.browsing-label-secondary {
  opacity: 0;
  max-width: 0;
  margin-left: 0;
  font-size: 0.75em;
  line-height: 1em; /* vertically center with number */
  transition: opacity 0.4s, max-width 0.4s, margin-left 0.4s;
}

.browsing-panel:hover .browsing-label-secondary {
  opacity: 0.5;
  max-width: 200px;
  margin-left: 3px;
}
</style>
