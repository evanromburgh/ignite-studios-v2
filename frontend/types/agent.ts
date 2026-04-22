/** Public contact row (env today, Supabase `agents` later). */
export interface AgentContact {
  id: string
  name: string
  /** Job title (e.g. Sales Specialist); shown under name in the picker and detail view. */
  title: string
  phone: string
  email: string
  imageUrl?: string
}
