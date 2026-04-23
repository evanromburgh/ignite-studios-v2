export const ALLOWED_REASON_FOR_BUYING = [
  'Purchasing to Live',
  'Purchasing as an investment',
  'Not looking to buy, just browsing',
] as const

export type AllowedReasonForBuying = (typeof ALLOWED_REASON_FOR_BUYING)[number]

export type ProfileUpdateInput = {
  firstName: string
  lastName: string
  phone: string
  idPassport: string
  reasonForBuying: AllowedReasonForBuying
}

function sanitizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('27')) return `+${digits}`
  if (digits.startsWith('0')) return `+27${digits.slice(1)}`
  return `+27${digits}`
}

export function parseProfileUpdateInput(body: unknown): ProfileUpdateInput | null {
  if (!body || typeof body !== 'object') return null
  const record = body as Record<string, unknown>

  const firstName = sanitizeText(record.firstName)
  const lastName = sanitizeText(record.lastName)
  const phone = normalizePhone(sanitizeText(record.phone))
  const idPassport = sanitizeText(record.idPassport)
  const reasonForBuyingRaw = sanitizeText(record.reasonForBuying)

  if (!firstName || !lastName || !phone || !idPassport || !reasonForBuyingRaw) {
    return null
  }

  const reasonForBuying = ALLOWED_REASON_FOR_BUYING.find((value) => value === reasonForBuyingRaw)
  if (!reasonForBuying) {
    return null
  }

  return {
    firstName,
    lastName,
    phone,
    idPassport,
    reasonForBuying,
  }
}
