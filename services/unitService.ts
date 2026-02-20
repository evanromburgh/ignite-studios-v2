import { supabase } from './supabase';
import { Unit } from '../types';
import { MOCK_UNITS } from '../constants';
import { CONFIG } from '../config';

const TABLE = 'units';

function toDbRow(unit: Unit): Record<string, unknown> {
  return {
    id: unit.id,
    unit_number: unit.unitNumber,
    bedrooms: unit.bedrooms,
    bathrooms: unit.bathrooms,
    parking: unit.parking,
    size_sqm: unit.sizeSqm,
    price: unit.price,
    status: unit.status,
    unit_type: unit.unitType,
    image_url: unit.imageUrl,
    viewers: unit.viewers ?? {},
    lock_expires_at: unit.lockExpiresAt ?? null,
    locked_by: unit.lockedBy ?? null,
  };
}

function toAppUnit(row: Record<string, unknown>): Unit {
  // Convert lock_expires_at to number (Supabase may return BIGINT as string or number)
  // Database stores milliseconds, but we need to ensure it's treated as milliseconds
  let lockExpiresAt: number | undefined = undefined;
  
  if (row.lock_expires_at != null) {
    const rawValue = row.lock_expires_at;
    let numValue: number;
    
    // Handle string values - remove any non-numeric characters except minus sign
    if (typeof rawValue === 'string') {
      // Remove slashes and other non-numeric characters, keep only digits
      const cleaned = rawValue.replace(/[^\d-]/g, '');
      numValue = parseInt(cleaned, 10);
    } else {
      // Handle number values
      numValue = Number(rawValue);
    }
    
    if (!isNaN(numValue)) {
      // Database stores milliseconds (BIGINT from EXTRACT(EPOCH FROM now()) * 1000)
      // If value is less than 13 digits, it might be in seconds - convert to milliseconds
      // Valid millisecond timestamps are typically 13 digits (e.g., 1771597028000)
      // Valid second timestamps are typically 10 digits (e.g., 1771597028)
      if (numValue > 0 && numValue < 1000000000000) {
        // Value appears to be in seconds, convert to milliseconds
        lockExpiresAt = numValue * 1000;
      } else {
        // Value is already in milliseconds
        lockExpiresAt = numValue;
      }
    }
  }
  
  return {
    id: row.id as string,
    unitNumber: row.unit_number as string,
    bedrooms: row.bedrooms as number,
    bathrooms: row.bathrooms as number,
    parking: row.parking as number,
    sizeSqm: row.size_sqm as number,
    price: row.price as number,
    status: row.status as Unit['status'],
    unitType: row.unit_type as string,
    imageUrl: row.image_url as string,
    viewers: (row.viewers as Record<string, number>) ?? {},
    lockExpiresAt: lockExpiresAt,
    lockedBy: row.locked_by as string | undefined,
  };
}

export const unitService = {
  subscribeToUnits(callback: (units: Unit[]) => void) {
    let localUnits: Unit[] = [];

    const fetchInitial = async () => {
      const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .order('unit_number', { ascending: true });

      if (error) {
        console.error('Failed to fetch units:', error.message, error.details, error.hint, error.code);
        return;
      }

      if (data.length === 0) {
        await this.importUnits(MOCK_UNITS);
        return;
      }

      localUnits = data.map(toAppUnit);
      callback(localUnits);
    };

    fetchInitial();

    const channel = supabase
      .channel('units-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: TABLE },
        (payload) => {
          const newRow = payload.new as Record<string, unknown> | undefined;
          const oldRow = payload.old as Record<string, unknown> | undefined;

          if (payload.eventType === 'INSERT' && newRow) {
            localUnits = [...localUnits, toAppUnit(newRow)];
          } else if (payload.eventType === 'UPDATE' && newRow) {
            localUnits = localUnits.map(u =>
              u.id === (newRow.id as string) ? toAppUnit(newRow) : u
            );
          } else if (payload.eventType === 'DELETE' && oldRow) {
            localUnits = localUnits.filter(u => u.id !== (oldRow.id as string));
          }

          localUnits.sort((a, b) => a.unitNumber.localeCompare(b.unitNumber));
          callback(localUnits);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  async updateHeartbeat(unitId: string, sessionId: string): Promise<void> {
    const { data } = await supabase.from(TABLE).select('viewers').eq('id', unitId).single();
    const viewers = (data?.viewers as Record<string, number>) ?? {};
    viewers[sessionId] = Date.now();
    await supabase.from(TABLE).update({ viewers }).eq('id', unitId);
  },

  async removeViewer(unitId: string, sessionId: string): Promise<void> {
    const { data } = await supabase.from(TABLE).select('viewers').eq('id', unitId).single();
    const viewers = (data?.viewers as Record<string, number>) ?? {};
    delete viewers[sessionId];
    await supabase.from(TABLE).update({ viewers }).eq('id', unitId);
  },

  async acquireLock(unitId: string, userId: string): Promise<boolean> {
    const lockExpiresAt = Date.now() + CONFIG.LOCK_DURATION_MS;

    const { data, error } = await supabase.rpc('try_acquire_lock', {
      p_unit_id: unitId,
      p_user_id: userId,
      p_lock_expires_at: lockExpiresAt,
    });

    if (error) return false;
    return data === true;
  },

  async getServerTimeMs(): Promise<number> {
    const { data, error } = await supabase.rpc('get_server_time_ms');
    if (error) return Date.now(); // fallback to client time
    const raw = data;
    const ms = typeof raw === 'string' ? parseInt(raw, 10) : Number(raw);
    return isNaN(ms) ? Date.now() : ms;
  },

  async getUnit(unitId: string): Promise<Unit | null> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id', unitId)
      .single();

    if (error) {
      console.error('Error fetching unit:', error);
      return null;
    }
    if (!data) {
      console.error('No data returned for unit:', unitId);
      return null;
    }
    
    const unit = toAppUnit(data);
    return unit;
  },

  async releaseLock(unitId: string): Promise<void> {
    await supabase
      .from(TABLE)
      .update({ lock_expires_at: null, locked_by: null })
      .eq('id', unitId);
  },

  /**
   * Release lock using fetch with keepalive so the request can complete
   * when the user closes the tab or refreshes (beforeunload/pagehide).
   * Call this from unload handlers; use releaseLock() for normal navigation.
   */
  releaseLockKeepalive(unitId: string, accessToken: string | null): void {
    const url = import.meta.env.VITE_SUPABASE_URL as string;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
    if (!url || !anonKey) return;
    const endpoint = `${url}/rest/v1/units?id=eq.${encodeURIComponent(unitId)}`;
    const headers: Record<string, string> = {
      apikey: anonKey,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    };
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    try {
      fetch(endpoint, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ lock_expires_at: null, locked_by: null }),
        keepalive: true,
      });
    } catch {
      // Ignore; page may be unloading
    }
  },

  async releaseAllLocksForUser(userId: string): Promise<void> {
    await supabase
      .from(TABLE)
      .update({ lock_expires_at: null, locked_by: null })
      .eq('locked_by', userId);
  },

  async saveUnit(unit: Unit): Promise<void> {
    await supabase.from(TABLE).upsert(toDbRow(unit));
  },

  async importUnits(newUnits: Unit[]): Promise<void> {
    const rows = newUnits.map(toDbRow);
    const { error } = await supabase.from(TABLE).upsert(rows).select();
    if (error) throw error;
  },

  async updateUnitStatus(id: string, status: Unit['status']): Promise<void> {
    await supabase
      .from(TABLE)
      .update({ status, lock_expires_at: null, locked_by: null })
      .eq('id', id);
  },

  async deleteUnit(id: string): Promise<void> {
    await supabase.from(TABLE).delete().eq('id', id);
  },

  async resetDatabase(): Promise<void> {
    await supabase.from(TABLE).delete().neq('id', '');
    await this.importUnits(MOCK_UNITS);
  },
};
