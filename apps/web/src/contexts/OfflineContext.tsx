import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { syncQueue, getQueueItems } from '../utils/offlineQueue';
import type { OfflineQueueItem } from '@ppm/shared';

type SyncStatus = 'online' | 'offline' | 'syncing' | 'synced' | 'failed';

interface OfflineContextType {
  isOnline: boolean;
  syncStatus: SyncStatus;
  queueItems: OfflineQueueItem[];
  sync: () => Promise<void>;
  refreshQueue: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export function OfflineProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(
    navigator.onLine ? 'online' : 'offline'
  );
  const [queueItems, setQueueItems] = useState<OfflineQueueItem[]>([]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncStatus('online');
      sync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    refreshQueue();

    // Sync every 30 seconds when online
    const syncInterval = setInterval(() => {
      if (navigator.onLine) {
        sync();
      }
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(syncInterval);
    };
  }, []);

  async function sync() {
    if (!navigator.onLine) {
      setSyncStatus('offline');
      return;
    }

    setSyncStatus('syncing');
    try {
      await syncQueue();
      await refreshQueue();
      setSyncStatus('synced');
      setTimeout(() => {
        if (navigator.onLine) {
          setSyncStatus('online');
        }
      }, 2000);
    } catch (error) {
      setSyncStatus('failed');
      setTimeout(() => {
        if (navigator.onLine) {
          setSyncStatus('online');
        }
      }, 3000);
    }
  }

  async function refreshQueue() {
    const items = await getQueueItems();
    setQueueItems(items);
  }

  return (
    <OfflineContext.Provider
      value={{ isOnline, syncStatus, queueItems, sync, refreshQueue }}
    >
      {children}
    </OfflineContext.Provider>
  );
}

export function useOffline() {
  const context = useContext(OfflineContext);
  if (context === undefined) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
}


