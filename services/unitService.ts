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
    lockExpiresAt: row.lock_expires_at as number | undefined,
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

  async releaseLock(unitId: string): Promise<void> {
    await supabase
      .from(TABLE)
      .update({ lock_expires_at: null, locked_by: null })
      .eq('id', unitId);
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
