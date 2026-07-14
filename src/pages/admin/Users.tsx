import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminType } from "@/hooks/admin/useAdminType";
import { UserManagement } from "@/components/admin/UserManagement";
import { Users as UsersIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Users() {
  const { adminType, loading } = useAdminType();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const isSystemAdmin = adminType === "system_admin";

  useEffect(() => {
    if (!loading && !isSystemAdmin) {
      navigate("/admin");
    }
  }, [isSystemAdmin, loading, navigate]);

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!isSystemAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <UsersIcon className="h-8 w-8" />
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{t("admin.userManagement")}</h1>
          <p className="text-muted-foreground">{t("admin.userManagementDesc")}</p>
        </div>
      </div>

      <UserManagement />
    </div>
  );
}
