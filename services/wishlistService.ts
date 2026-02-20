import { supabase } from './supabase';

const PROFILES_TABLE = 'profiles';

export const wishlistService = {
  /**
   * Subscribe to wishlist changes for a specific user (stored in profiles.wishlist_unit_ids)
   */
  subscribeToWishlist(userId: string, callback: (unitIds: string[]) => void) {
    let localWishlist: string[] = [];

    const fetchInitial = async () => {
      const { data, error } = await supabase
        .from(PROFILES_TABLE)
        .select('wishlist_unit_ids')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Failed to fetch wishlist:', error);
        callback([]);
        return;
      }

      localWishlist = (data?.wishlist_unit_ids as string[]) ?? [];
      callback(localWishlist);
    };

    fetchInitial();

    const channel = supabase
      .channel(`wishlist-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: PROFILES_TABLE,
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          const newRow = payload.new as { wishlist_unit_ids?: string[] } | undefined;
          if (newRow?.wishlist_unit_ids) {
            localWishlist = newRow.wishlist_unit_ids;
            callback(localWishlist);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * Add a unit to the user's wishlist
   */
  async addToWishlist(userId: string, unitId: string): Promise<void> {
    const { data: profile, error: fetchError } = await supabase
      .from(PROFILES_TABLE)
      .select('wishlist_unit_ids')
      .eq('id', userId)
      .single();

    if (fetchError || !profile) throw fetchError ?? new Error('Profile not found');

    const current = (profile.wishlist_unit_ids as string[]) ?? [];
    if (current.includes(unitId)) return;

    const { error } = await supabase
      .from(PROFILES_TABLE)
      .update({ wishlist_unit_ids: [...current, unitId] })
      .eq('id', userId);

    if (error) throw error;
  },

  /**
   * Remove a unit from the user's wishlist
   */
  async removeFromWishlist(userId: string, unitId: string): Promise<void> {
    const { data: profile, error: fetchError } = await supabase
      .from(PROFILES_TABLE)
      .select('wishlist_unit_ids')
      .eq('id', userId)
      .single();

    if (fetchError || !profile) throw fetchError ?? new Error('Profile not found');

    const current = (profile.wishlist_unit_ids as string[]) ?? [];
    const updated = current.filter((id) => id !== unitId);

    const { error } = await supabase
      .from(PROFILES_TABLE)
      .update({ wishlist_unit_ids: updated })
      .eq('id', userId);

    if (error) throw error;
  },

  /**
   * Toggle a unit in the user's wishlist
   */
  async toggleWishlist(userId: string, unitId: string, isWishlisted: boolean): Promise<void> {
    if (isWishlisted) {
      await this.removeFromWishlist(userId, unitId);
    } else {
      await this.addToWishlist(userId, unitId);
    }
  },

  /**
   * Get all unit IDs in the user's wishlist
   */
  async getWishlist(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from(PROFILES_TABLE)
      .select('wishlist_unit_ids')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Failed to get wishlist:', error);
      return [];
    }

    return (data?.wishlist_unit_ids as string[]) ?? [];
  },
};
