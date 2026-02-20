import { supabase } from './supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const PROFILES_TABLE = 'profiles';

export interface ReservationFormData {
  name: string;
  surname: string;
  email: string;
  phone: string;
  idPassport: string;
  reasonForBuying: string;
}

export interface ReservationResponse {
  success: boolean;
  zohoContactId: string;
  zohoReservationId?: string;
  paymentUrl?: string | null;
  paymentReference?: string | null;
  message?: string;
}

export const reservationService = {
  /**
   * Submit a reservation (calls submit-reservation edge function)
   */
  async submitReservation(
    formData: ReservationFormData,
    unitId: string,
    unitNumber: string
  ): Promise<ReservationResponse> {
    // Get current session and refresh if needed
    let { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    console.log('Reservation submission - Initial session check:', {
      hasSession: !!session,
      sessionError: sessionError?.message,
      hasAccessToken: !!session?.access_token,
    });
    
    // If no session, try to refresh
    if (!session) {
      console.log('No session found, attempting to refresh...');
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshedSession) {
        session = refreshedSession;
        console.log('Session refreshed successfully');
      } else {
        console.error('Failed to refresh session:', refreshError);
        throw new Error('User not authenticated');
      }
    }
    
    if (!session) {
      console.error('No session available for reservation submission');
      throw new Error('User not authenticated');
    }

    console.log('Calling submit-reservation Edge Function with session token');
    console.log('Token preview:', session.access_token.substring(0, 20) + '...');
    
    // Prepare request body
    const requestBody = {
      name: formData.name,
      surname: formData.surname,
      email: formData.email,
      phone: formData.phone,
      idPassport: formData.idPassport,
      reasonForBuying: formData.reasonForBuying,
      unitId,
      unitNumber,
    };
    
    console.log('Request body being sent:', JSON.stringify(requestBody));
    
    // Use fetch directly to ensure complete JSON body is sent
    const functionUrl = `${SUPABASE_URL}/functions/v1/submit-reservation`;
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY as string,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Edge Function error response:', errorText);
      let errorMessage = `Edge Function returned a non-2xx status code: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorMessage;
      } catch {
        // If errorText is not JSON, use it as the message
        if (errorText) errorMessage = errorText;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();

    if (!data?.success) {
      throw new Error(data?.error || 'Failed to create reservation');
    }

    return {
      success: data.success,
      zohoContactId: data.zohoContactId,
      zohoReservationId: data.zohoReservationId,
      paymentUrl: data.paymentUrl || null,
      paymentReference: data.paymentReference || null,
      message: data.message,
    };
  },

  /**
   * Subscribe to reserved unit IDs for a user (stored in profiles.reserved_unit_ids)
   */
  subscribeToReservedUnits(userId: string, callback: (unitIds: string[]) => void) {
    let localReserved: string[] = [];

    const fetchInitial = async () => {
      const { data, error } = await supabase
        .from(PROFILES_TABLE)
        .select('reserved_unit_ids')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Failed to fetch reserved units:', error);
        callback([]);
        return;
      }

      localReserved = (data?.reserved_unit_ids as string[]) ?? [];
      callback(localReserved);
    };

    fetchInitial();

    const channel = supabase
      .channel(`reserved-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: PROFILES_TABLE,
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          const newRow = payload.new as { reserved_unit_ids?: string[] } | undefined;
          if (newRow?.reserved_unit_ids !== undefined) {
            localReserved = newRow.reserved_unit_ids ?? [];
            callback(localReserved);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
