import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { adminNGOsKeys } from './useAdminNGOs'

export interface Business {
  id: string
  business_name: string
  business_type: string | null
  email: string | null
  phone: string | null
  address: string | null
  created_at: string
  ngo_id: string | null
  owner_id: string
  tax_rate: number | null
  currency: string | null
  latitude: number | null
  longitude: number | null
  ngos: {
    name: string
  } | null
}

interface BusinessFilters {
  search?: string
  typeFilter?: string
  ngoFilter?: string
  page?: number
  pageSize?: number
}

export const adminBusinessesKeys = {
  all: ['admin', 'businesses'] as const,
  list: (filters: BusinessFilters) => ['admin', 'businesses', 'list', filters] as const,
  detail: (businessId: string) => ['admin', 'businesses', businessId] as const,
  stats: (businessId: string) => ['admin', 'businesses', businessId, 'stats'] as const,
  unassigned: ['admin', 'businesses', 'unassigned'] as const,
  ngosForFilter: ['admin', 'ngos-for-filter'] as const,
}

interface FetchBusinessesResult {
  businesses: Business[]
  totalCount: number
}

async function fetchBusinesses(filters: BusinessFilters): Promise<FetchBusinessesResult> {
  const { search, typeFilter, ngoFilter, page = 1, pageSize = 10 } = filters

  let query = supabase
    .from('businesses')
    .select('*, ngos(name)', { count: 'exact' })

  if (search) {
    query = query.or(`business_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
  }

  if (typeFilter && typeFilter !== 'all') {
    query = query.eq('business_type', typeFilter)
  }

  if (ngoFilter && ngoFilter !== 'all') {
    if (ngoFilter === 'unassigned') {
      query = query.is('ngo_id', null)
    } else {
      query = query.eq('ngo_id', ngoFilter)
    }
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await query
    .range(from, to)
    .order('created_at', { ascending: false })

  if (error) throw error

  return {
    businesses: data || [],
    totalCount: count || 0,
  }
}

async function fetchBusiness(businessId: string) {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', businessId)
    .single()

  if (error) throw error
  return data
}

async function fetchUnassignedBusinesses() {
  const { data, error } = await supabase
    .from('businesses')
    .select('id, business_name, owner_id')
    .is('ngo_id', null)
    .order('business_name')

  if (error) throw error
  return data || []
}

async function fetchNGOsForFilter() {
  const { data, error } = await supabase
    .from('ngos')
    .select('id, name')
    .eq('is_active', true)
    .order('name')

  if (error) throw error
  return data || []
}

export function useAdminBusinesses(filters: BusinessFilters) {
  return useQuery({
    queryKey: adminBusinessesKeys.list(filters),
    queryFn: () => fetchBusinesses(filters),
  })
}

export function useAdminBusiness(businessId: string | undefined) {
  return useQuery({
    queryKey: adminBusinessesKeys.detail(businessId || ''),
    queryFn: () => fetchBusiness(businessId!),
    enabled: !!businessId,
  })
}

export function useUnassignedBusinesses(enabled = true) {
  return useQuery({
    queryKey: adminBusinessesKeys.unassigned,
    queryFn: fetchUnassignedBusinesses,
    enabled,
  })
}

export function useNGOsForFilter() {
  return useQuery({
    queryKey: adminBusinessesKeys.ngosForFilter,
    queryFn: fetchNGOsForFilter,
  })
}

interface AssignBusinessData {
  businessId: string
  ngoId: string
}

export function useAssignBusinessToNGO() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ businessId, ngoId }: AssignBusinessData) => {
      const { error } = await supabase
        .from('businesses')
        .update({ ngo_id: ngoId })
        .eq('id', businessId)

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      toast.success('Business assigned to NGO')
      queryClient.invalidateQueries({ queryKey: adminBusinessesKeys.unassigned })
      queryClient.invalidateQueries({ queryKey: ['admin', 'businesses'] })
      queryClient.invalidateQueries({ queryKey: adminNGOsKeys.businesses(variables.ngoId) })
      queryClient.invalidateQueries({ queryKey: adminNGOsKeys.businessCount(variables.ngoId) })
    },
    onError: (error) => {
      console.error('Error assigning business:', error)
      toast.error('Failed to assign business')
    },
  })
}

// Business owner profile hook
export function useBusinessOwnerProfile(ownerId: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'profile', ownerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, email, phone')
        .eq('user_id', ownerId!)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!ownerId,
  })
}

// Business statistics hook
export function useBusinessStats(businessId: string | undefined) {
  return useQuery({
    queryKey: adminBusinessesKeys.stats(businessId || ''),
    queryFn: async () => {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const [customersResult, salesResult, expensesResult, invoicesResult, inventoryResult, suppliersResult, recentSalesResult, recentExpensesResult] = await Promise.all([
        supabase.from('customers').select('id', { count: 'exact', head: true }).eq('business_id', businessId!),
        supabase.from('sales').select('total_amount').eq('business_id', businessId!),
        supabase.from('expenses').select('amount').eq('business_id', businessId!),
        supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('business_id', businessId!),
        supabase.from('inventory').select('id', { count: 'exact', head: true }).eq('business_id', businessId!),
        supabase.from('suppliers').select('id', { count: 'exact', head: true }).eq('business_id', businessId!),
        supabase.from('sales').select('id', { count: 'exact', head: true }).eq('business_id', businessId!).gte('sale_date', thirtyDaysAgo.toISOString().split('T')[0]),
        supabase.from('expenses').select('id', { count: 'exact', head: true }).eq('business_id', businessId!).gte('expense_date', thirtyDaysAgo.toISOString().split('T')[0]),
      ])

      const totalSales = salesResult.data?.reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0) || 0
      const totalExpenses = expensesResult.data?.reduce((sum, expense) => sum + Number(expense.amount || 0), 0) || 0

      return {
        totalCustomers: customersResult.count || 0,
        totalSales,
        totalExpenses,
        totalInvoices: invoicesResult.count || 0,
        totalInventory: inventoryResult.count || 0,
        totalSuppliers: suppliersResult.count || 0,
        recentSalesCount: recentSalesResult.count || 0,
        recentExpensesCount: recentExpensesResult.count || 0,
      }
    },
    enabled: !!businessId,
  })
}

// Business loan applications hook
export function useBusinessLoanApplications(businessId: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'businesses', businessId, 'loanApplications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loan_applications')
        .select('id, application_number, status, requested_amount, approved_amount, interest_rate, term_months, created_at, approval_date, disbursement_date')
        .eq('business_id', businessId!)
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) throw error
      return data || []
    },
    enabled: !!businessId,
  })
}

// Business loan repayments hook
export function useBusinessLoanRepayments(businessId: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'businesses', businessId, 'loanRepayments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loan_repayments')
        .select('id, due_date, amount, status, payment_date, reference_number')
        .eq('business_id', businessId!)
        .order('due_date', { ascending: false })
        .limit(10)

      if (error) throw error
      return data || []
    },
    enabled: !!businessId,
  })
}

// Business credit data hook
export function useBusinessCreditData(businessId: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'businesses', businessId, 'creditData'],
    queryFn: async () => {
      const [loanAppsResult, creditTxResult] = await Promise.all([
        supabase
          .from('loan_applications')
          .select('id, application_number, status, requested_amount, approved_amount, interest_rate, term_months, created_at, approval_date, disbursement_date')
          .eq('business_id', businessId!)
          .order('created_at', { ascending: false }),
        supabase
          .from('credit_transactions')
          .select('id', { count: 'exact', head: true })
          .eq('business_id', businessId!),
      ])

      if (loanAppsResult.error) throw loanAppsResult.error

      const loanApps = loanAppsResult.data || []
      const approved = loanApps.filter(app => app.status === 'approved').length
      const active = loanApps.filter(app => ['approved', 'disbursed'].includes(app.status)).length

      return {
        loanApplications: loanApps,
        totalLoansRequested: loanApps.length,
        totalLoansApproved: approved,
        totalLoansActive: active,
        totalCreditTransactions: creditTxResult.count || 0,
      }
    },
    enabled: !!businessId,
  })
}

// Business reporting metrics hook
export function useBusinessReportingMetrics(businessId: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'businesses', businessId, 'reportingMetrics'],
    queryFn: async () => {
      const now = new Date()
      const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

      const [salesResult, expensesResult, inventoryResult, customersResult, suppliersResult, invoicesResult] = await Promise.all([
        supabase.from('sales').select('total_amount, customer_id, sale_date').eq('business_id', businessId!),
        supabase.from('expenses').select('amount').eq('business_id', businessId!),
        supabase.from('inventory').select('stock_quantity, min_stock_level, unit_price, cost_price, is_active').eq('business_id', businessId!),
        supabase.from('customers').select('id, name, current_balance, email, phone').eq('business_id', businessId!),
        supabase.from('suppliers').select('current_balance').eq('business_id', businessId!),
        supabase.from('invoices').select('total_amount, paid_amount, status').eq('business_id', businessId!).in('status', ['sent', 'overdue']),
      ])

      const salesData = salesResult.data || []
      const expensesData = expensesResult.data || []
      const inventoryData = inventoryResult.data || []
      const customersData = customersResult.data || []
      const suppliersData = suppliersResult.data || []
      const invoicesData = invoicesResult.data || []

      const totalRevenue = salesData.reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0)
      const totalExpenses = expensesData.reduce((sum, expense) => sum + Number(expense.amount || 0), 0)
      const netProfit = totalRevenue - totalExpenses
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0
      const totalTransactions = salesData.length
      const averageTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0

      // Top customers
      const customerSales = salesData.reduce((acc, sale) => {
        if (sale.customer_id) {
          acc[sale.customer_id] = (acc[sale.customer_id] || 0) + Number(sale.total_amount || 0)
        }
        return acc
      }, {} as Record<string, number>)

      const topCustomers = Object.entries(customerSales)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([customerId, totalSpent]) => {
          const customer = customersData.find(c => c.id === customerId)
          return { name: customer?.name || 'Unknown', totalSpent }
        })

      // Inventory metrics
      const lowStockItems = inventoryData.filter(item => item.stock_quantity <= (item.min_stock_level || 0)).length
      const totalInventoryValue = inventoryData.reduce((sum, item) => sum + Number(item.cost_price || item.unit_price || 0) * item.stock_quantity, 0)

      // Outstanding balances
      const totalCustomerCredit = customersData.reduce((sum, customer) => sum + Number(customer.current_balance || 0), 0)
      const totalSupplierDebt = suppliersData.reduce((sum, supplier) => sum + Number(supplier.current_balance || 0), 0)
      const totalInvoicesDue = invoicesData.reduce((sum, invoice) => sum + (Number(invoice.total_amount || 0) - Number(invoice.paid_amount || 0)), 0)

      // Period comparison
      const currentMonthSales = salesData
        .filter(sale => new Date(sale.sale_date) >= firstDayCurrentMonth)
        .reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0)

      const lastMonthSales = salesData
        .filter(sale => {
          const saleDate = new Date(sale.sale_date)
          return saleDate >= firstDayLastMonth && saleDate <= lastDayLastMonth
        })
        .reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0)

      const growthRate = lastMonthSales > 0 ? ((currentMonthSales - lastMonthSales) / lastMonthSales) * 100 : 0

      // Credit score calculation (simplified)
      const calculateCreditScore = () => {
        let score = 500
        if (totalTransactions > 50) score += 100
        else if (totalTransactions > 20) score += 50
        if (profitMargin > 20) score += 100
        else if (profitMargin > 10) score += 50
        if (customersData.length > 20) score += 50
        if (lowStockItems === 0) score += 50
        
        let rating: string
        if (score >= 800) rating = 'Excellent'
        else if (score >= 740) rating = 'Very Good'
        else if (score >= 670) rating = 'Good'
        else if (score >= 580) rating = 'Fair'
        else rating = 'Poor'

        return { score: Math.min(850, score), rating }
      }

      const creditScore = calculateCreditScore()

      return {
        financialSummary: { totalRevenue, totalExpenses, netProfit, profitMargin },
        salesMetrics: { averageTransactionValue, totalTransactions, topCustomers },
        inventoryMetrics: { totalItems: inventoryData.length, lowStockItems, totalInventoryValue },
        outstandingBalances: { totalInvoicesDue, totalCustomerCredit, totalSupplierDebt },
        periodComparison: { currentMonthSales, lastMonthSales, growthRate },
        creditScore,
      }
    },
    enabled: !!businessId,
  })
}
