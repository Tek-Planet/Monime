import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { getOrCreateBusinessId } from '@/lib/getOrCreateBusinessId'
import { useEffect } from 'react'
import { useBranchContext } from '@/contexts/BranchContext'
import { useAuth } from '@/contexts/AuthContext'

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

const fetchSalesData = async (businessId?: string, branchId?: string | null): Promise<Sale[]> => {
  let query = supabase
    .from('sales')
    .select(`
      *,
      customer:customers(id, name, email, phone)
    `)

  if (businessId) {
    query = query.eq('business_id', businessId)
  }

  if (branchId) {
    query = query.eq('branch_id', branchId)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) throw error

  return (data || []) as Sale[]
}

export function useSales(businessId?: string) {
  const { user, loading: authLoading } = useAuth()
  const { selectedBranchId, branchResolved } = useBranchContext()
  const QUERY_KEY = ['sales', businessId, selectedBranchId]
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: sales = [], isLoading: loading, error } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => fetchSalesData(businessId, selectedBranchId),
    enabled: !!user && !authLoading && branchResolved,
    staleTime: 5 * 60 * 1000,
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

      const businessId = await getOrCreateBusinessId(user.id)
      if (!businessId) throw new Error('Failed to get business')

      const { data: sale, error } = await supabase
        .from('sales')
        .insert({
          user_id: user.id,
          business_id: businessId,
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
          business_id: businessId,
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

      return sale
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
          created_at: new Date().toISOString()
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
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Sale recorded successfully"
      })
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
