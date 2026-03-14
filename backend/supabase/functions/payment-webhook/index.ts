import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '0',
};

function jsonOk(body: string, init?: ResponseInit) {
  return new Response(body, {
    ...init,
    status: init?.status ?? 200,
    headers: { ...CORS_HEADERS, ...init?.headers, 'Content-Type': 'application/json' },
  });
}

async function hmacSha512Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(message)
  );
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

serve(async (req) => {
  console.log('payment-webhook invoked', { method: req.method, url: req.url });
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const contentType = req.headers.get('content-type') || '';
    const bodyText = await req.text();

    console.log('Request content-type:', contentType);
    console.log('Request body (first 500 chars):', bodyText.substring(0, 500));

    let paymentData: Record<string, unknown> = {};
    if (contentType.includes('application/json')) {
      try {
        paymentData = JSON.parse(bodyText) as Record<string, unknown>;
        console.log('Parsed JSON payment data (event):', (paymentData as any).event);
      } catch (e) {
        console.error('Failed to parse JSON:', e);
      }
    } else {
      const params = new URLSearchParams(bodyText);
      for (const [key, value] of params.entries()) {
        paymentData[key] = value;
      }
      console.log('Parsed form-urlencoded payment data:', paymentData);
    }

    let paymentReference = '';
    let finalStatus: 'COMPLETE' | 'CANCELLED' | null = null;

    // Paystack: JSON body with event + data
    const paystackEvent = paymentData.event as string | undefined;
    const paystackData = paymentData.data as Record<string, unknown> | undefined;
    if (contentType.includes('application/json') && paystackEvent && paystackData) {
      const paystackSecret = Deno.env.get('PAYSTACK_SECRET_KEY')?.trim();
      if (paystackSecret) {
        const signature = req.headers.get('x-paystack-signature') || '';
        const expectedHash = await hmacSha512Hex(paystackSecret, bodyText);
        if (signature !== expectedHash) {
          console.error('Paystack webhook signature mismatch');
          return jsonOk('OK');
        }
      }
      const ref = paystackData.reference as string | undefined;
      const status = String(paystackData.status ?? '').toLowerCase();
      if (paystackEvent === 'charge.success' && status === 'success') {
        finalStatus = 'COMPLETE';
        paymentReference = String(ref ?? '').trim();
      } else if (
        paystackEvent === 'charge.failed' ||
        paystackEvent === 'charge.reversed' ||
        status === 'failed' ||
        status === 'cancelled'
      ) {
        finalStatus = 'CANCELLED';
        paymentReference = String(ref ?? '').trim();
      }
      if (!paymentReference || !finalStatus) {
        console.log('Paystack event ignored:', paystackEvent, status);
        return jsonOk('OK');
      }
      console.log('Paystack webhook:', paystackEvent, 'reference:', paymentReference, 'finalStatus:', finalStatus);
    } else {
      // PayFast: form body with m_payment_id and payment_status
      paymentReference = String((paymentData.m_payment_id as string) || '').trim();
      const paymentStatus = ((paymentData.payment_status as string) || '').toUpperCase();
      const isComplete = paymentStatus === 'COMPLETE';
      const isCancelled =
        paymentStatus === 'CANCELLED' || paymentStatus === 'CANCEL' || paymentStatus === 'CANCELED';
      if (!paymentReference || (!isComplete && !isCancelled)) {
        console.log('Skipping - no payment reference or invalid status (PayFast)');
        return jsonOk('OK');
      }
      finalStatus = isComplete ? 'COMPLETE' : 'CANCELLED';
      console.log('PayFast webhook:', paymentReference, 'finalStatus:', finalStatus);
    }

    if (!paymentReference || !finalStatus) {
      console.log('Skipping - missing reference or finalStatus');
      return jsonOk('OK');
    }

    console.log('Processing payment with finalStatus:', finalStatus);

    // Ensure we're working with a string and decode any URL encoding
    const decodedReference = decodeURIComponent(paymentReference);
    console.log('Decoded payment reference:', decodedReference);
    
    // Reference format: unitId.zohoContactId.timestamp (Paystack) or unitId|zohoContactId|timestamp (legacy PayFast)
    const parts = decodedReference.includes('|')
      ? decodedReference.split('|')
      : decodedReference.split('.');
    console.log('Payment reference parts (array):', JSON.stringify(parts));
    console.log('Payment reference parts count:', parts.length);
    console.log('SEARCH_TARGET: reference=', decodedReference, '-> we will search Zoho for unitId=', parts[0], 'contactId=', parts[1]);
    
    if (parts.length !== 3) {
      console.error('Invalid payment reference format:', decodedReference, 'parts length:', parts.length, 'parts:', parts);
      return jsonOk('OK');
    }
    
    const unitId = String(parts[0] || '').trim();
    const zohoContactId = String(parts[1] || '').trim();
    const timestampPart = String(parts[2] || '').trim();

    console.log('Extracted from payment reference:', { 
      unitId, 
      unitIdLength: unitId.length,
      zohoContactId, 
      zohoContactIdLength: zohoContactId.length,
      timestampPart,
      timestampLength: timestampPart.length
    });

    if (!unitId || !zohoContactId || !timestampPart) {
      console.error('Invalid payment reference - missing parts:', { unitId, zohoContactId, timestampPart });
      return jsonOk('OK');
    }

    const zohoClientId = Deno.env.get('ZOHO_CLIENT_ID');
    const zohoClientSecret = Deno.env.get('ZOHO_CLIENT_SECRET');
    const zohoRefreshToken = Deno.env.get('ZOHO_REFRESH_TOKEN');
    const zohoApiDomain = Deno.env.get('ZOHO_API_DOMAIN') || 'com';

    if (!zohoClientId || !zohoClientSecret || !zohoRefreshToken) {
      console.error('Zoho credentials not configured');
      return jsonOk('OK');
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
      console.error('Failed to get Zoho token:', tokenResponse.status, errorText);
      
      // If rate limited, return OK to allow PayFast to retry later
      if (tokenResponse.status === 429 || errorText.includes('too many requests')) {
        console.log('Zoho rate limited on token request, will retry on next webhook call');
        return jsonOk('OK');
      }
      
      return jsonOk('OK');
    }

    const { access_token } = await tokenResponse.json();
    const zohoApiUrl = `https://www.zohoapis.${zohoApiDomain}/crm/v2`;

    console.log('Fetching unit data from Supabase for unitId:', unitId);
    const { data: unitData, error: unitError } = await supabase
      .from('units')
      .select('unit_number')
      .eq('id', unitId)
      .single();

    let unitNumber: string;
    if (unitError || !unitData) {
      console.log('Unit not found in Supabase, using unitId as unitNumber:', unitId);
      unitNumber = String(unitId).trim();
    } else {
      unitNumber = String(unitData.unit_number ?? unitId ?? '').trim() || String(unitId).trim();
      console.log('Found unit in Supabase, unitNumber:', unitNumber);
    }

    const normalizeUnit = (v: any) => String(v ?? '').trim();
    const unitMatches = (r: any) => {
      const u = normalizeUnit(r.Unit_Number ?? r.unit_number);
      return u === unitNumber || u === String(unitId);
    };

    // Prefer Zoho reservation ID from our DB (set by submit-reservation) so we skip Zoho search entirely
    let reservationId: string | null = null;
    const { data: pendingRow } = await supabase
      .from('pending_reservations')
      .select('zoho_reservation_id')
      .eq('unit_id', unitId)
      .eq('zoho_contact_id', zohoContactId)
      .maybeSingle();
    if (pendingRow?.zoho_reservation_id) {
      reservationId = String(pendingRow.zoho_reservation_id).trim();
      console.log('Using zoho_reservation_id from pending_reservations (skip Zoho search):', reservationId);
    }
    
    const pickBestMatch = (matches: any[], status: string) => {
      if (matches.length === 0) return null;
      
      // For both COMPLETE and CANCELLED, prioritize Pending status (the reservation we just created)
      if (matches.length > 1) {
        const pending = matches.find((r: any) => {
          const ps = normalizeUnit(r.Payment_Status ?? r.payment_status);
          return ps === 'Pending';
        });
        if (pending) {
          console.log('pickBestMatch: Selected pending reservation from', matches.length, 'matches');
          return pending;
        }
      }
      
      console.log('pickBestMatch: Returning first match from', matches.length, 'matches');
      return matches[0];
    };

    const perPage = 200;
    
    // Retry logic: Zoho may need time to index newly created reservations after submit-reservation creates them.
    // PayFast can notify very quickly after payment; an initial delay gives Zoho time to index.
    const maxRetries = 5;
    const retryDelays = [5000, 3000, 5000, 7000, 10000]; // First attempt after 5s (Zoho indexing), then 3s, 5s, 7s, 10s
    
    console.log('Starting reservation search with retry logic (max', maxRetries, 'attempts)');
    console.log('Searching for contact:', zohoContactId, 'unitNumber:', unitNumber, 'unitId:', unitId);
    
    for (let retryAttempt = 0; retryAttempt < maxRetries && !reservationId; retryAttempt++) {
      const delay = retryDelays[retryAttempt] ?? 10000;
      if (retryAttempt > 0) {
        console.log(`Retry attempt ${retryAttempt + 1}/${maxRetries} after ${delay}ms delay...`);
      } else {
        console.log(`Initial delay ${delay}ms before first search (allow Zoho to index new reservation)...`);
      }
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Try searching by Unit Number first (often indexed faster than Contact lookup); try both unitNumber and unitId
      if (!reservationId) {
        const unitSearchValues = unitNumber !== String(unitId) ? [unitNumber, unitId] : [unitNumber];
        for (const unitVal of unitSearchValues) {
          if (reservationId) break;
          console.log('Trying unit-only search first...', '(Unit_Number:', unitVal, ')');
          const unitOnlyCriteria = `(Unit_Number:equals:${encodeURIComponent(String(unitVal))})`;
          const unitSearchUrl = `${zohoApiUrl}/Unit_Reservations/search?criteria=${unitOnlyCriteria}&page=1&per_page=50`;
          console.log('Unit-only search criteria:', unitOnlyCriteria);
          try {
            const unitSearchResponse = await fetch(unitSearchUrl, {
            headers: {
              'Authorization': `Zoho-oauthtoken ${access_token}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (unitSearchResponse.ok) {
            const unitSearchText = await unitSearchResponse.text();
            if (unitSearchText && unitSearchText.trim()) {
              const unitSearchData = JSON.parse(unitSearchText);
              const unitResults = unitSearchData.data || [];
              console.log(`Unit-only search found ${unitResults.length} reservations`);
              
              if (unitResults.length > 0) {
                console.log(`Unit-only search found ${unitResults.length} reservations, filtering...`);
                
                // For both COMPLETE and CANCELLED, prioritize Pending status (the one we just created)
                const pendingMatch = unitResults.find((r: any) => {
                  const ps = String(r.Payment_Status ?? r.payment_status ?? '').trim();
                  const u = normalizeUnit(r.Unit_Number ?? r.unit_number);
                  const contactId = String(r.Contact?.id ?? r.Contact ?? '').trim();
                  const matchesUnit = (u === unitNumber || u === String(unitId));
                  const matchesContact = contactId === zohoContactId;
                  return ps === 'Pending' && matchesUnit && matchesContact;
                });
                
                if (pendingMatch) {
                  reservationId = pendingMatch.id;
                  console.log('Found pending reservation via unit-only search (with contact match):', reservationId);
                } else {
                  // If no pending match with contact, try pending with just unit match
                  const pendingUnitMatch = unitResults.find((r: any) => {
                    const ps = String(r.Payment_Status ?? r.payment_status ?? '').trim();
                    const u = normalizeUnit(r.Unit_Number ?? r.unit_number);
                    return ps === 'Pending' && (u === unitNumber || u === String(unitId));
                  });
                  
                  if (pendingUnitMatch) {
                    reservationId = pendingUnitMatch.id;
                    console.log('Found pending reservation via unit-only search (unit match only):', reservationId);
                  } else {
                    // If no pending match, try to match by contact ID (any status)
                    const contactMatch = unitResults.find((r: any) => {
                      const contactId = String(r.Contact?.id ?? r.Contact ?? '').trim();
                      const u = normalizeUnit(r.Unit_Number ?? r.unit_number);
                      return contactId === zohoContactId && (u === unitNumber || u === String(unitId));
                    });
                    
                    if (contactMatch) {
                      reservationId = contactMatch.id;
                      console.log('Found reservation via unit+contact match (any status):', reservationId);
                    } else if (unitResults.length === 1) {
                      // If only one result and it matches the unit, use it
                      const singleMatch = unitResults[0];
                      const u = normalizeUnit(singleMatch.Unit_Number ?? singleMatch.unit_number);
                      if (u === unitNumber || u === String(unitId)) {
                        reservationId = singleMatch.id;
                        console.log('Found single reservation matching unit:', reservationId);
                      }
                    }
                  }
                }
              }
            }
          }
          } catch (unitSearchError) {
            console.error('Unit-only search error:', unitSearchError);
          }
        }
      }

      // If unit-only search didn't work, try combined search (try both Contact and Contact.id for lookup)
      if (!reservationId) {
        const combinedCriteriaOptions = [
          `(Contact:equals:${encodeURIComponent(zohoContactId)})and(Unit_Number:equals:${encodeURIComponent(unitNumber)})`,
          `(Contact.id:equals:${encodeURIComponent(zohoContactId)})and(Unit_Number:equals:${encodeURIComponent(unitNumber)})`,
        ];
        for (const criteriaCombined of combinedCriteriaOptions) {
          if (reservationId) break;
          console.log('Trying combined search with criteria:', criteriaCombined);

          let combinedPage = 1;
          let combinedDone = false;

          while (!combinedDone && !reservationId) {
            const combinedUrl = `${zohoApiUrl}/Unit_Reservations/search?criteria=${criteriaCombined}&page=${combinedPage}&per_page=${perPage}`;
            console.log('Searching Zoho reservations, page:', combinedPage);
            const searchResponse = await fetch(combinedUrl, {
              headers: {
                'Authorization': `Zoho-oauthtoken ${access_token}`,
                'Content-Type': 'application/json',
              },
            });
            console.log('Combined search response status:', searchResponse.status);
            if (!searchResponse.ok) {
              const errorText = await searchResponse.text();
              console.error('Combined search failed:', searchResponse.status, errorText);
              if (searchResponse.status === 429 || errorText.includes('too many requests')) {
                console.log('Rate limited, will retry after delay');
                break;
              }
              break;
            }
            try {
              const searchText = await searchResponse.text();
              if (!searchText || searchText.trim() === '') {
                if (searchResponse.status === 204) console.log('Zoho returned 204 No Content (no results)');
                break;
              }
              const searchData = JSON.parse(searchText);
              const pageData = searchData.data || [];
              console.log(`Combined search found ${pageData.length} reservations on page ${combinedPage}`);
              if (pageData.length > 0) {
                const matches = pageData.filter((r: any) => unitMatches(r));
                console.log(`Filtered to ${matches.length} matching reservations`);
                const match = pickBestMatch(matches, finalStatus);
                if (match) {
                  reservationId = match.id;
                  console.log('Found reservation via combined search:', reservationId);
                  break;
                }
              }
              if (pageData.length < perPage) combinedDone = true;
              else combinedPage++;
            } catch (parseError) {
              console.error('Parse error in combined search:', parseError);
              break;
            }
          }
        }
      }
      
      // If we found a reservation, break out of retry loop
      if (reservationId) {
        console.log('Reservation found on retry attempt:', retryAttempt + 1);
        break;
      } else {
        console.log('Reservation not found on attempt', retryAttempt + 1);
      }
    }

    if (!reservationId) {
      console.log('Reservation not found after all retries, trying fallback searches...');
      const searchCriteriaOptions = [
        `(Contact:equals:${encodeURIComponent(zohoContactId)})`,
        `(Contact.id:equals:${encodeURIComponent(zohoContactId)})`,
        `(Contact_Name:equals:${encodeURIComponent(zohoContactId)})`,
      ];
      
      const allContactReservations: any[] = [];
      let criteriaIndex = 0;
      
      while (criteriaIndex < searchCriteriaOptions.length && allContactReservations.length === 0) {
        const searchCriteria = searchCriteriaOptions[criteriaIndex];
        let page = 1;
        let hasMore = true;
        const currentPageResults: any[] = [];
        
        while (hasMore) {
          const paginatedUrl = `${zohoApiUrl}/Unit_Reservations/search?criteria=${searchCriteria}&page=${page}&per_page=${perPage}`;
          const pageResponse = await fetch(paginatedUrl, {
            headers: {
              'Authorization': `Zoho-oauthtoken ${access_token}`,
              'Content-Type': 'application/json',
            },
          });
          if (!pageResponse.ok) break;
          const searchText = await pageResponse.text();
          if (!searchText || searchText.trim() === '') break;
          try {
            const searchData = JSON.parse(searchText);
            const pageData = searchData.data || [];
            currentPageResults.push(...pageData);
            if (pageData.length < perPage) hasMore = false;
            else page++;
          } catch (parseError) {
            break;
          }
        }
        
        if (currentPageResults.length > 0) {
          allContactReservations.push(...currentPageResults);
          break;
        } else {
          criteriaIndex++;
        }
      }
      
      if (allContactReservations.length > 0) {
        const matches = allContactReservations.filter((r: any) => unitMatches(r));
        const match = pickBestMatch(matches, finalStatus);
        if (match) {
          reservationId = match.id;
        } else {
          const unitSearchFormats = [
            { name: 'equals with quotes', criteria: `(Unit_Number:equals:"${unitNumber}")` },
            { name: 'equals without quotes', criteria: `(Unit_Number:equals:${unitNumber})` },
            { name: 'equals unitId', criteria: `(Unit_Number:equals:${unitId})` },
            { name: 'equals unitId with quotes', criteria: `(Unit_Number:equals:"${unitId}")` },
          ];
          
          for (const format of unitSearchFormats) {
            if (reservationId) break;
            const unitOnlyCriteria = format.criteria;
            const unitSearchUrl = `${zohoApiUrl}/Unit_Reservations/search?criteria=${encodeURIComponent(unitOnlyCriteria)}&page=1&per_page=50`;
            try {
              const unitSearchResponse = await fetch(unitSearchUrl, {
                headers: {
                  'Authorization': `Zoho-oauthtoken ${access_token}`,
                  'Content-Type': 'application/json',
                },
              });
              
              if (unitSearchResponse.status === 204) continue;
              
              if (unitSearchResponse.ok || (unitSearchResponse.status >= 200 && unitSearchResponse.status < 300)) {
                const unitSearchText = await unitSearchResponse.text();
                if (unitSearchText && unitSearchText.trim()) {
                  try {
                    const unitSearchData = JSON.parse(unitSearchText);
                    const unitResults = unitSearchData.data || [];
                    if (unitResults.length > 0) {
                      const pendingMatch = unitResults.find((r: any) => {
                        const ps = String(r.Payment_Status ?? r.payment_status ?? '').trim();
                        return ps === 'Pending';
                      });
                      if (pendingMatch) {
                        reservationId = pendingMatch.id;
                        break;
                      } else {
                        let selectedReservation = null;
                        if (finalStatus === 'COMPLETE') {
                          selectedReservation = unitResults.find((r: any) => {
                            const ps = String(r.Payment_Status ?? r.payment_status ?? '').trim();
                            return ps === 'Paid' || ps === 'Pending';
                          }) || unitResults[0];
                        } else {
                          selectedReservation = unitResults.find((r: any) => {
                            const ps = String(r.Payment_Status ?? r.payment_status ?? '').trim();
                            return ps === 'Cancelled';
                          }) || unitResults[0];
                        }
                        reservationId = selectedReservation.id;
                        break;
                      }
                    }
                  } catch (parseError: any) {
                    // Continue to next format
                  }
                }
              }
            } catch (unitSearchError: any) {
              // Continue to next format
            }
          }
          
          if (!reservationId) {
            try {
              const allReservationsUrl = `${zohoApiUrl}/Unit_Reservations?page=1&per_page=200`;
              const allResResponse = await fetch(allReservationsUrl, {
                headers: {
                  'Authorization': `Zoho-oauthtoken ${access_token}`,
                  'Content-Type': 'application/json',
                },
              });
              if (allResResponse.ok) {
                const allResText = await allResResponse.text();
                if (allResText && allResText.trim()) {
                  const allResData = JSON.parse(allResText);
                  const allReservations = allResData.data || [];
                  const unitMatches = allReservations.filter((r: any) => {
                    const u = String(r.Unit_Number ?? r.unit_number ?? '').trim();
                    return u === unitNumber || u === String(unitId);
                  });
                  if (unitMatches.length > 0) {
                    const pendingMatch = unitMatches.find((r: any) => {
                      const ps = String(r.Payment_Status ?? r.payment_status ?? '').trim();
                      return ps === 'Pending';
                    });
                    if (pendingMatch) {
                      reservationId = pendingMatch.id;
                    } else {
                      let selectedReservation = null;
                      if (finalStatus === 'COMPLETE') {
                        selectedReservation = unitMatches.find((r: any) => {
                          const ps = String(r.Payment_Status ?? r.payment_status ?? '').trim();
                          return ps === 'Paid' || ps === 'Pending';
                        }) || unitMatches[0];
                      } else {
                        selectedReservation = unitMatches.find((r: any) => {
                          const ps = String(r.Payment_Status ?? r.payment_status ?? '').trim();
                          return ps === 'Cancelled';
                        }) || unitMatches[0];
                      }
                      reservationId = selectedReservation.id;
                    }
                  }
                }
              }
            } catch (lastResortError) {
              // Last resort failed
            }
          }
        }
      } else {
        const unitOnlyCriteria = `(Unit_Number:equals:${encodeURIComponent(unitNumber)})`;
        try {
          const unitSearchUrl = `${zohoApiUrl}/Unit_Reservations/search?criteria=${unitOnlyCriteria}&page=1&per_page=50`;
          const unitSearchResponse = await fetch(unitSearchUrl, {
            headers: {
              'Authorization': `Zoho-oauthtoken ${access_token}`,
              'Content-Type': 'application/json',
            },
          });
          if (unitSearchResponse.ok) {
            const unitSearchText = await unitSearchResponse.text();
            if (unitSearchText && unitSearchText.trim()) {
              const unitSearchData = JSON.parse(unitSearchText);
              const unitResults = unitSearchData.data || [];
              if (unitResults.length > 0) {
                const pendingMatch = unitResults.find((r: any) => {
                  const ps = String(r.Payment_Status ?? r.payment_status ?? '').trim();
                  return ps === 'Pending';
                });
                if (pendingMatch) {
                  reservationId = pendingMatch.id;
                } else if (unitResults.length === 1) {
                  reservationId = unitResults[0].id;
                }
              }
            }
          }
        } catch (unitSearchError) {
          // Unit search failed
        }
      }
    }

    if (!reservationId) {
      console.error('Reservation not found for contact:', zohoContactId, 'unitNumber:', unitNumber, 'unitId:', unitId);
      return jsonOk('OK');
    }

    console.log('Found reservation ID:', reservationId, 'Updating Payment_Status to:', finalStatus === 'COMPLETE' ? 'Paid' : 'Cancelled');
    
    const zohoPaymentStatus = finalStatus === 'COMPLETE' ? 'Paid' : 'Cancelled';
    
    const updateUrl = `${zohoApiUrl}/Unit_Reservations/${reservationId}`;
    console.log('Updating Zoho reservation at:', updateUrl);
    console.log('Update payload:', { Payment_Status: zohoPaymentStatus });
    
    const updateResponse = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Zoho-oauthtoken ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: [{
          'Payment_Status': zohoPaymentStatus,
        }],
      }),
    });

    console.log('Zoho update response status:', updateResponse.status);
    
    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error('Failed to update Zoho reservation:', updateResponse.status, errorText);
      return jsonOk('OK');
    }
    
    const updateResponseText = await updateResponse.text();
    console.log('Zoho reservation updated successfully:', updateResponseText?.substring(0, 300));

    if (finalStatus === 'CANCELLED') {
      console.log('Payment cancelled, releasing unit lock so unit shows Available again');
      const { error: unitUpdateError } = await supabase
        .from('units')
        .update({
          lock_expires_at: null,
          locked_by: null,
        })
        .eq('id', unitId);

      if (unitUpdateError) {
        console.error('Failed to release unit lock:', unitUpdateError);
        return jsonOk('OK');
      }
      console.log('Unit lock released successfully');

      await supabase
        .from('pending_reservations')
        .delete()
        .eq('unit_id', unitId)
        .eq('zoho_contact_id', zohoContactId);
    } else if (finalStatus === 'COMPLETE') {
      console.log('Payment complete, updating unit status to Reserved');
      const { error: unitUpdateError } = await supabase
        .from('units')
        .update({
          status: 'Reserved',
          lock_expires_at: null,
          locked_by: null,
        })
        .eq('id', unitId);

      if (unitUpdateError) {
        console.error('Failed to update unit status:', unitUpdateError);
        return jsonOk('OK');
      }
      console.log('Unit status updated successfully to Reserved');

      // Add unit to user's reserved_unit_ids in profiles (for My Reservations page)
      const { data: pendingRow } = await supabase
        .from('pending_reservations')
        .select('user_id')
        .eq('unit_id', unitId)
        .eq('zoho_contact_id', zohoContactId)
        .single();

      if (pendingRow?.user_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('reserved_unit_ids')
          .eq('id', pendingRow.user_id)
          .single();

        const current = (profile?.reserved_unit_ids as string[] | null) ?? [];
        if (!current.includes(unitId)) {
          const { error: profileErr } = await supabase
            .from('profiles')
            .update({ reserved_unit_ids: [...current, unitId] })
            .eq('id', pendingRow.user_id);
          if (profileErr) {
            console.error('Failed to add unit to profile reserved_unit_ids:', profileErr);
          } else {
            console.log('Added unit to profile reserved_unit_ids for user:', pendingRow.user_id);
          }
        }
        await supabase
          .from('pending_reservations')
          .delete()
          .eq('unit_id', unitId)
          .eq('zoho_contact_id', zohoContactId);
      }
    }

    console.log('Payment webhook processing completed successfully');
    return jsonOk('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return jsonOk('OK');
  }
});
