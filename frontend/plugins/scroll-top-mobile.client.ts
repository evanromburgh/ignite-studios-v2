export default defineNuxtPlugin(() => {
  const isMobile = () => window.matchMedia('(max-width: 767px)').matches
  if (!isMobile()) return

  // On mobile: prevent browser from restoring scroll on refresh, and start at top
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual'
  }
  window.scrollTo(0, 0)
})
