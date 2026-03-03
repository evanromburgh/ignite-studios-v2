<template>
  <div class="min-h-screen bg-black text-zinc-100 relative">
    <div class="min-h-screen flex flex-col">
        <!-- Mobile menu backdrop -->
        <div
          role="presentation"
          aria-hidden="!showMobileMenu"
          class="lg:hidden fixed inset-0 z-[140] backdrop-blur-[5px] transition-opacity duration-300"
          :class="showMobileMenu ? 'opacity-100' : 'opacity-0 pointer-events-none'"
          @click="showMobileMenu = false"
        />

        <nav
      class="fixed top-0 left-0 right-0 z-[150] flex flex-col transition-all duration-300"
      :class="scrolled ? 'bg-black/80 backdrop-blur-2xl border-b border-white/5' : 'bg-transparent border-b border-transparent'"
    >
      <div class="pl-5 pr-5 sm:pl-8 sm:pr-8 md:px-24 h-16 sm:h-24 flex items-center justify-between flex-shrink-0">
        <NuxtLink
          to="/"
          class="cursor-pointer group flex items-center shrink-0"
        >
          <span class="text-2xl sm:text-3xl font-black tracking-tighter text-white group-hover:text-zinc-400 transition-colors leading-none">IGNITE</span>
          <span class="h-5 sm:h-5 w-px bg-zinc-800 mx-2 sm:mx-4" />
          <span class="text-[9px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] sm:tracking-[0.5em] leading-none">STUDIOS</span>
        </NuxtLink>

        <div class="flex items-center gap-3 sm:gap-4">
          <!-- Desktop: main links always visible; profile only when logged in -->
          <div class="hidden lg:flex items-center space-x-10 mr-6">
            <NuxtLink
              to="/"
              class="h-[46px] px-2 text-[10px] font-black uppercase tracking-[0.3em] transition-colors flex items-center"
              :class="isPropertiesPage ? 'text-white' : 'text-zinc-500 hover:text-white'"
            >
              Properties
            </NuxtLink>
            <NuxtLink
              to="/documents"
              class="h-[46px] px-2 text-[10px] font-black uppercase tracking-[0.3em] transition-colors flex items-center"
              :class="isDocumentsPage ? 'text-white' : 'text-zinc-500 hover:text-white'"
            >
              Documents
            </NuxtLink>
            <NuxtLink
              to="/contact"
              class="h-[46px] px-2 text-[10px] font-black uppercase tracking-[0.3em] transition-colors flex items-center"
              :class="isContactPage ? 'text-white' : 'text-zinc-500 hover:text-white'"
            >
              Contact
            </NuxtLink>
          </div>

          <template v-if="user">
            <div ref="userMenuRef" class="relative">
              <button
                type="button"
                title="Profile Settings"
                class="w-9 h-9 sm:w-[46px] sm:h-[46px] flex items-center justify-center rounded-full transition-all group overflow-hidden relative border pointer-events-none lg:pointer-events-auto cursor-default lg:cursor-pointer"
                :class="showUserMenu ? 'bg-white text-black border-white' : 'bg-white/5 border-white/10 text-zinc-400 lg:hover:text-white lg:hover:border-white/20'"
                @click="showUserMenu = !showUserMenu"
              >
                <span class="relative z-10 text-[9px] sm:text-[10px] font-black">{{ userInitials }}</span>
                <div
                  v-if="!showUserMenu"
                  class="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </button>

              <div
                v-if="showUserMenu"
                class="hidden lg:block absolute top-full right-0 mt-3 sm:mt-[1.3rem] w-56 sm:w-64 bg-black/95 backdrop-blur-2xl rounded-xl p-2 border border-white/10 shadow-[0_40px_80px_rgba(0,0,0,0.9)] z-[200]"
              >
                <NuxtLink
                  to="/reservations"
                  class="w-full flex items-center px-4 h-12 rounded-lg text-zinc-400 hover:bg-white hover:text-black transition-all group mb-1"
                  @click="showUserMenu = false"
                >
                  <span class="text-[10px] font-black uppercase tracking-widest">My Reservations</span>
                  <span
                    v-if="reservationsCount > 0"
                    class="ml-auto bg-emerald-500 text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-lg"
                  >
                    {{ reservationsCount }}
                  </span>
                </NuxtLink>
                <div class="h-px bg-white/5 mx-2 my-1" />
                <NuxtLink
                  to="/wishlist"
                  class="w-full flex items-center px-4 h-12 rounded-lg text-zinc-400 hover:bg-white hover:text-black transition-all group mb-1"
                  @click="showUserMenu = false"
                >
                  <span class="text-[10px] font-black uppercase tracking-widest">Wishlist</span>
                  <span
                    v-if="wishlistCount > 0"
                    class="ml-auto bg-red-500 text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-lg"
                  >
                    {{ wishlistCount }}
                  </span>
                </NuxtLink>
                <div class="h-px bg-white/5 mx-2 my-1" />
                <button
                  type="button"
                  class="w-full flex items-center px-4 h-12 rounded-lg text-zinc-400 hover:bg-white hover:text-black transition-all group"
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
                class="absolute block w-5 h-0.5 bg-white transition-all duration-300 ease-in-out"
                :class="showMobileMenu ? 'rotate-45 top-[9px]' : 'top-[3px]'"
              />
              <span
                class="absolute block w-5 h-0.5 bg-white transition-all duration-300 ease-in-out top-[9px]"
                :class="showMobileMenu ? 'opacity-0 scale-0' : 'opacity-100 scale-100'"
              />
              <span
                class="absolute block w-5 h-0.5 bg-white transition-all duration-300 ease-in-out"
                :class="showMobileMenu ? '-rotate-45 top-[9px]' : 'top-[15px]'"
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
            <NuxtLink to="/" class="w-full max-w-xs mx-auto h-12 flex items-center text-[10px] font-black uppercase tracking-widest" :class="isPropertiesPage ? 'text-white' : 'text-zinc-400'" @click="showMobileMenu = false">
              Properties
            </NuxtLink>
          </div>
          <div class="w-full h-px bg-zinc-800 my-1" />
          <div class="w-full flex">
            <NuxtLink to="/documents" class="w-full max-w-xs mx-auto h-12 flex items-center text-[10px] font-black uppercase tracking-widest" :class="isDocumentsPage ? 'text-white' : 'text-zinc-400'" @click="showMobileMenu = false">
              Documents
            </NuxtLink>
          </div>
          <div class="w-full h-px bg-zinc-800 my-1" />
          <div class="w-full flex">
            <NuxtLink to="/contact" class="w-full max-w-xs mx-auto h-12 flex items-center text-[10px] font-black uppercase tracking-widest" :class="isContactPage ? 'text-white' : 'text-zinc-400'" @click="showMobileMenu = false">
              Contact
            </NuxtLink>
          </div>
          <template v-if="user">
            <div class="w-full h-px bg-zinc-800 my-1" />
            <div class="w-full flex">
              <NuxtLink to="/reservations" class="w-full max-w-xs mx-auto h-12 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest" :class="isReservationsPage ? 'text-white' : 'text-zinc-400'" @click="showMobileMenu = false">
                My Reservations
                <span class="inline-grid place-items-center w-5 h-5 min-w-5 min-h-5 rounded-full ml-auto text-[9px] font-black tabular-nums" :class="reservationsCount > 0 ? 'bg-emerald-500 text-white' : 'bg-white/10 text-zinc-500'">{{ reservationsCount }}</span>
              </NuxtLink>
            </div>
            <div class="w-full h-px bg-zinc-800 my-1" />
            <div class="w-full flex">
              <NuxtLink to="/wishlist" class="w-full max-w-xs mx-auto h-12 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest" :class="isWishlistPage ? 'text-white' : 'text-zinc-400'" @click="showMobileMenu = false">
                Wishlist
                <span class="inline-grid place-items-center w-5 h-5 min-w-5 min-h-5 rounded-full ml-auto text-[9px] font-black tabular-nums" :class="wishlistCount > 0 ? 'bg-red-500 text-white' : 'bg-white/10 text-zinc-500'">{{ wishlistCount }}</span>
              </NuxtLink>
            </div>
            <div class="w-full h-px bg-zinc-800 my-1" />
            <div class="w-full flex">
              <button type="button" class="w-full max-w-xs mx-auto h-12 flex items-center justify-between text-[10px] font-black uppercase tracking-widest" :class="isLoggingOut ? 'text-zinc-400' : 'text-red-500'" @click="handleLogoutMobile">
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

    <footer class="px-5 sm:px-8 md:px-24 lg:px-40 xl:px-56 mt-16 sm:mt-24 pt-12 sm:pt-20 border-t border-white/5 flex flex-col lg:flex-row justify-between items-center text-zinc-700 text-[10px] font-black uppercase tracking-[0.3em] sm:tracking-[0.5em] gap-8 sm:gap-12 pb-12 sm:pb-20">
      <p>&copy; {{ new Date().getFullYear() }} Ignite Studios</p>
    </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import IconEyeLottie from '~/components/icons/IconEyeLottie.client.vue'

const route = useRoute()
const { user, logout } = useAuth()
const { wishlistCount } = useWishlistCount()
const { reservationsCount } = useReservationsCount()
const { onlineCount } = useGlobalPresence()

const showUserMenu = ref(false)
const showMobileMenu = ref(false)
const userMenuRef = ref<HTMLElement | null>(null)
const isLoggingOut = ref(false)
const scrolled = ref(false)

function updateScrolled() {
  scrolled.value = window.scrollY > 20
}

const userInitials = computed(() => {
  if (!user.value) return '?'
  if (user.value.displayName) {
    return user.value.displayName.split(' ').map(n => n[0]).join('').toUpperCase()
  }
  return user.value.email ? user.value.email[0].toUpperCase() : '?'
})

const isPropertiesPage = computed(() => route.path === '/' || route.path === '')
const isDocumentsPage = computed(() => route.path === '/documents')
const isContactPage = computed(() => route.path === '/contact')
const isReservationsPage = computed(() => route.path === '/reservations')
const isWishlistPage = computed(() => route.path === '/wishlist')

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
  window.addEventListener('scroll', updateScrolled, { passive: true })
  updateScrolled()
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onClickOutside)
  window.removeEventListener('resize', onResize)
  window.removeEventListener('scroll', updateScrolled)
  document.body.style.overflow = ''
})

function onResize() {
  if (window.innerWidth >= 1024) showMobileMenu.value = false
}

watch(showMobileMenu, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})
</script>

<style scoped>
/* Nuxt DevTools bar styling */
.browsing-anchor {
  --browsing-widget-bg: #111;
  --browsing-widget-fg: #f5f5f5;
  --browsing-widget-border: rgba(51, 51, 51, 0.4);
  --browsing-widget-shadow: rgba(0, 0, 0, 0.3);
  position: fixed;
  left: 20px;
  bottom: 20px;
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
