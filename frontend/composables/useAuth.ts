import { ref, onMounted } from 'vue'
import type { SupabaseClient, User as SupabaseAuthUser } from '@supabase/supabase-js'
import type { AppUser } from '~/types'

function mapUserSync(supabaseUser: SupabaseAuthUser | null): AppUser | null {
  if (!supabaseUser) return null
  const meta = (supabaseUser.user_metadata ?? {}) as Record<string, unknown>
  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? null,
    displayName: (meta.display_name as string | undefined) ?? null,
    role: 'user',
    firstName: (meta.first_name as string | undefined) ?? null,
    lastName: (meta.last_name as string | undefined) ?? null,
    phone: (meta.phone as string | undefined) ?? null,
    idPassportNumber: null,
    reasonForBuying: null,
  }
}

async function fetchProfileExtras(
  supabase: SupabaseClient,
  userId: string,
): Promise<{
  role: AppUser['role']
  idPassportNumber?: string | null
  reasonForBuying?: string | null
  firstName?: string | null
  lastName?: string | null
}> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role, id_passport_number, reason_for_buying, first_name, last_name')
      .eq('id', userId)
      .single()

    if (error || !data) {
      return { role: 'user', idPassportNumber: null, reasonForBuying: null }
    }
    return {
      role: (data.role as AppUser['role']) ?? 'user',
      idPassportNumber: (data.id_passport_number as string | null) ?? null,
      reasonForBuying: (data.reason_for_buying as string | null) ?? null,
      firstName: (data.first_name as string | null) ?? null,
      lastName: (data.last_name as string | null) ?? null,
    }
  } catch {
    return { role: 'user', idPassportNumber: null, reasonForBuying: null }
  }
}

const currentUser = ref<AppUser | null>(null)
const authLoading = ref(true)
/** Session from initial getSession(); set so list page can use it for Reserve without waiting. */
const sessionRef = ref<{ access_token: string } | null>(null)

let authSubscriptionDone = false
/** Run initial getSession/getUser only once so we don't fire N "user" requests per page (every useAuth() caller was triggering onMounted). */
let initialAuthFetchDone = false

export function useAuth() {
  const { $supabase } = useNuxtApp()

  onMounted(() => {
    const resolveUser = async (supabaseUser: SupabaseAuthUser | null) => {
      const user = mapUserSync(supabaseUser)
      if (!user) {
        currentUser.value = null
        return
      }
      // Set identity immediately so authLoading can end without waiting on profiles (faster first paint).
      currentUser.value = {
        ...user,
        role: 'user',
        idPassportNumber: null,
        reasonForBuying: null,
      }
      void fetchProfileExtras($supabase, user.id).then((profile) => {
        if (!currentUser.value || currentUser.value.id !== user.id) return
        currentUser.value = {
          ...currentUser.value,
          role: profile.role,
          idPassportNumber: profile.idPassportNumber ?? null,
          reasonForBuying: profile.reasonForBuying ?? null,
          firstName:
            profile.firstName?.trim() ||
            currentUser.value.firstName ||
            null,
          lastName:
            profile.lastName?.trim() ||
            currentUser.value.lastName ||
            null,
        }
      })
    }

    // Child components mount before their parent; the first useAuth() starts getSession().
    // Later callers must not set authLoading to false — that would flash the login UI before
    // the initial session resolves.
    if (initialAuthFetchDone) {
      return
    }
    initialAuthFetchDone = true

    $supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.access_token) {
        sessionRef.value = { access_token: session.access_token }
        const { data: { user: serverUser }, error } = await $supabase.auth.getUser()
        if (error || !serverUser) {
          // Session is invalid or user fetch failed – treat as fully logged out
          await $supabase.auth.signOut()
          currentUser.value = null
          authLoading.value = false
          return
        }
        await resolveUser(serverUser)
      } else {
        // No session at all
        await resolveUser(null)
      }
      authLoading.value = false
    }).catch((err) => {
      // e.g. NavigatorLockAcquireTimeoutError when auth lock is contended (e.g. after signup)
      console.warn('[useAuth] getSession failed:', err?.name ?? err)
      authLoading.value = false
    })

    // Subscribe to auth state change only once globally so we don't fire N profile fetches per event
    if (!authSubscriptionDone) {
      authSubscriptionDone = true
      $supabase.auth.onAuthStateChange((_event, session) => {
        sessionRef.value = session?.access_token ? { access_token: session.access_token } : null
        resolveUser(session?.user ?? null)
      })
    }
  })

  const signUp = async (
    email: string,
    password: string,
    name: string,
    firstName?: string,
    lastName?: string,
    phone?: string,
    idPassport?: string,
    reasonForBuying?: string,
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

    // Server-side post-signup bootstrap keeps profile + Zoho lead in sync
    // even when signUp returns no session (e.g. email confirmation flows).
    if (data.user?.id && firstName && lastName) {
      await $fetch('/api/auth/post-signup', {
        method: 'POST',
        body: {
          userId: data.user.id,
          email,
          firstName,
          lastName,
          phone: phone || '',
          idPassport,
          reasonForBuying,
        },
      }).catch((err: unknown) => {
        console.warn('[post-signup] bootstrap failed:', err)
      })
    }

    return data
  }

  const login = async (email: string, password: string) => {
    const { data, error } = await $supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    if (data.session?.access_token) {
      sessionRef.value = { access_token: data.session.access_token }
    }
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
    if (data.session?.access_token) {
      sessionRef.value = { access_token: data.session.access_token }
    }
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

