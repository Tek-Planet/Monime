import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { getOrCreateBusinessId } from '@/lib/getOrCreateBusinessId'
import { useEffect } from 'react'
import { useBranchContext } from '@/contexts/BranchContext'

export interface Supplier {
  id: string
  user_id: string
  business_id: string
  branch_id?: string
  name: string
  phone?: string
  location?: string
  product_category?: string
  notes?: string
  current_balance: number
  created_at: string
  updated_at: string
}

export interface CreateSupplierData {
  name: string
  phone?: string
  location?: string
  product_category?: string
  notes?: string
  branch_id?: string
}

type MutationContext = {
  previousData: Supplier[] | undefined
}

const fetchSuppliersData = async (businessId?: string, branchId?: string | null): Promise<Supplier[]> => {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return []
  }

  let query = supabase
    .from('suppliers')
    .select('*')
    .order('created_at', { ascending: false })

  if (businessId) {
    query = query.eq('business_id', businessId)
  }

  // Filter by branch if selected
  if (branchId) {
    query = query.eq('branch_id', branchId)
  }

  const { data, error } = await query

  if (error) throw error

  return data || []
}

export function useSuppliers(businessId?: string) {
  const { toast } = useToast()
  const { selectedBranchId, branchResolved } = useBranchContext()
  const queryClient = useQueryClient()
  const queryKey = ['suppliers', businessId, selectedBranchId]

  const { data: suppliers = [], isLoading: loading, error } = useQuery({
    queryKey,
    queryFn: () => fetchSuppliersData(businessId, selectedBranchId),
    enabled: branchResolved,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('suppliers-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'suppliers'
      }, () => {
        queryClient.invalidateQueries({ queryKey })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient, selectedBranchId])

  const createSupplierMutation = useMutation({
    mutationFn: async (supplierData: CreateSupplierData) => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('You must be logged in to create suppliers')
      }

      const businessIdToUse = businessId || await getOrCreateBusinessId(user.id)
      if (!businessIdToUse) throw new Error('Failed to get business')

      const { data: supplier, error } = await supabase
        .from('suppliers')
        .insert({
          user_id: user.id,
          business_id: businessIdToUse,
          branch_id: supplierData.branch_id || null,
          ...supplierData
        })
        .select()
        .single()

      if (error) throw error
      return supplier
    },
    onMutate: async (newSupplier): Promise<MutationContext> => {
      await queryClient.cancelQueries({ queryKey })
      const previousData = queryClient.getQueryData<Supplier[]>(queryKey)

      queryClient.setQueryData<Supplier[]>(queryKey, (old = []) => [
        {
          id: 'temp-' + Date.now(),
          user_id: '',
          business_id: '',
          current_balance: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...newSupplier
        },
        ...old
      ])

      return { previousData }
    },
    onError: (err, _newSupplier, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData)
      }
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to create supplier',
        variant: "destructive"
      })
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Supplier created successfully"
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    }
  })

  const updateSupplierMutation = useMutation({
    mutationFn: async ({ supplierId, updates }: { supplierId: string; updates: Partial<Supplier> }) => {
      const { error } = await supabase
        .from('suppliers')
        .update(updates)
        .eq('id', supplierId)

      if (error) throw error
    },
    onMutate: async ({ supplierId, updates }): Promise<MutationContext> => {
      await queryClient.cancelQueries({ queryKey })
      const previousData = queryClient.getQueryData<Supplier[]>(queryKey)

      queryClient.setQueryData<Supplier[]>(queryKey, (old = []) =>
        old.map(supplier =>
          supplier.id === supplierId
            ? { ...supplier, ...updates, updated_at: new Date().toISOString() }
            : supplier
        )
      )

      return { previousData }
    },
    onError: (err, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData)
      }
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to update supplier',
        variant: "destructive"
      })
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Supplier updated successfully"
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    }
  })

  const deleteSupplierMutation = useMutation({
    mutationFn: async (supplierId: string) => {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', supplierId)

      if (error) throw error
    },
    onMutate: async (supplierId): Promise<MutationContext> => {
      await queryClient.cancelQueries({ queryKey })
      const previousData = queryClient.getQueryData<Supplier[]>(queryKey)

      queryClient.setQueryData<Supplier[]>(queryKey, (old = []) =>
        old.filter(supplier => supplier.id !== supplierId)
      )

      return { previousData }
    },
    onError: (err, _supplierId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData)
      }
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to delete supplier',
        variant: "destructive"
      })
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Supplier deleted successfully"
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    }
  })

  return {
    suppliers,
    loading,
    error: error?.message || null,
    createSupplier: (data: CreateSupplierData) => createSupplierMutation.mutateAsync(data),
    updateSupplier: (supplierId: string, updates: Partial<Supplier>) => 
      updateSupplierMutation.mutateAsync({ supplierId, updates }),
    deleteSupplier: (supplierId: string) => deleteSupplierMutation.mutateAsync(supplierId),
    refetch: () => queryClient.invalidateQueries({ queryKey })
  }
}
