import { useState, useEffect } from 'react'
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

export function useFundDisbursements(ngoId?: string) {
  const [disbursements, setDisbursements] = useState<FundDisbursement[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchDisbursements = async () => {
    try {
      setLoading(true)
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
      setDisbursements((data || []) as FundDisbursement[])
    } catch (error) {
      console.error('Error fetching disbursements:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch fund disbursements',
      })
    } finally {
      setLoading(false)
    }
  }

  const createDisbursement = async (disbursementData: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase.from('fund_disbursements').insert([{
        ...disbursementData,
        created_by: user.id,
      }])

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Fund disbursement created successfully',
      })

      await fetchDisbursements()
      return true
    } catch (error) {
      console.error('Error creating disbursement:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create fund disbursement',
      })
      return false
    }
  }

  const updateDisbursementStatus = async (
    disbursementId: string,
    status: FundDisbursement['status']
  ) => {
    try {
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

      toast({
        title: 'Success',
        description: 'Disbursement status updated successfully',
      })

      await fetchDisbursements()
      return true
    } catch (error) {
      console.error('Error updating disbursement status:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update disbursement status',
      })
      return false
    }
  }

  useEffect(() => {
    fetchDisbursements()
  }, [ngoId])

  return {
    disbursements,
    loading,
    createDisbursement,
    updateDisbursementStatus,
    refetch: fetchDisbursements,
  }
}
