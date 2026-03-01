import { ref, onMounted, onBeforeUnmount } from 'vue'
import type { AppUser } from '~/types'

function mapUserSync(supabaseUser: any): AppUser | null {
  if (!supabaseUser) return null
  const meta = supabaseUser.user_metadata ?? {}
  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? null,
    displayName: meta.display_name ?? null,
    role: 'user',
    firstName: meta.first_name ?? null,
    lastName: meta.last_name ?? null,
    phone: meta.phone ?? null,
  }
}

async function fetchRole(supabase: any, userId: string): Promise<AppUser['role']> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (error || !data) return 'user'
    return (data.role as AppUser['role']) ?? 'user'
  } catch {
    return 'user'
  }
}

const currentUser = ref<AppUser | null>(null)
const authLoading = ref(true)
/** Session from initial getSession(); set so list page can use it for Reserve without waiting. */
const sessionRef = ref<{ access_token: string } | null>(null)

export function useAuth() {
  const { $supabase } = useNuxtApp()
  let unsubscribe: (() => void) | null = null

  onMounted(() => {
    const resolveUser = async (supabaseUser: any) => {
      const user = mapUserSync(supabaseUser)
      if (!user) {
        currentUser.value = null
        return
      }
      currentUser.value = user
      const role = await fetchRole($supabase, user.id)
      if (role !== user.role) {
        currentUser.value = { ...user, role }
      }
    }

    $supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.access_token) sessionRef.value = { access_token: session.access_token }
      if (session?.access_token) {
        const { data: { user: serverUser }, error } = await $supabase.auth.getUser()
        if (error || !serverUser) {
          await $supabase.auth.signOut()
          currentUser.value = null
          authLoading.value = false
          return
        }
      }
      resolveUser(session?.user ?? null)
      authLoading.value = false
    }).catch((err) => {
      // e.g. NavigatorLockAcquireTimeoutError when auth lock is contended (e.g. after signup)
      console.warn('[useAuth] getSession failed:', err?.name ?? err)
      authLoading.value = false
    })

    const {
      data: { subscription },
    } = $supabase.auth.onAuthStateChange((_event: string, session: any) => {
      resolveUser(session?.user ?? null)
    })

    unsubscribe = () => subscription.unsubscribe()
  })

  onBeforeUnmount(() => {
    if (unsubscribe) unsubscribe()
  })

  const signUp = async (
    email: string,
    password: string,
    name: string,
    firstName?: string,
    lastName?: string,
    phone?: string,
  ) => {
    const { data, error } = await $supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: name,
          first_name: firstName ?? null,
          last_name: lastName ?? null,
          phone: phone ?? null,
        },
      },
    })

    if (error) throw error

    // Mirror phone update behaviour from React app
    if (data.user?.id && phone) {
      await $supabase
        .from('profiles')
        .update({ phone: phone.trim() })
        .eq('id', data.user.id)
    }

    // Fire-and-forget Zoho lead creation: use session from signUp response so token is valid
    if (data.user && data.session && firstName && lastName) {
      const config = useRuntimeConfig()
      const supabaseUrl = config.public.supabaseUrl as string
      const supabaseAnonKey = config.public.supabaseAnonKey as string
      const accessToken = data.session.access_token

      const createLead = async () => {
        try {
          if (!supabaseUrl || !accessToken) {
            console.warn('[create-lead] Missing supabaseUrl or access_token')
            return
          }
          if (!supabaseAnonKey) {
            console.warn('[create-lead] Missing supabaseAnonKey')
            return
          }

          const res = await $fetch<unknown>(`${supabaseUrl}/functions/v1/create-lead`, {
            method: 'POST',
            body: {
              firstName,
              lastName,
              email,
              phone: phone || '',
            },
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
              apikey: supabaseAnonKey,
            },
          })

          console.log('[create-lead] Zoho lead created:', res)
        } catch (e: any) {
          console.warn('[create-lead] Error:', e?.data || e?.message || e)
        }
      }
      createLead()
    }

    return data
  }

  const login = async (email: string, password: string) => {
    const { data, error } = await $supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  const logout = async () => {
    const { data: { session } } = await $supabase.auth.getSession()
    const unitId = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('ignite_reserve_unitId') : null
    if (session?.access_token && unitId) {
      await $fetch('/api/units/release-lock', {
        method: 'POST',
        body: { unitId },
        headers: { Authorization: `Bearer ${session.access_token}` },
      }).catch(() => {})
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('ignite_reserve_unitId')
      sessionStorage.removeItem('ignite_reserve_lockExpiresAt')
    }
    const { error } = await $supabase.auth.signOut()
    if (error) throw error
    currentUser.value = null
  }

  const resetPasswordForEmail = async (email: string) => {
    const { error } = await $supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/`,
    })
    if (error) throw error
  }

  const signInWithOtp = async (email: string) => {
    const { data, error } = await $supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
      },
    })
    if (error) throw error
    return data
  }

  const verifyOtp = async (email: string, token: string) => {
    const { data, error } = await $supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    })
    if (error) throw error
    return data
  }

  const checkEmailExists = async (email: string): Promise<boolean> => {
    const { exists } = await $fetch<{ exists: boolean }>('/api/auth/check-email', {
      method: 'POST',
      body: { email },
    })
    return exists
  }

  return {
    user: currentUser,
    authLoading,
    /** Session from initial load; use for Reserve Now so first click doesn't wait for getSession(). */
    sessionRef,
    signUp,
    login,
    logout,
    resetPasswordForEmail,
    signInWithOtp,
    verifyOtp,
    checkEmailExists,
  }
}

