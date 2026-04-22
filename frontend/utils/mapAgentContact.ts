import type { AgentContact } from '~/types/agent'

export type SupabaseAgentRow = {
  id: string
  name: string | null
  title: string | null
  phone: string | null
  email: string | null
  image_url: string | null
}

export function mapSupabaseAgentRow(row: SupabaseAgentRow): AgentContact | null {
  const name = row.name?.trim()
  const phone = row.phone?.trim()
  const email = row.email?.trim()
  if (!name || !phone || !email) return null

  const title = row.title?.trim() || 'Sales Specialist'
  const imageUrl = row.image_url?.trim()

  return {
    id: row.id,
    name,
    title,
    phone,
    email,
    ...(imageUrl ? { imageUrl } : {}),
  }
}
