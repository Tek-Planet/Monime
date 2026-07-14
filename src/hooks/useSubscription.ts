import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "./useUserProfile";
import { useAdminType } from "./admin/useAdminType";

// All app pages are gated behind an active subscription.
// Settings remains ungated so users can still access the upgrade flow and account controls.
const PREMIUM_PAGES = [
  "dashboard",
  "invoices",
  "customers",
  "inventory",
  "sales",
  "suppliers",
  "expenses",
  "reports",
  "credit",
];

interface SubscriptionData {
  id: string;
  status: string;
  plan_type: string;
  trial_start_date: string;
  trial_end_date: string;
  current_period_start: string | null;
  current_period_end: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
}

export function useSubscription() {
  const { user } = useAuth();
  const { business } = useUserProfile();
  const { adminType } = useAdminType();

  const isAdmin = adminType === "system_admin" || adminType === "ngo_admin";

  // For team members, check the business owner's subscription
  const { data: ownerUserId } = useQuery({
    queryKey: ["business-owner", business?.id],
    queryFn: async () => {
      if (!business?.id) return null;
      const { data } = await supabase
        .from("businesses")
        .select("owner_id")
        .eq("id", business.id)
        .single();
      return data?.owner_id ?? null;
    },
    enabled: !!business?.id && !!user?.id,
  });

  const isOwner = ownerUserId === user?.id;
  const subscriptionUserId = isOwner ? user?.id : ownerUserId;

  const { data: subscription, isLoading } = useQuery({
    queryKey: ["subscription", subscriptionUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", subscriptionUserId!)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data as SubscriptionData | null;
    },
    enabled: !!subscriptionUserId && !isAdmin,
  });

  // Check promo code redemptions
  const { data: promoAccess } = useQuery({
    queryKey: ["promo-access", subscriptionUserId],
    queryFn: async () => {
      const { data } = await supabase
        .from("promo_code_redemptions")
        .select("access_granted_until")
        .eq("user_id", subscriptionUserId!)
        .gt("access_granted_until", new Date().toISOString())
        .limit(1);
      return (data && data.length > 0) ?? false;
    },
    enabled: !!subscriptionUserId && !isAdmin,
  });

  const hasPremiumAccess = (): boolean => {
    if (isAdmin) return true;
    if (!subscription) return false;
    
    const now = new Date();
    
    // Active paid subscription
    if (subscription.status === "active" && subscription.current_period_end) {
      return new Date(subscription.current_period_end) > now;
    }
    
    // Free trial removed — access requires an active paid subscription or promo code.


    // Promo code access
    if (promoAccess) return true;

    return false;
  };

  const isPremiumPage = (page: string): boolean => {
    return PREMIUM_PAGES.includes(page);
  };

  const canAccessPage = (page: string): boolean => {
    if (!isPremiumPage(page)) return true;
    return hasPremiumAccess();
  };

  const getTrialDaysRemaining = (): number | null => {
    if (!subscription || subscription.status !== "free_trial") return null;
    const end = new Date(subscription.trial_end_date);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  return {
    subscription,
    loading: isLoading,
    hasPremiumAccess: hasPremiumAccess(),
    isPremiumPage,
    canAccessPage,
    isAdmin,
    trialDaysRemaining: getTrialDaysRemaining(),
  };
}
