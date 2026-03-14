import { ref, onMounted } from 'vue'
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
    idPassportNumber: null,
    reasonForBuying: null,
  }
}

async function fetchRole(supabase: any, userId: string): Promise<{ role: AppUser['role']; idPassportNumber?: string | null; reasonForBuying?: string | null }> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role, id_passport_number, reason_for_buying')
      .eq('id', userId)
      .single()

    if (error || !data) {
      return { role: 'user', idPassportNumber: null, reasonForBuying: null }
    }
    return {
      role: (data.role as AppUser['role']) ?? 'user',
      idPassportNumber: (data.id_passport_number as string | null) ?? null,
      reasonForBuying: (data.reason_for_buying as string | null) ?? null,
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
    const resolveUser = async (supabaseUser: any) => {
      const user = mapUserSync(supabaseUser)
      if (!user) {
        currentUser.value = null
        return
      }
      const profile = await fetchRole($supabase, user.id)
      currentUser.value = {
        ...user,
        role: profile.role,
        idPassportNumber: profile.idPassportNumber ?? null,
        reasonForBuying: profile.reasonForBuying ?? null,
      }
    }

    if (initialAuthFetchDone) {
      authLoading.value = false
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
      $supabase.auth.onAuthStateChange((_event: string, session: any) => {
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

    // Mirror phone update behaviour from React app and also store ID/Passport + Reason for Buying in profiles
    if (data.user?.id) {
      const updates: Record<string, string> = {}
      if (phone) updates.phone = phone.trim()
      if (idPassport) updates.id_passport_number = idPassport.trim()
      if (reasonForBuying) updates.reason_for_buying = reasonForBuying.trim()
      if (Object.keys(updates).length > 0) {
        await $supabase
          .from('profiles')
          .update(updates)
          .eq('id', data.user.id)
      }
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
              idPassport,
              reasonForBuying,
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

