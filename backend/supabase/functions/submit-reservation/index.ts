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
      console.warn('[submit-reservation] No Authorization header');
      return new Response(JSON.stringify({ error: 'Unauthorized - no authorization header' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.warn('[submit-reservation] Auth failed:', authError?.message ?? 'No user', 'hasToken:', !!token);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    let body;
    try {
      const bodyArrayBuffer = await req.arrayBuffer();
      const bodyText = new TextDecoder().decode(bodyArrayBuffer);
      
      if (!bodyText || bodyText.trim() === '') {
        return new Response(JSON.stringify({ error: 'Request body is required' }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
      
      body = JSON.parse(bodyText);
    } catch (parseError: any) {
      return new Response(JSON.stringify({ error: 'Invalid JSON in request body', details: parseError?.message || 'Unknown parse error' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const { name, surname, email, phone, idPassport, reasonForBuying, unitId, unitNumber } = body;

    if (!name || !surname || !email || !phone || !idPassport || !reasonForBuying || !unitId || !unitNumber) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const zohoClientId = Deno.env.get('ZOHO_CLIENT_ID');
    const zohoClientSecret = Deno.env.get('ZOHO_CLIENT_SECRET');
    const zohoRefreshToken = Deno.env.get('ZOHO_REFRESH_TOKEN');
    const zohoApiDomain = Deno.env.get('ZOHO_API_DOMAIN') || 'com';

    if (!zohoClientId || !zohoClientSecret || !zohoRefreshToken) {
      return new Response(JSON.stringify({ error: 'Zoho credentials not configured' }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
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
      const errorText = await tokenResponse.text();
      console.error('Zoho token error:', tokenResponse.status, errorText);
      
      // Check for rate limiting
      if (tokenResponse.status === 429 || errorText.includes('too many requests')) {
        return new Response(JSON.stringify({ 
          error: 'Zoho API rate limit exceeded. Please wait a few minutes and try again.' 
        }), { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
      
      return new Response(JSON.stringify({ error: 'Failed to authenticate with Zoho' }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    let access_token: string;
    try {
      const tokenData = await tokenResponse.json();
      access_token = tokenData.access_token;
    } catch (parseError: any) {
      console.error('Failed to parse Zoho token response:', parseError?.message);
      return new Response(JSON.stringify({ error: 'Failed to authenticate with Zoho - invalid response format' }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    const zohoApiUrl = `https://www.zohoapis.${zohoApiDomain}/crm/v2`;

    const leadSearchUrl = `${zohoApiUrl}/Leads/search?criteria=(Email:equals:${encodeURIComponent(email)})`;
    console.log('Searching for Lead with email:', email);
    const leadSearchResponse = await fetch(leadSearchUrl, {
      headers: {
        'Authorization': `Zoho-oauthtoken ${access_token}`,
        'Content-Type': 'application/json',
      },
    });

    let zohoContactId: string | null = null;
    let zohoLeadId: string | null = null;
    let leadConverted = false;

    if (leadSearchResponse.ok) {
      let leadSearchData: any;
      try {
        const responseText = await leadSearchResponse.text();
        console.log('Lead search response status:', leadSearchResponse.status);
        leadSearchData = JSON.parse(responseText);
        console.log('Lead search found:', leadSearchData.data?.length || 0, 'leads');
      } catch (parseError: any) {
        console.error('Failed to parse lead search response:', parseError?.message);
        leadSearchData = { data: [] };
      }
      
      if (leadSearchData.data && leadSearchData.data.length > 0) {
        zohoLeadId = leadSearchData.data[0].id;
        console.log('Found Lead ID:', zohoLeadId, '- Attempting conversion...');
        
        const convertUrl = `${zohoApiUrl}/Leads/${zohoLeadId}/actions/convert`;
        const convertPayload = {
          data: [{
            overwrite: true,
            notify_lead_owner: false,
            notify_new_owner: false,
          }],
        };
        
        console.log('Converting Lead to Contact, URL:', convertUrl);
        const convertResponse = await fetch(convertUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Zoho-oauthtoken ${access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(convertPayload),
        });

        console.log('Lead conversion response status:', convertResponse.status);
        
        if (convertResponse.ok) {
          let convertData: any;
          try {
            const responseText = await convertResponse.text();
            console.log('Lead conversion response text:', responseText?.substring(0, 500));
            convertData = JSON.parse(responseText);
            console.log('Lead conversion parsed data:', JSON.stringify(convertData, null, 2));
          } catch (parseError: any) {
            console.error('Failed to parse conversion response:', parseError?.message);
            convertData = { data: [] };
          }
          
          if (convertData.code !== 'MANDATORY_NOT_FOUND' && convertData.status !== 'error' && convertData.data && convertData.data.length > 0) {
            const conversionResult = convertData.data[0];
            console.log('Conversion result:', JSON.stringify(conversionResult, null, 2));
            
            if (conversionResult.code !== 'INVALID_DATA' && conversionResult.status !== 'error') {
              // Try multiple ways to extract contact ID from Zoho response
              if (conversionResult.Contacts && Array.isArray(conversionResult.Contacts) && conversionResult.Contacts.length > 0) {
                zohoContactId = conversionResult.Contacts[0].id;
                console.log('Extracted Contact ID from Contacts array:', zohoContactId);
              } else if (conversionResult.Contacts && conversionResult.Contacts.id) {
                zohoContactId = conversionResult.Contacts.id;
                console.log('Extracted Contact ID from Contacts.id:', zohoContactId);
              } else if (conversionResult.Contact && conversionResult.Contact.id) {
                zohoContactId = conversionResult.Contact.id;
                console.log('Extracted Contact ID from Contact.id:', zohoContactId);
              } else if (conversionResult.Contact && Array.isArray(conversionResult.Contact) && conversionResult.Contact.length > 0) {
                zohoContactId = conversionResult.Contact[0].id;
                console.log('Extracted Contact ID from Contact array:', zohoContactId);
              } else {
                console.log('Contact ID not found in conversion response, waiting 2 seconds and searching...');
                leadConverted = true; // Mark that conversion happened
                await new Promise(resolve => setTimeout(resolve, 2000));
              }
            } else {
              console.error('Conversion result has error:', conversionResult.code, conversionResult.status);
            }
          } else {
            console.error('Conversion response indicates error:', convertData.code, convertData.status);
          }
        } else {
          const errorText = await convertResponse.text();
          console.error('Lead conversion failed with status:', convertResponse.status, errorText);
        }
      } else {
        console.log('No Lead found with email:', email);
      }
    } else {
      const errorText = await leadSearchResponse.text();
      console.error('Lead search failed with status:', leadSearchResponse.status, errorText);
    }

    if (!zohoContactId) {
      // If lead was converted, wait a bit longer for Zoho to process
      if (leadConverted) {
        console.log('Lead was converted, waiting 3 seconds for Zoho to process...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      
      console.log('Contact ID not found after conversion, searching for existing Contact...');
      const contactSearchUrl = `${zohoApiUrl}/Contacts/search?criteria=(Email:equals:${encodeURIComponent(email)})`;
      const contactSearchResponse = await fetch(contactSearchUrl, {
        headers: {
          'Authorization': `Zoho-oauthtoken ${access_token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Contact search response status:', contactSearchResponse.status);
      
      if (contactSearchResponse.ok) {
        let contactSearchData: any;
        try {
          const responseText = await contactSearchResponse.text();
          console.log('Contact search response text:', responseText?.substring(0, 300));
          if (responseText && responseText.trim() !== '') {
            contactSearchData = JSON.parse(responseText);
          } else {
            contactSearchData = { data: [] };
          }
        } catch (parseError: any) {
          console.error('Failed to parse contact search response:', parseError?.message);
          contactSearchData = { data: [] };
        }
        
        if (contactSearchData.data && contactSearchData.data.length > 0) {
          zohoContactId = contactSearchData.data[0].id;
          console.log('Found existing Contact ID:', zohoContactId);
        } else {
          console.log('No existing Contact found');
        }
      } else {
        const errorText = await contactSearchResponse.text();
        console.error('Contact search failed:', contactSearchResponse.status, errorText);
      }
    }
    
    // If lead was converted but we still don't have a contact ID, don't create a duplicate
    if (!zohoContactId && leadConverted) {
      console.error('Lead was converted but Contact ID could not be found. This may indicate a Zoho API issue.');
      return new Response(JSON.stringify({ error: 'Lead conversion succeeded but Contact ID could not be retrieved. Please try again or contact support.' }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    let finalContactId: string;
    
    if (zohoContactId) {
      const contactUpdate: Record<string, string> = {
        First_Name: name,
        Last_Name: surname,
        Email: email,
        Phone: `+27${phone}`,
        'ID_Passport_Number': idPassport.trim(),
      };
      console.log('[submit-reservation] Contact update payload ID_Passport_Number:', contactUpdate['ID_Passport_Number']);

      const updateUrl = `${zohoApiUrl}/Contacts/${zohoContactId}`;
      const updateResponse = await fetch(updateUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Zoho-oauthtoken ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: [contactUpdate] }),
      });

      if (!updateResponse.ok) {
        const errText = await updateResponse.text();
        console.error('Zoho contact update error:', updateResponse.status, errText);
      } else {
        console.log('[submit-reservation] Zoho contact update OK for', zohoContactId);
      }
      finalContactId = zohoContactId;
    } else {
      const newContact: Record<string, string> = {
        First_Name: name,
        Last_Name: surname,
        Email: email,
        Phone: `+27${phone}`,
        'ID_Passport_Number': idPassport.trim(),
      };
      console.log('[submit-reservation] Contact create payload ID_Passport_Number:', newContact['ID_Passport_Number']);
      
      const createUrl = `${zohoApiUrl}/Contacts`;
      const createResponse = await fetch(createUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Zoho-oauthtoken ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: [newContact] }),
      });

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        console.error('Zoho contact create error:', errorText);
        return new Response(JSON.stringify({ error: 'Failed to create contact in Zoho' }), { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }

      try {
        const responseText = await createResponse.text();
        const createData = JSON.parse(responseText);
        finalContactId = createData.data[0].details.id;
      } catch (parseError: any) {
        console.error('Failed to parse Contact create response:', parseError?.message);
        return new Response(JSON.stringify({ error: 'Failed to create contact in Zoho - invalid response format', details: parseError?.message }), { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
    }

    if (!finalContactId) {
      return new Response(JSON.stringify({ error: 'Contact ID is missing - cannot create reservation' }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    if (idPassport.trim()) {
      const passportOnlyUrl = `${zohoApiUrl}/Contacts/${finalContactId}`;
      const passportOnlyRes = await fetch(passportOnlyUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Zoho-oauthtoken ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: [{ 'ID_Passport_Number': idPassport.trim() }] }),
      });
      if (!passportOnlyRes.ok) {
        console.error('[submit-reservation] ID_Passport_Number-only update failed:', passportOnlyRes.status, await passportOnlyRes.text());
      } else {
        console.log('[submit-reservation] ID_Passport_Number updated for contact', finalContactId);
      }
    }

    // Store unit+contact -> user so payment-webhook can add unit to profile.reserved_unit_ids on success
    const { error: pendingErr } = await supabase
      .from('pending_reservations')
      .upsert(
        { unit_id: unitId, zoho_contact_id: finalContactId, user_id: user.id },
        { onConflict: 'unit_id,zoho_contact_id' }
      );
    if (pendingErr) {
      console.error('Failed to store pending reservation:', pendingErr);
    }
    
    const currentDate = new Date().toISOString().split('T')[0];
    
    const reservationData: Record<string, any> = {
      Contact: finalContactId,
      'Unit_Number': unitNumber,
      'Reservation_Date': currentDate,
      'Payment_Status': 'Pending',
      'Deposit': 10000,
      'Reason_for_Buying': reasonForBuying,
      'ID_Passport_Number': idPassport.trim(),
    };

    const moduleApiName = 'Unit_Reservations';
    const reservationUrl = `${zohoApiUrl}/${moduleApiName}`;
    
    const reservationPayload = { data: [reservationData] };
    
    const reservationResponse = await fetch(reservationUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Zoho-oauthtoken ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reservationPayload),
    });

    let reservationId: string | null = null;
    
    if (!reservationResponse.ok) {
      const errorText = await reservationResponse.text();
      console.error('Zoho reservation create error:', reservationResponse.status, errorText);
      return new Response(JSON.stringify({ error: 'Failed to create reservation in Zoho', details: errorText }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    try {
      const reservationText = await reservationResponse.text();
      if (reservationText && reservationText.trim() !== '') {
        const reservationData = JSON.parse(reservationText);
        if (reservationData.data && reservationData.data[0] && reservationData.data[0].details && reservationData.data[0].details.id) {
          reservationId = reservationData.data[0].details.id;
        }
      }
    } catch (parseError: any) {
      console.error('Failed to parse reservation response:', parseError?.message);
    }

    if (reservationId) {
      const { error: updatePendingErr } = await supabase
        .from('pending_reservations')
        .update({ zoho_reservation_id: reservationId })
        .eq('unit_id', unitId)
        .eq('zoho_contact_id', finalContactId);
      if (updatePendingErr) {
        console.error('Failed to store zoho_reservation_id in pending_reservations:', updatePendingErr);
      } else {
        console.log('Stored zoho_reservation_id in pending_reservations for webhook lookup:', reservationId);
      }
    }

    // Generate reference for Paystack (webhook uses this ref)
    const timestamp = Date.now();
    const paymentReference = `${unitId}.${finalContactId}.${timestamp}`;
    const amountCents = 10000 * 100; // ZAR cents

    return new Response(
      JSON.stringify({
        success: true,
        zohoContactId: finalContactId,
        zohoReservationId: reservationId,
        paymentReference,
        email: email.trim(),
        amountInCents: amountCents,
        currency: 'ZAR',
        message: 'Reservation created successfully in Zoho CRM',
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
    console.error('submit-reservation function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error?.message || 'Unknown error' }),
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
