import { getDefectsDB } from './schema';
import type { Defect, DefectFilter, DefectSettings } from '../types';

// Generate next defect code (DEF-000001, DEF-000002, etc.)
export async function generateDefectCode(): Promise<string> {
  const db = await getDefectsDB();
  const counter = await db.get('counters', 'defect');
  
  if (!counter) {
    await db.put('counters', 'defect', {
      key: 'defect',
      counter: 1,
    });
    return 'DEF-000001';
  }

  const nextCounter = counter.counter + 1;
  await db.put('counters', 'defect', {
    key: 'defect',
    counter: nextCounter,
  });

  return `DEF-${nextCounter.toString().padStart(6, '0')}`;
}

// Get settings
export async function getDefectSettings(): Promise<DefectSettings> {
  const db = await getDefectsDB();
  const settings = await db.get('settings', 'defect');
  if (!settings) {
    throw new Error('Defect settings not initialized');
  }
  return settings.settings;
}

// Update settings
export async function updateDefectSettings(settings: Partial<DefectSettings>): Promise<void> {
  const db = await getDefectsDB();
  const current = await db.get('settings', 'defect');
  if (!current) {
    throw new Error('Defect settings not initialized');
  }
  await db.put('settings', 'defect', {
    key: 'defect',
    settings: { ...current.settings, ...settings },
  });
}

// Calculate unsafe flag based on severity and settings
export async function calculateUnsafeFlag(
  severity: Defect['severity'],
  severityModel: Defect['severityModel']
): Promise<boolean> {
  const settings = await getDefectSettings();
  const thresholds = settings.unsafeThresholds[severityModel];
  return thresholds.includes(severity as any);
}

// CRUD Operations
export async function createDefect(defect: Omit<Defect, 'id' | 'defectCode' | 'unsafeDoNotUse'>): Promise<Defect> {
  const db = await getDefectsDB();
  const defectCode = await generateDefectCode();
  const unsafeDoNotUse = await calculateUnsafeFlag(defect.severity, defect.severityModel);

  const newDefect: Defect = {
    ...defect,
    id: crypto.randomUUID(),
    defectCode,
    unsafeDoNotUse,
    history: [
      {
        id: crypto.randomUUID(),
        at: new Date().toISOString(),
        by: defect.createdBy,
        byName: defect.createdByName,
        type: 'status_change',
        summary: `Defect created with status: ${defect.status}`,
      },
    ],
  };

  await db.add('defects', newDefect);
  return newDefect;
}

export async function getDefectById(id: string): Promise<Defect | undefined> {
  const db = await getDefectsDB();
  return db.get('defects', id);
}

export async function getDefectByCode(defectCode: string): Promise<Defect | undefined> {
  const db = await getDefectsDB();
  const index = db.transaction('defects').store.index('by-defectCode');
  return index.get(defectCode);
}

export async function getAllDefects(): Promise<Defect[]> {
  const db = await getDefectsDB();
  return db.getAll('defects');
}

export async function updateDefect(id: string, updates: Partial<Defect>): Promise<Defect> {
  const db = await getDefectsDB();
  const existing = await db.get('defects', id);
  if (!existing) {
    throw new Error(`Defect ${id} not found`);
  }

  // Recalculate unsafe flag if severity changed
  let unsafeDoNotUse = existing.unsafeDoNotUse;
  if (updates.severity || updates.severityModel) {
    unsafeDoNotUse = await calculateUnsafeFlag(
      (updates.severity || existing.severity) as Defect['severity'],
      (updates.severityModel || existing.severityModel) as Defect['severityModel']
    );
  }

  const updated: Defect = {
    ...existing,
    ...updates,
    unsafeDoNotUse,
    updatedAt: new Date().toISOString(),
    updatedBy: updates.updatedBy || existing.updatedBy,
    updatedByName: updates.updatedByName || existing.updatedByName,
  };

  await db.put('defects', updated);
  return updated;
}

export async function deleteDefect(id: string): Promise<void> {
  const db = await getDefectsDB();
  await db.delete('defects', id);
}

// Query & Filter
export async function queryDefects(filter?: DefectFilter): Promise<Defect[]> {
  const db = await getDefectsDB();
  let defects = await db.getAll('defects');

  if (!filter) {
    return defects;
  }

  // Status filter
  if (filter.status) {
    defects = defects.filter((d) => d.status === filter.status);
  }

  // Severity filter
  if (filter.severity) {
    defects = defects.filter((d) => d.severity === filter.severity);
  }

  // Severity model filter
  if (filter.severityModel) {
    defects = defects.filter((d) => d.severityModel === filter.severityModel);
  }

  // Asset filter
  if (filter.assetId) {
    defects = defects.filter((d) => d.assetId === filter.assetId);
  }

  // Location filter
  if (filter.locationId) {
    defects = defects.filter((d) => d.locationId === filter.locationId);
  }

  // Site filter
  if (filter.siteId) {
    defects = defects.filter((d) => d.siteId === filter.siteId);
  }

  // Assigned filter
  if (filter.assignedToId) {
    defects = defects.filter((d) => d.assignedToId === filter.assignedToId);
  }

  // Overdue filter
  if (filter.showOverdue) {
    const now = new Date();
    defects = defects.filter((d) => {
      if (!d.targetRectificationDate) return false;
      return new Date(d.targetRectificationDate) < now && d.status !== 'Closed';
    });
  }

  // Unsafe filter
  if (filter.showUnsafe) {
    defects = defects.filter((d) => d.unsafeDoNotUse);
  }

  // Unassigned filter
  if (filter.showUnassigned) {
    defects = defects.filter((d) => !d.assignedToId);
  }

  // Compliance tag filter
  if (filter.complianceTag) {
    defects = defects.filter((d) => d.complianceTags.includes(filter.complianceTag!));
  }

  // Search filter
  if (filter.search) {
    const searchLower = filter.search.toLowerCase();
    defects = defects.filter(
      (d) =>
        d.defectCode.toLowerCase().includes(searchLower) ||
        d.title.toLowerCase().includes(searchLower) ||
        d.description?.toLowerCase().includes(searchLower) ||
        d.assetId?.toLowerCase().includes(searchLower)
    );
  }

  return defects;
}

// Summary stats
export async function getDefectSummary(): Promise<{
  total: number;
  open: number;
  overdue: number;
  unsafe: number;
}> {
  const defects = await getAllDefects();
  const now = new Date();

  return {
    total: defects.length,
    open: defects.filter((d) => d.status !== 'Closed').length,
    overdue: defects.filter((d) => {
      if (!d.targetRectificationDate) return false;
      return new Date(d.targetRectificationDate) < now && d.status !== 'Closed';
    }).length,
    unsafe: defects.filter((d) => d.unsafeDoNotUse && d.status !== 'Closed').length,
  };
}

// Add history entry
export async function addHistoryEntry(
  defectId: string,
  entry: Omit<Defect['history'][0], 'id'>
): Promise<void> {
  const defect = await getDefectById(defectId);
  if (!defect) {
    throw new Error(`Defect ${defectId} not found`);
  }

  const newEntry = {
    ...entry,
    id: crypto.randomUUID(),
  };

  await updateDefect(defectId, {
    history: [...defect.history, newEntry],
    updatedBy: entry.by,
    updatedByName: entry.byName,
  });
}

// Add comment
export async function addComment(
  defectId: string,
  comment: Omit<Defect['comments'][0], 'id'>
): Promise<void> {
  const defect = await getDefectById(defectId);
  if (!defect) {
    throw new Error(`Defect ${defectId} not found`);
  }

  const newComment = {
    ...comment,
    id: crypto.randomUUID(),
  };

  await updateDefect(defectId, {
    comments: [...defect.comments, newComment],
    updatedBy: comment.by,
    updatedByName: comment.byName,
  });

  // Also add to history
  await addHistoryEntry(defectId, {
    at: comment.at,
    by: comment.by,
    byName: comment.byName,
    type: 'comment',
    summary: `Comment added: ${comment.text.substring(0, 50)}...`,
  });
}
