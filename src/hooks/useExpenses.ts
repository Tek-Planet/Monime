import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { getOrCreateBusinessId } from '@/lib/getOrCreateBusinessId'
import { useEffect } from 'react'
import { useBranchContext } from '@/contexts/BranchContext'
import { fetchAllPages } from '@/lib/fetchAllPages'
import { offlineDb, type LocalExpense } from '@/lib/offlineDb'
import { cacheExpenses, recordOfflineExpense } from '@/lib/offlineSyncEngine'

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
  is_offline?: boolean
  synced?: boolean
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

const getLocalExpenses = async (businessId?: string, branchId?: string | null): Promise<Expense[]> => {
  try {
    let localRows = await offlineDb.expenses.toArray();
    if (businessId) {
      localRows = localRows.filter(e => e.business_id === businessId);
    }
    if (branchId) {
      localRows = localRows.filter(e => e.branch_id === branchId || !e.branch_id);
    }

    const suppliers = await offlineDb.suppliers.toArray();
    const supplierMap = new Map(suppliers.map(s => [s.id, s]));

    const formatted: Expense[] = localRows.map(e => ({
      id: e.id,
      user_id: e.user_id || '',
      business_id: e.business_id,
      branch_id: e.branch_id || undefined,
      supplier_id: e.supplier_id || undefined,
      description: e.description,
      amount: e.amount,
      payment_method: e.payment_method,
      category: e.category || undefined,
      expense_date: e.expense_date,
      notes: e.notes || undefined,
      created_at: e.created_at,
      updated_at: e.updated_at || e.created_at,
      is_offline: e.is_offline,
      synced: e.synced,
      supplier: e.supplier_id && supplierMap.has(e.supplier_id)
        ? {
            id: e.supplier_id,
            name: supplierMap.get(e.supplier_id)!.name,
          }
        : undefined,
    }));

    return formatted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } catch (err) {
    console.warn('Error reading local Dexie expenses:', err);
    return [];
  }
};

const fetchExpensesData = async (businessId?: string, branchId?: string | null): Promise<Expense[]> => {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return await getLocalExpenses(businessId, branchId);
  }

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return await getLocalExpenses(businessId, branchId);
  }

  try {
    const buildQuery = () => {
      let query = supabase
        .from('expenses')
        .select(`
          *,
          supplier:suppliers!expenses_supplier_id_fkey(id, name)
        `)

      if (businessId) {
        query = query.eq('business_id', businessId)
      }

      if (branchId) {
        query = query.eq('branch_id', branchId)
      }

      return query.order('created_at', { ascending: false })
    }

    const remoteExpenses = await fetchAllPages<Expense>(buildQuery)

    // Cache remote expenses to Dexie
    cacheExpenses(remoteExpenses.map(e => ({
      id: e.id,
      user_id: e.user_id,
      business_id: e.business_id,
      branch_id: e.branch_id || null,
      supplier_id: e.supplier_id || null,
      description: e.description,
      amount: e.amount,
      payment_method: e.payment_method,
      category: e.category || null,
      expense_date: e.expense_date,
      notes: e.notes || null,
      created_at: e.created_at,
      updated_at: e.updated_at,
      synced: true,
      is_offline: false,
    }))).catch(() => {});

    // Check for pending unsynced offline expenses and merge
    try {
      const unsynced = await offlineDb.expenses
        .filter(e => e.synced === false && (businessId ? e.business_id === businessId : true))
        .toArray();

      if (unsynced.length > 0) {
        const existingIds = new Set(remoteExpenses.map(e => e.id));
        const extraOffline: Expense[] = unsynced
          .filter(e => !existingIds.has(e.id))
          .map(e => ({
            id: e.id,
            user_id: e.user_id || '',
            business_id: e.business_id,
            branch_id: e.branch_id || undefined,
            supplier_id: e.supplier_id || undefined,
            description: e.description,
            amount: e.amount,
            payment_method: e.payment_method,
            category: e.category || undefined,
            expense_date: e.expense_date,
            notes: e.notes || undefined,
            created_at: e.created_at,
            updated_at: e.updated_at || e.created_at,
            is_offline: true,
            synced: false,
          }));

        return [...extraOffline, ...remoteExpenses].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }
    } catch {
      // ignore
    }

    return remoteExpenses;
  } catch (error) {
    console.warn('Network error fetching expenses from Supabase, loading local cache:', error);
    return await getLocalExpenses(businessId, branchId);
  }
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
      const isDeviceOffline = typeof navigator !== 'undefined' && !navigator.onLine;
      const { data: { user } } = await supabase.auth.getUser();

      const businessIdToUse = businessId || (user ? await getOrCreateBusinessId(user.id) : null) || 'local-biz';

      if (isDeviceOffline || !user) {
        const localExpense = await recordOfflineExpense({
          user_id: user?.id || '',
          business_id: businessIdToUse,
          branch_id: expenseData.branch_id || null,
          supplier_id: expenseData.supplier_id || null,
          description: expenseData.description,
          amount: expenseData.amount,
          payment_method: expenseData.payment_method,
          category: expenseData.category || null,
          expense_date: expenseData.expense_date,
          notes: expenseData.notes || null,
        });

        return {
          ...localExpense,
          is_offline: true,
          synced: false,
        } as Expense;
      }

      try {
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
      } catch (err: any) {
        console.warn('Network call failed, recording expense offline:', err);
        const localExpense = await recordOfflineExpense({
          user_id: user.id,
          business_id: businessIdToUse,
          branch_id: expenseData.branch_id || null,
          supplier_id: expenseData.supplier_id || null,
          description: expenseData.description,
          amount: expenseData.amount,
          payment_method: expenseData.payment_method,
          category: expenseData.category || null,
          expense_date: expenseData.expense_date,
          notes: expenseData.notes || null,
        });

        return {
          ...localExpense,
          is_offline: true,
          synced: false,
        } as Expense;
      }
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
          is_offline: typeof navigator !== 'undefined' && !navigator.onLine,
          synced: typeof navigator !== 'undefined' ? navigator.onLine : true,
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
    onSuccess: (result) => {
      if (result && 'is_offline' in result && result.is_offline) {
        toast({
          title: "Expense Saved Locally (Offline)",
          description: "Stored securely on device. It will automatically sync once internet is connected.",
        });
      } else {
        toast({
          title: "Success",
          description: "Expense recorded successfully"
        });
      }
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
