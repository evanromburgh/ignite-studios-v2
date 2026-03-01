import { ref, onMounted, onBeforeUnmount } from 'vue'
import type { Unit } from '~/types'
import { CONFIG } from '~/config'

const units = ref<Unit[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
let hasInitialized = false
let channel: { unsubscribe: () => void } | null = null

export function useUnits() {
  const { $supabase } = useNuxtApp()

  const mapRow = (row: any): Unit => {
    const rawViewers = (row.viewers as Record<string, number | string> | null | undefined) ?? {}
    const now = Date.now()
    const ttl = CONFIG.PRESENCE_TTL_MS
    const viewers: Record<string, number> = {}
    for (const [key, value] of Object.entries(rawViewers)) {
      const t = typeof value === 'number' ? value : Number(value)
      if (!Number.isNaN(t) && now - t <= ttl) {
        viewers[key] = t
      }
    }
    let lockExpiresAt: number | undefined
    if (row.lock_expires_at != null) {
      const raw = row.lock_expires_at
      const ms = raw instanceof Date ? raw.getTime() : new Date(raw).getTime()
      if (!Number.isNaN(ms)) lockExpiresAt = ms
    }

    return {
      id: row.id as string,
      unitNumber: row.unit_number as string,
      bedrooms: row.bedrooms as number,
      bathrooms: row.bathrooms as number,
      parking: row.parking as number,
      sizeSqm: row.size_sqm as number,
      price: row.price as number,
      status: row.status as Unit['status'],
      unitType: row.unit_type as string,
      floor: (row.floor as string | null) ?? null,
      direction: (row.direction as string | null) ?? null,
      imageUrl: row.image_url as string,
      imageUrl2: (row.image_url_2 as string | null) ?? null,
      imageUrl3: (row.image_url_3 as string | null) ?? null,
      floorplanUrl: (row.floorplan_url as string | null) ?? null,
      viewers,
      lockExpiresAt,
      lockedBy: row.locked_by as string | undefined,
    }
  }

  const fetchInitial = async () => {
    loading.value = true
    error.value = null
    try {
      const { data, error: supaError } = await $supabase
        .from('units')
        .select('*')
        .order('unit_number', { ascending: true })

      if (supaError) {
        console.error('Failed to fetch units:', supaError)
        error.value = supaError.message
        return
      }
      if (!data) return
      units.value = data.map(mapRow)
    } finally {
      loading.value = false
    }
  }

  onMounted(async () => {
    if (hasInitialized) return
    hasInitialized = true

    await fetchInitial()

    channel = $supabase
      .channel('units-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'units' },
        (payload) => {
          const newRow = payload.new as any | undefined
          const oldRow = payload.old as any | undefined

          if (payload.eventType === 'INSERT' && newRow) {
            units.value = [...units.value, mapRow(newRow)]
          } else if (payload.eventType === 'UPDATE' && newRow) {
            units.value = units.value.map((u) =>
              u.id === newRow.id ? mapRow(newRow) : u,
            )
          } else if (payload.eventType === 'DELETE' && oldRow) {
            units.value = units.value.filter((u) => u.id !== oldRow.id)
          }

          units.value.sort((a, b) => a.unitNumber.localeCompare(b.unitNumber))
        },
      )
      .subscribe()
  })

  onBeforeUnmount(() => {
    // Keep channel alive for shared state; only one subscription for app lifetime
  })

  return {
    units,
    loading,
    error,
  }
}

