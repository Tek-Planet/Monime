import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { getOrCreateBusinessId } from '@/lib/getOrCreateBusinessId'
import { useEffect } from 'react'
import { useBranchContext } from '@/contexts/BranchContext'

export interface Expense {
  id: string
  user_id: string
  business_id: string
  branch_id?: string
  supplier_id?: string
  description: string
  amount: number
  payment_method: string
  category?: string
  expense_date: string
  notes?: string
  created_at: string
  updated_at: string
  supplier?: {
    id: string
    name: string
  }
}

export interface CreateExpenseData {
  supplier_id?: string
  description: string
  amount: number
  payment_method: 'cash' | 'mobile_money' | 'bank_transfer' | 'credit'
  category?: string
  expense_date?: string
  notes?: string
  branch_id?: string
}

type MutationContext = {
  previousData: Expense[] | undefined
}

const fetchExpensesData = async (businessId?: string, branchId?: string | null): Promise<Expense[]> => {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return []
  }

  let query = supabase
    .from('expenses')
    .select(`
      *,
      supplier:suppliers!expenses_supplier_id_fkey(id, name)
    `)
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

  return (data || []) as Expense[]
}

export function useExpenses(businessId?: string) {
  const { toast } = useToast()
  const { selectedBranchId, branchResolved } = useBranchContext()
  const queryClient = useQueryClient()
  const queryKey = ['expenses', businessId, selectedBranchId]

  const { data: expenses = [], isLoading: loading, error } = useQuery({
    queryKey,
    queryFn: () => fetchExpensesData(businessId, selectedBranchId),
    enabled: branchResolved,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('expenses-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'expenses'
      }, () => {
        queryClient.invalidateQueries({ queryKey })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient, selectedBranchId])

  const createExpenseMutation = useMutation({
    mutationFn: async (expenseData: CreateExpenseData) => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('You must be logged in to create expenses')
      }

      const businessIdToUse = businessId || await getOrCreateBusinessId(user.id)
      if (!businessIdToUse) throw new Error('Failed to get business')

      const { data: expense, error } = await supabase
        .from('expenses')
        .insert({
          user_id: user.id,
          business_id: businessIdToUse,
          branch_id: expenseData.branch_id || null,
          expense_date: expenseData.expense_date || new Date().toISOString().split('T')[0],
          ...expenseData
        })
        .select()
        .single()

      if (error) throw error
      return expense
    },
    onMutate: async (newExpense): Promise<MutationContext> => {
      await queryClient.cancelQueries({ queryKey })
      const previousData = queryClient.getQueryData<Expense[]>(queryKey)

      queryClient.setQueryData<Expense[]>(queryKey, (old = []) => [
        {
          id: 'temp-' + Date.now(),
          user_id: '',
          business_id: '',
          expense_date: newExpense.expense_date || new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...newExpense
        } as Expense,
        ...old
      ])

      return { previousData }
    },
    onError: (err, _newExpense, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData)
      }
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to create expense',
        variant: "destructive"
      })
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Expense recorded successfully"
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    }
  })

  const updateExpenseMutation = useMutation({
    mutationFn: async ({ expenseId, updates }: { expenseId: string; updates: Partial<Expense> }) => {
      const { error } = await supabase
        .from('expenses')
        .update(updates)
        .eq('id', expenseId)

      if (error) throw error
    },
    onMutate: async ({ expenseId, updates }): Promise<MutationContext> => {
      await queryClient.cancelQueries({ queryKey })
      const previousData = queryClient.getQueryData<Expense[]>(queryKey)

      queryClient.setQueryData<Expense[]>(queryKey, (old = []) =>
        old.map(expense =>
          expense.id === expenseId
            ? { ...expense, ...updates, updated_at: new Date().toISOString() }
            : expense
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
        description: err instanceof Error ? err.message : 'Failed to update expense',
        variant: "destructive"
      })
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Expense updated successfully"
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    }
  })

  const deleteExpenseMutation = useMutation({
    mutationFn: async (expenseId: string) => {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId)

      if (error) throw error
    },
    onMutate: async (expenseId): Promise<MutationContext> => {
      await queryClient.cancelQueries({ queryKey })
      const previousData = queryClient.getQueryData<Expense[]>(queryKey)

      queryClient.setQueryData<Expense[]>(queryKey, (old = []) =>
        old.filter(expense => expense.id !== expenseId)
      )

      return { previousData }
    },
    onError: (err, _expenseId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData)
      }
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to delete expense',
        variant: "destructive"
      })
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Expense deleted successfully"
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    }
  })

  return {
    expenses,
    loading,
    error: error?.message || null,
    createExpense: (data: CreateExpenseData) => createExpenseMutation.mutateAsync(data),
    updateExpense: (expenseId: string, updates: Partial<Expense>) => 
      updateExpenseMutation.mutateAsync({ expenseId, updates }),
    deleteExpense: (expenseId: string) => deleteExpenseMutation.mutateAsync(expenseId),
    refetch: () => queryClient.invalidateQueries({ queryKey })
  }
}
