import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminType } from '@/hooks/admin/useAdminType'
import { ActivityLogsTable } from '@/components/admin/ActivityLogsTable'
import { Activity } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useLanguage } from '@/contexts/LanguageContext'

export default function ActivityLogs() {
  const { t } = useLanguage()
  const { adminType, ngoId, loading } = useAdminType()
  const navigate = useNavigate()
  
  const isSystemAdmin = adminType === 'system_admin'
  const isNGOAdmin = adminType === 'ngo_admin'
  const hasAdminAccess = isSystemAdmin || isNGOAdmin

  useEffect(() => {
    if (!loading && !hasAdminAccess) {
      navigate('/admin')
    }
  }, [hasAdminAccess, loading, navigate])

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!hasAdminAccess) {
    return null
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Activity className="h-8 w-8" />
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{t("admin.activityLogs")}</h1>
          <p className="text-muted-foreground">
            {isSystemAdmin ? t("admin.activityLogsDesc") : t("admin.ngoActivityDesc")}
          </p>
        </div>
      </div>

      <ActivityLogsTable ngoId={isNGOAdmin ? ngoId : undefined} />
    </div>
  )
}
