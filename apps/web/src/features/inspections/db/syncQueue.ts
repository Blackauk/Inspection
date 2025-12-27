import { getInspectionsDB } from './schema';

export type SyncQueueItemType = 
  | 'createInspection' 
  | 'updateInspection' 
  | 'submitInspection' 
  | 'approveInspection' 
  | 'closeInspection';

export interface SyncQueueItem {
  id: string;
  type: SyncQueueItemType;
  inspectionId: string;
  data: unknown;
  retries: number;
  createdAt: number;
}

export async function addToSyncQueue(
  type: SyncQueueItemType,
  inspectionId: string,
  data: unknown
): Promise<string> {
  const db = await getInspectionsDB();
  const id = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const item: SyncQueueItem = {
    id,
    type,
    inspectionId,
    data,
    retries: 0,
    createdAt: Date.now(),
  };
  await db.add('syncQueue', item);
  return id;
}

export async function getSyncQueueItems(): Promise<SyncQueueItem[]> {
  try {
    const db = await getInspectionsDB();
    return db.getAll('syncQueue');
  } catch (error) {
    console.warn('[getSyncQueueItems] Failed to get sync queue items:', error);
    return [];
  }
}

export async function removeFromSyncQueue(id: string): Promise<void> {
  const db = await getInspectionsDB();
  await db.delete('syncQueue', id);
}

export async function updateSyncQueueItem(
  id: string,
  updates: Partial<SyncQueueItem>
): Promise<void> {
  const db = await getInspectionsDB();
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
      // if (item.type === 'createInspection') {
      //   await api.post('/inspections', item.data);
      // } else if (item.type === 'updateInspection') {
      //   await api.put(`/inspections/${item.inspectionId}`, item.data);
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
