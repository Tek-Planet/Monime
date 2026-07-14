import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "./useUserProfile";

interface PageAccessData {
  accessiblePages: string[];
  isOwner: boolean;
}

async function fetchPageAccess(
  userId: string,
  businessId: string
): Promise<PageAccessData> {
  // Check if user is the owner
  const { data: businessData } = await supabase
    .from("businesses")
    .select("owner_id")
    .eq("id", businessId)
    .single();

  if (businessData?.owner_id === userId) {
    return {
      isOwner: true,
      accessiblePages: ["all"], // Owner has access to everything
    };
  }

  // Check member access
  const { data: memberData } = await supabase
    .from("organization_members")
    .select("accessible_pages")
    .eq("business_id", businessId)
    .eq("user_id", userId)
    .eq("is_active", true)
    .single();

  return {
    isOwner: false,
    accessiblePages: memberData?.accessible_pages || [],
  };
}

export function usePageAccess() {
  const { user } = useAuth();
  const { business, loading: profileLoading } = useUserProfile();

  const { data, isLoading } = useQuery({
    queryKey: ["page-access", user?.id, business?.id],
    queryFn: () => fetchPageAccess(user!.id, business!.id),
    enabled: !!user?.id && !!business?.id && !profileLoading,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });

  const hasPageAccess = (page: string): boolean => {
    if (data?.isOwner) return true;
    return data?.accessiblePages.includes(page) ?? false;
  };

  return {
    accessiblePages: data?.accessiblePages ?? [],
    isOwner: data?.isOwner ?? false,
    loading: profileLoading || isLoading,
    hasPageAccess,
  };
}
