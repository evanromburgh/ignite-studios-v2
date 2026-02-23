import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import CryptoJS from 'https://esm.sh/crypto-js@4.2.0';

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
      return new Response(JSON.stringify({ error: 'Unauthorized - no authorization header' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
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
      const contactUpdate = {
        First_Name: name,
        Last_Name: surname,
        Email: email,
        Phone: `+27${phone}`,
        'ID_Passport_Number': idPassport,
      };
      
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
        console.error('Zoho contact update error:', await updateResponse.text());
      }
      finalContactId = zohoContactId;
    } else {
      const newContact = {
        First_Name: name,
        Last_Name: surname,
        Email: email,
        Phone: `+27${phone}`,
        'ID_Passport_Number': idPassport,
      };
      
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

    const payfastMerchantId = Deno.env.get('PAYFAST_MERCHANT_ID');
    const payfastMerchantKey = Deno.env.get('PAYFAST_MERCHANT_KEY');
    const payfastEnv = Deno.env.get('PAYFAST_ENV') || 'sandbox';
    const payfastPassphrase = Deno.env.get('PAYFAST_PASSPHRASE') || '';
    const payfastReturnUrl = Deno.env.get('PAYFAST_RETURN_URL') || 'https://yourdomain.com/payment-success';
    const payfastCancelUrl = Deno.env.get('PAYFAST_CANCEL_URL') || 'https://yourdomain.com/payment-cancel';
    
    let paymentUrl: string | null = null;
    let paymentReference: string | null = null;

    if (payfastMerchantId && payfastMerchantKey) {
      try {
        const timestamp = Date.now();
        paymentReference = `${unitId}-${finalContactId}-${timestamp}`;
        
        const payfastBaseUrl = payfastEnv === 'production' 
          ? 'https://www.payfast.co.za/eng/process'
          : 'https://sandbox.payfast.co.za/eng/process';
        
        const supabaseProjectUrl = Deno.env.get('SUPABASE_URL') || '';
        const notifyUrl = `${supabaseProjectUrl}/functions/v1/payment-webhook`;
        
        const amount = '10000.00';
        const cancelUrlWithRef = `${payfastCancelUrl}?ref=${encodeURIComponent(paymentReference)}`;
        
        // Remove leading zero from phone number if present (PayFast format: 27XXXXXXXXX, not 270XXXXXXXXX)
        let payfastPhone = phone.trim();
        if (payfastPhone.startsWith('0')) {
          payfastPhone = payfastPhone.substring(1); // Remove leading 0
        }
        // Ensure phone is 9 digits (without leading 0)
        payfastPhone = payfastPhone.replace(/\D/g, '').substring(0, 9);
        
        const payfastParams: Record<string, string> = {
          merchant_id: payfastMerchantId,
          merchant_key: payfastMerchantKey,
          return_url: payfastReturnUrl,
          cancel_url: cancelUrlWithRef,
          notify_url: notifyUrl,
          name_first: name.trim(),
          name_last: surname.trim(),
          email_address: email.trim(),
          cell_number: `27${payfastPhone}`,
          m_payment_id: paymentReference,
          amount: amount,
          item_name: `Unit ${unitNumber} Reservation Deposit`,
          item_description: `Reservation deposit for Unit ${unitNumber}`,
        };
        
        const paramOrder = [
          'merchant_id',
          'merchant_key',
          'return_url',
          'cancel_url',
          'notify_url',
          'name_first',
          'name_last',
          'email_address',
          'cell_number',
          'm_payment_id',
          'amount',
          'item_name',
          'item_description'
        ];
        
        const paramPairs: string[] = [];
        for (const key of paramOrder) {
          const value = payfastParams[key];
          if (value && value !== '' && value !== null && value !== undefined) {
            const encodedValue = encodeURIComponent(String(value).trim()).replace(/%20/g, '+');
            paramPairs.push(`${key}=${encodedValue}`);
          }
        }
        
        const paramString = paramPairs.join('&');
        const signatureString = payfastPassphrase && payfastPassphrase.trim() !== ''
          ? `${paramString}&passphrase=${encodeURIComponent(payfastPassphrase.trim()).replace(/%20/g, '+')}`
          : paramString;
        
        const signature = CryptoJS.MD5(signatureString).toString();
        payfastParams.signature = signature;
        
        const queryParams: string[] = [];
        for (const key of Object.keys(payfastParams)) {
          const value = payfastParams[key];
          if (value && value !== '' && value !== null && value !== undefined) {
            const encodedValue = encodeURIComponent(String(value).trim()).replace(/%20/g, '+');
            queryParams.push(`${key}=${encodedValue}`);
          }
        }
        
        const queryString = queryParams.join('&');
        paymentUrl = `${payfastBaseUrl}?${queryString}`;
      } catch (payfastError: any) {
        console.error('Error generating PayFast payment URL:', payfastError?.message);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        zohoContactId: finalContactId,
        zohoReservationId: reservationId,
        paymentUrl: paymentUrl,
        paymentReference: paymentReference,
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
