import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
};

serve(async (req) => {
  console.log('create-lead function invoked', { method: req.method, url: req.url });
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing create-lead request');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    console.log('Authorization header present:', !!authHeader);
    console.log('Authorization header length:', authHeader?.length || 0);
    
    if (!authHeader) {
      console.error('No Authorization header found');
      return new Response(JSON.stringify({ error: 'Unauthorized - No token provided' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Token extracted, length:', token.length);
    console.log('Token starts with:', token.substring(0, 20) + '...');
    
    // Decode JWT to check if it has 'sub' claim (without verification)
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        console.log('Token payload keys:', Object.keys(payload));
        console.log('Token has sub claim:', !!payload.sub);
        console.log('Token sub value:', payload.sub);
        console.log('Token exp:', payload.exp);
        console.log('Token iat:', payload.iat);
      }
    } catch (decodeError) {
      console.warn('Could not decode token for inspection:', decodeError);
    }
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth failed:', authError?.message || 'No user');
      console.error('Auth error code:', authError?.status);
      console.error('Auth error details:', JSON.stringify(authError, null, 2));
      return new Response(JSON.stringify({ error: 'Unauthorized', details: authError?.message }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    console.log('User authenticated:', user.email);
    
    let body;
    try {
      const bodyText = await req.text();
      if (!bodyText || bodyText.trim() === '') {
        return new Response(JSON.stringify({ error: 'Request body is required' }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
      body = JSON.parse(bodyText);
    } catch (parseError: any) {
      return new Response(JSON.stringify({ error: 'Invalid JSON in request body', details: parseError.message }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    const { firstName, lastName, email, phone } = body;

    if (!firstName || !lastName || !email) {
      console.error('Missing required fields:', { firstName: !!firstName, lastName: !!lastName, email: !!email });
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    console.log('Creating Lead in Zoho CRM for:', email);

    const zohoClientId = (Deno.env.get('ZOHO_CLIENT_ID') ?? '').trim();
    const zohoClientSecret = (Deno.env.get('ZOHO_CLIENT_SECRET') ?? '').trim();
    const zohoRefreshToken = (Deno.env.get('ZOHO_REFRESH_TOKEN') ?? '').trim();
    const zohoApiDomain = (Deno.env.get('ZOHO_API_DOMAIN') || 'com').trim() || 'com';

    if (!zohoClientId || !zohoClientSecret || !zohoRefreshToken) {
      console.error('Zoho credentials missing:', { 
        hasClientId: !!zohoClientId, 
        hasClientSecret: !!zohoClientSecret, 
        hasRefreshToken: !!zohoRefreshToken 
      });
      return new Response(JSON.stringify({ error: 'Zoho credentials not configured' }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const tokenUrl = `https://accounts.zoho.${zohoApiDomain}/oauth/v2/token`;
    console.log('Requesting Zoho access token from:', tokenUrl);
    console.log('Using Client ID (full):', zohoClientId);
    console.log('Using Client Secret (first 20 chars):', zohoClientSecret?.substring(0, 20) + '...');
    console.log('Using Refresh Token (first 30 chars):', zohoRefreshToken?.substring(0, 30) + '...');
    console.log('Using API Domain:', zohoApiDomain);
    
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

    console.log('Zoho token response status:', tokenResponse.status);
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Zoho token error:', tokenResponse.status, errorText);
      console.error('Full error response:', errorText);
      return new Response(JSON.stringify({ error: 'Failed to authenticate with Zoho', details: errorText }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const tokenResponseText = await tokenResponse.text();
    console.log('Zoho token response text:', tokenResponseText?.substring(0, 200));
    
    let tokenData;
    try {
      tokenData = JSON.parse(tokenResponseText);
    } catch (parseError: any) {
      console.error('Failed to parse Zoho token response:', parseError);
      console.error('Response text:', tokenResponseText);
      return new Response(JSON.stringify({ error: 'Invalid response from Zoho', details: tokenResponseText }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    console.log('Zoho token response parsed:', { 
      hasAccessToken: !!tokenData.access_token,
      hasError: !!tokenData.error,
      error: tokenData.error,
      errorDescription: tokenData.error_description
    });
    
    const { access_token } = tokenData;
    if (!access_token) {
      console.error('No access_token in Zoho token response');
      console.error('Full token response:', JSON.stringify(tokenData, null, 2));
      return new Response(JSON.stringify({ error: 'No access token received from Zoho', details: tokenData.error || 'Unknown error' }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    console.log('Zoho access token obtained successfully');
    
    const zohoApiUrl = `https://www.zohoapis.${zohoApiDomain}/crm/v2`;

    const searchUrl = `${zohoApiUrl}/Leads/search?criteria=(Email:equals:${encodeURIComponent(email)})`;
    const searchResponse = await fetch(searchUrl, {
      headers: {
        'Authorization': `Zoho-oauthtoken ${access_token}`,
        'Content-Type': 'application/json',
      },
    });

    let zohoLeadId: string | null = null;
    if (searchResponse.ok) {
      try {
        const searchText = await searchResponse.text();
        if (searchText && searchText.trim() !== '') {
          const searchData = JSON.parse(searchText);
          if (searchData.data && searchData.data.length > 0) {
            zohoLeadId = searchData.data[0].id;
          }
        }
      } catch (parseError) {
        // Continue - will create new Lead if search fails
      }
    }

    const zohoLead: Record<string, unknown> = {
      First_Name: firstName,
      Last_Name: lastName,
      Email: email,
      Lead_Status: 'New Lead',
      Lead_Source: 'Reservation Portal',
    };
    if (phone != null && String(phone).trim() !== '') {
      const digits = String(phone).replace(/\D/g, '');
      zohoLead.Phone = digits.startsWith('27') ? `+${digits}` : `+27${digits}`;
    }

    let finalLeadId: string;
    if (zohoLeadId) {
      const updateUrl = `${zohoApiUrl}/Leads/${zohoLeadId}`;
      const updateResponse = await fetch(updateUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Zoho-oauthtoken ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: [zohoLead] }),
      });

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        console.error('Zoho Lead update error:', updateResponse.status, errorText);
        return new Response(JSON.stringify({ error: 'Failed to update lead in Zoho', details: errorText }), { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
      
      finalLeadId = zohoLeadId;
    } else {
      const createUrl = `${zohoApiUrl}/Leads`;
      const createResponse = await fetch(createUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Zoho-oauthtoken ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: [zohoLead] }),
      });

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        console.error('Zoho Lead create error:', createResponse.status, errorText);
        return new Response(JSON.stringify({ error: 'Failed to create lead in Zoho', details: errorText }), { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }

      let createText = '';
      try {
        createText = await createResponse.text();
        if (!createText || createText.trim() === '') {
          throw new Error('Empty response from Zoho create');
        }
        const createData = JSON.parse(createText);
        const first = createData?.data?.[0];
        const code = first?.code ?? first?.status;
        if (code === 'INVALID_DATA' || code === 'ERROR' || first?.status === 'error') {
          const msg = first?.message ?? first?.details?.message ?? 'Zoho rejected the data';
          console.error('Zoho create rejected:', code, msg, first?.details);
          return new Response(JSON.stringify({ error: 'Zoho validation error', details: msg, zohoDetails: first?.details }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        const id = first?.details?.id ?? first?.id;
        if (id != null && id !== '') {
          finalLeadId = String(id);
        } else {
          console.error('Zoho create response (first 800 chars):', createText.substring(0, 800));
          throw new Error('Invalid response structure from Zoho');
        }
      } catch (parseError: any) {
        console.error('Failed to parse Zoho create response:', parseError);
        if (createText) console.error('Zoho create raw response (first 800 chars):', createText.substring(0, 800));
        return new Response(JSON.stringify({ error: 'Failed to parse Zoho create response', details: parseError.message }), { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
    }

    console.log('Lead created/updated successfully, ID:', finalLeadId);
    return new Response(
      JSON.stringify({
        success: true,
        zohoLeadId: finalLeadId,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.error('create-lead function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
