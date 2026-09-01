import { TrendingUp, TrendingDown, Users, Package, CreditCard, Utensils, Store, Briefcase, Sparkles, CheckCircle2, Clock } from 'lucide-react'
import { LeCurrency } from '@/components/ui/le-currency'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RevenueChart } from './charts/RevenueChart'
import { RecentTransactions } from './RecentTransactions'
import { BirthdayReminders } from './BirthdayReminders'
import { LocationPromptBanner } from './LocationPromptBanner'
import { MobileQuickAccess } from './MobileQuickAccess'
import { DashboardAttendanceWidget } from './attendance/DashboardAttendanceWidget'
import { useUserProfile } from '@/hooks/useUserProfile'
import { useSales } from '@/hooks/useSales'
import { useInventory } from '@/hooks/useInventory'
import { useInvoices } from '@/hooks/useInvoices'
import { useCustomers } from '@/hooks/useCustomers'
import { useLanguage } from '@/contexts/LanguageContext'
import { useBranchContext } from '@/contexts/BranchContext'
import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { getBusinessArchetype, ARCHETYPE_CONFIGS, BUSINESS_TYPES } from '@/lib/businessArchetypes'

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

  const archetype = useMemo(() => {
    return getBusinessArchetype(business?.business_type)
  }, [business?.business_type])

  const archetypeConfig = ARCHETYPE_CONFIGS[archetype]
  const currentTypeOption = BUSINESS_TYPES.find(b => b.value === business?.business_type)

  const metrics = useMemo(() => {
    // Calculate total revenue from sales and paid invoices
    const salesRevenue = sales.reduce((sum, sale) => sum + Number(sale.total_amount), 0)
    const invoiceRevenue = invoices
      .filter(invoice => invoice.status === 'paid')
      .reduce((sum, invoice) => sum + Number(invoice.total_amount), 0)
    const totalRevenue = salesRevenue + invoiceRevenue
    
    // Calculate total pending invoice amount
    const pendingInvoices = invoices.filter(invoice => invoice.status === 'draft' || invoice.status === 'sent')
    const pendingInvoiceAmount = pendingInvoices.reduce((sum, invoice) => sum + Number(invoice.total_amount), 0)

    // Format currency based on business settings
    const currency = business?.currency || 'SLL'
    const formatCurrency = (amount: number) => {
      if (currency === 'SLL') {
        return `Le ${amount.toLocaleString()}`
      }
      return `${currency} ${amount.toLocaleString()}`
    }

    if (archetype === 'food') {
      // Restaurant / Eatery / Bakery / Lounge specific metrics
      const totalOrdersServed = sales.length + invoices.filter(i => i.status === 'paid').length
      return [
        {
          title: archetypeConfig.metric1Title, // e.g. "Food & Drink Revenue"
          value: formatCurrency(totalRevenue),
          change: sales.length > 0 ? '+' + ((totalRevenue / sales.length) * 0.1).toFixed(1) + '%' : '0%',
          trend: 'up' as const,
          icon: LeCurrency,
          period: archetypeConfig.metric1Period
        },
        {
          title: archetypeConfig.metric2Title, // e.g. "Meals & Orders Served"
          value: totalOrdersServed.toString(),
          change: totalOrdersServed > 0 ? `+${totalOrdersServed} orders` : '0 orders',
          trend: 'up' as const,
          icon: Utensils,
          period: archetypeConfig.metric2Period
        },
        {
          title: archetypeConfig.metric3Title, // e.g. "Menu Items & Stock"
          value: `${inventory.length} items`,
          change: formatCurrency(totalValue),
          trend: 'up' as const,
          icon: Package,
          period: archetypeConfig.metric3Period
        },
        {
          title: archetypeConfig.metric4Title, // e.g. "Pending Orders & Bills"
          value: formatCurrency(pendingInvoiceAmount),
          change: `${pendingInvoices.length} orders`,
          trend: pendingInvoiceAmount > 0 ? 'down' as const : 'up' as const,
          icon: Clock,
          period: archetypeConfig.metric4Period
        },
      ]
    }

    if (archetype === 'service') {
      // Services / Salons / Tailoring / Consulting specific metrics
      const totalJobsCompleted = sales.length + invoices.filter(i => i.status === 'paid').length
      return [
        {
          title: archetypeConfig.metric1Title, // e.g. "Total Service Revenue"
          value: formatCurrency(totalRevenue),
          change: sales.length > 0 ? '+' + ((totalRevenue / sales.length) * 0.1).toFixed(1) + '%' : '0%',
          trend: 'up' as const,
          icon: LeCurrency,
          period: archetypeConfig.metric1Period
        },
        {
          title: archetypeConfig.metric2Title, // e.g. "Jobs & Bookings Done"
          value: totalJobsCompleted.toString(),
          change: totalJobsCompleted > 0 ? `+${totalJobsCompleted} jobs` : '0 jobs',
          trend: 'up' as const,
          icon: CheckCircle2,
          period: archetypeConfig.metric2Period
        },
        {
          title: archetypeConfig.metric3Title, // e.g. "Active Clients"
          value: customers.length.toString(),
          change: customers.length > 0 ? '+' + Math.round(customers.length * 0.1) : '0',
          trend: 'up' as const,
          icon: Users,
          period: archetypeConfig.metric3Period
        },
        {
          title: archetypeConfig.metric4Title, // e.g. "Outstanding Invoices"
          value: formatCurrency(pendingInvoiceAmount),
          change: `${pendingInvoices.length} client bills`,
          trend: pendingInvoiceAmount > 0 ? 'down' as const : 'up' as const,
          icon: CreditCard,
          period: archetypeConfig.metric4Period
        },
      ]
    }

    // Default: Provision Store & Retail Goods
    return [
      {
        title: archetypeConfig.metric1Title, // e.g. "Total Sales Revenue"
        value: formatCurrency(totalRevenue),
        change: sales.length > 0 ? '+' + ((totalRevenue / sales.length) * 0.1).toFixed(1) + '%' : '0%',
        trend: 'up' as const,
        icon: LeCurrency,
        period: archetypeConfig.metric1Period
      },
      {
        title: archetypeConfig.metric2Title, // e.g. "Active Shoppers"
        value: customers.length.toString(),
        change: customers.length > 0 ? '+' + Math.round(customers.length * 0.1) : '0',
        trend: 'up' as const,
        icon: Users,
        period: archetypeConfig.metric2Period
      },
      {
        title: archetypeConfig.metric3Title, // e.g. "Inventory Valuation"
        value: formatCurrency(totalValue),
        change: `${inventory.length} items`,
        trend: 'up' as const,
        icon: Store,
        period: archetypeConfig.metric3Period
      },
      {
        title: archetypeConfig.metric4Title, // e.g. "Pending Store Credits"
        value: formatCurrency(pendingInvoiceAmount),
        change: `${pendingInvoices.length} invoices`,
        trend: pendingInvoiceAmount > 0 ? 'down' as const : 'up' as const,
        icon: CreditCard,
        period: archetypeConfig.metric4Period
      },
    ]
  }, [sales, inventory, invoices, customers, totalValue, business?.currency, business?.business_type, archetype, archetypeConfig, language])

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

      {/* Enhanced Welcome Header with Personalized Industry Badge */}
      <div className="relative overflow-hidden bg-primary rounded-2xl shadow-glow">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
        <div className="relative px-8 py-10 text-center text-white">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-xs font-semibold mb-3">
            <span>{archetypeConfig.badge}</span>
            {currentTypeOption && (
              <>
                <span className="opacity-40">•</span>
                <span>{currentTypeOption.label}</span>
              </>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 tracking-tight">
            {greeting}, {userName}! 👋
          </h1>
          <p className="text-base sm:text-lg md:text-xl opacity-90 mb-2">
            {t('dashboard.welcomeTo')} {businessName}
          </p>
          {hasBranches && selectedBranch && (
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30 mb-2">
              📍 {selectedBranch.branch_name}
            </Badge>
          )}
          <p className="text-xs sm:text-sm text-white/80">
            {new Date().toLocaleDateString(
              language === 'fr' ? 'fr-FR' : language === 'ar' ? 'ar-SA' : 'en-US', 
              { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
            )}
          </p>
        </div>
      </div>

      {/* Quick Access Module Icons with Archetype Customization */}
      <MobileQuickAccess businessType={business?.business_type} />

      {/* Staff Attendance Live Bar */}
      <DashboardAttendanceWidget businessId={businessId} />

      {/* Enhanced Metrics Grid with Personalized Industry Titles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-7">
        {metrics.map((metric, index) => (
          <Card key={metric.title} className="group professional-card hover-lift border-0 bg-gradient-card shadow-card hover:shadow-elegant transition-all duration-300" style={{animationDelay: `${index * 0.1}s`}}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 p-7">
              <CardTitle className="text-xs sm:text-sm font-bold text-muted-foreground uppercase tracking-wider">
                {metric.title}
              </CardTitle>
              <div className="p-3 bg-muted/50 rounded-xl group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                <metric.icon className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="pt-2 px-7 pb-7">
              <div className="text-2xl sm:text-3xl font-bold text-foreground mb-2" aria-label={`${metric.title}: ${metric.value}`}>
                {metric.value}
              </div>
              <div className="flex items-center text-xs sm:text-sm">
                {metric.trend === 'up' ? (
                  <TrendingUp className="h-4 w-4 text-success mr-2 shrink-0" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-destructive mr-2 shrink-0" />
                )}
                <span className={`font-semibold ${metric.trend === 'up' ? 'text-success' : 'text-destructive'}`}>
                  {metric.change}
                </span>
                <span className="text-muted-foreground ml-2 capitalize truncate">{metric.period}</span>
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
