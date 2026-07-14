import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export interface AdminUser {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  created_at: string
  is_admin: boolean
}

export const adminUsersKeys = {
  all: ['admin', 'users'] as const,
}

async function fetchAdminUsers(): Promise<AdminUser[]> {
  // Fetch profiles and admin roles in parallel
  const [profilesResult, rolesResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('user_id, first_name, last_name, email, created_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('user_roles')
      .select('user_id, role')
      .in('role', ['admin', 'system_admin'])
  ])

  if (profilesResult.error) throw profilesResult.error

  const profiles = profilesResult.data || []
  const roles = rolesResult.data || []

  // Create a set of admin user IDs
  const adminUserIds = new Set(roles.map(r => r.user_id))

  return profiles.map(profile => ({
    id: profile.user_id,
    email: profile.email || 'N/A',
    first_name: profile.first_name,
    last_name: profile.last_name,
    created_at: profile.created_at,
    is_admin: adminUserIds.has(profile.user_id),
  }))
}

export function useAdminUsers() {
  return useQuery({
    queryKey: adminUsersKeys.all,
    queryFn: fetchAdminUsers,
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke('admin-delete-user', {
        body: { userId }
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      return data
    },
    onSuccess: () => {
      toast.success('User deleted successfully')
      queryClient.invalidateQueries({ queryKey: adminUsersKeys.all })
    },
    onError: (error: any) => {
      console.error('Error deleting user:', error)
      toast.error(error.message || 'Failed to delete user')
    },
  })
}

interface UpdateUserData {
  userId: string
  firstName: string
  lastName: string
  isAdmin: boolean
}

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdateUserData) => {
      const { data: result, error } = await supabase.functions.invoke('admin-update-user', {
        body: data
      })
      if (error) throw error
      if (result?.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      toast.success('User updated successfully')
      queryClient.invalidateQueries({ queryKey: adminUsersKeys.all })
    },
    onError: (error: any) => {
      console.error('Error updating user:', error)
      toast.error(error.message || 'Failed to update user')
    },
  })
}

interface CreateAdminUserData {
  email: string
  password: string
  firstName: string
  lastName: string
}

export function useCreateAdminUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateAdminUserData) => {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Failed to create user')

      // Wait for profile trigger
      await new Promise(resolve => setTimeout(resolve, 1000))

      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: 'admin',
        })

      if (roleError) throw roleError

      // Send notification (non-blocking)
      try {
        await supabase.functions.invoke('send-admin-notification', {
          body: {
            action: 'admin_created',
            userEmail: data.email,
            userName: `${data.firstName} ${data.lastName}`.trim(),
          },
        })
      } catch (notificationError) {
        console.error('Failed to send notification:', notificationError)
      }

      return authData.user
    },
    onSuccess: () => {
      toast.success('Admin user created successfully')
      queryClient.invalidateQueries({ queryKey: adminUsersKeys.all })
    },
    onError: (error: any) => {
      console.error('Error creating admin user:', error)
      toast.error(error.message || 'Failed to create admin user')
    },
  })
}
