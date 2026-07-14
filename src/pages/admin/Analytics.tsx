import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAdminType } from '@/hooks/useAdminType'
import { useAnalytics } from '@/hooks/useAnalytics'
import { BarChart3, Users, Building2, TrendingUp, Activity } from 'lucide-react'
import { LeCurrency } from '@/components/ui/le-currency'
import { Skeleton } from '@/components/ui/skeleton'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { useLanguage } from '@/contexts/LanguageContext'

export default function Analytics() {
  const { t } = useLanguage()
  const { adminType, ngoId, loading: adminLoading } = useAdminType()
  const navigate = useNavigate()
  
  const isSystemAdmin = adminType === 'system_admin'
  const isNGOAdmin = adminType === 'ngo_admin'
  const hasAdminAccess = isSystemAdmin || isNGOAdmin

  const { data, loading: analyticsLoading } = useAnalytics(isNGOAdmin ? ngoId : undefined)

  useEffect(() => {
    if (!adminLoading && !hasAdminAccess) {
      navigate('/admin')
    }
  }, [hasAdminAccess, adminLoading, navigate])

  if (adminLoading || analyticsLoading) {
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

  if (!data) return null

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-8 w-8" />
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{t("admin.analytics")}</h1>
          <p className="text-muted-foreground">
            {isSystemAdmin ? t("admin.platformAnalytics") : t("admin.ngoAnalytics")}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("admin.totalUsers")}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              +{data.newUsersThisMonth} {t("admin.thisMonth")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("admin.totalBusinesses")}</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalBusinesses}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("admin.totalSales")}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalSales}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("admin.totalRevenue")}</CardTitle>
            <LeCurrency className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Le {data.totalRevenue.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("admin.activeUsersToday")}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.activeUsersToday}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.salesOverTime")}</CardTitle>
          <CardDescription>{t("admin.lastSixMonths")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.salesByMonth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="sales" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.userGrowth")}</CardTitle>
          <CardDescription>{t("admin.newUsersPerMonth")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.userGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="users" stroke="hsl(var(--primary))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.topBusinesses")}</CardTitle>
          <CardDescription>{t("admin.byRevenue")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.topBusinesses.map((business, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{business.name}</p>
                  <p className="text-sm text-muted-foreground">{business.sales} {t("admin.salesLabel")}</p>
                </div>
                <p className="font-bold">
                  Le {business.revenue.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
