import { TrendingUp, TrendingDown, Users, Package, CreditCard } from 'lucide-react'
import { LeCurrency } from '@/components/ui/le-currency'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RevenueChart } from './charts/RevenueChart'
import { RecentTransactions } from './RecentTransactions'
import { BirthdayReminders } from './BirthdayReminders'
import { LocationPromptBanner } from './LocationPromptBanner'
import { MobileQuickAccess } from './MobileQuickAccess'
import { useUserProfile } from '@/hooks/useUserProfile'
import { useSales } from '@/hooks/useSales'
import { useInventory } from '@/hooks/useInventory'
import { useInvoices } from '@/hooks/useInvoices'
import { useCustomers } from '@/hooks/useCustomers'
import { useLanguage } from '@/contexts/LanguageContext'
import { useBranchContext } from '@/contexts/BranchContext'
import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'

export function Dashboard() {
  const { t, language } = useLanguage()
  const { profile, business, loading } = useUserProfile()
  const { selectedBranch, hasBranches } = useBranchContext()
  const businessId = business?.id
  // These hooks now respect selectedBranchId from BranchContext
  const { sales, loading: salesLoading } = useSales(businessId)
  const { inventory, totalValue, loading: inventoryLoading } = useInventory(businessId)
  const { invoices, loading: invoicesLoading } = useInvoices(businessId)
  const { customers, loading: customersLoading } = useCustomers(businessId)

  const metrics = useMemo(() => {

    // Calculate total revenue from sales and paid invoices
    const salesRevenue = sales.reduce((sum, sale) => sum + Number(sale.total_amount), 0)
    const invoiceRevenue = invoices
      .filter(invoice => invoice.status === 'paid')
      .reduce((sum, invoice) => sum + Number(invoice.total_amount), 0)
    const totalRevenue = salesRevenue + invoiceRevenue
    
    // Calculate total pending invoice amount
    const pendingInvoiceAmount = invoices
      .filter(invoice => invoice.status === 'draft' || invoice.status === 'sent')
      .reduce((sum, invoice) => sum + Number(invoice.total_amount), 0)

    // Format currency based on business settings
    const currency = business?.currency || 'SLL'
    const formatCurrency = (amount: number) => {
      if (currency === 'SLL') {
        return `Le ${amount.toLocaleString()}`
      }
      return `${currency} ${amount.toLocaleString()}`
    }

    return [
      {
        title: t('dashboard.totalRevenue'),
        value: formatCurrency(totalRevenue),
        change: sales.length > 0 ? '+' + ((totalRevenue / sales.length) * 0.1).toFixed(1) + '%' : '0%',
        trend: 'up' as const,
        icon: LeCurrency,
        period: t('dashboard.fromSales')
      },
      {
        title: t('dashboard.activeCustomers'),
        value: customers.length.toString(),
        change: customers.length > 0 ? '+' + Math.round(customers.length * 0.1) : '0',
        trend: 'up' as const,
        icon: Users,
        period: t('dashboard.totalCustomers')
      },
      {
        title: t('dashboard.inventoryValue'),
        value: formatCurrency(totalValue),
        change: inventory.length > 0 ? '+' + ((totalValue / 1000) * 0.05).toFixed(1) + '%' : '0%',
        trend: 'up' as const,
        icon: Package,
        period: t('dashboard.currentStock')
      },
      {
        title: t('dashboard.pendingInvoices'),
        value: formatCurrency(pendingInvoiceAmount),
        change: invoices.filter(i => i.status === 'draft' || i.status === 'sent').length + ' ' + t('dashboard.invoices'),
        trend: pendingInvoiceAmount > 0 ? 'down' as const : 'up' as const,
        icon: CreditCard,
        period: t('dashboard.awaitingPayment')
      },
    ]
  }, [sales, inventory, invoices, customers, totalValue, business?.currency, salesLoading, inventoryLoading, invoicesLoading, customersLoading, language])

  // Only show loading on initial load (all hooks loading), not on return with cached data
  const isInitialLoading = loading && salesLoading && inventoryLoading && invoicesLoading && customersLoading

  if (isInitialLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-muted-foreground text-sm">{t("dashboard.loadingData")}</p>
      </div>
    )
  }

  const businessName = business?.business_name || t('dashboard.yourBusiness')
  const userName = profile?.first_name ? `${profile.first_name}${profile.last_name ? ' ' + profile.last_name : ''}` : t('dashboard.user')
  const greeting = new Date().getHours() < 12 ? t('dashboard.goodMorning') : new Date().getHours() < 17 ? t('dashboard.goodAfternoon') : t('dashboard.goodEvening')

  // Check if business has no location set
  const showLocationBanner = business && !business.latitude && !business.longitude;

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Location Prompt Banner for businesses without location */}
      {showLocationBanner && <LocationPromptBanner businessName={business.business_name} />}

      {/* Enhanced Welcome Header */}
      <div className="relative overflow-hidden bg-primary rounded-2xl shadow-glow">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
        <div className="relative px-8 py-12 text-center text-white">
          {/* <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4 backdrop-blur-sm">
            <LeCurrency className="text-2xl" />
          </div> */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 tracking-tight">{greeting}, {userName}! 👋</h1>
          <p className="text-base sm:text-lg md:text-xl opacity-90 mb-2">{t('dashboard.welcomeTo')} {businessName}</p>
          {hasBranches && selectedBranch && (
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30 mb-2">
              {selectedBranch.branch_name}
            </Badge>
          )}
          <p className="text-white/80">{new Date().toLocaleDateString(
            language === 'fr' ? 'fr-FR' : language === 'ar' ? 'ar-SA' : 'en-US', 
            { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
          )}</p>
        </div>
      </div>

      {/* Quick Access Module Icons */}
      <MobileQuickAccess />

      {/* Enhanced Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-7">
        {metrics.map((metric, index) => (
          <Card key={metric.title} className="group professional-card hover-lift border-0 bg-gradient-card shadow-card hover:shadow-elegant transition-all duration-300" style={{animationDelay: `${index * 0.1}s`}}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 p-7">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {metric.title}
              </CardTitle>
              <div className="p-3 bg-muted/50 rounded-lg">
                <metric.icon className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="pt-2 px-7 pb-7">
              <div className="text-2xl sm:text-3xl font-bold text-foreground mb-2" aria-label={`${metric.title}: ${metric.value}`}>{metric.value}</div>
              <div className="flex items-center text-xs sm:text-sm">
                {metric.trend === 'up' ? (
                  <TrendingUp className="h-4 w-4 text-success mr-2" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-destructive mr-2" />
                )}
                <span className={`font-semibold ${metric.trend === 'up' ? 'text-success' : 'text-destructive'}`}>
                  {metric.change}
                </span>
                <span className="text-muted-foreground ml-2">{metric.period}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Enhanced Charts and Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-7 lg:gap-9">
        {/* Enhanced Revenue Chart */}
        <Card className="lg:col-span-2 professional-card border-0 shadow-card hover:shadow-elegant transition-all duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl">
              <div className="p-2 bg-primary/10 rounded-lg">
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              {t('dashboard.revenueOverview')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart businessId={businessId} />
          </CardContent>
        </Card>

        {/* Enhanced Recent Transactions */}
        <Card className="professional-card border-0 shadow-card hover:shadow-elegant transition-all duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl">
              <div className="p-2 bg-prosperity-green/10 rounded-lg">
              <LeCurrency className="h-5 w-5 sm:h-6 sm:w-6 text-prosperity-green" />
              </div>
              {t('dashboard.recentTransactions')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RecentTransactions businessId={businessId} />
          </CardContent>
        </Card>
      </div>

      {/* Birthday Reminders */}
      <BirthdayReminders businessId={businessId} />

    </div>
  )
}
