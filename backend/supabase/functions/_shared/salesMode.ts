// Deno/Edge — mirror of server prelaunch check (app_settings id=1).

type SalesRow = { sales_mode: string; sales_opens_at: string | null }

export function isPrelaunchFromRow(row: SalesRow | null): boolean {
  if (!row) return false
  return String(row.sales_mode).trim() === 'prelaunch'
}

export async function getAppSettingsForSales(supabase: any): Promise<SalesRow | null> {
  const { data, error } = await supabase
    .from('app_settings')
    .select('sales_mode, sales_opens_at')
    .eq('id', 1)
    .maybeSingle()

  if (error) {
    console.error('[salesMode] app_settings read failed', error)
    return null
  }
  return (data as SalesRow) ?? null
}

export const SALES_PRELAUNCH_JSON = {
  error: 'SALES_PRELAUNCH',
  message: 'Reservations are not open yet.',
} as const
