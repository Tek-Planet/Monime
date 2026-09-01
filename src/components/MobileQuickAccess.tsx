import { TrendingUp, Receipt, Package, Users, FileText, BarChart3, Truck, Settings, Utensils, Briefcase } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '@/contexts/LanguageContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getBusinessArchetype } from '@/lib/businessArchetypes'

interface MobileQuickAccessProps {
  businessType?: string | null
}

export function MobileQuickAccess({ businessType }: MobileQuickAccessProps) {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const archetype = getBusinessArchetype(businessType)

  // Archetype tailored icons and labels
  const getModules = () => {
    if (archetype === 'food') {
      return [
        { label: 'Take Orders', icon: Utensils, route: '/sales', color: 'bg-orange-500/10 text-orange-600' },
        { label: 'Menu & Stock', icon: Package, route: '/inventory', color: 'bg-emerald-500/10 text-emerald-600' },
        { label: 'Table Bills', icon: FileText, route: '/invoices', color: 'bg-amber-500/10 text-amber-600' },
        { label: 'Staff Shifts', icon: Users, route: '/attendance', color: 'bg-indigo-500/10 text-indigo-600' },
        { label: 'Diners', icon: Users, route: '/customers', color: 'bg-violet-500/10 text-violet-600' },
        { label: 'Kitchen Costs', icon: Receipt, route: '/expenses', color: 'bg-red-500/10 text-red-600' },
        { label: 'Food Reports', icon: BarChart3, route: '/reports', color: 'bg-cyan-500/10 text-cyan-600' },
        { label: 'Food Suppliers', icon: Truck, route: '/suppliers', color: 'bg-blue-500/10 text-blue-600' },
      ]
    }

    if (archetype === 'service') {
      return [
        { label: 'Service Jobs', icon: TrendingUp, route: '/sales', color: 'bg-emerald-500/10 text-emerald-600' },
        { label: 'Client Invoices', icon: FileText, route: '/invoices', color: 'bg-amber-500/10 text-amber-600' },
        { label: 'Staff Shifts', icon: Users, route: '/attendance', color: 'bg-indigo-500/10 text-indigo-600' },
        { label: 'Client Roster', icon: Users, route: '/customers', color: 'bg-violet-500/10 text-violet-600' },
        { label: 'Service Rates', icon: Briefcase, route: '/inventory', color: 'bg-blue-500/10 text-blue-600' },
        { label: 'Job Expenses', icon: Receipt, route: '/expenses', color: 'bg-red-500/10 text-red-600' },
        { label: 'Performance', icon: BarChart3, route: '/reports', color: 'bg-cyan-500/10 text-cyan-600' },
        { label: 'Vendors', icon: Truck, route: '/suppliers', color: 'bg-orange-500/10 text-orange-600' },
      ]
    }

    // Default Retail / Provision Store
    return [
      { label: t('nav.sales'), icon: TrendingUp, route: '/sales', color: 'bg-emerald-500/10 text-emerald-600' },
      { label: t('nav.inventory'), icon: Package, route: '/inventory', color: 'bg-blue-500/10 text-blue-600' },
      { label: t('nav.invoices'), icon: FileText, route: '/invoices', color: 'bg-amber-500/10 text-amber-600' },
      { label: t('nav.attendance') || 'Attendance', icon: Users, route: '/attendance', color: 'bg-indigo-500/10 text-indigo-600' },
      { label: t('nav.customers'), icon: Users, route: '/customers', color: 'bg-violet-500/10 text-violet-600' },
      { label: t('nav.expenses'), icon: Receipt, route: '/expenses', color: 'bg-red-500/10 text-red-600' },
      { label: t('nav.reports'), icon: BarChart3, route: '/reports', color: 'bg-cyan-500/10 text-cyan-600' },
      { label: t('nav.suppliers'), icon: Truck, route: '/suppliers', color: 'bg-orange-500/10 text-orange-600' },
    ]
  }

  const modules = getModules()

  return (
    <Card className="professional-card border-0 shadow-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{t('dashboard.quickAccess')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-3">
          {modules.map((mod) => (
            <button
              key={mod.route}
              onClick={() => navigate(mod.route)}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-muted/50 active:scale-95 transition-all"
            >
              <div className={`p-3 rounded-xl ${mod.color}`}>
                <mod.icon className="h-6 w-6" />
              </div>
              <span className="text-[11px] font-medium text-muted-foreground text-center leading-tight">
                {mod.label}
              </span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
