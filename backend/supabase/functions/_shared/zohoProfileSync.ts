import { resolveZohoProfileRouting } from './zohoProfileRouting.ts'

type ProfileRow = {
  id: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  id_passport_number: string | null
  reason_for_buying: string | null
  zoho_lead_id: string | null
  zoho_contact_id: string | null
}

export type ZohoProfileSyncResult = {
  zohoLeadId: string | null
  zohoContactId: string | null
  syncedModule: 'Contacts' | 'Leads'
}

const jsonHeaders = (token: string) => ({
  Authorization: `Zoho-oauthtoken ${token}`,
  'Content-Type': 'application/json',
})

function normalizePhone(input: string): string {
  const digits = String(input ?? '').replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('27')) return `+${digits}`
  if (digits.startsWith('0')) return `+27${digits.slice(1)}`
  return `+27${digits}`
}

async function getZohoAccessToken() {
  const zohoClientId = (Deno.env.get('ZOHO_CLIENT_ID') ?? '').trim()
  const zohoClientSecret = (Deno.env.get('ZOHO_CLIENT_SECRET') ?? '').trim()
  const zohoRefreshToken = (Deno.env.get('ZOHO_REFRESH_TOKEN') ?? '').trim()
  const zohoApiDomain = (Deno.env.get('ZOHO_API_DOMAIN') ?? 'com').trim() || 'com'

  if (!zohoClientId || !zohoClientSecret || !zohoRefreshToken) {
    throw new Error('Zoho credentials are not configured')
  }

  const tokenResponse = await fetch(`https://accounts.zoho.${zohoApiDomain}/oauth/v2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: zohoRefreshToken,
      client_id: zohoClientId,
      client_secret: zohoClientSecret,
      grant_type: 'refresh_token',
    }),
  })

  if (!tokenResponse.ok) {
    throw new Error(`Zoho token request failed (${tokenResponse.status}): ${await tokenResponse.text()}`)
  }

  const tokenData = await tokenResponse.json()
  const accessToken = String(tokenData?.access_token ?? '').trim()
  if (!accessToken) {
    throw new Error('Zoho token response missing access_token')
  }

  return {
    accessToken,
    baseUrl: `https://www.zohoapis.${zohoApiDomain}/crm/v2`,
  }
}

async function searchSingleByEmail(baseUrl: string, accessToken: string, moduleName: 'Leads' | 'Contacts', email: string) {
  const url = `${baseUrl}/${moduleName}/search?criteria=(Email:equals:${encodeURIComponent(email)})`
  const response = await fetch(url, { headers: jsonHeaders(accessToken) })
  if (!response.ok) return null

  const data = await response.json().catch(() => ({}))
  const first = data?.data?.[0]
  return first ? String(first.id ?? '').trim() || null : null
}

function toContactPayload(profile: ProfileRow, email: string) {
  const payload: Record<string, unknown> = {
    First_Name: String(profile.first_name ?? '').trim(),
    Last_Name: String(profile.last_name ?? '').trim(),
    Email: email,
    ID_Passport_Number: String(profile.id_passport_number ?? '').trim(),
    Reason_for_Buying: String(profile.reason_for_buying ?? '').trim(),
  }

  const normalizedPhone = normalizePhone(String(profile.phone ?? '').trim())
  if (normalizedPhone) payload.Phone = normalizedPhone

  return payload
}

function toLeadPayload(profile: ProfileRow, email: string) {
  const payload: Record<string, unknown> = {
    First_Name: String(profile.first_name ?? '').trim(),
    Last_Name: String(profile.last_name ?? '').trim(),
    Email: email,
    Lead_Status: 'New Lead',
    Lead_Source: 'Reservation Portal',
    ID_Passport_Number: String(profile.id_passport_number ?? '').trim(),
    Reason_for_Buying: String(profile.reason_for_buying ?? '').trim(),
  }

  const normalizedPhone = normalizePhone(String(profile.phone ?? '').trim())
  if (normalizedPhone) payload.Phone = normalizedPhone

  return payload
}

async function upsertContact(baseUrl: string, accessToken: string, contactId: string | null, payload: Record<string, unknown>) {
  if (contactId) {
    const response = await fetch(`${baseUrl}/Contacts/${contactId}`, {
      method: 'PUT',
      headers: jsonHeaders(accessToken),
      body: JSON.stringify({ data: [payload] }),
    })
    if (!response.ok) {
      throw new Error(`Zoho contact update failed (${response.status}): ${await response.text()}`)
    }
    return contactId
  }

  const createResponse = await fetch(`${baseUrl}/Contacts`, {
    method: 'POST',
    headers: jsonHeaders(accessToken),
    body: JSON.stringify({ data: [payload] }),
  })
  if (!createResponse.ok) {
    throw new Error(`Zoho contact create failed (${createResponse.status}): ${await createResponse.text()}`)
  }

  const createData = await createResponse.json().catch(() => ({}))
  const createdId = String(createData?.data?.[0]?.details?.id ?? createData?.data?.[0]?.id ?? '').trim()
  if (!createdId) {
    throw new Error('Zoho contact create response missing contact id')
  }
  return createdId
}

async function upsertLead(baseUrl: string, accessToken: string, leadId: string | null, payload: Record<string, unknown>) {
  if (leadId) {
    const response = await fetch(`${baseUrl}/Leads/${leadId}`, {
      method: 'PUT',
      headers: jsonHeaders(accessToken),
      body: JSON.stringify({ data: [payload] }),
    })
    if (!response.ok) {
      throw new Error(`Zoho lead update failed (${response.status}): ${await response.text()}`)
    }
    return leadId
  }

  const createResponse = await fetch(`${baseUrl}/Leads`, {
    method: 'POST',
    headers: jsonHeaders(accessToken),
    body: JSON.stringify({ data: [payload] }),
  })
  if (!createResponse.ok) {
    throw new Error(`Zoho lead create failed (${createResponse.status}): ${await createResponse.text()}`)
  }

  const createData = await createResponse.json().catch(() => ({}))
  const createdId = String(createData?.data?.[0]?.details?.id ?? createData?.data?.[0]?.id ?? '').trim()
  if (!createdId) {
    throw new Error('Zoho lead create response missing lead id')
  }
  return createdId
}

export async function syncProfileToZoho(
  supabase: any,
  userId: string,
): Promise<ZohoProfileSyncResult> {
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, phone, id_passport_number, reason_for_buying, zoho_lead_id, zoho_contact_id')
    .eq('id', userId)
    .single()

  if (profileErr || !profile) {
    throw new Error(`Profile lookup failed: ${profileErr?.message ?? 'not found'}`)
  }

  const { data: userData, error: userErr } = await supabase.auth.admin.getUserById(userId)
  if (userErr || !userData?.user) {
    throw new Error(`Auth user lookup failed: ${userErr?.message ?? 'not found'}`)
  }

  const email = String(userData.user.email ?? '').trim().toLowerCase()
  if (!email) throw new Error('Profile sync requires a valid email')
  if (!String(profile.first_name ?? '').trim() || !String(profile.last_name ?? '').trim()) {
    throw new Error('Profile sync requires first and last name')
  }

  const { accessToken, baseUrl } = await getZohoAccessToken()
  const profileRow = profile as ProfileRow

  const existingContactId = String(profileRow.zoho_contact_id ?? '').trim() || null
  const existingLeadId = String(profileRow.zoho_lead_id ?? '').trim() || null
  const foundContactId = existingContactId
    ? null
    : await searchSingleByEmail(baseUrl, accessToken, 'Contacts', email)
  const foundLeadId = (existingContactId || foundContactId || existingLeadId)
    ? null
    : await searchSingleByEmail(baseUrl, accessToken, 'Leads', email)

  const route = resolveZohoProfileRouting({
    existingContactId,
    existingLeadId,
    foundContactId,
    foundLeadId,
  })

  if (route.module === 'Contacts') {
    const zohoContactId = await upsertContact(baseUrl, accessToken, route.id, toContactPayload(profileRow, email))
    await supabase
      .from('profiles')
      .update({
        zoho_contact_id: zohoContactId,
      })
      .eq('id', userId)

    return {
      zohoLeadId: existingLeadId ?? foundLeadId ?? null,
      zohoContactId,
      syncedModule: 'Contacts',
    }
  }

  const zohoLeadId = await upsertLead(baseUrl, accessToken, route.id, toLeadPayload(profileRow, email))
  await supabase
    .from('profiles')
    .update({
      zoho_lead_id: zohoLeadId,
    })
    .eq('id', userId)

  return {
    zohoLeadId,
    zohoContactId: null,
    syncedModule: 'Leads',
  }
}
