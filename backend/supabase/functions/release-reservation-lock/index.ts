import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  try {
    const contentType = req.headers.get('content-type') || '';
    const bodyText = await req.text();
    let ref = '';
    if (contentType.includes('application/json')) {
      try {
        const data = JSON.parse(bodyText);
        ref = String(data.ref ?? data.payment_ref ?? '').trim();
      } catch {
        // ignore
      }
    } else {
      const params = new URLSearchParams(bodyText);
      ref = (params.get('ref') ?? params.get('payment_ref') ?? '').trim();
    }

    if (!ref) {
      return new Response(JSON.stringify({ error: 'Missing ref' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const decoded = decodeURIComponent(ref);
    // Same format as submit-reservation / payment-webhook: unitId|zohoContactId|timestamp
    const parts = decoded.split('|');
    const unitId = parts[0]?.trim();
    if (!unitId || parts.length !== 3) {
      return new Response(JSON.stringify({ error: 'Invalid ref format' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error } = await supabase
      .from('units')
      .update({ lock_expires_at: null, locked_by: null })
      .eq('id', unitId);

    if (error) {
      console.error('release-reservation-lock error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true, unitId }), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('release-reservation-lock:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});
