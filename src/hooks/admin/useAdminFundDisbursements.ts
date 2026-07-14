import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface FundDisbursement {
  id: string
  ngo_id: string
  business_id: string
  amount: number
  disbursement_type: 'grant' | 'loan' | 'credit'
  purpose: string
  disbursement_date: string
  repayment_start_date?: string
  repayment_end_date?: string
  repayment_frequency?: 'weekly' | 'monthly' | 'quarterly' | 'annually'
  interest_rate?: number
  status: 'pending' | 'approved' | 'disbursed' | 'completed' | 'cancelled'
  notes?: string
  approved_by?: string
  approved_at?: string
  disbursed_by?: string
  disbursed_at?: string
  created_by: string
  created_at: string
  updated_at: string
  businesses?: {
    business_name: string
    owner_id: string
  }
  ngos?: {
    name: string
  }
}

export const adminDisbursementsKeys = {
  all: ['admin', 'fund-disbursements'] as const,
  list: (ngoId?: string) => ['admin', 'fund-disbursements', ngoId] as const,
}

async function fetchDisbursements(ngoId?: string): Promise<FundDisbursement[]> {
  let query = supabase
    .from('fund_disbursements')
    .select(`
      *,
      businesses (
        business_name,
        owner_id
      ),
      ngos (
        name
      )
    `)
    .order('created_at', { ascending: false })

  if (ngoId) {
    query = query.eq('ngo_id', ngoId)
  }

  const { data, error } = await query

  if (error) throw error
  return (data || []) as FundDisbursement[]
}

export function useAdminFundDisbursements(ngoId?: string) {
  return useQuery({
    queryKey: adminDisbursementsKeys.list(ngoId),
    queryFn: () => fetchDisbursements(ngoId),
  })
}

interface CreateDisbursementData {
  ngo_id: string
  business_id: string
  amount: number
  disbursement_type: string
  purpose: string
  disbursement_date?: string
  repayment_start_date?: string
  repayment_end_date?: string
  repayment_frequency?: string
  interest_rate?: number
  notes?: string
}

export function useCreateDisbursement() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: CreateDisbursementData) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase.from('fund_disbursements').insert([{
        ...data,
        created_by: user.id,
      }])

      if (error) throw error
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Fund disbursement created successfully',
      })
      queryClient.invalidateQueries({ queryKey: adminDisbursementsKeys.all })
    },
    onError: (error) => {
      console.error('Error creating disbursement:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create fund disbursement',
      })
    },
  })
}

interface UpdateDisbursementStatusData {
  disbursementId: string
  status: FundDisbursement['status']
}

export function useUpdateDisbursementStatus() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ disbursementId, status }: UpdateDisbursementStatusData) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const updates: any = { status }

      if (status === 'approved') {
        updates.approved_by = user.id
        updates.approved_at = new Date().toISOString()
      } else if (status === 'disbursed') {
        updates.disbursed_by = user.id
        updates.disbursed_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('fund_disbursements')
        .update(updates)
        .eq('id', disbursementId)

      if (error) throw error
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Disbursement status updated successfully',
      })
      queryClient.invalidateQueries({ queryKey: adminDisbursementsKeys.all })
    },
    onError: (error) => {
      console.error('Error updating disbursement status:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update disbursement status',
      })
    },
  })
}
