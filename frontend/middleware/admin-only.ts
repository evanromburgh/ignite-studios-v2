export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.server) return

  const { user, authLoading } = useAuth()
  const { $supabase } = useNuxtApp()

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

  if (user.value?.role === 'admin') return

  // Fallback for hard-refresh timing: verify current session directly before redirecting.
  try {
    const { data: { session } } = await $supabase.auth.getSession()
    if (session?.user?.id) {
      const { data: profile } = await $supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (profile?.role === 'admin') return
    }
  } catch {
    // Ignore and continue to redirect below.
  }

  return navigateTo('/')
})
