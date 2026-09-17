import { supabase } from '@/integrations/supabase/client';
import { offlineDb } from '@/lib/offlineDb';

function getCachedBusinessId(userId?: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    if (userId) {
      const userCached = localStorage.getItem(`cached_business_id_${userId}`);
      if (userCached) return userCached;
    }
    const globalCached = localStorage.getItem('cached_business_id');
    if (globalCached) return globalCached;
  } catch {
    // Ignore storage issues
  }
  return null;
}

export function setCachedBusinessId(userId: string, businessId: string) {
  if (typeof window === 'undefined' || !businessId) return;
  try {
    localStorage.setItem(`cached_business_id_${userId}`, businessId);
    localStorage.setItem('cached_business_id', businessId);
  } catch {
    // Ignore storage quota
  }
}

const timeoutPromise = <T>(promise: Promise<T>, ms = 2500): Promise<T> => {
  let timer: any;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Network timeout resolving business')), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};

/**
 * Gets the business ID for a user, respecting team membership.
 * Priority: 1) Cached ID if offline, 2) Owned business, 3) Team membership, 4) Create new business
 */
export async function getOrCreateBusinessId(userId: string): Promise<string | null> {
  const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
  const cached = getCachedBusinessId(userId);

  if (isOffline && cached) {
    return cached;
  }

  // If offline without cache, inspect local Dexie stores for any known business ID
  if (isOffline) {
    try {
      const anySale = await offlineDb.sales.toCollection().first();
      if (anySale?.business_id) {
        setCachedBusinessId(userId, anySale.business_id);
        return anySale.business_id;
      }
      const anyInv = await offlineDb.inventory.toCollection().first();
      if (anyInv?.business_id) {
        setCachedBusinessId(userId, anyInv.business_id);
        return anyInv.business_id;
      }
    } catch {
      // ignore
    }
    return cached || 'offline-business';
  }

  try {
    // 1. Check if user owns a business
    const { data: ownedBusiness, error: ownedError } = await timeoutPromise(
      supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', userId)
        .maybeSingle()
    );

    if (ownedError && ownedError.code !== 'PGRST116') {
      console.warn('Error fetching owned business:', ownedError);
    }

    if (ownedBusiness) {
      setCachedBusinessId(userId, ownedBusiness.id);
      return ownedBusiness.id;
    }

    // 2. Check if user is a team member
    const { data: memberships, error: memberError } = await timeoutPromise(
      supabase
        .from('organization_members')
        .select('business_id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
    );

    if (memberError) {
      console.warn('Error fetching membership:', memberError);
    }

    const membership = memberships?.[0];
    if (membership?.business_id) {
      setCachedBusinessId(userId, membership.business_id);
      return membership.business_id;
    }

    // 3. Only create new business if user is neither owner nor member
    const { data: newBusiness, error: createError } = await timeoutPromise(
      supabase
        .from('businesses')
        .insert({
          owner_id: userId,
          business_name: 'My Business',
          business_type: 'retail'
        })
        .select('id')
        .single()
    );

    if (createError) {
      console.warn('Error creating business:', createError);
      return cached || 'offline-business';
    }

    if (newBusiness?.id) {
      setCachedBusinessId(userId, newBusiness.id);
      return newBusiness.id;
    }
  } catch (err) {
    console.warn('Network timeout or error resolving business ID, using fallback cache:', err);
    if (cached) return cached;
    try {
      const anySale = await offlineDb.sales.toCollection().first();
      if (anySale?.business_id) return anySale.business_id;
      const anyInv = await offlineDb.inventory.toCollection().first();
      if (anyInv?.business_id) return anyInv.business_id;
    } catch {
      // ignore
    }
    return 'offline-business';
  }

  return cached || 'offline-business';
}

/**
 * Gets the business ID for a user without creating one.
 * Returns null if user has no business association.
 */
export async function getBusinessId(userId: string): Promise<string | null> {
  const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
  const cached = getCachedBusinessId(userId);

  if (isOffline) {
    return cached;
  }

  try {
    // 1. Check if user owns a business
    const { data: ownedBusiness } = await timeoutPromise(
      supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', userId)
        .maybeSingle()
    );

    if (ownedBusiness) {
      setCachedBusinessId(userId, ownedBusiness.id);
      return ownedBusiness.id;
    }

    // 2. Check if user is a team member
    const { data: memberships } = await timeoutPromise(
      supabase
        .from('organization_members')
        .select('business_id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
    );

    if (memberships?.[0]?.business_id) {
      setCachedBusinessId(userId, memberships[0].business_id);
      return memberships[0].business_id;
    }
  } catch (err) {
    console.warn('Network timeout or error in getBusinessId, falling back to cache:', err);
  }

  return cached;
}
