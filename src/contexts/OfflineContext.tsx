import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { processOutboxSync, getPendingOutboxCount, type SyncResult } from '@/lib/offlineSyncEngine';
import { offlineDb } from '@/lib/offlineDb';

interface OfflineContextType {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime: Date | null;
  syncNow: () => Promise<SyncResult>;
  refreshPendingCount: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const refreshPendingCount = useCallback(async () => {
    try {
      const count = await getPendingOutboxCount();
      setPendingCount(count);
    } catch {
      // ignore
    }
  }, []);

  const syncNow = useCallback(async (): Promise<SyncResult> => {
    if (!navigator.onLine) {
      toast({
        title: "You are currently offline",
        description: "Your records are safely saved locally. They will sync automatically once internet is available.",
      });
      return { success: 0, failed: 0, total: 0, errors: ["Offline"] };
    }

    setIsSyncing(true);
    try {
      const result = await processOutboxSync();
      setLastSyncTime(new Date());
      await refreshPendingCount();

      if (result.total > 0) {
        // Invalidate react queries so UI reflects synced state
        queryClient.invalidateQueries({ queryKey: ['sales'] });
        queryClient.invalidateQueries({ queryKey: ['expenses'] });
        queryClient.invalidateQueries({ queryKey: ['inventory'] });
        queryClient.invalidateQueries({ queryKey: ['customers'] });

        if (result.failed === 0) {
          toast({
            title: "Offline Data Synced",
            description: `Successfully uploaded ${result.success} record${result.success > 1 ? 's' : ''} to the cloud.`,
          });
        } else {
          toast({
            title: "Sync partially completed",
            description: `Synced ${result.success} of ${result.total} records. Retrying remaining shortly.`,
            variant: "destructive",
          });
        }
      }
      return result;
    } catch (err: any) {
      console.error('Error running manual sync:', err);
      toast({
        title: "Sync issue",
        description: err?.message || "Could not sync offline records at this moment.",
        variant: "destructive",
      });
      return { success: 0, failed: 1, total: 1, errors: [err?.message || 'Sync error'] };
    } finally {
      setIsSyncing(false);
    }
  }, [toast, queryClient, refreshPendingCount]);

  // Network online / offline listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Back Online",
        description: "Network connected. Synchronizing offline records...",
      });
      // Trigger background sync on reconnect
      syncNow();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "Offline Mode Active",
        description: "No internet connection. Sales & expenses will be saved on your device.",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    refreshPendingCount();

    // Check last sync time from dexie meta
    offlineDb.meta.get('last_sync_completed_at').then(meta => {
      if (meta?.value) {
        setLastSyncTime(new Date(meta.value));
      }
    }).catch(() => {});

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncNow, toast, refreshPendingCount]);

  // Periodic polling for sync if there are pending items and we are online
  useEffect(() => {
    const interval = setInterval(() => {
      if (navigator.onLine && pendingCount > 0 && !isSyncing) {
        syncNow();
      } else {
        refreshPendingCount();
      }
    }, 20000);

    return () => clearInterval(interval);
  }, [pendingCount, isSyncing, syncNow, refreshPendingCount]);

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        isSyncing,
        pendingCount,
        lastSyncTime,
        syncNow,
        refreshPendingCount,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = (): OfflineContextType => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};
