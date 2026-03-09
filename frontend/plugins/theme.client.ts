export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const theme = config.public.theme as Record<string, string> | undefined
  if (!theme || typeof theme !== 'object') return
  const root = document.documentElement
  for (const [key, value] of Object.entries(theme)) {
    if (key.startsWith('--') && typeof value === 'string') {
      root.style.setProperty(key, value)
    }
  }
})
