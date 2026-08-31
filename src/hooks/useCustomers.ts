import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { getOrCreateBusinessId, getBusinessId } from '@/lib/getOrCreateBusinessId'
import { useEffect } from 'react'
import { useBranchContext } from '@/contexts/BranchContext'
import { fetchAllPages } from '@/lib/fetchAllPages'
import { offlineDb, type LocalCustomer } from '@/lib/offlineDb'
import { cacheCustomers, recordOfflineCustomer } from '@/lib/offlineSyncEngine'

export interface Customer {
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

export interface CreateCustomerData {
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

const getLocalCustomers = async (targetBusinessId?: string, branchId?: string | null): Promise<Customer[]> => {
  try {
    let localRows = await offlineDb.customers.toArray();
    if (targetBusinessId) {
      localRows = localRows.filter(c => c.business_id === targetBusinessId);
    }
    if (branchId) {
      localRows = localRows.filter(c => c.branch_id === branchId || !c.branch_id);
    }

    return localRows.map(c => ({
      id: c.id,
      user_id: '',
      business_id: c.business_id || '',
      branch_id: c.branch_id || undefined,
      name: c.name,
      email: c.email || undefined,
      phone: c.phone || undefined,
      current_balance: 0,
      created_at: c.created_at || new Date().toISOString(),
      updated_at: c.created_at || new Date().toISOString(),
    }));
  } catch (err) {
    console.warn('Error reading local Dexie customers:', err);
    return [];
  }
};

export function useCustomers(businessId?: string) {
  const { user } = useAuth()
  const { selectedBranchId, branchResolved, isBusinessOwner, isHqMember } = useBranchContext()
  const queryClient = useQueryClient()
  const QUERY_KEY = ['customers', businessId, selectedBranchId]

  const { data: customers = [], isLoading: loading, error } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<Customer[]> => {
      const isDeviceOffline = typeof navigator !== 'undefined' && !navigator.onLine;

      let targetBusinessId = businessId
      if (!targetBusinessId && user) {
        targetBusinessId = (await getBusinessId(user.id)) || undefined
      }

      if (isDeviceOffline) {
        return await getLocalCustomers(targetBusinessId, selectedBranchId);
      }

      if (!user) return []
      if (!targetBusinessId) return []

      const canViewAll = isBusinessOwner || isHqMember || !!businessId;
      
      if (branchResolved && !canViewAll && !selectedBranchId) {
        return [];
      }

      try {
        const buildQuery = () => {
          let query = supabase
            .from('customers')
            .select('*')
            .eq('business_id', targetBusinessId)

          if (selectedBranchId) {
            query = query.or(`branch_id.eq.${selectedBranchId},branch_id.is.null`)
          }

          return query.order('name', { ascending: true })
        }

        const remoteCustomers = await fetchAllPages<Customer>(buildQuery)

        // Cache into Dexie
        cacheCustomers(remoteCustomers.map(c => ({
          id: c.id,
          business_id: c.business_id,
          branch_id: c.branch_id || null,
          name: c.name,
          email: c.email || null,
          phone: c.phone || null,
          created_at: c.created_at,
        }))).catch(() => {});

        return remoteCustomers;
      } catch (err) {
        console.warn('Error fetching customers from network, using local Dexie cache:', err);
        return await getLocalCustomers(targetBusinessId, selectedBranchId);
      }
    },
    enabled: !!user && branchResolved,
    staleTime: 30 * 1000,
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

      const isDeviceOffline = typeof navigator !== 'undefined' && !navigator.onLine;
      const bId = businessId || (await getOrCreateBusinessId(user.id)) || 'local-biz';

      if (isDeviceOffline) {
        const localCustomer = await recordOfflineCustomer({
          user_id: user.id,
          business_id: bId,
          branch_id: customerData.branch_id || selectedBranchId || null,
          name: customerData.name,
          email: customerData.email || null,
          phone: customerData.phone || null,
        });

        return {
          ...localCustomer,
          user_id: user.id,
          current_balance: 0,
          created_at: localCustomer.created_at || new Date().toISOString(),
          updated_at: localCustomer.created_at || new Date().toISOString(),
        } as Customer;
      }

      try {
        const { data, error } = await supabase
          .from('customers')
          .insert([{
            user_id: user.id,
            business_id: bId,
            branch_id: customerData.branch_id || selectedBranchId || null,
            ...customerData
          }])
          .select()
          .single()

        if (error) throw error
        return data
      } catch (err: any) {
        console.warn('Network failed when creating customer, saving offline:', err);
        const localCustomer = await recordOfflineCustomer({
          user_id: user.id,
          business_id: bId,
          branch_id: customerData.branch_id || selectedBranchId || null,
          name: customerData.name,
          email: customerData.email || null,
          phone: customerData.phone || null,
        });

        return {
          ...localCustomer,
          user_id: user.id,
          current_balance: 0,
          created_at: localCustomer.created_at || new Date().toISOString(),
          updated_at: localCustomer.created_at || new Date().toISOString(),
        } as Customer;
      }
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
      toast.success('Customer saved successfully')
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
