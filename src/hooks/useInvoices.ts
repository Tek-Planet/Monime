import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { getOrCreateBusinessId } from '@/lib/getOrCreateBusinessId'
import { useEffect } from 'react'
import { useBranchContext } from '@/contexts/BranchContext'
import { useAuth } from '@/contexts/AuthContext'

export interface Invoice {
  id: string
  user_id: string
  business_id: string
  branch_id?: string
  customer_id?: string
  invoice_number: string
  invoice_date: string
  due_date?: string
  subtotal: number
  tax_amount: number
  total_amount: number
  paid_amount: number
  status: 'draft' | 'sent' | 'partial' | 'paid' | 'overdue' | 'cancelled'
  notes?: string
  created_at: string
  updated_at: string
  customer?: {
    id: string
    name: string
    email?: string
    phone?: string
  }
  invoice_items?: InvoiceItem[]
}

export interface InvoiceItem {
  id: string
  invoice_id: string
  product_id?: string
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
}

export interface CreateInvoiceData {
  customer_id?: string
  due_date?: string
  notes?: string
  branch_id?: string
  items: {
    product_id?: string
    product_name: string
    quantity: number
    unit_price: number
    total_price: number
  }[]
}

type MutationContext = {
  previousData: Invoice[] | undefined
}

const fetchInvoicesData = async (businessId?: string, branchId?: string | null): Promise<Invoice[]> => {
  let query = supabase
    .from('invoices')
    .select(`
      *,
      customer:customers(id, name, email, phone),
      invoice_items(*)
    `)

  if (businessId) {
    query = query.eq('business_id', businessId)
  }

  if (branchId) {
    query = query.eq('branch_id', branchId)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) throw error

  return (data || []) as Invoice[]
}

export function useInvoices(businessId?: string) {
  const { user, loading: authLoading } = useAuth()
  const { selectedBranchId, branchResolved } = useBranchContext()
  const QUERY_KEY = ['invoices', businessId, selectedBranchId]
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: invoices = [], isLoading: loading, error } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => fetchInvoicesData(businessId, selectedBranchId),
    enabled: !!user && !authLoading && branchResolved,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  useEffect(() => {
    if (!user || !branchResolved) return

    const invoicesChannel = supabase
      .channel('invoices-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'invoices'
      }, () => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      })
      .subscribe()

    const itemsChannel = supabase
      .channel('invoice-items-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'invoice_items'
      }, () => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(invoicesChannel)
      supabase.removeChannel(itemsChannel)
    }
  }, [queryClient, selectedBranchId, branchResolved, businessId, user?.id])

  const createInvoiceMutation = useMutation({
    mutationFn: async (invoiceData: CreateInvoiceData) => {
      if (!user) {
        throw new Error('You must be logged in to create invoices')
      }

      const businessId = await getOrCreateBusinessId(user.id)
      if (!businessId) throw new Error('Failed to get business')

      const subtotal = invoiceData.items.reduce((sum, item) => sum + item.total_price, 0)
      const tax_amount = subtotal * 0.15
      const total_amount = subtotal + tax_amount
      const invoiceNumber = `INV-${Date.now()}`

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          user_id: user.id,
          business_id: businessId,
          branch_id: invoiceData.branch_id || null,
          customer_id: invoiceData.customer_id,
          invoice_number: invoiceNumber,
          invoice_date: new Date().toISOString().split('T')[0],
          due_date: invoiceData.due_date,
          subtotal,
          tax_amount,
          total_amount,
          paid_amount: 0,
          status: 'draft',
          notes: invoiceData.notes
        })
        .select()
        .single()

      if (invoiceError) throw invoiceError

      const itemsWithInvoiceId = invoiceData.items.map(item => ({
        invoice_id: invoice.id,
        branch_id: invoiceData.branch_id || null,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        ...(item.product_id && { product_id: item.product_id })
      }))

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsWithInvoiceId)

      if (itemsError) throw itemsError

      for (const item of invoiceData.items) {
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
                stock_quantity: Math.max(0, inventoryItem.stock_quantity - item.quantity)
              })
              .eq('id', item.product_id)
          }
        }
      }

      return invoice
    },
    onMutate: async (newInvoice): Promise<MutationContext> => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY })
      const previousData = queryClient.getQueryData<Invoice[]>(QUERY_KEY)

      const subtotal = newInvoice.items.reduce((sum, item) => sum + item.total_price, 0)
      const tax_amount = subtotal * 0.15
      const total_amount = subtotal + tax_amount

      queryClient.setQueryData<Invoice[]>(QUERY_KEY, (old = []) => [
        {
          id: 'temp-' + Date.now(),
          user_id: '',
          business_id: '',
          invoice_number: `INV-${Date.now()}`,
          invoice_date: new Date().toISOString().split('T')[0],
          due_date: newInvoice.due_date,
          customer_id: newInvoice.customer_id,
          subtotal,
          tax_amount,
          total_amount,
          paid_amount: 0,
          status: 'draft' as const,
          notes: newInvoice.notes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          invoice_items: newInvoice.items.map((item, index) => ({
            id: `temp-item-${index}`,
            invoice_id: 'temp-' + Date.now(),
            ...item
          }))
        },
        ...old
      ])

      return { previousData }
    },
    onError: (err, _newInvoice, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(QUERY_KEY, context.previousData)
      }
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to create invoice',
        variant: "destructive"
      })
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Invoice created successfully"
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    }
  })

  const updateInvoiceMutation = useMutation({
    mutationFn: async ({ 
      invoiceId, 
      updates, 
      items 
    }: {
      invoiceId: string;
      updates: Partial<Invoice>;
      items?: CreateInvoiceData['items'];
    }) => {
      let invoiceUpdates = { ...updates }
      if (items && items.length > 0) {
        const subtotal = items.reduce((sum, item) => sum + item.total_price, 0)
        const tax_amount = subtotal * 0.15
        const total_amount = subtotal + tax_amount
        invoiceUpdates = {
          ...invoiceUpdates,
          subtotal,
          tax_amount,
          total_amount
        }
      }

      const { error } = await supabase
        .from('invoices')
        .update(invoiceUpdates)
        .eq('id', invoiceId)

      if (error) throw error

      if (items && items.length > 0) {
        const { data: oldItems } = await supabase
          .from('invoice_items')
          .select('product_id, quantity')
          .eq('invoice_id', invoiceId)

        if (oldItems) {
          for (const item of oldItems) {
            if (item.product_id) {
              const { data: inv } = await supabase
                .from('inventory')
                .select('stock_quantity')
                .eq('id', item.product_id)
                .single()

              if (inv) {
                await supabase
                  .from('inventory')
                  .update({ stock_quantity: inv.stock_quantity + item.quantity })
                  .eq('id', item.product_id)
              }
            }
          }
        }

        const { error: deleteError } = await supabase
          .from('invoice_items')
          .delete()
          .eq('invoice_id', invoiceId)

        if (deleteError) throw deleteError

        // Get the invoice to get branch_id
        const { data: invoice } = await supabase
          .from('invoices')
          .select('branch_id')
          .eq('id', invoiceId)
          .single()

        const itemsWithInvoiceId = items.map(item => ({
          invoice_id: invoiceId,
          branch_id: invoice?.branch_id || null,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          ...(item.product_id && { product_id: item.product_id })
        }))

        const { error: insertError } = await supabase
          .from('invoice_items')
          .insert(itemsWithInvoiceId)

        if (insertError) throw insertError

        for (const item of items) {
          if (item.product_id) {
            const { data: inv } = await supabase
              .from('inventory')
              .select('stock_quantity')
              .eq('id', item.product_id)
              .single()

            if (inv) {
              await supabase
                .from('inventory')
                .update({ stock_quantity: Math.max(0, inv.stock_quantity - item.quantity) })
                .eq('id', item.product_id)
            }
          }
        }
      }
    },
    onMutate: async ({ invoiceId, updates, items }): Promise<MutationContext> => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY })
      const previousData = queryClient.getQueryData<Invoice[]>(QUERY_KEY)

      queryClient.setQueryData<Invoice[]>(QUERY_KEY, (old = []) =>
        old.map(invoice => {
          if (invoice.id !== invoiceId) return invoice

          let newInvoice = { ...invoice, ...updates, updated_at: new Date().toISOString() }
          
          if (items && items.length > 0) {
            const subtotal = items.reduce((sum, item) => sum + item.total_price, 0)
            const tax_amount = subtotal * 0.15
            const total_amount = subtotal + tax_amount
            newInvoice = {
              ...newInvoice,
              subtotal,
              tax_amount,
              total_amount,
              invoice_items: items.map((item, index) => ({
                id: `temp-item-${index}`,
                invoice_id: invoiceId,
                ...item
              }))
            }
          }

          return newInvoice
        })
      )

      return { previousData }
    },
    onError: (err, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(QUERY_KEY, context.previousData)
      }
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to update invoice',
        variant: "destructive"
      })
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Invoice updated successfully"
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    }
  })

  const deleteInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      const { data: invoiceItems } = await supabase
        .from('invoice_items')
        .select('product_id, quantity')
        .eq('invoice_id', invoiceId)

      if (invoiceItems && invoiceItems.length > 0) {
        for (const item of invoiceItems) {
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
        .from('invoices')
        .delete()
        .eq('id', invoiceId)

      if (error) throw error
    },
    onMutate: async (invoiceId): Promise<MutationContext> => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY })
      const previousData = queryClient.getQueryData<Invoice[]>(QUERY_KEY)

      queryClient.setQueryData<Invoice[]>(QUERY_KEY, (old = []) =>
        old.filter(invoice => invoice.id !== invoiceId)
      )

      return { previousData }
    },
    onError: (err, _invoiceId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(QUERY_KEY, context.previousData)
      }
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to delete invoice',
        variant: "destructive"
      })
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Invoice deleted and inventory restored successfully"
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    }
  })

  return {
    invoices,
    loading,
    error: error?.message || null,
    createInvoice: (data: CreateInvoiceData) => createInvoiceMutation.mutateAsync(data),
    updateInvoice: (
      invoiceId: string, 
      updates: Partial<Invoice>,
      items?: CreateInvoiceData['items']
    ) => updateInvoiceMutation.mutateAsync({ invoiceId, updates, items }),
    deleteInvoice: (invoiceId: string) => deleteInvoiceMutation.mutateAsync(invoiceId),
    refetch: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY })
  }
}
