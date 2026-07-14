import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminType } from "@/hooks/useAdminType";
import { Users, Activity, BarChart3, Shield, Building2, ArrowRight, CreditCard, Megaphone } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminStats } from "@/components/admin/AdminStats";
import { PromoCodeManagement } from "@/components/admin/PromoCodeManagement";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Admin() {
  const { t } = useLanguage();
  const {
    adminType,
    loading
  } = useAdminType();
  const navigate = useNavigate();
  const isSystemAdmin = adminType === "system_admin";
  const isNGOAdmin = adminType === "ngo_admin";
  const hasAdminAccess = isSystemAdmin || isNGOAdmin;
  useEffect(() => {
    if (!loading && !hasAdminAccess) {
      navigate("/");
    }
  }, [hasAdminAccess, loading, navigate]);
  if (loading) {
    return <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>;
  }
  if (!hasAdminAccess) {
    return null;
  }
  const adminModules = [...(isSystemAdmin ? [{
    title: t("admin.userManagement"),
    description: t("admin.userManagementDesc"),
    icon: Users,
    path: "/admin/users",
    color: "text-blue-500"
  }, {
    title: t("admin.ngoManagement"),
    description: t("admin.ngoManagementDesc"),
    icon: Building2,
    path: "/admin/ngos",
    color: "text-green-500"
  }, {
    title: t("adminSub.title"),
    description: t("adminSub.description"),
    icon: CreditCard,
    path: "/admin/subscriptions",
    color: "text-emerald-500"
  }, {
    title: t("marketer.title"),
    description: t("marketer.description"),
    icon: Megaphone,
    path: "/admin/marketers",
    color: "text-pink-500"
  }] : []), {
    title: t("admin.activityLogs"),
    description: isSystemAdmin ? t("admin.activityLogsDesc") : t("admin.ngoActivityDesc"),
    icon: Activity,
    path: "/admin/activity-logs",
    color: "text-purple-500"
  }, {
    title: t("admin.analytics"),
    description: t("admin.analyticsDesc"),
    icon: BarChart3,
    path: "/admin/analytics",
    color: "text-orange-500"
  }];
  return <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">{t("admin.title")}</h1>
          <p className="text-muted-foreground">{isSystemAdmin ? t("admin.systemAdmin") : t("admin.ngoAdmin")}</p>
        </div>
      </div>

      <AdminStats />

      <div>
        <h2 className="text-2xl font-semibold mb-4">{t("admin.modules")}</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
          {adminModules.map(module => <Link to={module.path}>
              <Card key={module.path} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <module.icon className={`h-8 w-8 ${module.color}`} />
                    <div className="flex-1">
                      <CardTitle>{module.title}</CardTitle>
                      <CardDescription>{module.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>)}
        </div>
      </div>

      {isSystemAdmin && <PromoCodeManagement />}
    </div>;
}