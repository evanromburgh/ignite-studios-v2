<template>
  <div class="min-h-screen bg-theme-bg text-theme-text-primary relative">
    <div class="min-h-screen flex flex-col">
        <!-- Mobile-only bar background: keeps transparent/scrolled state; never turns white when menu opens -->
        <div
          aria-hidden="true"
          class="fixed top-0 left-0 right-0 h-16 sm:h-24 z-[150] pointer-events-none transition-all duration-300 lg:hidden"
          :class="[navBackgroundClass, disableNavTransitions && '!transition-none !duration-0']"
        />
        <!-- White panel slides down over the bar (z-160); tap to close -->
        <div
          role="presentation"
          :aria-hidden="!showMobileMenu"
          class="lg:hidden fixed top-0 left-0 right-0 z-[160] bg-white overflow-hidden mobile-menu-panel"
          :class="[
            showMobileMenu && panelSlideDone ? 'translate-y-0 pointer-events-auto mobile-menu-panel--sized' : '-translate-y-full pointer-events-none'
          ]"
          :style="whitePanelStyle"
          @click="showMobileMenu = false"
        />

        <nav
      ref="navRef"
      class="fixed top-0 left-0 right-0 z-[170] lg:z-[150] flex flex-col transition-all duration-300"
      :class="[navBackgroundClass, 'max-lg:!bg-transparent max-lg:!border-transparent', menuMeasuring && 'mobile-menu-measuring', disableNavTransitions && '!transition-none !duration-0']"
    >
      <div class="pl-5 pr-5 sm:pl-8 sm:pr-8 md:px-[5rem] h-16 sm:h-24 flex items-center justify-between flex-shrink-0">
        <NuxtLink
          to="/"
          class="cursor-pointer flex items-center shrink-0"
          @click="handleLogoClick"
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
            @click="toggleMobileMenu()"
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

      <!-- Mobile menu (expanded but invisible when menuMeasuring so we can measure height) -->
      <div
        class="lg:hidden overflow-hidden mobile-menu-dropdown"
        :class="showMobileMenu ? 'max-h-[70vh] opacity-100' : menuMeasuring ? 'max-h-[70vh] opacity-0' : 'max-h-0 opacity-0 pointer-events-none'"
      >
        <div class="flex flex-col items-stretch pt-0 pb-6 pl-5 pr-5 sm:pl-8 sm:pr-8">
          <div class="w-full flex">
            <NuxtLink to="/" class="w-full max-w-xs mx-auto h-12 flex items-center text-[12px] uppercase tracking-wider" :class="navLinkClass(isPropertiesPage)" @click="showMobileMenu = false">
              Properties
            </NuxtLink>
          </div>
          <template v-if="user">
            <div class="w-full h-px my-1" :class="effectiveIsDarkNavTheme ? 'bg-white/10' : 'bg-zinc-200'" />
            <div class="w-full flex">
              <NuxtLink to="/wishlist" class="w-full max-w-xs mx-auto h-12 flex items-center text-[12px] uppercase tracking-wider" :class="navLinkClass(isWishlistPage)" @click="showMobileMenu = false">
                Wishlist
              </NuxtLink>
            </div>
            <div class="w-full h-px my-1" :class="effectiveIsDarkNavTheme ? 'bg-white/10' : 'bg-zinc-200'" />
            <div class="w-full flex">
              <NuxtLink to="/reservations" class="w-full max-w-xs mx-auto h-12 flex items-center text-[12px] uppercase tracking-wider" :class="navLinkClass(isReservationsPage)" @click="showMobileMenu = false">
                My Units
              </NuxtLink>
            </div>
          </template>
          <div class="w-full h-px my-1" :class="effectiveIsDarkNavTheme ? 'bg-white/10' : 'bg-zinc-200'" />
          <div class="w-full flex">
            <NuxtLink to="/documents" class="w-full max-w-xs mx-auto h-12 flex items-center text-[12px] uppercase tracking-wider" :class="navLinkClass(isDocumentsPage)" @click="showMobileMenu = false">
              Downloads
            </NuxtLink>
          </div>
          <template v-if="user">
            <div class="w-full h-px my-1" :class="effectiveIsDarkNavTheme ? 'bg-white/10' : 'bg-zinc-200'" />
            <div class="w-full flex">
              <NuxtLink to="/profile" class="w-full max-w-xs mx-auto h-12 flex items-center text-[12px] uppercase tracking-wider" :class="navLinkClass(isProfilePage)" @click="showMobileMenu = false">
                Profile
              </NuxtLink>
            </div>
            <div class="w-full h-px my-1" :class="effectiveIsDarkNavTheme ? 'bg-white/10' : 'bg-zinc-200'" />
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

    <main class="w-full pt-0 pb-[4rem] sm:pb-0">
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
          <span class="browsing-label-secondary">Users online</span>
        </div>
      </div>
    </div>

    <!-- Chat / Contact Agent widget: Properties (index) only, after scrolling past hero -->
    <Transition name="chat-widget-appear">
      <ChatWidget v-if="showChatWidget && isAgentContactConfigured" />
    </Transition>

    <BottomUrgencyStrip />

    <footer class="footer-main relative bg-[#18181B] text-white pl-5 pr-5 sm:pl-8 sm:pr-8 md:px-24 pt-16 sm:pt-20 pb-[4.25rem]">
      <!-- Main footer: Logo + Contact + Quick Links + Terms & Conditions -->
      <div class="footer-content flex flex-col gap-14 lg:grid lg:grid-cols-2 lg:items-start lg:gap-20 pb-[4rem] sm:pb-16">
        <!-- Logo -->
        <div class="flex flex-col items-start text-left">
          <img
            :src="logoLightUrl"
            alt="Ignite Studios"
            class="h-6 w-auto"
          />
        </div>

        <!-- Contact, Quick Links, Terms & Conditions -->
        <div class="grid grid-cols-1 sm:grid-cols-[auto_auto_auto] gap-10 sm:gap-14 sm:justify-between">
          <!-- Contact -->
          <div class="footer-col space-y-4 sm:w-max sm:min-w-max">
            <h3 class="text-[11px] font-bold uppercase tracking-wider text-white">
              Contact
            </h3>
            <a
              href="mailto:info@ignite-studios.co.za"
              class="block text-[12px] text-[#CCCCCC] hover:text-white transition-colors leading-relaxed"
            >
              info@ignite-studios.co.za
            </a>
          </div>

          <!-- Quick Links -->
          <div class="footer-col space-y-4 sm:w-max sm:min-w-max">
            <h3 class="text-[11px] font-bold uppercase tracking-wider text-white">
              Quick Links
            </h3>
            <nav class="flex flex-col gap-3">
              <NuxtLink
                to="/wishlist"
                class="text-[12px] text-[#CCCCCC] hover:text-white transition-colors leading-relaxed"
              >
                Wishlist
              </NuxtLink>
              <NuxtLink
                to="/reservations"
                class="text-[12px] text-[#CCCCCC] hover:text-white transition-colors leading-relaxed"
              >
                My Units
              </NuxtLink>
              <NuxtLink
                to="/documents"
                class="text-[12px] text-[#CCCCCC] hover:text-white transition-colors leading-relaxed"
              >
                Downloads
              </NuxtLink>
            </nav>
          </div>

          <!-- Terms & Conditions -->
          <div class="footer-col space-y-4 sm:w-max sm:min-w-max">
            <h3 class="text-[11px] font-bold uppercase tracking-wider text-white">
              Terms &amp; Conditions
            </h3>
            <nav class="flex flex-col gap-3">
              <span class="text-[12px] text-[#CCCCCC] hover:text-white transition-colors leading-relaxed cursor-pointer">Privacy Policy</span>
              <span class="text-[12px] text-[#CCCCCC] hover:text-white transition-colors leading-relaxed cursor-pointer">Disclaimer</span>
              <span class="text-[12px] text-[#CCCCCC] hover:text-white transition-colors leading-relaxed cursor-pointer">Cookie Settings</span>
            </nav>
          </div>
        </div>
      </div>

      <!-- Bottom bar: line separator, then copyright + back to top -->
      <div class="footer-bottom border-t border-white/10 flex items-center justify-between pt-5 sm:pt-6 pb-0">
        <p class="m-0 text-[12px] text-[#CCCCCC] font-normal">
          © {{ new Date().getFullYear() }} Ignite Studios. All rights reserved.
        </p>
        <button
          type="button"
          class="flex items-center justify-center w-10 h-10 rounded-full text-[#CCCCCC] hover:text-white hover:bg-white/10 transition-colors shrink-0"
          aria-label="Back to top"
          @click="scrollToTop"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      </div>
    </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick } from 'vue'
import IconEyeLottie from '~/components/icons/IconEyeLottie.client.vue'
import { initialsFromName } from '~/utils/initialsFromName'

const route = useRoute()
const { logoLightUrl, logoDarkUrl } = useBranding()
const { isConfigured: isAgentContactConfigured } = useAgentContacts()
const { user, logout } = useAuth()
const { onlineCount } = useGlobalPresence()

const showUserMenu = ref(false)
const isPropertiesPage = computed(() => route.path === '/' || route.path === '')
const isDocumentsPage = computed(() => route.path === '/documents')
const isReservationsPage = computed(() => route.path === '/reservations')
const isWishlistPage = computed(() => route.path === '/wishlist')
const isProfilePage = computed(() => route.path === '/profile')

const showMobileMenu = ref(false)
const navRef = ref<HTMLElement | null>(null)
const navHeightPx = ref(0)
/** Expand dropdown invisibly to measure nav height before opening panel (avoids full-height then pop) */
const menuMeasuring = ref(false)
/** When true, panel has finished sliding down (so we show translateY(0)); starts false on open so panel slides from top */
const panelSlideDone = ref(false)
const userMenuRef = ref<HTMLElement | null>(null)
const isLoggingOut = ref(false)
const scrolled = ref(false)
/** Chat widget only on Properties (index); there, only after scrolling past the hero (hidden when footer is in view) */
const showChatWidget = ref(false)
const currentNavTheme = ref<'dark' | 'light'>(isPropertiesPage.value ? 'dark' : 'light')
const disableNavTransitions = ref(false)

const isDarkNavTheme = computed(() => currentNavTheme.value === 'dark')

/** When mobile menu is open or we're measuring height, use light theme (dark logo/items on white) */
const effectiveNavTheme = computed(() => (showMobileMenu.value || menuMeasuring.value ? 'light' : currentNavTheme.value))
const effectiveIsDarkNavTheme = computed(() => effectiveNavTheme.value === 'dark')

/** Bar background: never force white for menu open — white comes from the sliding panel only */
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
  if (effectiveIsDarkNavTheme.value) {
    return isActive ? 'text-white font-semibold' : 'text-white font-normal'
  }
  return isActive ? 'text-[#18181B] font-semibold' : 'text-[#18181B] font-normal'
}

const mobileIconBarClass = computed(() =>
  effectiveIsDarkNavTheme.value ? 'bg-white' : 'bg-[#18181B]',
)

const logoSrc = computed(() =>
  effectiveIsDarkNavTheme.value ? logoLightUrl : logoDarkUrl,
)

const profileButtonClass = computed(() => {
  if (!user.value) return ''

  if (effectiveIsDarkNavTheme.value) {
    // Dark nav theme (white logo/text): solid white circle with dark text
    return 'bg-white text-[#18181B]'
  }

  // Light nav theme (dark logo/text): solid dark circle with white text
  return 'bg-[#18181B] text-white hover:bg-[#27272a]'
})

/** White panel height: use nav height so it never changes during open/close (avoids panel “dropping” before slide-up on close) */
const whitePanelStyle = computed(() => {
  if (navHeightPx.value) return { height: `${navHeightPx.value}px` }
  return { height: '100vh' }
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
      // Show chat widget as soon as the user scrolls (bottom of hero has moved up from the bottom of the viewport)
      const heroRect = hero.getBoundingClientRect()
      showChatWidget.value = heroRect.bottom < window.innerHeight
      const footer = document.querySelector<HTMLElement>('.footer-main')
      if (footer && footer.getBoundingClientRect().top < window.innerHeight) {
        showChatWidget.value = false
      }
      return
    }
    showChatWidget.value = false
    return
  }

  showChatWidget.value = false

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
  const dn = user.value.displayName?.trim()
  if (dn) return initialsFromName(dn)
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
    // Prevent a one-frame border flash when navigating to Properties:
    // route changes before scroll restoration can briefly leave `scrolled` true.
    if (isPropertiesPage.value) {
      disableNavTransitions.value = true
      scrolled.value = false
      currentNavTheme.value = 'dark'
    }
    await nextTick()
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve())
      })
    })
    updateScrolledAndTheme()
    requestAnimationFrame(() => {
      disableNavTransitions.value = false
    })
  },
)

onBeforeUnmount(() => {
  navResizeObserver?.disconnect()
  navResizeObserver = null
  document.removeEventListener('mousedown', onClickOutside)
  window.removeEventListener('resize', onResize)
  window.removeEventListener('scroll', updateScrolledAndTheme)
  document.body.style.overflow = ''
})

function onResize() {
  if (window.innerWidth >= 1024) showMobileMenu.value = false
  updateScrolledAndTheme()
}

let navResizeObserver: ResizeObserver | null = null

function startOpenSequence() {
  if (!navRef.value) return
  panelSlideDone.value = false
  menuMeasuring.value = true
  nextTick(() => {
    if (!navRef.value) return
    navHeightPx.value = navRef.value.offsetHeight
    menuMeasuring.value = false
    showMobileMenu.value = true
    // Double rAF so the panel is painted at -100% before we transition to 0 (otherwise open has no visible slide)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        panelSlideDone.value = true
      })
    })
  })
}

function toggleMobileMenu() {
  if (showMobileMenu.value) {
    showMobileMenu.value = false
    panelSlideDone.value = false
  } else {
    startOpenSequence()
  }
}

watch(showMobileMenu, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
  if (open && navRef.value) {
    navResizeObserver = new ResizeObserver(() => {
      if (navRef.value) navHeightPx.value = navRef.value.offsetHeight
    })
    navResizeObserver.observe(navRef.value)
  } else {
    panelSlideDone.value = false
    navResizeObserver?.disconnect()
    navResizeObserver = null
  }
})

function scrollToTop() {
  if (typeof window === 'undefined') return
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function handleLogoClick(event: MouseEvent) {
  // NuxtLink ignores same-route navigations; hard-refresh home when already there.
  if (route.path === '/' || route.path === '') {
    event.preventDefault()
    if (typeof window !== 'undefined') window.location.assign('/')
  }
}
</script>

<style scoped>
/* Footer: logo + sections, then bottom bar with copyright and back to top */
.footer-main {
  min-height: 0;
}

.footer-col {
  min-width: 0;
}

/* Mobile menu panel: smooth slide on open and close; height only transitions when resizing (not during open slide) */
.mobile-menu-panel {
  transition: transform 0.32s cubic-bezier(0.32, 0.72, 0, 1);
}
.mobile-menu-panel.mobile-menu-panel--sized {
  transition:
    transform 0.32s cubic-bezier(0.32, 0.72, 0, 1),
    height 0.28s cubic-bezier(0.32, 0.72, 0, 1);
}

/* Match dropdown expand/collapse to panel for unified open/close */
.mobile-menu-dropdown {
  transition:
    max-height 0.32s cubic-bezier(0.32, 0.72, 0, 1),
    opacity 0.24s cubic-bezier(0.32, 0.72, 0, 1);
}

/* When measuring, dropdown expands instantly (no transition) for accurate height */
.mobile-menu-measuring .mobile-menu-dropdown {
  transition: none;
}

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
  border: none;
  background-color: var(--browsing-widget-bg);
  backdrop-filter: blur(10px);
  height: 30px;
  color: var(--browsing-widget-fg);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
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

/* Chat widget: enter = slide up from bottom + fade; leave = fade only */
.chat-widget-appear-enter-active {
  transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}

.chat-widget-appear-leave-active {
  transition: opacity 0.25s ease;
}

.chat-widget-appear-enter-from {
  opacity: 0;
  transform: translateY(100%);
}

.chat-widget-appear-leave-to {
  opacity: 0;
}
</style>
