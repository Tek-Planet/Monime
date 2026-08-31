import { Wifi, WifiOff, RefreshCw, CloudCheck, CloudUpload, Info } from 'lucide-react';
import { useOffline } from '@/contexts/OfflineContext';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

export function OfflineSyncStatus() {
  const { isOnline, isSyncing, pendingCount, lastSyncTime, syncNow } = useOffline();
  const [open, setOpen] = useState(false);

  const handleManualSync = async () => {
    await syncNow();
  };

  const formattedTime = lastSyncTime
    ? lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Just now';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-colors border focus:outline-none focus:ring-1 focus:ring-primary"
          style={{
            backgroundColor: !isOnline
              ? 'hsl(var(--amber-500, 38 92% 50%) / 0.15)'
              : pendingCount > 0
              ? 'hsl(var(--primary) / 0.1)'
              : 'transparent',
            borderColor: !isOnline
              ? 'hsl(var(--amber-500, 38 92% 50%) / 0.3)'
              : pendingCount > 0
              ? 'hsl(var(--primary) / 0.25)'
              : 'transparent',
          }}
          title={!isOnline ? 'Offline Mode Active' : pendingCount > 0 ? `${pendingCount} unsynced items` : 'Online & Synced'}
        >
          {!isOnline ? (
            <>
              <WifiOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="hidden sm:inline text-amber-700 dark:text-amber-300 font-medium">
                Offline {pendingCount > 0 ? `(${pendingCount})` : ''}
              </span>
              <span className="sm:hidden text-amber-700 dark:text-amber-300 font-medium">
                {pendingCount > 0 ? pendingCount : '!'}
              </span>
            </>
          ) : isSyncing ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 text-primary animate-spin" />
              <span className="hidden sm:inline text-primary font-medium">Syncing...</span>
            </>
          ) : pendingCount > 0 ? (
            <>
              <CloudUpload className="w-3.5 h-3.5 text-primary" />
              <span className="text-primary font-medium">
                Sync ({pendingCount})
              </span>
            </>
          ) : (
            <>
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="hidden md:inline text-muted-foreground text-[11px]">Synced</span>
            </>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-72 p-4 text-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {!isOnline ? (
              <Badge variant="destructive" className="bg-amber-600 hover:bg-amber-600 text-white gap-1 text-[11px]">
                <WifiOff className="w-3 h-3" /> Offline
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 gap-1 text-[11px]">
                <Wifi className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Online
              </Badge>
            )}
          </div>
          <span className="text-muted-foreground text-[11px]">
            {lastSyncTime ? `Last sync: ${formattedTime}` : 'All synced'}
          </span>
        </div>

        <div className="space-y-1.5 bg-muted/40 p-2.5 rounded-lg border">
          <div className="flex justify-between items-center text-foreground font-medium">
            <span>Pending Local Records</span>
            <span className="font-semibold text-primary">{pendingCount}</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {!isOnline
              ? "You are working in remote offline mode. New sales and expenses are safely stored on this device."
              : pendingCount > 0
              ? `${pendingCount} record(s) queued. They will be uploaded automatically.`
              : "All local data has been backed up to the cloud."}
          </p>
        </div>

        <div className="flex items-center justify-between pt-1">
          <Button
            size="sm"
            variant={pendingCount > 0 ? "default" : "outline"}
            className="w-full h-8 text-xs font-medium gap-1.5"
            onClick={handleManualSync}
            disabled={!isOnline || isSyncing}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Synchronizing...' : 'Sync Now'}
          </Button>
        </div>

        <div className="flex items-start gap-1.5 text-[10px] text-muted-foreground/80 pt-1 border-t">
          <Info className="w-3 h-3 shrink-0 mt-0.5" />
          <span>Receipts and stock adjustments function normally even with zero network coverage.</span>
        </div>
      </PopoverContent>
    </Popover>
  );
}
