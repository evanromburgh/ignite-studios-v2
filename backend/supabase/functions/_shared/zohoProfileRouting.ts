export type ZohoProfileRoutingInput = {
  existingContactId: string | null
  existingLeadId: string | null
  foundContactId: string | null
  foundLeadId: string | null
}

export function resolveZohoProfileRouting(input: ZohoProfileRoutingInput): {
  module: 'Contacts' | 'Leads'
  id: string | null
} {
  if (input.existingContactId) {
    return { module: 'Contacts', id: input.existingContactId }
  }
  if (input.foundContactId) {
    return { module: 'Contacts', id: input.foundContactId }
  }
  if (input.existingLeadId) {
    return { module: 'Leads', id: input.existingLeadId }
  }
  if (input.foundLeadId) {
    return { module: 'Leads', id: input.foundLeadId }
  }
  return { module: 'Leads', id: null }
}
