import { ViewMode, type SearchFilters } from '~/types'
import type { LocationQuery, LocationQueryValue } from 'vue-router'

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
const viewMode = ref<ViewMode>(ViewMode.GRID)

export function useUnitFilters() {
  const { user, authLoading } = useAuth()
  const route = useRoute()
  const router = useRouter()
  const prevUserId = ref<string | null | undefined>(undefined)
  let applyingFromRoute = false
  let applyingToRoute = false

  function queryValue(value: LocationQueryValue | LocationQueryValue[] | undefined): string | undefined {
    if (value == null) return undefined
    if (Array.isArray(value)) return value[0] ?? undefined
    return value
  }

  function parseQueryFilters(query: LocationQuery): { nextFilters: SearchFilters; nextViewMode: ViewMode } {
    const nextFilters: SearchFilters = { ...DEFAULT_FILTERS }
    const queryMap = {
      q: queryValue(query.q),
      orderBy: queryValue(query.orderBy),
      orderDir: queryValue(query.orderDir),
      status: queryValue(query.status),
      layout: queryValue(query.layout),
      floor: queryValue(query.floor),
      direction: queryValue(query.direction),
      parking: queryValue(query.parking),
      minPrice: queryValue(query.minPrice),
      maxPrice: queryValue(query.maxPrice),
      bedrooms: queryValue(query.bedrooms),
      bathrooms: queryValue(query.bathrooms),
      wishlist: queryValue(query.wishlist),
      view: queryValue(query.view),
    }

    if (queryMap.q) nextFilters.searchQuery = queryMap.q
    if (queryMap.status) nextFilters.status = queryMap.status
    if (queryMap.layout) nextFilters.layout = queryMap.layout
    if (queryMap.floor) nextFilters.floor = queryMap.floor
    if (queryMap.direction) nextFilters.direction = queryMap.direction
    if (queryMap.parking) nextFilters.parking = queryMap.parking
    if (queryMap.bedrooms) nextFilters.bedrooms = queryMap.bedrooms
    if (queryMap.bathrooms) nextFilters.bathrooms = queryMap.bathrooms
    if (queryMap.wishlist === 'yes' || queryMap.wishlist === 'all') nextFilters.wishlistFilter = queryMap.wishlist

    if (queryMap.orderBy === 'unitNumber' || queryMap.orderBy === 'price' || queryMap.orderBy === 'bedrooms') {
      nextFilters.orderBy = queryMap.orderBy
    }
    if (queryMap.orderDir === 'asc' || queryMap.orderDir === 'desc') {
      nextFilters.orderDir = queryMap.orderDir
    }

    const minPrice = Number(queryMap.minPrice)
    const maxPrice = Number(queryMap.maxPrice)
    if (Number.isFinite(minPrice) && minPrice > 0) nextFilters.minPrice = minPrice
    if (Number.isFinite(maxPrice) && maxPrice > 0) nextFilters.maxPrice = maxPrice

    const nextViewMode: ViewMode =
      queryMap.view === ViewMode.LIST || queryMap.view === ViewMode.PLANS ? queryMap.view : ViewMode.GRID

    return { nextFilters, nextViewMode }
  }

  function toFlatQuery(query: LocationQuery): Record<string, string> {
    const out: Record<string, string> = {}
    for (const [key, value] of Object.entries(query)) {
      const first = queryValue(value)
      if (first !== undefined) out[key] = first
    }
    return out
  }

  function buildFilterQuery(current: SearchFilters, currentViewMode: ViewMode): Record<string, string> {
    const q: Record<string, string> = {}
    const search = current.searchQuery?.trim()

    if (search) q.q = search
    if ((current.orderBy ?? DEFAULT_FILTERS.orderBy) !== DEFAULT_FILTERS.orderBy) q.orderBy = current.orderBy as string
    if ((current.orderDir ?? DEFAULT_FILTERS.orderDir) !== DEFAULT_FILTERS.orderDir) q.orderDir = current.orderDir as string
    if (current.status !== DEFAULT_FILTERS.status) q.status = current.status
    if ((current.layout ?? DEFAULT_FILTERS.layout) !== DEFAULT_FILTERS.layout) q.layout = current.layout as string
    if ((current.floor ?? DEFAULT_FILTERS.floor) !== DEFAULT_FILTERS.floor) q.floor = current.floor as string
    if ((current.direction ?? DEFAULT_FILTERS.direction) !== DEFAULT_FILTERS.direction) q.direction = current.direction as string
    if ((current.parking ?? DEFAULT_FILTERS.parking) !== DEFAULT_FILTERS.parking) q.parking = current.parking as string
    if (current.minPrice !== DEFAULT_FILTERS.minPrice) q.minPrice = String(current.minPrice)
    if (current.maxPrice !== DEFAULT_FILTERS.maxPrice) q.maxPrice = String(current.maxPrice)
    if (current.bedrooms !== DEFAULT_FILTERS.bedrooms) q.bedrooms = current.bedrooms
    if (current.bathrooms !== DEFAULT_FILTERS.bathrooms) q.bathrooms = current.bathrooms
    if ((current.wishlistFilter ?? DEFAULT_FILTERS.wishlistFilter) !== DEFAULT_FILTERS.wishlistFilter) q.wishlist = current.wishlistFilter as string
    if (currentViewMode !== ViewMode.GRID) q.view = currentViewMode

    return q
  }

  function syncFromRoute() {
    const { nextFilters, nextViewMode } = parseQueryFilters(route.query)
    filters.value = nextFilters
    viewMode.value = nextViewMode
  }

  function resetFilters() {
    filters.value = { ...DEFAULT_FILTERS }
    viewMode.value = ViewMode.GRID
  }

  watch(
    () => route.query,
    () => {
      if (applyingToRoute) return
      applyingFromRoute = true
      syncFromRoute()
      applyingFromRoute = false
    },
    { immediate: true },
  )

  watch(
    [filters, viewMode],
    async ([nextFilters, nextViewMode]) => {
      if (applyingFromRoute) return

      const filterKeys = new Set([
        'q', 'orderBy', 'orderDir', 'status', 'layout', 'floor', 'direction', 'parking',
        'minPrice', 'maxPrice', 'bedrooms', 'bathrooms', 'wishlist', 'view',
      ])
      const untouchedQuery: Record<string, string> = {}
      for (const [key, value] of Object.entries(toFlatQuery(route.query))) {
        if (!filterKeys.has(key)) untouchedQuery[key] = value
      }
      const targetQuery = { ...untouchedQuery, ...buildFilterQuery(nextFilters, nextViewMode) }
      const currentQuery = toFlatQuery(route.query)
      const sameLength = Object.keys(targetQuery).length === Object.keys(currentQuery).length
      const unchanged = sameLength && Object.entries(targetQuery).every(([k, v]) => currentQuery[k] === v)
      if (unchanged) return

      applyingToRoute = true
      try {
        await router.replace({ query: targetQuery })
      } finally {
        applyingToRoute = false
      }
    },
    { deep: true },
  )

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
