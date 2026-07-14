import { TrendingUp, Receipt, Package, Users, FileText, BarChart3, Truck, Settings } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '@/contexts/LanguageContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const modules = [
  { key: 'nav.sales', icon: TrendingUp, route: '/sales', color: 'bg-emerald-500/10 text-emerald-600' },
  { key: 'nav.expenses', icon: Receipt, route: '/expenses', color: 'bg-red-500/10 text-red-600' },
  { key: 'nav.inventory', icon: Package, route: '/inventory', color: 'bg-blue-500/10 text-blue-600' },
  { key: 'nav.customers', icon: Users, route: '/customers', color: 'bg-violet-500/10 text-violet-600' },
  { key: 'nav.invoices', icon: FileText, route: '/invoices', color: 'bg-amber-500/10 text-amber-600' },
  { key: 'nav.reports', icon: BarChart3, route: '/reports', color: 'bg-cyan-500/10 text-cyan-600' },
  { key: 'nav.suppliers', icon: Truck, route: '/suppliers', color: 'bg-orange-500/10 text-orange-600' },
  { key: 'nav.settings', icon: Settings, route: '/settings', color: 'bg-gray-500/10 text-gray-600' },
]

export function MobileQuickAccess() {
  const { t } = useLanguage()
  const navigate = useNavigate()

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
                {t(mod.key)}
              </span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
