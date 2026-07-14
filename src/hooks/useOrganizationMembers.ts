import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useUserProfile } from './useUserProfile'
import { toast } from 'sonner'

export interface OrganizationMember {
  id: string
  business_id: string
  user_id: string
  role: string
  accessible_pages: string[]
  invited_by: string | null
  invited_at: string
  joined_at: string
  is_active: boolean
  email?: string
  display_name?: string
  branch_id?: string | null
}

export interface OrganizationInvitation {
  id: string
  business_id: string
  email: string
  accessible_pages: string[]
  invited_by: string
  invitation_token: string
  status: string
  expires_at: string
  created_at: string
}

export function useOrganizationMembers() {
  const { user } = useAuth()
  const { business } = useUserProfile()
  const [members, setMembers] = useState<OrganizationMember[]>([])
  const [invitations, setInvitations] = useState<OrganizationInvitation[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMembers = async () => {
    if (!business?.id) return

    try {
      const { data, error } = await supabase
        .from('organization_members')
        .select('*')
        .eq('business_id', business.id)
        .eq('is_active', true)
        .order('joined_at', { ascending: false })

      if (error) throw error

      setMembers(data || [])
    } catch (error: any) {
      console.error('Error fetching members:', error)
      toast.error('Failed to load team members')
    }
  }

  const fetchInvitations = async () => {
    if (!business?.id) return

    try {
      const { data, error } = await supabase
        .from('organization_invitations')
        .select('*')
        .eq('business_id', business.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) throw error
      setInvitations(data || [])
    } catch (error: any) {
      console.error('Error fetching invitations:', error)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchMembers(), fetchInvitations()])
      setLoading(false)
    }

    if (user && business?.id) {
      loadData()
    }
  }, [user, business?.id])

  const inviteMember = async (email: string, accessiblePages: string[], branchId?: string | null) => {
    if (!business?.id || !user) return

    try {
      // Check for existing invitation
      const { data: existing } = await supabase
        .from('organization_invitations')
        .select('id, status')
        .eq('business_id', business.id)
        .eq('email', email)
        .maybeSingle()

      let invitationId: string

      if (existing) {
        // Update existing invitation
        const { error: updateError } = await supabase
          .from('organization_invitations')
          .update({
            accessible_pages: accessiblePages,
            branch_id: branchId ?? null,
            status: 'pending',
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          })
          .eq('id', existing.id)

        if (updateError) throw updateError
        invitationId = existing.id
      } else {
        // Create new invitation
        const { data: inserted, error } = await supabase
          .from('organization_invitations')
          .insert({
            business_id: business.id,
            email,
            accessible_pages: accessiblePages,
            branch_id: branchId ?? null,
            invited_by: user.id
          })
          .select('id')
          .single()

        if (error) throw error
        invitationId = inserted.id
      }

      // Trigger email invite via Edge Function, passing branchId for later member creation
      const redirectTo = `${window.location.origin}/auth?type=invite`
      const { data: fnData, error: fnError } = await supabase.functions.invoke('send-invitation', {
        body: { invitationId, redirectTo, branchId },
      })

      if (fnError) {
        // Try to extract error message from response
        const errorMessage = fnData?.error || fnError.message || 'Failed to send invitation'
        throw new Error(errorMessage)
      }

      toast.success('Invitation email sent')
      await fetchInvitations()
    } catch (error: any) {
      console.error('Error inviting member:', error)
      toast.error(error.message || 'Failed to send invitation')
    }
  }

  const updateMemberBranch = async (memberId: string, branchId: string | null) => {
    try {
      const { error } = await supabase
        .from('organization_members')
        .update({ branch_id: branchId })
        .eq('id', memberId)

      if (error) throw error

      toast.success('Member branch updated')
      await fetchMembers()
    } catch (error: any) {
      console.error('Error updating member branch:', error)
      toast.error('Failed to update member branch')
    }
  }

  const updateMemberAccess = async (memberId: string, accessiblePages: string[]) => {
    try {
      const { error } = await supabase
        .from('organization_members')
        .update({ accessible_pages: accessiblePages })
        .eq('id', memberId)

      if (error) throw error

      toast.success('Member access updated')
      await fetchMembers()
    } catch (error: any) {
      console.error('Error updating member:', error)
      toast.error('Failed to update member access')
    }
  }

  const removeMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('id', memberId)

      if (error) throw error

      toast.success('Member removed from team')
      await fetchMembers()
    } catch (error: any) {
      console.error('Error removing member:', error)
      toast.error('Failed to remove member')
    }
  }

  const cancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('organization_invitations')
        .delete()
        .eq('id', invitationId)

      if (error) throw error

      toast.success('Invitation cancelled')
      await fetchInvitations()
    } catch (error: any) {
      console.error('Error cancelling invitation:', error)
      toast.error('Failed to cancel invitation')
    }
  }

  return {
    members,
    invitations,
    loading,
    inviteMember,
    updateMemberAccess,
    updateMemberBranch,
    removeMember,
    cancelInvitation,
    refetch: async () => {
      await Promise.all([fetchMembers(), fetchInvitations()])
    }
  }
}
