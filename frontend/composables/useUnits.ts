import { ref, onMounted } from 'vue'
import type { Unit } from '~/types'
import { mapSupabaseUnitRow, type SupabaseUnitRow } from '~/utils/mapUnitRow'
import { getUnitsBucketPublicUrl } from '~/utils/unitsStorage'

const units = ref<Unit[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
let hasInitialized = false
let channel: { unsubscribe: () => void } | null = null

export function useUnits() {
  const { $supabase } = useNuxtApp()

  function getPublicUrl(path: string | null | undefined): string | null {
    return getUnitsBucketPublicUrl($supabase, path)
  }

  const mapRow = (row: unknown): Unit =>
    mapSupabaseUnitRow(row as SupabaseUnitRow, getPublicUrl)

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
          const newRow = payload.new as SupabaseUnitRow | undefined
          const oldRow = payload.old as Pick<SupabaseUnitRow, 'id'> | undefined

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

  return {
    units,
    loading,
    error,
  }
}

