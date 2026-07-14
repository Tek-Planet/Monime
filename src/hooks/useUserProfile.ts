import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useCallback, useEffect } from "react";

interface UserProfile {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
}

interface Business {
  id: string;
  owner_id: string;
  business_name: string;
  business_type: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  currency: string | null;
  latitude: number | null;
  longitude: number | null;
  branches_enabled: boolean;
}

interface ProfilePhoto {
  url: string | null;
  filePath: string | null;
}

interface UserProfileData {
  profile: UserProfile | null;
  business: Business | null;
  needsOnboarding: boolean;
  profilePhoto: ProfilePhoto;
}

async function fetchUserProfileData(userId: string): Promise<UserProfileData> {
  // Fetch user profile
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileError && profileError.code !== "PGRST116") {
    console.error("Error fetching profile:", profileError);
  }

  // Fetch profile photo
  let profilePhoto: ProfilePhoto = { url: null, filePath: null };
  const { data: photoData, error: photoError } = await supabase
    .from("profile_documents")
    .select("file_path")
    .eq("user_id", userId)
    .eq("document_type", "profile_photo")
    .maybeSingle();

  if (!photoError && photoData?.file_path) {
    profilePhoto.filePath = photoData.file_path;
    const { data: signedData } = await supabase.storage
      .from("profile-documents")
      .createSignedUrl(photoData.file_path, 3600);
    if (signedData?.signedUrl) {
      profilePhoto.url = signedData.signedUrl;
    }
  }

  // First, check if user owns a business
  const { data: ownedBusiness, error: businessError } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", userId)
    .maybeSingle();

  if (businessError && businessError.code !== "PGRST116") {
    console.error("Error fetching business:", businessError);
  }

  if (ownedBusiness) {
    return {
      profile: profileData,
      business: ownedBusiness,
      needsOnboarding: !profileData || !ownedBusiness,
      profilePhoto,
    };
  }

  // Check if user is a member of an organization
  const { data: memberData, error: memberError } = await supabase
    .from("organization_members")
    .select("business_id, businesses(*)")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  if (memberError && memberError.code !== "PGRST116") {
    console.error("Error fetching organization membership:", memberError);
  }

  if (memberData?.businesses) {
    return {
      profile: profileData,
      business: memberData.businesses as unknown as Business,
      needsOnboarding: false, // Team members don't need onboarding
      profilePhoto,
    };
  }

  // User has no business association - needs onboarding
  return {
    profile: profileData,
    business: null,
    needsOnboarding: true,
    profilePhoto,
  };
}

export function useUserProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch: queryRefetch } = useQuery({
    queryKey: ["user-profile", user?.id],
    queryFn: () => fetchUserProfileData(user!.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes - data stays fresh
    gcTime: 1000 * 60 * 30, // 30 minutes - cache retention
  });

  // Listen for custom event to invalidate cache
  useEffect(() => {
    const handleInvalidate = () => {
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ["user-profile", user.id] });
      }
    };
    window.addEventListener("user-data-updated", handleInvalidate);
    return () => {
      window.removeEventListener("user-data-updated", handleInvalidate);
    };
  }, [user?.id, queryClient]);

  const refetch = useCallback(async () => {
    if (!user?.id) return null;
    
    // Add a small delay to ensure database operations are completed
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    const result = await queryRefetch();
    
    if (result.data) {
      return {
        hasProfile: !!result.data.profile,
        hasBusiness: !!result.data.business,
        needsOnboarding: result.data.needsOnboarding,
      };
    }
    return null;
  }, [user?.id, queryRefetch]);

  // Return default values when no user or data
  if (!user) {
    return {
      profile: null,
      business: null,
      loading: false,
      needsOnboarding: false,
      profilePhotoUrl: null,
      profilePhotoFilePath: null,
      refetch,
    };
  }

  return {
    profile: data?.profile ?? null,
    business: data?.business ?? null,
    loading: isLoading,
    needsOnboarding: data?.needsOnboarding ?? false,
    profilePhotoUrl: data?.profilePhoto?.url ?? null,
    profilePhotoFilePath: data?.profilePhoto?.filePath ?? null,
    refetch,
  };
}
