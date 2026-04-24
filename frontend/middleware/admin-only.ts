export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.server) return

  const { user, authLoading } = useAuth()

  // Wait briefly for auth bootstrap so we can make a role decision.
  if (authLoading.value) {
    await new Promise<void>((resolve) => {
      const startedAt = Date.now()
      const id = setInterval(() => {
        if (!authLoading.value || Date.now() - startedAt > 3000) {
          clearInterval(id)
          resolve()
        }
      }, 50)
    })
  }

  if (!user.value || user.value.role !== 'admin') {
    return navigateTo('/')
  }
})
