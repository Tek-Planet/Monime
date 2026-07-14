import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'

export interface NGOMember {
  id: string
  ngo_id: string
  user_id: string
  role: string
  is_active: boolean
  created_at: string
  updated_at: string
  user_email?: string
  user_name?: string
}

export interface NGOMembersHook {
  members: NGOMember[]
  loading: boolean
  addMember: (ngoId: string, userId: string, role: 'admin' | 'member') => Promise<void>
  removeMember: (memberId: string) => Promise<void>
  refetch: () => Promise<void>
}

export function useNGOMembers(ngoId?: string): NGOMembersHook {
  const [members, setMembers] = useState<NGOMember[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMembers = async () => {
    if (!ngoId) {
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('ngo_members')
        .select('*')
        .eq('ngo_id', ngoId)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Fetch user details for each member
      const membersWithDetails = await Promise.all(
        (data || []).map(async (member) => {
          // Call edge function to get user email
          const { data: userData } = await supabase.functions.invoke('search-user-by-email', {
            body: { userId: member.user_id }
          })
          
          const { data: profileData } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('user_id', member.user_id)
            .single()

          return {
            ...member,
            user_email: userData?.email || 'Unknown',
            user_name: profileData 
              ? `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim()
              : undefined
          }
        })
      )

      setMembers(membersWithDetails)
    } catch (error) {
      console.error('Error fetching NGO members:', error)
      setMembers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMembers()
  }, [ngoId])

  const addMember = async (ngoId: string, userId: string, role: 'admin' | 'member') => {
    const { error } = await supabase
      .from('ngo_members')
      .insert([{
        ngo_id: ngoId,
        user_id: userId,
        role,
        is_active: true
      }])

    if (error) throw error
    await fetchMembers()
  }

  const removeMember = async (memberId: string) => {
    const { error } = await supabase
      .from('ngo_members')
      .update({ is_active: false })
      .eq('id', memberId)

    if (error) throw error
    await fetchMembers()
  }

  return {
    members,
    loading,
    addMember,
    removeMember,
    refetch: fetchMembers
  }
}
