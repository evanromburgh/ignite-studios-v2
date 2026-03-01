import type { SearchFilters, ViewMode } from '~/types'

const DEFAULT_FILTERS: SearchFilters = {
  maxPrice: 'all',
  minPrice: 'all',
  bedrooms: 'all',
  bathrooms: 'all',
  status: 'all',
  searchQuery: '',
  orderBy: 'unitNumber',
  orderDir: 'asc',
  layout: 'any',
  floor: 'any',
  direction: 'any',
  parking: 'any',
  wishlistFilter: 'all',
}

const filters = ref<SearchFilters>({ ...DEFAULT_FILTERS })
const viewMode = ref<ViewMode>('GRID')

export function useUnitFilters() {
  const { user, authLoading } = useAuth()
  const prevUserId = ref<string | null | undefined>(undefined)

  function resetFilters() {
    filters.value = { ...DEFAULT_FILTERS }
    viewMode.value = 'GRID'
  }

  // Reset filters only when the user signs in or signs out (not on initial auth hydration)
  watch(
    [() => user.value?.id ?? null, () => authLoading.value],
    ([id, loading]) => {
      if (loading) return
      const currentId = id as string | null
      if (prevUserId.value === undefined) {
        prevUserId.value = currentId
        return
      }
      if (prevUserId.value !== currentId) {
        resetFilters()
      }
      prevUserId.value = currentId
    },
  )

  return {
    filters,
    viewMode,
    resetFilters,
  }
}
