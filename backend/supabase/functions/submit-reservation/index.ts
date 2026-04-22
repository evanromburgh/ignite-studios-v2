import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createServiceRoleClient, getUserFromBearerToken, jsonResponse, optionsResponse } from '../_shared/http.ts'

type SubmitBody = {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  idPassport?: string
  reasonForBuying?: string
  unitId?: string
  unitNumber?: string
  amountInZar?: number
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return optionsResponse()
  }

  try {
    const supabase = createServiceRoleClient()
    const user = await getUserFromBearerToken(req, supabase)
    if (!user) return jsonResponse(401, { error: 'Unauthorized' })
    const body = await req.json().catch(() => null) as SubmitBody | null
    if (!body) return jsonResponse(400, { error: 'Invalid JSON body' })

    const firstName = String(body.firstName ?? '').trim()
    const lastName = String(body.lastName ?? '').trim()
    const email = String(body.email ?? '').trim()
    const phone = String(body.phone ?? '').trim()
    const idPassport = String(body.idPassport ?? '').trim()
    const reasonForBuying = String(body.reasonForBuying ?? '').trim()
    const unitId = String(body.unitId ?? '').trim()
    const unitNumberFromClient = String(body.unitNumber ?? '').trim()

    if (!firstName || !lastName || !email || !phone || !idPassport || !reasonForBuying || !unitId) {
      return jsonResponse(400, { error: 'Missing required fields' })
    }

    const { data: unit, error: unitErr } = await supabase
      .from('units')
      .select('id, unit_number, status, lock_expires_at, locked_by')
      .eq('id', unitId)
      .single()

    if (unitErr || !unit) {
      return jsonResponse(404, { error: 'Unit not found' })
    }

    if (String(unit.status) !== 'Available') {
      return jsonResponse(409, { error: 'Unit is no longer available' })
    }

    const lockOwner = String(unit.locked_by ?? '').trim()
    const lockExpires = unit.lock_expires_at ? new Date(unit.lock_expires_at).getTime() : null
    const lockIsActive = lockExpires != null && lockExpires > Date.now()
    if (lockIsActive && lockOwner && lockOwner !== user.id) {
      return jsonResponse(409, { error: 'Unit is temporarily locked by another user' })
    }

    const { data: active } = await supabase
      .from('reservations')
      .select('id, user_id, paystack_reference, amount_cents, currency')
      .eq('unit_id', unitId)
      .eq('status', 'payment_pending')
      .limit(1)
      .maybeSingle()

    if (active) {
      if (active.user_id !== user.id) {
        return jsonResponse(409, { error: 'An active checkout already exists for this unit' })
      }

      return jsonResponse(200, {
        success: true,
        reservationId: active.id,
        paymentReference: active.paystack_reference,
        amountInCents: active.amount_cents,
        currency: active.currency,
        email,
        message: 'Existing pending reservation reused',
      })
    }

    const requestedAmount = Number(body.amountInZar ?? Number(Deno.env.get('RESERVATION_DEPOSIT_ZAR') ?? 10000))
    const amountInZar = Number.isFinite(requestedAmount) && requestedAmount > 0 ? requestedAmount : 10000
    const amountInCents = Math.round(amountInZar * 100)

    const reservationId = crypto.randomUUID()
    const paymentReference = `resv_${reservationId}`
    const unitNumberSnapshot = String(unit.unit_number ?? unitNumberFromClient ?? '').trim() || unitId

    const { error: insertErr } = await supabase
      .from('reservations')
      .insert({
        id: reservationId,
        paystack_reference: paymentReference,
        unit_id: unitId,
        user_id: user.id,
        status: 'payment_pending',
        amount_cents: amountInCents,
        currency: 'ZAR',
        buyer_first_name: firstName,
        buyer_last_name: lastName,
        buyer_email: email,
        buyer_phone: phone,
        buyer_id_passport: idPassport,
        buyer_reason_for_buying: reasonForBuying,
        unit_number_snapshot: unitNumberSnapshot,
        zoho_sync_status: 'not_required',
      })

    if (insertErr) {
      console.error('submit-reservation insert error:', insertErr)
      return jsonResponse(500, { error: 'Failed to create reservation' })
    }

    // Best-effort profile enrichment so records are consistent across flows.
    await supabase
      .from('profiles')
      .update({
        first_name: firstName,
        last_name: lastName,
        phone,
        id_passport_number: idPassport,
        reason_for_buying: reasonForBuying,
      })
      .eq('id', user.id)

    return jsonResponse(200, {
      success: true,
      reservationId,
      paymentReference,
      amountInCents,
      currency: 'ZAR',
      email,
      message: 'Reservation created. Proceed to payment.',
    })
  } catch (error: any) {
    console.error('submit-reservation error:', error)
    return jsonResponse(500, { error: 'Internal server error', details: error?.message })
  }
})
