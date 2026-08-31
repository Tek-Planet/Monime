import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { getOrCreateBusinessId, getBusinessId } from '@/lib/getOrCreateBusinessId'
import { useEffect } from 'react'
import { useBranchContext } from '@/contexts/BranchContext'
import { useAuth } from '@/contexts/AuthContext'
import { fetchAllPages } from '@/lib/fetchAllPages'
import { offlineDb, type LocalSale } from '@/lib/offlineDb'
import { cacheSales, recordOfflineSale } from '@/lib/offlineSyncEngine'

export interface Sale {
  id: string
  user_id: string
  business_id: string
  branch_id?: string
  customer_id?: string
  invoice_id?: string
  sale_date: string
  total_amount: number
  payment_method: 'cash' | 'mobile_money' | 'bank_transfer' | 'credit'
  notes?: string
  created_at: string
  is_offline?: boolean
  synced?: boolean
  customer?: {
    id: string
    name: string
    email?: string
    phone?: string
  }
}

export interface SaleItemData {
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
}

export interface CreateSaleData {
  customer_id?: string
  invoice_id?: string
  total_amount: number
  payment_method: 'cash' | 'mobile_money' | 'bank_transfer' | 'credit'
  notes?: string
  sale_date?: string
  items?: SaleItemData[]
  branch_id?: string
}

type MutationContext = {
  previousData: Sale[] | undefined
}

const getLocalSales = async (targetBusinessId?: string, branchId?: string | null): Promise<Sale[]> => {
  try {
    let localRows = await offlineDb.sales.toArray();
    if (targetBusinessId) {
      localRows = localRows.filter(s => s.business_id === targetBusinessId);
    }
    if (branchId) {
      localRows = localRows.filter(s => s.branch_id === branchId || !s.branch_id);
    }
    // Attach customer names from local dexie cache
    const customers = await offlineDb.customers.toArray();
    const customerMap = new Map(customers.map(c => [c.id, c]));

    const formatted: Sale[] = localRows.map(s => ({
      id: s.id,
      user_id: s.user_id || '',
      business_id: s.business_id,
      branch_id: s.branch_id || undefined,
      customer_id: s.customer_id || undefined,
      invoice_id: s.invoice_id || undefined,
      sale_date: s.sale_date,
      total_amount: s.total_amount,
      payment_method: s.payment_method,
      notes: s.notes || undefined,
      created_at: s.created_at,
      is_offline: s.is_offline,
      synced: s.synced,
      customer: s.customer_id && customerMap.has(s.customer_id)
        ? {
            id: s.customer_id,
            name: customerMap.get(s.customer_id)!.name,
            email: customerMap.get(s.customer_id)!.email || undefined,
            phone: customerMap.get(s.customer_id)!.phone || undefined,
          }
        : undefined,
    }));

    return formatted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } catch (err) {
    console.warn('Error reading local Dexie sales:', err);
    return [];
  }
};

const fetchSalesData = async (businessId?: string, branchId?: string | null, userId?: string): Promise<Sale[]> => {
  let targetBusinessId = businessId
  if (!targetBusinessId && userId) {
    targetBusinessId = (await getBusinessId(userId)) || undefined
  }
  if (!targetBusinessId) {
    // If offline and no targetBusinessId, try to load any cached sales
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return await getLocalSales();
    }
    return []
  }

  // If completely offline, return local Dexie cache immediately
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return await getLocalSales(targetBusinessId, branchId);
  }

  try {
    const buildQuery = () => {
      let query = supabase
        .from('sales')
        .select(`
          *,
          customer:customers(id, name, email, phone)
        `)
        .eq('business_id', targetBusinessId)

      if (branchId) {
        query = query.or(`branch_id.eq.${branchId},branch_id.is.null`)
      }

      return query.order('created_at', { ascending: false })
    }

    const remoteSales = await fetchAllPages<Sale>(buildQuery)

    // Cache remote sales in background to Dexie for offline use
    cacheSales(remoteSales.map(s => ({
      id: s.id,
      user_id: s.user_id,
      business_id: s.business_id,
      branch_id: s.branch_id || null,
      customer_id: s.customer_id || null,
      invoice_id: s.invoice_id || null,
      sale_date: s.sale_date,
      total_amount: s.total_amount,
      payment_method: s.payment_method,
      notes: s.notes || null,
      created_at: s.created_at,
      synced: true,
      is_offline: false,
    }))).catch(() => {});

    // Also load any pending unsynced offline sales and merge
    try {
      const unsyncedOffline = await offlineDb.sales
        .filter(s => s.synced === false && s.business_id === targetBusinessId)
        .toArray();

      if (unsyncedOffline.length > 0) {
        const existingIds = new Set(remoteSales.map(s => s.id));
        const extraOffline: Sale[] = unsyncedOffline
          .filter(s => !existingIds.has(s.id))
          .map(s => ({
            id: s.id,
            user_id: s.user_id || '',
            business_id: s.business_id,
            branch_id: s.branch_id || undefined,
            customer_id: s.customer_id || undefined,
            invoice_id: s.invoice_id || undefined,
            sale_date: s.sale_date,
            total_amount: s.total_amount,
            payment_method: s.payment_method,
            notes: s.notes || undefined,
            created_at: s.created_at,
            is_offline: true,
            synced: false,
          }));

        return [...extraOffline, ...remoteSales].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }
    } catch {
      // ignore
    }

    return remoteSales;
  } catch (error) {
    console.warn('Network error fetching sales from Supabase, loading from offline cache:', error);
    return await getLocalSales(targetBusinessId, branchId);
  }
}

export function useSales(businessId?: string) {
  const { user, loading: authLoading } = useAuth()
  const { selectedBranchId, branchResolved } = useBranchContext()
  const QUERY_KEY = ['sales', businessId, selectedBranchId]
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: sales = [], isLoading: loading, error } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => fetchSalesData(businessId, selectedBranchId, user?.id),
    enabled: !!user && !authLoading && branchResolved,
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  useEffect(() => {
    if (!user || !branchResolved) return

    const channel = supabase
      .channel('sales-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sales'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: QUERY_KEY })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient, selectedBranchId, branchResolved, businessId, user?.id])

  const createSaleMutation = useMutation({
    mutationFn: async (saleData: CreateSaleData) => {
      if (!user) {
        throw new Error('You must be logged in to create sales')
      }

      let bId = businessId;
      if (!bId) {
        bId = await getOrCreateBusinessId(user.id) || undefined;
      }
      if (!bId) {
        // Fallback for offline mode if business id can be determined from cached sales or metadata
        const cachedSale = await offlineDb.sales.toCollection().first();
        if (cachedSale?.business_id) {
          bId = cachedSale.business_id;
        } else {
          throw new Error('Failed to resolve business');
        }
      }

      // Check if offline
      const isDeviceOffline = typeof navigator !== 'undefined' && !navigator.onLine;

      if (isDeviceOffline) {
        const localSale = await recordOfflineSale({
          user_id: user.id,
          business_id: bId,
          branch_id: saleData.branch_id || null,
          customer_id: saleData.customer_id || null,
          invoice_id: saleData.invoice_id || null,
          sale_date: saleData.sale_date,
          total_amount: saleData.total_amount,
          payment_method: saleData.payment_method,
          notes: saleData.notes || null,
          items: saleData.items,
        });

        return {
          ...localSale,
          is_offline: true,
          synced: false,
        } as Sale;
      }

      try {
        const { data: sale, error } = await supabase
          .from('sales')
          .insert({
            user_id: user.id,
            business_id: bId,
            branch_id: saleData.branch_id || null,
            customer_id: saleData.customer_id,
            invoice_id: saleData.invoice_id,
            sale_date: saleData.sale_date || new Date().toISOString().split('T')[0],
            total_amount: saleData.total_amount,
            payment_method: saleData.payment_method,
            notes: saleData.notes
          })
          .select()
          .single()

        if (error) throw error

        // Store sale items and reduce inventory stock
        if (saleData.items && saleData.items.length > 0) {
          const saleItemsToInsert = saleData.items.map(item => ({
            sale_id: sale.id,
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.quantity * item.unit_price,
            user_id: user.id,
            business_id: bId,
            branch_id: saleData.branch_id || null
          }))

          const { error: itemsError } = await supabase
            .from('sale_items')
            .insert(saleItemsToInsert)

          if (itemsError) {
            console.error('Error inserting sale items:', itemsError)
          }

          // Reduce inventory stock for each sold item
          for (const item of saleData.items) {
            const { data: inventoryItem } = await supabase
              .from('inventory')
              .select('stock_quantity')
              .eq('id', item.product_id)
              .single()

            if (inventoryItem) {
              await supabase
                .from('inventory')
                .update({
                  stock_quantity: Math.max(0, inventoryItem.stock_quantity - item.quantity)
                })
                .eq('id', item.product_id)
            }
          }
        }

        return sale;
      } catch (err: any) {
        // If network error during submission, gracefully record offline
        console.warn('Network call failed, recording sale offline:', err);
        const localSale = await recordOfflineSale({
          user_id: user.id,
          business_id: bId,
          branch_id: saleData.branch_id || null,
          customer_id: saleData.customer_id || null,
          invoice_id: saleData.invoice_id || null,
          sale_date: saleData.sale_date,
          total_amount: saleData.total_amount,
          payment_method: saleData.payment_method,
          notes: saleData.notes || null,
          items: saleData.items,
        });

        return {
          ...localSale,
          is_offline: true,
          synced: false,
        } as Sale;
      }
    },
    onMutate: async (newSale): Promise<MutationContext> => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY })
      const previousData = queryClient.getQueryData<Sale[]>(QUERY_KEY)

      queryClient.setQueryData<Sale[]>(QUERY_KEY, (old = []) => [
        {
          id: 'temp-' + Date.now(),
          user_id: '',
          business_id: '',
          sale_date: newSale.sale_date || new Date().toISOString().split('T')[0],
          total_amount: newSale.total_amount,
          payment_method: newSale.payment_method,
          notes: newSale.notes,
          customer_id: newSale.customer_id,
          created_at: new Date().toISOString(),
          is_offline: typeof navigator !== 'undefined' && !navigator.onLine,
          synced: typeof navigator !== 'undefined' ? navigator.onLine : true,
        } as Sale,
        ...old
      ])

      return { previousData }
    },
    onError: (err, _newSale, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(QUERY_KEY, context.previousData)
      }
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to create sale',
        variant: "destructive"
      })
    },
    onSuccess: (result) => {
      if (result && 'is_offline' in result && result.is_offline) {
        toast({
          title: "Sale Saved Locally (Offline)",
          description: "Stored securely on device. It will automatically sync to the database once online.",
        });
      } else {
        toast({
          title: "Success",
          description: "Sale recorded successfully"
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    }
  })

  const updateSaleMutation = useMutation({
    mutationFn: async ({ saleId, updates }: {
      saleId: string;
      updates: {
        customer_id?: string | null;
        payment_method?: 'cash' | 'mobile_money' | 'bank_transfer' | 'credit';
        notes?: string;
        items?: SaleItemData[];
      };
    }) => {
      if (!user) {
        throw new Error('You must be logged in to update sales')
      }

      const { data: sale } = await supabase
        .from('sales')
        .select('business_id, branch_id')
        .eq('id', saleId)
        .single()

      if (!sale) throw new Error('Sale not found')

      if (updates.items && updates.items.length > 0) {
        const { data: oldSaleItems } = await supabase
          .from('sale_items')
          .select('product_id, quantity')
          .eq('sale_id', saleId)

        if (oldSaleItems && oldSaleItems.length > 0) {
          for (const item of oldSaleItems) {
            if (item.product_id) {
              const { data: inventoryItem } = await supabase
                .from('inventory')
                .select('stock_quantity')
                .eq('id', item.product_id)
                .single()

              if (inventoryItem) {
                await supabase
                  .from('inventory')
                  .update({
                    stock_quantity: inventoryItem.stock_quantity + item.quantity
                  })
                  .eq('id', item.product_id)
              }
            }
          }
        }

        await supabase
          .from('sale_items')
          .delete()
          .eq('sale_id', saleId)

        const saleItemsToInsert = updates.items.map(item => ({
          sale_id: saleId,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.quantity * item.unit_price,
          user_id: user.id,
          business_id: sale.business_id,
          branch_id: sale.branch_id
        }))

        const { error: itemsError } = await supabase
          .from('sale_items')
          .insert(saleItemsToInsert)

        if (itemsError) {
          console.error('Error inserting sale items:', itemsError)
        }

        for (const item of updates.items) {
          const { data: inventoryItem } = await supabase
            .from('inventory')
            .select('stock_quantity')
            .eq('id', item.product_id)
            .single()

          if (inventoryItem) {
            await supabase
              .from('inventory')
              .update({
                stock_quantity: Math.max(0, inventoryItem.stock_quantity - item.quantity)
              })
              .eq('id', item.product_id)
          }
        }

        const newTotal = updates.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)

        const { error } = await supabase
          .from('sales')
          .update({
            customer_id: updates.customer_id,
            payment_method: updates.payment_method,
            notes: updates.notes,
            total_amount: newTotal
          })
          .eq('id', saleId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('sales')
          .update({
            customer_id: updates.customer_id,
            payment_method: updates.payment_method,
            notes: updates.notes
          })
          .eq('id', saleId)

        if (error) throw error
      }
    },
    onMutate: async ({ saleId, updates }): Promise<MutationContext> => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY })
      const previousData = queryClient.getQueryData<Sale[]>(QUERY_KEY)

      queryClient.setQueryData<Sale[]>(QUERY_KEY, (old = []) =>
        old.map(sale =>
          sale.id === saleId
            ? {
                ...sale,
                customer_id: updates.customer_id ?? sale.customer_id,
                payment_method: updates.payment_method ?? sale.payment_method,
                notes: updates.notes ?? sale.notes,
                total_amount: updates.items
                  ? updates.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
                  : sale.total_amount
              }
            : sale
        )
      )

      return { previousData }
    },
    onError: (err, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(QUERY_KEY, context.previousData)
      }
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to update sale',
        variant: "destructive"
      })
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Sale updated successfully"
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    }
  })

  const deleteSaleMutation = useMutation({
    mutationFn: async (saleId: string) => {
      const { data: saleItems } = await supabase
        .from('sale_items')
        .select('product_id, quantity')
        .eq('sale_id', saleId)

      if (saleItems && saleItems.length > 0) {
        for (const item of saleItems) {
          if (item.product_id) {
            const { data: inventoryItem } = await supabase
              .from('inventory')
              .select('stock_quantity')
              .eq('id', item.product_id)
              .single()

            if (inventoryItem) {
              await supabase
                .from('inventory')
                .update({
                  stock_quantity: inventoryItem.stock_quantity + item.quantity
                })
                .eq('id', item.product_id)
            }
          }
        }
      }

      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', saleId)

      if (error) throw error
    },
    onMutate: async (saleId): Promise<MutationContext> => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY })
      const previousData = queryClient.getQueryData<Sale[]>(QUERY_KEY)

      queryClient.setQueryData<Sale[]>(QUERY_KEY, (old = []) =>
        old.filter(sale => sale.id !== saleId)
      )

      return { previousData }
    },
    onError: (err, _saleId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(QUERY_KEY, context.previousData)
      }
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to delete sale',
        variant: "destructive"
      })
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Sale deleted and inventory restored successfully"
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    }
  })

  return {
    sales,
    loading,
    error: error?.message || null,
    createSale: (data: CreateSaleData) => createSaleMutation.mutateAsync(data),
    updateSale: (saleId: string, updates: Parameters<typeof updateSaleMutation.mutateAsync>[0]['updates']) => 
      updateSaleMutation.mutateAsync({ saleId, updates }),
    deleteSale: (saleId: string) => deleteSaleMutation.mutateAsync(saleId),
    refetch: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY })
  }
}
