import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

export type AdminType = 'system_admin' | 'ngo_admin' | 'none'

export interface AdminInfo {
  adminType: AdminType
  ngoId?: string
  loading: boolean
}

export function useAdminType(): AdminInfo {
  const { user } = useAuth()
  const [adminType, setAdminType] = useState<AdminType>('none')
  const [ngoId, setNgoId] = useState<string | undefined>()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setAdminType('none')
        setNgoId(undefined)
        setLoading(false)
        return
      }

      try {
        // Check if user is system admin
        const { data: systemAdminData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .in('role', ['admin', 'system_admin'])
          .maybeSingle()

        if (systemAdminData) {
          setAdminType('system_admin')
          setNgoId(undefined)
          setLoading(false)
          return
        }

        // Check if user is NGO admin
        const { data: ngoAdminData } = await supabase
          .from('ngo_members')
          .select('ngo_id, role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .eq('is_active', true)
          .maybeSingle()

        if (ngoAdminData) {
          setAdminType('ngo_admin')
          setNgoId(ngoAdminData.ngo_id)
        } else {
          setAdminType('none')
          setNgoId(undefined)
        }
      } catch (error) {
        console.error('Error checking admin status:', error)
        setAdminType('none')
        setNgoId(undefined)
      } finally {
        setLoading(false)
      }
    }

    checkAdminStatus()
  }, [user])

  return { adminType, ngoId, loading }
}
