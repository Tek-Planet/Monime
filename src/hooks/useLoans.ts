import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useCreditScore } from '@/hooks/useCreditScore'
import { getOrCreateBusinessId } from '@/lib/getOrCreateBusinessId'

export interface LoanProduct {
  id: string
  name: string
  description?: string
  min_amount: number
  max_amount: number
  interest_rate: number
  term_months: number
  product_type: string
  min_credit_score: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface LoanApplication {
  id: string
  user_id: string
  business_id: string
  loan_product_id: string
  supplier_id?: string
  application_number: string
  requested_amount: number
  approved_amount?: number
  interest_rate?: number
  term_months?: number
  status: string
  credit_score?: number
  risk_assessment?: any
  items_to_restock?: any
  application_data?: any
  approval_date?: string
  disbursement_date?: string
  repayment_start_date?: string
  created_at: string
  updated_at: string
  loan_product?: LoanProduct
  supplier?: any
}

export interface CreateLoanApplicationData {
  loan_product_id: string
  supplier_id?: string
  requested_amount: number
  items_to_restock?: any[]
  application_data?: any
}

export interface PreQualificationResult {
  qualified: boolean
  max_amount: number
  recommended_products: LoanProduct[]
  credit_score: number
  reasons?: string[]
}

export function useLoans(businessId?: string) {
  const [loanProducts, setLoanProducts] = useState<LoanProduct[]>([])
  const [loanApplications, setLoanApplications] = useState<LoanApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const creditScore = useCreditScore(businessId)

  const fetchLoanProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('loan_products')
        .select('*')
        .eq('is_active', true)
        .order('min_amount')

      if (error) throw error
      setLoanProducts(data || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch loan products'
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    }
  }

  const fetchLoanApplications = async () => {
    try {
      setError(null)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('You must be logged in to view loan applications')
      }

      let query = supabase
        .from('loan_applications')
        .select(`
          *,
          loan_product:loan_products(*),
          supplier:suppliers(*)
        `)

      if (businessId) {
        query = query.eq('business_id', businessId)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      setLoanApplications(data || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch loan applications'
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const checkPreQualification = async (loan_product_id: string, requested_amount: number, supplier_id?: string): Promise<PreQualificationResult> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('You must be logged in to check pre-qualification')
      }

      // Get the loan product
      const { data: product, error: productError } = await supabase
        .from('loan_products')
        .select('*')
        .eq('id', loan_product_id)
        .single()

      if (productError) throw productError

      // Validate supplier if provided
      if (supplier_id) {
        const { data: supplier, error: supplierError } = await supabase
          .from('suppliers')
          .select('*')
          .eq('id', supplier_id)
          .eq('user_id', user.id)
          .single()

        if (supplierError) throw new Error('Invalid supplier selected')
      }

      // Get user's credit score
      const userCreditScore = creditScore?.score || 300

      // Check if user meets minimum credit score and requested amount is within limits
      const meetsCreditscore = userCreditScore >= product.min_credit_score
      const withinMinAmount = requested_amount >= product.min_amount
      const withinMaxAmount = requested_amount <= product.max_amount
      const qualified = meetsCreditscore && withinMinAmount && withinMaxAmount

      // Calculate max amount based on credit score and business performance
      let maxAmount = product.max_amount
      if (userCreditScore < 500) {
        maxAmount = Math.min(maxAmount, product.min_amount * 2)
      } else if (userCreditScore < 700) {
        maxAmount = Math.min(maxAmount, product.max_amount * 0.7)
      }

      // Get recommended products based on credit score
      const { data: recommendedProducts } = await supabase
        .from('loan_products')
        .select('*')
        .lte('min_credit_score', userCreditScore)
        .eq('is_active', true)
        .order('interest_rate')

      const reasons = []
      if (!meetsCreditscore) {
        reasons.push(`Credit score ${userCreditScore} is below minimum requirement of ${product.min_credit_score}`)
      }
      if (!withinMinAmount) {
        reasons.push(`Requested amount ${requested_amount.toLocaleString()} is below minimum of ${product.min_amount.toLocaleString()}`)
      }
      if (!withinMaxAmount) {
        reasons.push(`Requested amount ${requested_amount.toLocaleString()} exceeds maximum of ${product.max_amount.toLocaleString()}`)
      }

      return {
        qualified,
        max_amount: maxAmount,
        recommended_products: recommendedProducts || [],
        credit_score: userCreditScore,
        reasons: qualified ? undefined : reasons
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check pre-qualification'
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
      throw err
    }
  }

  const createLoanApplication = async (applicationData: CreateLoanApplicationData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('You must be logged in to apply for a loan')
      }

      const resolvedBusinessId = businessId || await getOrCreateBusinessId(user.id)
      if (!resolvedBusinessId) throw new Error('Failed to get business')

      // Generate application number using the database function
      const { data: appNumberResult } = await supabase
        .rpc('generate_application_number')

      if (!appNumberResult) throw new Error('Failed to generate application number')

      const { data: application, error } = await supabase
        .from('loan_applications')
        .insert({
          user_id: user.id,
          business_id: resolvedBusinessId,
          application_number: appNumberResult,
          ...applicationData,
          credit_score: creditScore?.score || 300,
          status: 'pending'
        })
        .select(`
          *,
          loan_product:loan_products(*),
          supplier:suppliers(*)
        `)
        .single()

      if (error) throw error

      toast({
        title: "Success",
        description: `Loan application ${appNumberResult} submitted successfully`
      })

      fetchLoanApplications()
      return application
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create loan application'
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
      throw err
    }
  }

  const updateLoanApplicationStatus = async (applicationId: string, status: string, additionalData?: any) => {
    try {
      // Get the loan application details first
      const { data: application, error: fetchError } = await supabase
        .from('loan_applications')
        .select('*, items_to_restock, user_id, business_id')
        .eq('id', applicationId)
        .single()

      if (fetchError) throw fetchError

      // Update the application status
      const { error } = await supabase
        .from('loan_applications')
        .update({
          status,
          ...additionalData,
          ...(status === 'approved' && { approval_date: new Date().toISOString() })
        })
        .eq('id', applicationId)

      if (error) throw error

      // If approved and has items to restock, update inventory
      if (status === 'approved' && application.items_to_restock) {
        const itemsToRestock = application.items_to_restock as Array<{
          id: string
          quantity: number
        }>

        // Update inventory quantities for each item
        for (const item of itemsToRestock) {
          // First get current stock quantity
          const { data: currentInventory, error: fetchInventoryError } = await supabase
            .from('inventory')
            .select('stock_quantity')
            .eq('id', item.id)
            .eq('user_id', application.user_id)
            .single()

          if (fetchInventoryError) {
            console.error('Failed to fetch inventory for item:', item.id, fetchInventoryError)
            continue
          }

          // Update with new quantity
          const { error: inventoryError } = await supabase
            .from('inventory')
            .update({
              stock_quantity: currentInventory.stock_quantity + item.quantity
            })
            .eq('id', item.id)
            .eq('user_id', application.user_id)

          if (inventoryError) {
            console.error('Failed to update inventory for item:', item.id, inventoryError)
          }
        }
      }

      toast({
        title: "Success",
        description: `Loan application status updated to ${status}${status === 'approved' ? ' and inventory updated' : ''}`
      })

      fetchLoanApplications()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update loan application'
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
      throw err
    }
  }

  useEffect(() => {
    fetchLoanProducts()
    fetchLoanApplications()
  }, [businessId])

  return {
    loanProducts,
    loanApplications,
    loading,
    error,
    checkPreQualification,
    createLoanApplication,
    updateLoanApplicationStatus,
    refetch: () => {
      fetchLoanProducts()
      fetchLoanApplications()
    }
  }
}