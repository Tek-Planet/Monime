import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Users, Building2, TrendingUp } from "lucide-react";
import { LeCurrency } from "@/components/ui/le-currency";
import { useAdminType } from "@/hooks/useAdminType";
import { useLanguage } from "@/contexts/LanguageContext";

export function AdminStats() {
  const { t } = useLanguage();
  const { adminType, ngoId } = useAdminType();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBusinesses: 0,
    totalSales: 0,
    totalExpenses: 0,
    totalRevenue: 0,
    activeToday: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        let businessesQuery = supabase.from("businesses").select("id", { count: "exact", head: true });
        let salesQuery = supabase.from("sales").select("total_amount");
        let expensesQuery = supabase.from("expenses").select("amount");
        let activityQuery = supabase
          .from("activity_logs")
          .select("user_id", { count: "exact", head: true })
          .gte("created_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString());

        if (adminType === "ngo_admin" && ngoId) {
          businessesQuery = businessesQuery.eq("ngo_id", ngoId);
          const { data: ngoBusinesses } = await supabase.from("businesses").select("id").eq("ngo_id", ngoId);
          const businessIds = ngoBusinesses?.map((b) => b.id) || [];
          if (businessIds.length > 0) {
            salesQuery = salesQuery.in("business_id", businessIds);
            expensesQuery = expensesQuery.in("business_id", businessIds);
            activityQuery = activityQuery.in("business_id", businessIds);
          } else {
            setStats({ totalUsers: 0, totalBusinesses: 0, totalSales: 0, totalExpenses: 0, totalRevenue: 0, activeToday: 0 });
            return;
          }
        }

        const [usersRes, businessesRes, salesRes, expensesRes, activityRes] = await Promise.all([
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          businessesQuery, salesQuery, expensesQuery, activityQuery,
        ]);

        const totalSales = salesRes.data?.reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0) || 0;
        const totalExpenses = expensesRes.data?.reduce((sum, expense) => sum + Number(expense.amount || 0), 0) || 0;

        setStats({
          totalUsers: usersRes.count || 0,
          totalBusinesses: businessesRes.count || 0,
          totalSales, totalExpenses,
          totalRevenue: totalSales - totalExpenses,
          activeToday: activityRes.count || 0,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };
    fetchStats();
  }, [adminType, ngoId]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">{t("admin.totalUsers")}</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent><div className="text-2xl font-bold">{stats.totalUsers}</div></CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">{t("admin.totalBusinesses")}</CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent><div className="text-2xl font-bold">{stats.totalBusinesses}</div></CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">{t("admin.totalSales")}</CardTitle>
          <LeCurrency className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent><div className="text-2xl font-bold">Le {stats.totalSales.toLocaleString()}</div></CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">{t("admin.totalExpenses")}</CardTitle>
          <LeCurrency className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent><div className="text-2xl font-bold">Le {stats.totalExpenses.toLocaleString()}</div></CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">{t("admin.netRevenue")}</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent><div className="text-2xl font-bold">Le {stats.totalRevenue.toLocaleString()}</div></CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">{t("admin.activeToday")}</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent><div className="text-2xl font-bold">{stats.activeToday}</div></CardContent>
      </Card>
    </div>
  );
}