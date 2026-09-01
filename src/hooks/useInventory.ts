import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useUserProfile } from './useUserProfile'
import { toast } from '@/hooks/use-toast'
import { useEffect, useMemo } from 'react'
import { useBranchContext } from '@/contexts/BranchContext'
import { fetchAllPages } from '@/lib/fetchAllPages'
import { offlineDb, type LocalInventoryItem } from '@/lib/offlineDb'
import { cacheInventoryItems } from '@/lib/offlineSyncEngine'

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

const getLocalInventory = async (businessId?: string, branchId?: string | null): Promise<InventoryItem[]> => {
  try {
    let localRows = await offlineDb.inventory.toArray();
    if (businessId) {
      localRows = localRows.filter(i => i.business_id === businessId);
    }
    if (branchId) {
      localRows = localRows.filter(i => i.branch_id === branchId || !i.branch_id);
    }

    return localRows.map(i => ({
      id: i.id,
      name: i.name,
      category: i.category || undefined,
      unit_price: i.unit_price,
      cost_price: i.cost_price || undefined,
      stock_quantity: i.stock_quantity,
      min_stock_level: i.min_stock_level || undefined,
      supplier: i.supplier || undefined,
      location: i.location || undefined,
      is_active: i.is_active,
      branch_id: i.branch_id || undefined,
      created_at: i.updated_at || new Date().toISOString(),
      updated_at: i.updated_at || new Date().toISOString(),
    }));
  } catch (err) {
    console.warn('Error reading local Dexie inventory:', err);
    return [];
  }
};

export function useInventory(businessId?: string) {
  const { user } = useAuth()
  const { business } = useUserProfile()
  const { selectedBranchId, branchResolved } = useBranchContext()
  const queryClient = useQueryClient()
  const QUERY_KEY = ['inventory', businessId, selectedBranchId]

  const { data: inventory = [], isLoading: loading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<InventoryItem[]> => {
      const isDeviceOffline = typeof navigator !== 'undefined' && !navigator.onLine;
      const bId = businessId || business?.id;

      if (isDeviceOffline) {
        return await getLocalInventory(bId, selectedBranchId);
      }

      if (!user) return []

      try {
        const buildQuery = () => {
          let query = supabase
            .from('inventory')
            .select('*')

          if (businessId) {
            query = query.eq('business_id', businessId)
          }

          if (selectedBranchId) {
            query = query.eq('branch_id', selectedBranchId)
          }

          return query.order('created_at', { ascending: false })
        }

        const remoteInventory = await fetchAllPages<InventoryItem>(buildQuery)

        // Cache remote items in Dexie for offline use
        cacheInventoryItems(remoteInventory.map(item => ({
          id: item.id,
          business_id: businessId || business?.id,
          branch_id: item.branch_id || null,
          name: item.name,
          category: item.category || null,
          unit_price: item.unit_price,
          cost_price: item.cost_price || null,
          stock_quantity: item.stock_quantity,
          min_stock_level: item.min_stock_level || null,
          supplier: item.supplier || null,
          location: item.location || null,
          is_active: item.is_active,
          updated_at: item.updated_at,
        }))).catch(() => {});

        return remoteInventory;
      } catch (err) {
        console.warn('Error fetching inventory from network, reading local Dexie:', err);
        return await getLocalInventory(bId, selectedBranchId);
      }
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
  }, [queryClient, businessId, selectedBranchId])

  const addInventoryItemMutation = useMutation({
    mutationFn: async (itemData: InventoryFormData) => {
      if (!user || !business) throw new Error('User or business not found')

      const isDeviceOffline = typeof navigator !== 'undefined' && !navigator.onLine;

      if (isDeviceOffline) {
        const id = crypto.randomUUID ? crypto.randomUUID() : 'offline-item-' + Date.now();
        const localItem: LocalInventoryItem = {
          id,
          business_id: business.id,
          branch_id: itemData.branch_id || null,
          name: itemData.name,
          category: itemData.category || null,
          unit_price: itemData.unit_price,
          cost_price: itemData.cost_price || null,
          stock_quantity: itemData.stock_quantity,
          min_stock_level: itemData.min_stock_level || null,
          supplier: itemData.supplier || null,
          location: itemData.location || null,
          is_active: itemData.is_active ?? true,
          updated_at: new Date().toISOString(),
        };

        await offlineDb.inventory.put(localItem);
        return {
          ...localItem,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as InventoryItem;
      }

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

      const isDeviceOffline = typeof navigator !== 'undefined' && !navigator.onLine;
      if (isDeviceOffline) {
        await offlineDb.inventory.update(id, {
          ...updates,
          updated_at: new Date().toISOString(),
        });
        const updated = await offlineDb.inventory.get(id);
        return updated as any;
      }

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

      const isDeviceOffline = typeof navigator !== 'undefined' && !navigator.onLine;
      if (isDeviceOffline) {
        await offlineDb.inventory.delete(id);
        return;
      }

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

  const adjustStockMutation = useMutation({
    mutationFn: async ({ id, quantity, type }: { id: string; quantity: number; type: 'add' | 'subtract' }) => {
      if (!user) throw new Error('User not found')

      const isDeviceOffline = typeof navigator !== 'undefined' && !navigator.onLine;
      if (isDeviceOffline) {
        const item = await offlineDb.inventory.get(id);
        if (item) {
          const newQty = type === 'add' ? item.stock_quantity + quantity : Math.max(0, item.stock_quantity - quantity);
          await offlineDb.inventory.update(id, { stock_quantity: newQty, updated_at: new Date().toISOString() });
        }
        return;
      }

      const { data: item } = await supabase
        .from('inventory')
        .select('stock_quantity')
        .eq('id', id)
        .single()

      if (!item) throw new Error('Item not found')

      const newQuantity = type === 'add' 
        ? item.stock_quantity + quantity 
        : Math.max(0, item.stock_quantity - quantity)

      const { error } = await supabase
        .from('inventory')
        .update({ stock_quantity: newQuantity })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Stock quantity updated successfully'
      })
    },
    onError: (error) => {
      console.error('Error adjusting stock:', error)
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

  // Compute inventory metrics and stock statuses
  const getStockStatus = (item: InventoryItem): 'good' | 'low' | 'critical' | 'out' => {
    const qty = Number(item.stock_quantity) || 0;
    if (qty <= 0) return 'out';
    const minLevel = Number(item.min_stock_level) || 10;
    if (qty <= Math.ceil(minLevel / 2)) return 'critical';
    if (qty <= minLevel) return 'low';
    return 'good';
  };

  const { criticalItems, lowItems, outOfStockItems, totalValue, totalCostValue } = useMemo(() => {
    let critical = 0;
    let low = 0;
    let out = 0;
    let val = 0;
    let cost = 0;

    for (const item of inventory) {
      const qty = Number(item.stock_quantity) || 0;
      const price = Number(item.unit_price) || 0;
      const costPrice = Number(item.cost_price) || 0;

      val += qty * price;
      cost += qty * costPrice;

      const status = getStockStatus(item);
      if (status === 'out') out++;
      else if (status === 'critical') critical++;
      else if (status === 'low') low++;
    }

    return {
      criticalItems: critical,
      lowItems: low,
      outOfStockItems: out,
      totalValue: val,
      totalCostValue: cost,
    };
  }, [inventory]);

  const updateStockMutation = useMutation({
    mutationFn: async ({ id, newQuantity }: { id: string; newQuantity: number }) => {
      if (!user) throw new Error('User not found');
      const isDeviceOffline = typeof navigator !== 'undefined' && !navigator.onLine;
      if (isDeviceOffline) {
        await offlineDb.inventory.update(id, { stock_quantity: newQuantity, updated_at: new Date().toISOString() });
        return;
      }

      const { error } = await supabase
        .from('inventory')
        .update({ stock_quantity: newQuantity, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onMutate: async ({ id, newQuantity }): Promise<MutationContext> => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previousData = queryClient.getQueryData<InventoryItem[]>(QUERY_KEY);

      queryClient.setQueryData<InventoryItem[]>(QUERY_KEY, (old = []) =>
        old.map(item =>
          item.id === id ? { ...item, stock_quantity: newQuantity, updated_at: new Date().toISOString() } : item
        )
      );

      return { previousData };
    },
    onError: (error, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(QUERY_KEY, context.previousData);
      }
      console.error('Error updating stock quantity:', error);
      toast({
        title: 'Error',
        description: 'Failed to update stock quantity',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  return {
    inventory,
    loading,
    criticalItems,
    lowItems,
    outOfStockItems,
    totalValue,
    totalCostValue,
    getStockStatus,
    addInventoryItem: (data: InventoryFormData) => addInventoryItemMutation.mutateAsync(data),
    updateInventoryItem: (id: string, updates: Partial<InventoryFormData>) => 
      updateInventoryItemMutation.mutateAsync({ id, updates }),
    deleteInventoryItem: (id: string) => deleteInventoryItemMutation.mutateAsync(id),
    updateStock: (id: string, newQuantity: number) => updateStockMutation.mutateAsync({ id, newQuantity }),
    adjustStock: (id: string, quantity: number, type: 'add' | 'subtract') =>
      adjustStockMutation.mutateAsync({ id, quantity, type }),
    fetchInventory: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
    refetch: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY })
  }
}
