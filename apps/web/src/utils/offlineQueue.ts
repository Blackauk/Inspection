import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { QueueItemType, OfflineQueueItem } from '@ppm/shared';
import { api } from './api';

interface QueueDB extends DBSchema {
  queue: {
    key: string;
    value: OfflineQueueItem;
  };
}

let db: IDBPDatabase<QueueDB> | null = null;

export async function initQueue() {
  if (db) return db;
  db = await openDB<QueueDB>('ppm-queue', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('queue')) {
        db.createObjectStore('queue', { keyPath: 'id' });
      }
    },
  });
  return db;
}

export async function addToQueue(
  type: QueueItemType,
  data: unknown
): Promise<string> {
  const queueDb = await initQueue();
  const id = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const item: OfflineQueueItem = {
    id,
    type,
    data,
    retries: 0,
    createdAt: Date.now(),
  };
  await queueDb.add('queue', item);
  return id;
}

export async function getQueueItems(): Promise<OfflineQueueItem[]> {
  const queueDb = await initQueue();
  return queueDb.getAll('queue');
}

export async function removeFromQueue(id: string): Promise<void> {
  const queueDb = await initQueue();
  await queueDb.delete('queue', id);
}

export async function updateQueueItem(
  id: string,
  updates: Partial<OfflineQueueItem>
): Promise<void> {
  const queueDb = await initQueue();
  const item = await queueDb.get('queue', id);
  if (item) {
    await queueDb.put('queue', { ...item, ...updates });
  }
}

export async function processQueue(): Promise<{ success: number; failed: number }> {
  const items = await getQueueItems();
  let success = 0;
  let failed = 0;

  for (const item of items) {
    try {
      if (item.type === 'createWorkOrder') {
        await api.post('/work-orders', item.data);
        await removeFromQueue(item.id);
        success++;
      } else if (item.type === 'submitCheck') {
        await api.post('/check-submissions', item.data);
        await removeFromQueue(item.id);
        success++;
      }
    } catch (error) {
      const newRetries = item.retries + 1;
      if (newRetries >= 5) {
        // Max retries reached, remove from queue
        await removeFromQueue(item.id);
        failed++;
      } else {
        // Exponential backoff: 2^retries seconds
        const delay = Math.pow(2, newRetries) * 1000;
        await updateQueueItem(item.id, {
          retries: newRetries,
          createdAt: Date.now() + delay, // Schedule for retry
        });
      }
    }
  }

  return { success, failed };
}

export async function syncQueue(): Promise<void> {
  if (!navigator.onLine) {
    return;
  }

  const items = await getQueueItems();
  const now = Date.now();

  // Process items that are due for retry
  const dueItems = items.filter(
    (item) => item.createdAt <= now || item.retries === 0
  );

  for (const item of dueItems) {
    try {
      if (item.type === 'createWorkOrder') {
        await api.post('/work-orders', item.data);
        await removeFromQueue(item.id);
      } else if (item.type === 'submitCheck') {
        await api.post('/check-submissions', item.data);
        await removeFromQueue(item.id);
      }
    } catch (error) {
      const newRetries = item.retries + 1;
      if (newRetries >= 5) {
        await removeFromQueue(item.id);
      } else {
        const delay = Math.pow(2, newRetries) * 1000;
        await updateQueueItem(item.id, {
          retries: newRetries,
          createdAt: Date.now() + delay,
        });
      }
    }
  }
}


