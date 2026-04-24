// plugins/supabase.client.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { APP_SETTINGS_DATA_KEY } from '~/composables/useSalesMode'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  const supabaseUrl = config.public.supabaseUrl as string
  const supabaseAnonKey = config.public.supabaseAnonKey as string

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please set NUXT_PUBLIC_SUPABASE_URL and NUXT_PUBLIC_SUPABASE_ANON_KEY in .env',
    )
  }

  const supabase: SupabaseClient = createClient(
    supabaseUrl,
    supabaseAnonKey,
  )

  supabase
    .channel('app_settings_public')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'app_settings', filter: 'id=eq.1' },
      () => {
        void refreshNuxtData(APP_SETTINGS_DATA_KEY)
      },
    )
    .subscribe()

  return {
    provide: {
      supabase,
    },
  }
})