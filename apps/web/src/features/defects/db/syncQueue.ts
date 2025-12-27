import { getDefectsDB } from './schema';

export type SyncQueueItemType = 'createDefect' | 'updateDefect' | 'deleteDefect' | 'closeDefect' | 'reopenDefect';

export interface SyncQueueItem {
  id: string;
  type: SyncQueueItemType;
  defectId: string;
  data: unknown;
  retries: number;
  createdAt: number;
}

export async function addToSyncQueue(
  type: SyncQueueItemType,
  defectId: string,
  data: unknown
): Promise<string> {
  const db = await getDefectsDB();
  const id = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const item: SyncQueueItem = {
    id,
    type,
    defectId,
    data,
    retries: 0,
    createdAt: Date.now(),
  };
  await db.add('syncQueue', item);
  return id;
}

export async function getSyncQueueItems(): Promise<SyncQueueItem[]> {
  const db = await getDefectsDB();
  return db.getAll('syncQueue');
}

export async function removeFromSyncQueue(id: string): Promise<void> {
  const db = await getDefectsDB();
  await db.delete('syncQueue', id);
}

export async function updateSyncQueueItem(
  id: string,
  updates: Partial<SyncQueueItem>
): Promise<void> {
  const db = await getDefectsDB();
  const item = await db.get('syncQueue', id);
  if (item) {
    await db.put('syncQueue', { ...item, ...updates });
  }
}

// Stub sync function (Phase 1 - no actual server)
export async function flushSyncQueue(): Promise<{ success: number; failed: number }> {
  const items = await getSyncQueueItems();
  let success = 0;
  let failed = 0;

  // In Phase 1, we just simulate success
  for (const item of items) {
    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 100));
      
      // In Phase 2, this would be:
      // if (item.type === 'createDefect') {
      //   await api.post('/defects', item.data);
      // } else if (item.type === 'updateDefect') {
      //   await api.put(`/defects/${item.defectId}`, item.data);
      // } etc.

      await removeFromSyncQueue(item.id);
      success++;
    } catch (error) {
      const newRetries = item.retries + 1;
      if (newRetries >= 5) {
        await removeFromSyncQueue(item.id);
        failed++;
      } else {
        const delay = Math.pow(2, newRetries) * 1000;
        await updateSyncQueueItem(item.id, {
          retries: newRetries,
          createdAt: Date.now() + delay,
        });
      }
    }
  }

  return { success, failed };
}
