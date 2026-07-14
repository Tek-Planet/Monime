import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'

export interface AnalyticsData {
  totalUsers: number
  totalBusinesses: number
  totalSales: number
  totalRevenue: number
  activeUsersToday: number
  newUsersThisMonth: number
  salesByMonth: { month: string; sales: number; revenue: number }[]
  topBusinesses: { name: string; sales: number; revenue: number }[]
  userGrowth: { month: string; users: number }[]
}

export function useAnalytics(ngoId?: string) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [ngoId])

  const fetchAnalytics = async () => {
    try {
      // Get total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      // Get total businesses (filtered by NGO if provided)
      let businessQuery = supabase
        .from('businesses')
        .select('*', { count: 'exact', head: true })
      
      if (ngoId) {
        businessQuery = businessQuery.eq('ngo_id', ngoId)
      }
      
      const { count: totalBusinesses } = await businessQuery

      // Get business IDs for filtering
      let businessIds: string[] = []
      if (ngoId) {
        const { data: businesses } = await supabase
          .from('businesses')
          .select('id')
          .eq('ngo_id', ngoId)
        businessIds = businesses?.map(b => b.id) || []
      }

      // Get total sales
      let salesQuery = supabase
        .from('sales')
        .select('total_amount', { count: 'exact' })
      
      if (ngoId && businessIds.length > 0) {
        salesQuery = salesQuery.in('business_id', businessIds)
      }
      
      const { data: salesData, count: totalSalesCount } = await salesQuery

      // Get paid invoices
      let invoicesQuery = supabase
        .from('invoices')
        .select('paid_amount', { count: 'exact' })
        .eq('status', 'paid')
      
      if (ngoId && businessIds.length > 0) {
        invoicesQuery = invoicesQuery.in('business_id', businessIds)
      }
      
      const { data: invoicesData, count: totalInvoicesCount } = await invoicesQuery

      const salesRevenue = salesData?.reduce((sum, sale) => sum + (Number(sale.total_amount) || 0), 0) || 0
      const invoiceRevenue = invoicesData?.reduce((sum, inv) => sum + (Number(inv.paid_amount) || 0), 0) || 0
      const totalRevenue = salesRevenue + invoiceRevenue
      const totalSales = (totalSalesCount || 0) + (totalInvoicesCount || 0)

      // Get active users today
      const today = new Date().toISOString().split('T')[0]
      const { count: activeUsersToday } = await supabase
        .from('activity_logs')
        .select('user_id', { count: 'exact', head: true })
        .gte('created_at', today)

      // Get new users this month
      const firstOfMonth = new Date()
      firstOfMonth.setDate(1)
      const { count: newUsersThisMonth } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', firstOfMonth.toISOString())

      // Get sales by month (last 6 months)
      let salesByMonthQuery = supabase
        .from('sales')
        .select('sale_date, total_amount')
        .gte('sale_date', new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString())
      
      if (ngoId && businessIds.length > 0) {
        salesByMonthQuery = salesByMonthQuery.in('business_id', businessIds)
      }
      
      const { data: salesByMonthData } = await salesByMonthQuery

      // Get invoices by month (last 6 months)
      let invoicesByMonthQuery = supabase
        .from('invoices')
        .select('invoice_date, paid_amount')
        .eq('status', 'paid')
        .gte('invoice_date', new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString())
      
      if (ngoId && businessIds.length > 0) {
        invoicesByMonthQuery = invoicesByMonthQuery.in('business_id', businessIds)
      }
      
      const { data: invoicesByMonthData } = await invoicesByMonthQuery

      const salesByMonth = processSalesByMonth(salesByMonthData || [], invoicesByMonthData || [])

      // Get top businesses
      let topBusinessesQuery = supabase
        .from('sales')
        .select('business_id, total_amount, businesses!inner(business_name)')
      
      if (ngoId && businessIds.length > 0) {
        topBusinessesQuery = topBusinessesQuery.in('business_id', businessIds)
      }
      
      const { data: topBusinessesData } = await topBusinessesQuery

      // Get invoices with business info for top businesses
      let topInvoicesQuery = supabase
        .from('invoices')
        .select('business_id, paid_amount, businesses!inner(business_name)')
        .eq('status', 'paid')
      
      if (ngoId && businessIds.length > 0) {
        topInvoicesQuery = topInvoicesQuery.in('business_id', businessIds)
      }
      
      const { data: topInvoicesData } = await topInvoicesQuery

      const topBusinesses = processTopBusinesses(topBusinessesData || [], topInvoicesData || [])

      // Get user growth (last 6 months)
      const { data: userGrowthData } = await supabase
        .from('profiles')
        .select('created_at')
        .gte('created_at', new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString())

      const userGrowth = processUserGrowth(userGrowthData || [])

      setData({
        totalUsers: totalUsers || 0,
        totalBusinesses: totalBusinesses || 0,
        totalSales,
        totalRevenue,
        activeUsersToday: activeUsersToday || 0,
        newUsersThisMonth: newUsersThisMonth || 0,
        salesByMonth,
        topBusinesses,
        userGrowth
      })
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  return { data, loading, refetch: fetchAnalytics }
}

function processSalesByMonth(sales: any[], invoices: any[]) {
  const monthMap = new Map<string, { sales: number; revenue: number }>()
  
  sales.forEach(sale => {
    const month = new Date(sale.sale_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    const current = monthMap.get(month) || { sales: 0, revenue: 0 }
    monthMap.set(month, {
      sales: current.sales + 1,
      revenue: current.revenue + (Number(sale.total_amount) || 0)
    })
  })

  invoices.forEach(invoice => {
    const month = new Date(invoice.invoice_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    const current = monthMap.get(month) || { sales: 0, revenue: 0 }
    monthMap.set(month, {
      sales: current.sales + 1,
      revenue: current.revenue + (Number(invoice.paid_amount) || 0)
    })
  })

  return Array.from(monthMap.entries())
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
}

function processTopBusinesses(sales: any[], invoices: any[]) {
  const businessMap = new Map<string, { name: string; sales: number; revenue: number }>()
  
  sales.forEach(sale => {
    const businessName = sale.businesses?.business_name || 'Unknown'
    const current = businessMap.get(businessName) || { name: businessName, sales: 0, revenue: 0 }
    businessMap.set(businessName, {
      name: businessName,
      sales: current.sales + 1,
      revenue: current.revenue + (Number(sale.total_amount) || 0)
    })
  })

  invoices.forEach(invoice => {
    const businessName = invoice.businesses?.business_name || 'Unknown'
    const current = businessMap.get(businessName) || { name: businessName, sales: 0, revenue: 0 }
    businessMap.set(businessName, {
      name: businessName,
      sales: current.sales + 1,
      revenue: current.revenue + (Number(invoice.paid_amount) || 0)
    })
  })

  return Array.from(businessMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
}

function processUserGrowth(users: any[]) {
  const monthMap = new Map<string, number>()
  
  users.forEach(user => {
    const month = new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    monthMap.set(month, (monthMap.get(month) || 0) + 1)
  })

  return Array.from(monthMap.entries())
    .map(([month, users]) => ({ month, users }))
    .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
}
