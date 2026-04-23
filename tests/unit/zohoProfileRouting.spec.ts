import { describe, expect, it } from 'vitest'
import { resolveZohoProfileRouting } from '../../backend/supabase/functions/_shared/zohoProfileRouting'

describe('resolveZohoProfileRouting', () => {
  it('prefers existing contact id over all lead paths', () => {
    const route = resolveZohoProfileRouting({
      existingContactId: 'contact_existing',
      existingLeadId: 'lead_existing',
      foundContactId: 'contact_found',
      foundLeadId: 'lead_found',
    })

    expect(route).toEqual({ module: 'Contacts', id: 'contact_existing' })
  })

  it('uses found contact when no stored contact exists', () => {
    const route = resolveZohoProfileRouting({
      existingContactId: null,
      existingLeadId: 'lead_existing',
      foundContactId: 'contact_found',
      foundLeadId: null,
    })

    expect(route).toEqual({ module: 'Contacts', id: 'contact_found' })
  })

  it('falls back to lead when no contact path exists', () => {
    const route = resolveZohoProfileRouting({
      existingContactId: null,
      existingLeadId: 'lead_existing',
      foundContactId: null,
      foundLeadId: null,
    })

    expect(route).toEqual({ module: 'Leads', id: 'lead_existing' })
  })

  it('creates a lead route when neither contact nor lead is found', () => {
    const route = resolveZohoProfileRouting({
      existingContactId: null,
      existingLeadId: null,
      foundContactId: null,
      foundLeadId: null,
    })

    expect(route).toEqual({ module: 'Leads', id: null })
  })
})
