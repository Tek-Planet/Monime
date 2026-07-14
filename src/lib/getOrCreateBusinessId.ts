import { supabase } from '@/integrations/supabase/client'

/**
 * Gets the business ID for a user, respecting team membership.
 * Priority: 1) Owned business, 2) Team membership, 3) Create new business
 */
export async function getOrCreateBusinessId(userId: string): Promise<string | null> {
  // 1. Check if user owns a business
  const { data: ownedBusiness, error: ownedError } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', userId)
    .maybeSingle()

  if (ownedError && ownedError.code !== 'PGRST116') {
    console.error('Error fetching owned business:', ownedError)
  }

  if (ownedBusiness) {
    return ownedBusiness.id
  }

  // 2. Check if user is a team member
  const { data: membership, error: memberError } = await supabase
    .from('organization_members')
    .select('business_id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle()

  if (memberError && memberError.code !== 'PGRST116') {
    console.error('Error fetching membership:', memberError)
  }

  if (membership?.business_id) {
    return membership.business_id
  }

  // 3. Only create new business if user is neither owner nor member
  const { data: newBusiness, error: createError } = await supabase
    .from('businesses')
    .insert({
      owner_id: userId,
      business_name: 'My Business',
      business_type: 'retail'
    })
    .select('id')
    .single()

  if (createError) {
    console.error('Error creating business:', createError)
    return null
  }

  return newBusiness?.id || null
}

/**
 * Gets the business ID for a user without creating one.
 * Returns null if user has no business association.
 */
export async function getBusinessId(userId: string): Promise<string | null> {
  // 1. Check if user owns a business
  const { data: ownedBusiness } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', userId)
    .maybeSingle()

  if (ownedBusiness) {
    return ownedBusiness.id
  }

  // 2. Check if user is a team member
  const { data: membership } = await supabase
    .from('organization_members')
    .select('business_id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle()

  return membership?.business_id || null
}
