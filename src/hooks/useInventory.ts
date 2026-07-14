import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useUserProfile } from './useUserProfile'
import { toast } from '@/hooks/use-toast'
import { useEffect } from 'react'
import { useBranchContext } from '@/contexts/BranchContext'

export interface InventoryItem {
  id: string
  name: string
  category?: string
  sku?: string
  barcode?: string
  description?: string
  unit_price: number
  cost_price?: number
  stock_quantity: number
  min_stock_level?: number
  supplier?: string
  location?: string
  is_active?: boolean
  branch_id?: string
  created_at: string
  updated_at: string
}

export interface InventoryFormData {
  name: string
  category?: string
  sku?: string
  barcode?: string
  description?: string
  unit_price: number
  cost_price?: number
  stock_quantity: number
  min_stock_level?: number
  supplier?: string
  location?: string
  is_active?: boolean
  branch_id?: string
}

type MutationContext = {
  previousData: InventoryItem[] | undefined
}

export function useInventory(businessId?: string) {
  const { user } = useAuth()
  const { business } = useUserProfile()
  const { selectedBranchId, branchResolved } = useBranchContext()
  const queryClient = useQueryClient()
  const QUERY_KEY = ['inventory', businessId, selectedBranchId]

  const { data: inventory = [], isLoading: loading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<InventoryItem[]> => {
      if (!user) return []

      let query = supabase
        .from('inventory')
        .select('*')

      if (businessId) {
        query = query.eq('business_id', businessId)
      }

      // Filter by branch if selected
      if (selectedBranchId) {
        query = query.eq('branch_id', selectedBranchId)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!user && branchResolved,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('inventory-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: QUERY_KEY })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient, selectedBranchId])

  const addInventoryItemMutation = useMutation({
    mutationFn: async (itemData: InventoryFormData) => {
      if (!user || !business) throw new Error('User or business not found')

      const { data, error } = await supabase
        .from('inventory')
        .insert({
          ...itemData,
          user_id: user.id,
          business_id: business.id,
          branch_id: itemData.branch_id || null
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onMutate: async (newItem): Promise<MutationContext> => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY })
      const previousData = queryClient.getQueryData<InventoryItem[]>(QUERY_KEY)

      queryClient.setQueryData<InventoryItem[]>(QUERY_KEY, (old = []) => [
        {
          id: 'temp-' + Date.now(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...newItem
        },
        ...old
      ])

      return { previousData }
    },
    onError: (error, _newItem, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(QUERY_KEY, context.previousData)
      }
      console.error('Error adding inventory item:', error)
      toast({
        title: 'Error',
        description: 'Failed to add inventory item',
        variant: 'destructive'
      })
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Inventory item added successfully'
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    }
  })

  const updateInventoryItemMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<InventoryFormData> }) => {
      if (!user) throw new Error('User not found')

      const { data, error } = await supabase
        .from('inventory')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onMutate: async ({ id, updates }): Promise<MutationContext> => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY })
      const previousData = queryClient.getQueryData<InventoryItem[]>(QUERY_KEY)

      queryClient.setQueryData<InventoryItem[]>(QUERY_KEY, (old = []) =>
        old.map(item =>
          item.id === id
            ? { ...item, ...updates, updated_at: new Date().toISOString() }
            : item
        )
      )

      return { previousData }
    },
    onError: (error, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(QUERY_KEY, context.previousData)
      }
      console.error('Error updating inventory item:', error)
      toast({
        title: 'Error',
        description: 'Failed to update inventory item',
        variant: 'destructive'
      })
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Inventory item updated successfully'
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    }
  })

  const deleteInventoryItemMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('User not found')

      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
    },
    onMutate: async (id): Promise<MutationContext> => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY })
      const previousData = queryClient.getQueryData<InventoryItem[]>(QUERY_KEY)

      queryClient.setQueryData<InventoryItem[]>(QUERY_KEY, (old = []) =>
        old.filter(item => item.id !== id)
      )

      return { previousData }
    },
    onError: (error, _id, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(QUERY_KEY, context.previousData)
      }
      console.error('Error deleting inventory item:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete inventory item',
        variant: 'destructive'
      })
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Inventory item deleted successfully'
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    }
  })

  const updateStockMutation = useMutation({
    mutationFn: async ({ id, newQuantity }: { id: string; newQuantity: number }) => {
      if (!user) throw new Error('User not found')

      const { data, error } = await supabase
        .from('inventory')
        .update({ stock_quantity: Math.max(0, newQuantity) })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onMutate: async ({ id, newQuantity }): Promise<MutationContext> => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY })
      const previousData = queryClient.getQueryData<InventoryItem[]>(QUERY_KEY)

      queryClient.setQueryData<InventoryItem[]>(QUERY_KEY, (old = []) =>
        old.map(item =>
          item.id === id
            ? { ...item, stock_quantity: Math.max(0, newQuantity), updated_at: new Date().toISOString() }
            : item
        )
      )

      return { previousData }
    },
    onError: (error, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(QUERY_KEY, context.previousData)
      }
      console.error('Error updating stock:', error)
      toast({
        title: 'Error',
        description: 'Failed to update stock quantity',
        variant: 'destructive'
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    }
  })

  const getStockStatus = (item: InventoryItem) => {
    if (item.stock_quantity <= 0) return 'out'
    if (item.stock_quantity <= 3) return 'critical'
    if (item.min_stock_level && item.stock_quantity < item.min_stock_level) return 'low'
    return 'good'
  }

  const criticalItems = inventory.filter(item => getStockStatus(item) === 'critical').length
  const lowItems = inventory.filter(item => getStockStatus(item) === 'low').length
  const outOfStockItems = inventory.filter(item => getStockStatus(item) === 'out').length
  const totalValue = inventory.reduce((sum, item) => sum + (item.stock_quantity * item.unit_price), 0)

  return {
    inventory,
    loading,
    addInventoryItem: (data: InventoryFormData) => addInventoryItemMutation.mutateAsync(data),
    updateInventoryItem: (id: string, updates: Partial<InventoryFormData>) => 
      updateInventoryItemMutation.mutateAsync({ id, updates }),
    deleteInventoryItem: (id: string) => deleteInventoryItemMutation.mutateAsync(id),
    updateStock: (id: string, newQuantity: number) => 
      updateStockMutation.mutateAsync({ id, newQuantity }),
    fetchInventory: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
    getStockStatus,
    criticalItems,
    lowItems,
    outOfStockItems,
    totalValue
  }
}
