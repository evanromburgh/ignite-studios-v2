import { computed, onMounted, ref } from 'vue'
import type { AgentContact } from '~/types/agent'
import {
  mapSupabaseAgentRow,
  type SupabaseAgentRow,
} from '~/utils/mapAgentContact'

const agents = ref<AgentContact[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
let hasInitialized = false

export function useAgentContacts() {
  const { $supabase } = useNuxtApp()

  const fetchAgents = async () => {
    loading.value = true
    error.value = null
    try {
      const { data, error: supaError } = await $supabase
        .from('agents')
        .select('id, name, title, phone, email, image_url, sort_order, created_at')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })

      if (supaError) {
        console.error('Failed to fetch agents:', supaError)
        error.value = supaError.message
        agents.value = []
        return
      }

      const rows = (data ?? []) as SupabaseAgentRow[]
      agents.value = rows
        .map(mapSupabaseAgentRow)
        .filter((row): row is AgentContact => row !== null)
    } finally {
      loading.value = false
    }
  }

  onMounted(async () => {
    if (hasInitialized) return
    hasInitialized = true
    await fetchAgents()
  })

  const isConfigured = computed(() => agents.value.length > 0)

  return { agents, isConfigured, loading, error, refreshAgents: fetchAgents }
}
