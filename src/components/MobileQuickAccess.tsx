import { 
  TrendingUp, 
  Receipt, 
  Package, 
  Users, 
  FileText, 
  BarChart3, 
  Truck, 
  Utensils, 
  Briefcase, 
  Clock, 
  CreditCard 
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '@/contexts/LanguageContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getQuickAccessModules, isProfessionalServices } from '@/lib/businessArchetypes'

interface MobileQuickAccessProps {
  businessType?: string | null
}

const ICON_MAP = {
  FileText,
  TrendingUp,
  Users,
  Briefcase,
  Clock,
  Receipt,
  CreditCard,
  BarChart3,
  Utensils,
  Package,
  Truck,
}

export function MobileQuickAccess({ businessType }: MobileQuickAccessProps) {
  const { t } = useLanguage()
  const navigate = useNavigate()

  const rawModules = getQuickAccessModules(businessType)
  const isPro = isProfessionalServices(businessType)

  return (
    <Card className="professional-card border-0 shadow-card">
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg">{t('dashboard.quickAccess')}</CardTitle>
        {isPro && (
          <span className="text-[11px] font-semibold text-primary px-2 py-0.5 rounded-full bg-primary/10">
            Professional Practice
          </span>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-3">
          {rawModules.map((mod) => {
            const IconComponent = ICON_MAP[mod.iconName] || Briefcase
            return (
              <button
                key={mod.label + mod.route}
                onClick={() => navigate(mod.route)}
                title={mod.description}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-muted/50 active:scale-95 transition-all"
              >
                <div className={`p-3 rounded-xl ${mod.color}`}>
                  <IconComponent className="h-6 w-6" />
                </div>
                <span className="text-[11px] font-medium text-muted-foreground text-center leading-tight line-clamp-1">
                  {mod.label}
                </span>
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
