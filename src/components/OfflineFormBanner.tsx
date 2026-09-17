import { WifiOff } from "lucide-react";
import { useOffline } from "@/contexts/OfflineContext";

interface OfflineFormBannerProps {
  moduleName?: string;
  className?: string;
}

export function OfflineFormBanner({ moduleName = "record", className = "" }: OfflineFormBannerProps) {
  const { isOnline } = useOffline();

  if (isOnline) return null;

  return (
    <div
      className={`flex items-start gap-2.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-900 dark:text-amber-200 text-xs sm:text-sm ${className}`}
      role="status"
    >
      <WifiOff className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
      <div className="space-y-0.5">
        <p className="font-semibold leading-tight text-amber-800 dark:text-amber-300">
          Offline Mode Active
        </p>
        <p className="text-muted-foreground dark:text-amber-200/80 leading-snug">
          You are currently offline. This {moduleName} will be saved immediately to this device and automatically synced to the cloud once you reconnect.
        </p>
      </div>
    </div>
  );
}
