import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'
import { useSales } from '@/hooks/useSales'
import { useInvoices } from '@/hooks/useInvoices'
import { useBusinessInfo } from '@/hooks/useBusinessInfo'
import { useLanguage } from '@/contexts/LanguageContext'
import { useMemo } from 'react'

interface RevenueChartProps {
  businessId?: string
}

export function RevenueChart({ businessId }: RevenueChartProps) {
  const { sales } = useSales(businessId)
  const { invoices } = useInvoices(businessId)
  const { businessInfo: business } = useBusinessInfo(businessId)
  const { t, language } = useLanguage()

  const dateLocale = useMemo(() => {
    switch (language) {
      case 'fr': return 'fr-FR'
      case 'ar': return 'ar-SA'
      default: return 'en-US'
    }
  }, [language])

  const data = useMemo(() => {
    const currency = business?.currency || 'SLL'
    
    // Get the last 6 months
    const months = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({
        month: date.toLocaleDateString(dateLocale, { month: 'short' }),
        fullDate: date
      })
    }

    return months.map(({ month, fullDate }) => {
      const monthStart = new Date(fullDate.getFullYear(), fullDate.getMonth(), 1)
      const monthEnd = new Date(fullDate.getFullYear(), fullDate.getMonth() + 1, 0)

      // Calculate revenue from sales for this month
      const monthSales = sales.filter(sale => {
        const saleDate = new Date(sale.sale_date)
        return saleDate >= monthStart && saleDate <= monthEnd
      })
      const revenue = monthSales.reduce((sum, sale) => sum + Number(sale.total_amount), 0)

      // Calculate revenue from invoices for this month
      const monthInvoices = invoices.filter(invoice => {
        const invoiceDate = new Date(invoice.invoice_date)
        return invoiceDate >= monthStart && invoiceDate <= monthEnd && invoice.status === 'paid'
      })
      const invoiceRevenue = monthInvoices.reduce((sum, invoice) => sum + Number(invoice.total_amount), 0)

      // For expenses, we'll estimate as 60% of revenue (common business ratio)
      const totalRevenue = revenue + invoiceRevenue
      const expenses = totalRevenue * 0.6

      return {
        month,
        revenue: totalRevenue,
        expenses: expenses
      }
    })
  }, [sales, invoices, business?.currency, dateLocale])

  const currency = business?.currency || 'SLL'
  const formatTick = (value: number) => {
    if (currency === 'SLL') {
      return `Le ${(value / 1000).toFixed(1)}K`
    }
    return `${currency} ${(value / 1000).toFixed(1)}K`
  }

  if (data.every(d => d.revenue === 0 && d.expenses === 0)) {
    return (
      <div className="h-80 flex items-center justify-center text-muted-foreground">
        <p>{t('dashboard.noRevenueData')}</p>
      </div>
    )
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="month" 
            axisLine={false}
            tickLine={false}
            className="text-muted-foreground text-sm"
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            className="text-muted-foreground text-sm"
            tickFormatter={formatTick}
          />
          <Line 
            type="monotone" 
            dataKey="revenue" 
            stroke="hsl(var(--fintech-blue))" 
            strokeWidth={3}
            dot={{ fill: 'hsl(var(--fintech-blue))', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
            name={t('dashboard.revenue')}
          />
          <Line 
            type="monotone" 
            dataKey="expenses" 
            stroke="hsl(var(--prosperity-green))" 
            strokeWidth={3}
            dot={{ fill: 'hsl(var(--prosperity-green))', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
            name={t('dashboard.expenses')}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
