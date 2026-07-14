import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useUserProfile } from "@/hooks/useUserProfile";

const BANNER_DISMISSED_KEY = "profile-completion-banner-dismissed";

export function ProfileCompletionBanner() {
  const { profile, loading } = useUserProfile();
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem(BANNER_DISMISSED_KEY);
    if (dismissed === "true") {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem(BANNER_DISMISSED_KEY, "true");
  };

  // Don't show while loading
  if (loading) return null;

  // Don't show if no profile exists (onboarding handles this)
  if (!profile) return null;

  // Don't show if profile is complete
  const isIncomplete = !profile.first_name || !profile.last_name || !profile.phone;
  if (!isIncomplete) return null;

  // Don't show if dismissed
  if (isDismissed) return null;

  return (
    <Alert className="rounded-none border-x-0 border-t-0 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500 flex-shrink-0" />
          <AlertDescription className="text-amber-800 dark:text-amber-200 text-sm">
            {"Your profile is incomplete. Please add your name and phone number."}
          </AlertDescription>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            asChild
            size="sm"
            variant="outline"
            className="h-7 text-xs border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900"
          >
            <Link to="/settings">{"Complete Profile"}</Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-amber-600 dark:text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Alert>
  );
}
