/**
 * Sticky filterbar: fixed at bottom of viewport until scroll reaches the point
 * where the bar is half over the hero and half over the content, then it
 * anchors in the document and scrolls with the page.
 */

import type { Ref } from 'vue'
import { reactive } from 'vue'

const BOTTOM_OFFSET_REM = 3.25
const BOTTOM_OFFSET_PX = 20 // ~1.25rem
const DEFAULT_BAR_HEIGHT = 220
const MOBILE_BREAKPOINT = 640

export function useStickyFilterbar(fixedBarRef: Ref<HTMLElement | null>) {
  const barHeight = ref(DEFAULT_BAR_HEIGHT)
  const scrollY = ref(0)
  const isMobile = ref(false)

  const barHeightPx = computed(() => `${barHeight.value}px`)

  const anchorScrollThreshold = computed(() => {
    // Mobile: anchor immediately so fixed bar never shows (we use Filters drawer instead)
    if (isMobile.value) return 0
    // SSR: use same value as client initial state so hydration matches (no window/scroll on server)
    if (import.meta.server || typeof window === 'undefined') {
      return BOTTOM_OFFSET_PX + DEFAULT_BAR_HEIGHT / 2
    }
    return BOTTOM_OFFSET_PX + barHeight.value / 2
  })

  const isAnchored = computed(() => scrollY.value >= anchorScrollThreshold.value)

  const anchorWrapperStyle = computed(() => ({
    marginTop: `${-barHeight.value / 2}px`,
  }))

  const fixedBarStyle = computed(() => ({
    position: 'fixed' as const,
    bottom: `${BOTTOM_OFFSET_REM}rem`,
    left: 0,
    right: 0,
  }))

  function updateMobile() {
    isMobile.value = typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT
  }

  function measureHeight() {
    if (isMobile.value) return
    const el = fixedBarRef.value
    if (!el) return
    const h = el.getBoundingClientRect().height
    if (h > 0) barHeight.value = h
  }

  function onScroll() {
    scrollY.value = typeof window !== 'undefined' ? window.scrollY : 0
    measureHeight()
  }

  function onResize() {
    updateMobile()
    measureHeight()
  }

  onMounted(() => {
    if (typeof window === 'undefined') return
    updateMobile()
    nextTick(() => {
      measureHeight()
      onScroll()
    })
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
  })

  onUnmounted(() => {
    if (typeof window === 'undefined') return
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onResize)
  })

  return reactive({
    isAnchored,
    anchorWrapperStyle,
    fixedBarStyle,
    barHeightPx,
  })
}
