import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

export type AdminType = 'system_admin' | 'ngo_admin' | 'none'

export interface AdminInfo {
  adminType: AdminType
  ngoId?: string
}

export const adminTypeKeys = {
  status: (userId: string | undefined) => ['admin', 'admin-type', userId] as const,
}

async function fetchAdminStatus(userId: string): Promise<AdminInfo> {
  // Check if user is system admin
  const { data: systemAdminData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .in('role', ['admin', 'system_admin'])
    .maybeSingle()

  if (systemAdminData) {
    return { adminType: 'system_admin', ngoId: undefined }
  }

  // Check if user is NGO admin
  const { data: ngoAdminData } = await supabase
    .from('ngo_members')
    .select('ngo_id, role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .eq('is_active', true)
    .maybeSingle()

  if (ngoAdminData) {
    return { adminType: 'ngo_admin', ngoId: ngoAdminData.ngo_id }
  }

  return { adminType: 'none', ngoId: undefined }
}

export function useAdminTypeQuery() {
  const { user } = useAuth()

  return useQuery({
    queryKey: adminTypeKeys.status(user?.id),
    queryFn: () => fetchAdminStatus(user!.id),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })
}

// Wrapper hook for backward compatibility
export function useAdminType() {
  const { user } = useAuth()
  const { data, isLoading } = useAdminTypeQuery()

  return {
    adminType: data?.adminType ?? 'none',
    ngoId: data?.ngoId,
    loading: !user ? false : isLoading,
  }
}
