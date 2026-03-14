import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let body: { paymentReference?: string };
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const paymentReference = String(body?.paymentReference ?? '').trim();
    if (!paymentReference) {
      return new Response(JSON.stringify({ error: 'paymentReference is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const decodedReference = decodeURIComponent(paymentReference);
    const parts = decodedReference.includes('|') ? decodedReference.split('|') : decodedReference.split('.');
    if (parts.length !== 3) {
      return new Response(JSON.stringify({ error: 'Invalid payment reference format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const unitId = String(parts[0] ?? '').trim();
    const zohoContactId = String(parts[1] ?? '').trim();
    if (!unitId || !zohoContactId) {
      return new Response(JSON.stringify({ error: 'Invalid payment reference' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Ensure the reservation belongs to this user
    const { data: pendingRow, error: pendingErr } = await supabase
      .from('pending_reservations')
      .select('user_id, zoho_reservation_id')
      .eq('unit_id', unitId)
      .eq('zoho_contact_id', zohoContactId)
      .maybeSingle();

    if (pendingErr) {
      console.error('cancel-reservation: pending_reservations lookup error', pendingErr);
      return new Response(JSON.stringify({ error: 'Failed to lookup reservation' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (pendingRow?.user_id && pendingRow.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let reservationId: string | null = pendingRow?.zoho_reservation_id
      ? String(pendingRow.zoho_reservation_id).trim()
      : null;

    const zohoClientId = Deno.env.get('ZOHO_CLIENT_ID');
    const zohoClientSecret = Deno.env.get('ZOHO_CLIENT_SECRET');
    const zohoRefreshToken = Deno.env.get('ZOHO_REFRESH_TOKEN');
    const zohoApiDomain = Deno.env.get('ZOHO_API_DOMAIN') || 'com';

    if (!zohoClientId || !zohoClientSecret || !zohoRefreshToken) {
      console.error('cancel-reservation: Zoho credentials not configured');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const tokenUrl = `https://accounts.zoho.${zohoApiDomain}/oauth/v2/token`;
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: zohoRefreshToken,
        client_id: zohoClientId,
        client_secret: zohoClientSecret,
        grant_type: 'refresh_token',
      }),
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      console.error('cancel-reservation: Zoho token error', tokenResponse.status, errText);
      return new Response(JSON.stringify({ error: 'Failed to update reservation status' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { access_token } = await tokenResponse.json();
    const zohoApiUrl = `https://www.zohoapis.${zohoApiDomain}/crm/v2`;

    if (!reservationId) {
      const { data: unitData } = await supabase.from('units').select('unit_number').eq('id', unitId).single();
      const unitNumber = unitData?.unit_number ?? unitId;
      const criteria = `(Contact:equals:${encodeURIComponent(zohoContactId)})and(Unit_Number:equals:${encodeURIComponent(String(unitNumber))})`;
      const searchUrl = `${zohoApiUrl}/Unit_Reservations/search?criteria=${criteria}&page=1&per_page=5`;
      const searchRes = await fetch(searchUrl, {
        headers: { Authorization: `Zoho-oauthtoken ${access_token}`, 'Content-Type': 'application/json' },
      });
      if (searchRes.ok) {
        const searchData = await searchRes.json().catch(() => ({}));
        const records = searchData?.data ?? [];
        const pending = records.find((r: any) => String(r.Payment_Status ?? r.payment_status ?? '').trim() === 'Pending');
        if (pending?.id) reservationId = String(pending.id);
      }
    }

    if (reservationId) {
      const updateUrl = `${zohoApiUrl}/Unit_Reservations/${reservationId}`;
      const updateRes = await fetch(updateUrl, {
        method: 'PUT',
        headers: {
          Authorization: `Zoho-oauthtoken ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: [{ Payment_Status: 'Cancelled' }] }),
      });
      if (!updateRes.ok) {
        console.error('cancel-reservation: Zoho update failed', updateRes.status, await updateRes.text());
      }
    }

    const { error: unitUpdateError } = await supabase
      .from('units')
      .update({ lock_expires_at: null, locked_by: null })
      .eq('id', unitId);

    if (unitUpdateError) {
      console.error('cancel-reservation: unit lock release error', unitUpdateError);
    }

    await supabase
      .from('pending_reservations')
      .delete()
      .eq('unit_id', unitId)
      .eq('zoho_contact_id', zohoContactId);

    return new Response(
      JSON.stringify({ success: true, message: 'Reservation cancelled' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('cancel-reservation error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: err?.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
