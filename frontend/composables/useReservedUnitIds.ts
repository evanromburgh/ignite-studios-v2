/**
 * Fetches the current user's reserved_unit_ids from profiles (updated by payment-webhook).
 * Used by My Units page and nav badge count.
 */
const reservedUnitIds = ref<string[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
let lastUserId: string | null = null

export function useReservedUnitIds() {
  const { user } = useAuth()
  const { $supabase } = useNuxtApp()

  async function fetchReservedUnitIds(force = false) {
    const uid = user.value?.id
    if (!uid) {
      reservedUnitIds.value = []
      lastUserId = null
      return
    }
    if (!force && lastUserId === uid && !error.value) {
      return
    }
    loading.value = true
    error.value = null
    try {
      const { data, error: e } = await $supabase
        .from('profiles')
        .select('reserved_unit_ids')
        .eq('id', uid)
        .single()

      if (e) {
        error.value = e.message
        reservedUnitIds.value = []
        return
      }
      const ids = (data?.reserved_unit_ids as string[] | null) ?? []
      reservedUnitIds.value = Array.isArray(ids) ? ids : []
      lastUserId = uid
    } finally {
      loading.value = false
    }
  }

  watch(
    () => user.value?.id,
    (id) => {
      if (!id) {
        reservedUnitIds.value = []
        lastUserId = null
        return
      }
      fetchReservedUnitIds()
    },
    { immediate: true },
  )

  onMounted(() => {
    if (user.value?.id) fetchReservedUnitIds()
  })

  return {
    reservedUnitIds,
    loading,
    error,
    refetch: () => fetchReservedUnitIds(true),
  }
}
