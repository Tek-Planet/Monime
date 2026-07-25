import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Users, Building2, TrendingUp } from "lucide-react";
import { LeCurrency } from "@/components/ui/le-currency";
import { useAdminType } from "@/hooks/useAdminType";
import { useLanguage } from "@/contexts/LanguageContext";
import { fetchAllPages } from "@/lib/fetchAllPages";

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
        let activityQuery = supabase
          .from("activity_logs")
          .select("user_id", { count: "exact", head: true })
          .gte("created_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString());

        let businessIds: string[] = [];
        if (adminType === "ngo_admin" && ngoId) {
          businessesQuery = businessesQuery.eq("ngo_id", ngoId);
          const { data: ngoBusinesses } = await supabase.from("businesses").select("id").eq("ngo_id", ngoId);
          businessIds = ngoBusinesses?.map((b) => b.id) || [];
          if (businessIds.length > 0) {
            activityQuery = activityQuery.in("business_id", businessIds);
          } else {
            setStats({ totalUsers: 0, totalBusinesses: 0, totalSales: 0, totalExpenses: 0, totalRevenue: 0, activeToday: 0 });
            return;
          }
        }

        const [usersRes, businessesRes, activityRes, salesData, expensesData] = await Promise.all([
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          businessesQuery,
          activityQuery,
          fetchAllPages<{ total_amount: number }>(() => {
            let q = supabase.from("sales").select("total_amount");
            if (adminType === "ngo_admin" && ngoId && businessIds.length > 0) {
              q = q.in("business_id", businessIds);
            }
            return q.order("created_at", { ascending: false });
          }),
          fetchAllPages<{ amount: number }>(() => {
            let q = supabase.from("expenses").select("amount");
            if (adminType === "ngo_admin" && ngoId && businessIds.length > 0) {
              q = q.in("business_id", businessIds);
            }
            return q.order("created_at", { ascending: false });
          }),
        ]);

        const totalSales = salesData.reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0);
        const totalExpenses = expensesData.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

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