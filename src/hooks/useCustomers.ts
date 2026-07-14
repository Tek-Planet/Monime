import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { getOrCreateBusinessId } from '@/lib/getOrCreateBusinessId'
import { useEffect } from 'react'
import { useBranchContext } from '@/contexts/BranchContext'

interface Customer {
  id: string
  user_id: string
  business_id: string
  branch_id?: string
  name: string
  email?: string
  phone?: string
  address?: string
  business_type?: string
  credit_limit?: number
  current_balance?: number
  birthday?: string
  created_at: string
  updated_at: string
}

interface CreateCustomerData {
  name: string
  email?: string
  phone?: string
  address?: string
  business_type?: string
  credit_limit?: number
  birthday?: string
  branch_id?: string
}

type MutationContext = {
  previousData: Customer[] | undefined
}

export function useCustomers(businessId?: string) {
  const { user } = useAuth()
  const { selectedBranchId, branchResolved, isBusinessOwner, isHqMember } = useBranchContext()
  const queryClient = useQueryClient()
  const QUERY_KEY = ['customers', businessId, selectedBranchId]

  const { data: customers = [], isLoading: loading, error } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<Customer[]> => {
      if (!user) return []

      const canViewAll = isBusinessOwner || isHqMember;
      
      // This is a hard guard. If branch context is resolved and a non-privileged user
      // does not have a branch selected, we must prevent fetching aggregated data.
      if (branchResolved && !canViewAll && !selectedBranchId) {
          console.warn("Data fetch blocked: A non-privileged user must have a branch selected.");
          return [];
      }

      let query = supabase
        .from('customers')
        .select('*')

      if (businessId) {
        query = query.eq('business_id', businessId)
      }

      // If a specific branch is selected, filter by it. 
      // If selectedBranchId is null (for owners/HQ viewing "All Branches"), this filter is skipped.
      if (selectedBranchId) {
        query = query.eq('branch_id', selectedBranchId)
      }

      const { data, error } = await query.order('name', { ascending: true })

      if (error) {
        console.error('Error fetching customers:', error)
        throw error
      }

      return data || []
    },
    // The query is enabled only when the user is loaded and branch access is resolved.
    enabled: !!user && branchResolved,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('customers-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'customers',
          filter: `business_id=eq.${businessId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: QUERY_KEY })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient, businessId, selectedBranchId])

  const createCustomerMutation = useMutation({
    mutationFn: async (customerData: CreateCustomerData) => {
      if (!user) throw new Error('User not authenticated')

      const businessId = await getOrCreateBusinessId(user.id)
      
      if (!businessId) throw new Error('Failed to get business')

      const { data, error } = await supabase
        .from('customers')
        .insert([{
          user_id: user.id,
          business_id: businessId,
          // Ensure the branch_id from the modal is used
          branch_id: customerData.branch_id || selectedBranchId || null,
          ...customerData
        }])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onMutate: async (newCustomer): Promise<MutationContext> => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY })
      const previousData = queryClient.getQueryData<Customer[]>(QUERY_KEY)

      queryClient.setQueryData<Customer[]>(QUERY_KEY, (old = []) => [
        {
          id: 'temp-' + Date.now(),
          user_id: user?.id || '',
          business_id: businessId || '',
          current_balance: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...newCustomer,
          branch_id: newCustomer.branch_id || selectedBranchId || undefined
        },
        ...old
      ])

      return { previousData }
    },
    onError: (err, _newCustomer, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(QUERY_KEY, context.previousData)
      }
      console.error('Error creating customer:', err)
      toast.error('Failed to create customer')
    },
    onSuccess: () => {
      toast.success('Customer created successfully')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    }
  })

  const updateCustomerMutation = useMutation({
    mutationFn: async ({ customerId, updates }: { customerId: string; updates: Partial<Customer> }) => {
      const { error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', customerId)

      if (error) throw error
    },
    onMutate: async ({ customerId, updates }): Promise<MutationContext> => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY })
      const previousData = queryClient.getQueryData<Customer[]>(QUERY_KEY)

      queryClient.setQueryData<Customer[]>(QUERY_KEY, (old = []) =>
        old.map(customer =>
          customer.id === customerId
            ? { ...customer, ...updates, updated_at: new Date().toISOString() }
            : customer
        )
      )

      return { previousData }
    },
    onError: (err, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(QUERY_KEY, context.previousData)
      }
      console.error('Error updating customer:', err)
      toast.error('Failed to update customer')
    },
    onSuccess: () => {
      toast.success('Customer updated successfully')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    }
  })

  const deleteCustomerMutation = useMutation({
    mutationFn: async (customerId: string) => {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId)

      if (error) throw error
    },
    onMutate: async (customerId): Promise<MutationContext> => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY })
      const previousData = queryClient.getQueryData<Customer[]>(QUERY_KEY)

      queryClient.setQueryData<Customer[]>(QUERY_KEY, (old = []) =>
        old.filter(customer => customer.id !== customerId)
      )

      return { previousData }
    },
    onError: (err, _customerId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(QUERY_KEY, context.previousData)
      }
      console.error('Error deleting customer:', err)
      toast.error('Failed to delete customer')
    },
    onSuccess: () => {
      toast.success('Customer deleted successfully')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    }
  })

  return {
    customers,
    loading,
    error: error?.message || null,
    createCustomer: createCustomerMutation.mutateAsync,
    updateCustomer: updateCustomerMutation.mutateAsync,
    deleteCustomer: deleteCustomerMutation.mutateAsync,
    refetch: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY })
  }
}
