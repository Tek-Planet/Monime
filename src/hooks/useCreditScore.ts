import { useMemo } from 'react'
import { useSales } from './useSales'
import { useInvoices } from './useInvoices'
import { useInventory } from './useInventory'
import { useCustomers } from './useCustomers'

interface CreditScoreBreakdown {
  score: number
  rating: string
  factors: {
    paymentHistory: { score: number; weight: number; description: string }
    businessAge: { score: number; weight: number; description: string }
    revenueStability: { score: number; weight: number; description: string }
    inventoryManagement: { score: number; weight: number; description: string }
    customerBase: { score: number; weight: number; description: string }
  }
  improvements: string[]
}

export function useCreditScore(businessId?: string): CreditScoreBreakdown {
  const { sales } = useSales(businessId)
  const { invoices } = useInvoices(businessId)
  const { inventory, outOfStockItems, criticalItems } = useInventory(businessId)
  const { customers } = useCustomers(businessId)

  return useMemo(() => {
    // Payment History Score (35% weight)
    const calculatePaymentHistory = (): { score: number; description: string } => {
      if (invoices.length === 0) {
        return { score: 500, description: "No invoice history available" }
      }

      const paidInvoices = invoices.filter(inv => inv.status === 'paid')
      const overdueInvoices = invoices.filter(inv => inv.status === 'overdue')
      const paymentRate = paidInvoices.length / invoices.length

      let score = 300 + (paymentRate * 400) // Base 300, up to 700
      
      // Penalty for overdue invoices
      const overdueRate = overdueInvoices.length / invoices.length
      score -= (overdueRate * 200)

      return {
        score: Math.max(300, Math.min(850, score)),
        description: `${Math.round(paymentRate * 100)}% payment rate, ${overdueInvoices.length} overdue`
      }
    }

    // Business Age Score (15% weight)
    const calculateBusinessAge = (): { score: number; description: string } => {
      if (sales.length === 0) {
        return { score: 400, description: "New business, no transaction history" }
      }

      const oldestSale = sales.reduce((oldest, sale) => {
        const saleDate = new Date(sale.created_at)
        const oldestDate = new Date(oldest.created_at)
        return saleDate < oldestDate ? sale : oldest
      })

      const businessAgeMonths = Math.max(1, 
        (Date.now() - new Date(oldestSale.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30)
      )

      // Score increases with business age, maxing out at 24 months
      let score = 400 + Math.min(businessAgeMonths * 15, 300)

      return {
        score: Math.round(Math.min(850, score)),
        description: `${Math.round(businessAgeMonths)} months in business`
      }
    }

    // Revenue Stability Score (25% weight)
    const calculateRevenueStability = (): { score: number; description: string } => {
      if (sales.length < 3) {
        return { score: 450, description: "Insufficient sales data for analysis" }
      }

      // Group sales by month
      const monthlySales: { [key: string]: number } = {}
      sales.forEach(sale => {
        const monthKey = new Date(sale.sale_date).toISOString().substring(0, 7)
        monthlySales[monthKey] = (monthlySales[monthKey] || 0) + Number(sale.total_amount)
      })

      const monthlyRevenues = Object.values(monthlySales)
      const avgRevenue = monthlyRevenues.reduce((sum, rev) => sum + rev, 0) / monthlyRevenues.length

      // Calculate coefficient of variation (lower is better for stability)
      if (avgRevenue === 0) {
        return { score: 400, description: "No revenue recorded" }
      }

      const variance = monthlyRevenues.reduce((sum, rev) => 
        sum + Math.pow(rev - avgRevenue, 2), 0
      ) / monthlyRevenues.length
      
      const stdDev = Math.sqrt(variance)
      const coefficientOfVariation = stdDev / avgRevenue

      // Lower variation = higher score
      let score = 500 + Math.max(0, (1 - coefficientOfVariation) * 250)

      return {
        score: Math.max(300, Math.min(850, score)),
        description: `${monthlyRevenues.length} months of data, ${coefficientOfVariation < 0.3 ? 'stable' : 'variable'} revenue`
      }
    }

    // Inventory Management Score (15% weight)
    const calculateInventoryManagement = (): { score: number; description: string } => {
      if (inventory.length === 0) {
        return { score: 400, description: "No inventory data available" }
      }

      const outOfStockRate = outOfStockItems / inventory.length
      const criticalStockRate = criticalItems / inventory.length

      // Start with base score, reduce for poor inventory management
      let score = 600
      score -= (outOfStockRate * 200) // Heavy penalty for out of stock
      score -= (criticalStockRate * 100) // Moderate penalty for critical stock

      // Bonus for good inventory diversity
      const activeItems = inventory.filter(item => item.is_active).length
      if (activeItems > 10) score += 50

      return {
        score: Math.max(300, Math.min(850, score)),
        description: `${outOfStockItems} out of stock, ${criticalItems} critical stock items`
      }
    }

    // Customer Base Score (10% weight)
    const calculateCustomerBase = (): { score: number; description: string } => {
      const customerCount = customers.length
      
      let score = 400 + Math.min(customerCount * 10, 300) // Up to 700 for 30+ customers

      // Bonus for customer diversity (having customer contact info)
      const customersWithContact = customers.filter(c => c.email || c.phone).length
      const contactRate = customerCount > 0 ? customersWithContact / customerCount : 0
      score += (contactRate * 100)

      return {
        score: Math.max(300, Math.min(850, score)),
        description: `${customerCount} customers, ${Math.round(contactRate * 100)}% with contact info`
      }
    }

    // Calculate all factors
    const paymentHistory = calculatePaymentHistory()
    const businessAge = calculateBusinessAge()
    const revenueStability = calculateRevenueStability()
    const inventoryManagement = calculateInventoryManagement()
    const customerBase = calculateCustomerBase()

    // Weighted final score
    const finalScore = Math.round(
      (paymentHistory.score * 0.35) +
      (businessAge.score * 0.15) +
      (revenueStability.score * 0.25) +
      (inventoryManagement.score * 0.15) +
      (customerBase.score * 0.10)
    )

    // Determine rating
    let rating: string
    if (finalScore >= 800) rating = "Excellent"
    else if (finalScore >= 740) rating = "Very Good"
    else if (finalScore >= 670) rating = "Good"
    else if (finalScore >= 580) rating = "Fair"
    else rating = "Poor"

    // Generate improvement suggestions
    const improvements: string[] = []
    if (paymentHistory.score < 650) improvements.push("Improve invoice payment collection")
    if (revenueStability.score < 600) improvements.push("Focus on consistent monthly revenue")
    if (inventoryManagement.score < 600) improvements.push("Reduce out-of-stock items")
    if (customerBase.score < 600) improvements.push("Build larger customer base")
    if (businessAge.score < 600) improvements.push("Continue building business history")

    return {
      score: finalScore,
      rating,
      factors: {
        paymentHistory: { score: paymentHistory.score, weight: 35, description: paymentHistory.description },
        businessAge: { score: businessAge.score, weight: 15, description: businessAge.description },
        revenueStability: { score: revenueStability.score, weight: 25, description: revenueStability.description },
        inventoryManagement: { score: inventoryManagement.score, weight: 15, description: inventoryManagement.description },
        customerBase: { score: customerBase.score, weight: 10, description: customerBase.description }
      },
      improvements
    }
  }, [sales, invoices, inventory, customers, outOfStockItems, criticalItems])
}