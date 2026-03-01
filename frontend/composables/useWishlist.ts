import { ref, computed, watch, onMounted } from 'vue'

// Shared state so layout, index, and wishlist page stay in sync
const wishlistIds = ref<string[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

export function useWishlist() {
  const { $supabase } = useNuxtApp()
  const { user } = useAuth()

  const wishlistCount = computed(() => wishlistIds.value.length)

  async function fetchWishlist() {
    if (!user.value?.id) {
      wishlistIds.value = []
      return
    }
    loading.value = true
    error.value = null
    try {
      const { data, error: e } = await $supabase
        .from('wishlists')
        .select('unit_id')
        .eq('user_id', user.value.id)

      if (e) {
        error.value = e.message
        wishlistIds.value = []
        return
      }
      wishlistIds.value = (data ?? []).map((row: { unit_id: string }) => row.unit_id)
    } finally {
      loading.value = false
    }
  }

  async function add(unitId: string) {
    if (!user.value?.id) return
    error.value = null
    const { error: e } = await $supabase
      .from('wishlists')
      .insert({ user_id: user.value.id, unit_id: unitId })

    if (e) {
      error.value = e.message
      return
    }
    if (!wishlistIds.value.includes(unitId)) {
      wishlistIds.value = [...wishlistIds.value, unitId]
    }
  }

  async function remove(unitId: string) {
    if (!user.value?.id) return
    error.value = null
    const { error: e } = await $supabase
      .from('wishlists')
      .delete()
      .eq('user_id', user.value.id)
      .eq('unit_id', unitId)

    if (e) {
      error.value = e.message
      return
    }
    wishlistIds.value = wishlistIds.value.filter((id) => id !== unitId)
  }

  async function toggle(unitId: string) {
    if (!user.value?.id) return
    const isIn = wishlistIds.value.includes(unitId)
    if (isIn) await remove(unitId)
    else await add(unitId)
  }

  function isWishlisted(unitId: string): boolean {
    return wishlistIds.value.includes(unitId)
  }

  watch(
    () => user.value?.id,
    (userId) => {
      if (userId) fetchWishlist()
      else wishlistIds.value = []
    },
    { immediate: true },
  )

  onMounted(() => {
    if (user.value?.id) fetchWishlist()
  })

  return {
    wishlistIds,
    wishlistCount,
    loading,
    error,
    add,
    remove,
    toggle,
    isWishlisted,
    refresh: fetchWishlist,
  }
}
