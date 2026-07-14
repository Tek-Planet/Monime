import { ReactNode, useState } from 'react'
import { usePageAccess } from '@/hooks/usePageAccess'
import { useSubscription } from '@/hooks/useSubscription'
import { AccessDeniedPage } from '@/pages/AccessDenied'
import { Skeleton } from '@/components/ui/skeleton'
import { UpgradeModal } from '@/components/UpgradeModal'
import { Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/LanguageContext'

interface PageAccessGuardProps {
  pageKey: string
  children: ReactNode
}

export function PageAccessGuard({ pageKey, children }: PageAccessGuardProps) {
  const { hasPageAccess, loading } = usePageAccess()
  const { canAccessPage, isPremiumPage, loading: subLoading, trialDaysRemaining } = useSubscription()
  const { t } = useLanguage()
  const [showUpgrade, setShowUpgrade] = useState(false)

  if (loading || subLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!hasPageAccess(pageKey)) {
    return <AccessDeniedPage />
  }

  // Check subscription access for premium pages
  if (isPremiumPage(pageKey) && !canAccessPage(pageKey)) {
    return (
      <>
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
          <div className="bg-muted/50 rounded-full p-6 mb-6">
            <Crown className="h-12 w-12 text-yellow-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2">{t('subscription.premiumRequired')}</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            {t('subscription.premiumRequiredDesc')}
          </p>
          <Button onClick={() => setShowUpgrade(true)} size="lg">
            <Crown className="h-4 w-4 mr-2" />
            {t('subscription.upgradeToPremium')}
          </Button>
        </div>
        <UpgradeModal open={showUpgrade} onOpenChange={setShowUpgrade} />
      </>
    )
  }

  return <>{children}</>
}
