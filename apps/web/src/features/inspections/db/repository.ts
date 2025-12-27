import { getInspectionsDB } from './schema';
import type { Inspection, InspectionTemplate, InspectionFilter, InspectionSettings, ChecklistItemAnswer } from '../types';
import { createDefect } from '../../defects/db/repository';
import type { Defect } from '../../defects/types';

// Generate next inspection code (INSP-000001, INSP-000002, etc.)
export async function generateInspectionCode(): Promise<string> {
  const db = await getInspectionsDB();
  const counter = await db.get('counters', 'inspection');
  
  if (!counter) {
    await db.put('counters', 'inspection', {
      key: 'inspection',
      counter: 1,
    });
    return 'INSP-000001';
  }

  const nextCounter = counter.counter + 1;
  await db.put('counters', 'inspection', {
    key: 'inspection',
    counter: nextCounter,
  });

  return `INSP-${nextCounter.toString().padStart(6, '0')}`;
}

// Get settings
export async function getInspectionSettings(): Promise<InspectionSettings> {
  const db = await getInspectionsDB();
  const settings = await db.get('settings', 'inspection');
  if (!settings) {
    throw new Error('Inspection settings not initialized');
  }
  return settings.settings;
}

// Update settings
export async function updateInspectionSettings(settings: Partial<InspectionSettings>): Promise<void> {
  const db = await getInspectionsDB();
  const current = await db.get('settings', 'inspection');
  if (!current) {
    throw new Error('Inspection settings not initialized');
  }
  await db.put('settings', 'inspection', {
    key: 'inspection',
    settings: { ...current.settings, ...settings },
  });
}

// Auto-create defects from failed checklist items
export async function autoCreateDefectsFromInspection(
  inspection: Inspection,
  failedAnswers: ChecklistItemAnswer[]
): Promise<string[]> {
  const settings = await getInspectionSettings();
  if (!settings.requireDefectOnFail) {
    return [];
  }

  const defectIds: string[] = [];

  for (const answer of failedAnswers) {
    const item = inspection.items.find((i) => i.id === answer.checklistItemId);
    if (!item) continue;

    // Determine severity from item default or fallback
    const severity = item.defaultSeverity || 'Medium';
    const severityModel = severity === 'Minor' || severity === 'Major' || severity === 'Critical' ? 'MMC' : 'LMH';

    // Create defect
    const defect: Omit<Defect, 'id' | 'defectCode' | 'unsafeDoNotUse' | 'history'> = {
      title: `Defect from ${inspection.inspectionCode}: ${item.question}`,
      description: answer.comment || `Failed inspection item: ${item.question}`,
      severityModel,
      severity: severity as any,
      status: 'Open',
      complianceTags: item.complianceTag ? [item.complianceTag] : [],
      actions: [],
      attachments: answer.photoUri ? [{
        id: crypto.randomUUID(),
        type: 'photo' as const,
        filename: `inspection-${inspection.inspectionCode}-${item.id}.jpg`,
        uri: answer.photoUri,
        createdAt: new Date().toISOString(),
      }] : [],
      beforeAfterRequired: false,
      reopenedCount: 0,
      assetId: inspection.assetId || undefined,
      locationId: inspection.locationId || undefined,
      inspectionId: inspection.id,
      siteId: inspection.siteId || undefined,
      siteName: inspection.siteName || undefined,
      createdAt: new Date().toISOString(),
      createdBy: inspection.inspectorId,
      createdByName: inspection.inspectorName,
      updatedAt: new Date().toISOString(),
      updatedBy: inspection.inspectorId,
      updatedByName: inspection.inspectorName,
      comments: [],
    };

    const createdDefect = await createDefect(defect);
    defectIds.push(createdDefect.id);
  }

  return defectIds;
}

// Validate inspection can be submitted
export async function validateInspectionSubmission(inspection: Inspection): Promise<{ valid: boolean; errors: string[] }> {
  const settings = await getInspectionSettings();
  const errors: string[] = [];

  // Must have at least asset or location
  if (!inspection.assetId && !inspection.locationId) {
    errors.push('Inspection must be linked to at least one Asset or Location');
  }

  // All required items must be answered
  const requiredItems = inspection.items.filter((i) => i.required);
  const answeredItemIds = new Set(inspection.answers.map((a) => a.checklistItemId));
  const missingRequired = requiredItems.filter((i) => !answeredItemIds.has(i.id));
  if (missingRequired.length > 0) {
    errors.push(`Missing answers for ${missingRequired.length} required checklist item(s)`);
  }

  // Check for failed items
  const failedAnswers = inspection.answers.filter((a) => a.result === 'Fail');
  if (failedAnswers.length > 0) {
    // Check if comments are required
    if (settings.requireCommentOnFail) {
      const missingComments = failedAnswers.filter((a) => !a.comment || !a.comment.trim());
      if (missingComments.length > 0) {
        errors.push('Comments are required for all failed items');
      }
    }

    // Check if photos are required
    if (settings.requirePhotoOnFail) {
      const itemsRequiringPhoto = failedAnswers.filter((a) => {
        const item = inspection.items.find((i) => i.id === a.checklistItemId);
        return item?.photoRequiredOnFail && !a.photoUri;
      });
      if (itemsRequiringPhoto.length > 0) {
        errors.push('Photos are required for failed items marked as photo-required');
      }
    }

    // If defects are required, they will be auto-created, but we need to ensure it's possible
    if (settings.requireDefectOnFail) {
      // Defects will be auto-created, so this is just a validation check
      // No additional errors needed here
    }
  }

  // Check critical items
  const criticalItems = inspection.items.filter((i) => i.critical);
  const criticalAnswers = inspection.answers.filter((a) => {
    const item = inspection.items.find((i) => i.id === a.checklistItemId);
    return item?.critical && a.result === 'Fail';
  });
  if (criticalAnswers.length > 0) {
    // Critical failure means inspection fails
    // This is handled in result calculation
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Calculate inspection result
export function calculateInspectionResult(inspection: Inspection): 'Pass' | 'Fail' | 'Pending' {
  // If no answers, pending
  if (inspection.answers.length === 0) {
    return 'Pending';
  }

  // Check for critical failures
  const criticalItems = inspection.items.filter((i) => i.critical);
  for (const answer of inspection.answers) {
    const item = inspection.items.find((i) => i.id === answer.checklistItemId);
    if (item?.critical && answer.result === 'Fail') {
      return 'Fail';
    }
  }

  // Check for any failures
  const hasFailures = inspection.answers.some((a) => a.result === 'Fail');
  if (hasFailures) {
    return 'Fail';
  }

  // All passed or N/A
  return 'Pass';
}

// CRUD Operations for Inspections
export async function createInspection(inspection: Omit<Inspection, 'id' | 'inspectionCode'>): Promise<Inspection> {
  const db = await getInspectionsDB();
  const inspectionCode = await generateInspectionCode();

  const newInspection: Inspection = {
    ...inspection,
    id: crypto.randomUUID(),
    inspectionCode,
    result: calculateInspectionResult(inspection as Inspection),
    history: [
      {
        id: crypto.randomUUID(),
        at: new Date().toISOString(),
        by: inspection.createdBy,
        byName: inspection.createdByName,
        type: 'status_change',
        summary: `Inspection created with status: ${inspection.status}`,
      },
    ],
    revisionNumber: 0,
  };

  await db.add('inspections', newInspection);
  return newInspection;
}

export async function getInspectionById(id: string): Promise<Inspection | undefined> {
  const db = await getInspectionsDB();
  // Try by id first
  let inspection = await db.get('inspections', id);
  if (inspection) {
    return inspection;
  }
  // Fallback: try by inspectionCode
  try {
    const index = db.transaction('inspections').store.index('by-inspectionCode');
    inspection = await index.get(id);
    return inspection;
  } catch (e) {
    // Index might not exist, that's okay
    return undefined;
  }
}

export async function getInspectionByCode(inspectionCode: string): Promise<Inspection | undefined> {
  const db = await getInspectionsDB();
  const index = db.transaction('inspections').store.index('by-inspectionCode');
  return index.get(inspectionCode);
}

export async function getAllInspections(): Promise<Inspection[]> {
  const db = await getInspectionsDB();
  return db.getAll('inspections');
}

export async function updateInspection(id: string, updates: Partial<Inspection>): Promise<Inspection> {
  const db = await getInspectionsDB();
  const existing = await db.get('inspections', id);
  if (!existing) {
    throw new Error(`Inspection ${id} not found`);
  }

  // Recalculate result if answers changed
  let result = existing.result;
  if (updates.answers) {
    const updatedInspection = { ...existing, ...updates, answers: updates.answers };
    result = calculateInspectionResult(updatedInspection as Inspection);
  }

  const updated: Inspection = {
    ...existing,
    ...updates,
    result,
    updatedAt: new Date().toISOString(),
    updatedBy: updates.updatedBy || existing.updatedBy,
    updatedByName: updates.updatedByName || existing.updatedByName,
  };

  await db.put('inspections', updated);
  return updated;
}

export async function deleteInspection(id: string): Promise<void> {
  const db = await getInspectionsDB();
  await db.delete('inspections', id);
}

// Submit inspection
export async function submitInspection(
  id: string,
  userId: string,
  userName: string
): Promise<Inspection> {
  const inspection = await getInspectionById(id);
  if (!inspection) {
    throw new Error('Inspection not found');
  }

  // Validate
  const validation = await validateInspectionSubmission(inspection);
  if (!validation.valid) {
    throw new Error(validation.errors.join('; '));
  }

  // Auto-create defects for failed items
  const failedAnswers = inspection.answers.filter((a) => a.result === 'Fail');
  const defectIds: string[] = [];
  if (failedAnswers.length > 0) {
    const createdDefectIds = await autoCreateDefectsFromInspection(inspection, failedAnswers);
    defectIds.push(...createdDefectIds);
  }

  // Update inspection
  const updated = await updateInspection(id, {
    status: 'Submitted',
    result: calculateInspectionResult(inspection),
    submittedAt: new Date().toISOString(),
    linkedDefectIds: [...inspection.linkedDefectIds, ...defectIds],
    history: [
      ...inspection.history,
      {
        id: crypto.randomUUID(),
        at: new Date().toISOString(),
        by: userId,
        byName: userName,
        type: 'status_change',
        summary: 'Inspection submitted',
        data: { defectIds },
      },
    ],
    updatedBy: userId,
    updatedByName: userName,
  });

  return updated;
}

// Approve inspection
export async function approveInspection(
  id: string,
  supervisorId: string,
  supervisorName: string
): Promise<Inspection> {
  const inspection = await getInspectionById(id);
  if (!inspection) {
    throw new Error('Inspection not found');
  }

  if (inspection.status !== 'Submitted') {
    throw new Error('Only submitted inspections can be approved');
  }

  return updateInspection(id, {
    status: 'Approved',
    supervisorId,
    supervisorName,
    approvedAt: new Date().toISOString(),
    history: [
      ...inspection.history,
      {
        id: crypto.randomUUID(),
        at: new Date().toISOString(),
        by: supervisorId,
        byName: supervisorName,
        type: 'approval',
        summary: 'Inspection approved',
      },
    ],
    updatedBy: supervisorId,
    updatedByName: supervisorName,
  });
}

// Query & Filter
export async function queryInspections(filter?: InspectionFilter): Promise<Inspection[]> {
  const db = await getInspectionsDB();
  let inspections = await db.getAll('inspections');

  if (!filter) {
    return inspections;
  }

  // Status filter
  if (filter.status) {
    inspections = inspections.filter((i) => i.status === filter.status);
  }

  // Result filter
  if (filter.result) {
    inspections = inspections.filter((i) => i.result === filter.result);
  }

  // Type filter
  if (filter.inspectionType) {
    inspections = inspections.filter((i) => i.inspectionType === filter.inspectionType);
  }

  // Site filter
  if (filter.siteId) {
    inspections = inspections.filter((i) => i.siteId === filter.siteId);
  }

  // Asset filter
  if (filter.assetId) {
    inspections = inspections.filter((i) => i.assetId === filter.assetId);
  }

  // Inspector filter
  if (filter.inspectorId) {
    inspections = inspections.filter((i) => i.inspectorId === filter.inspectorId);
  }

  // Supervisor filter
  if (filter.supervisorId) {
    inspections = inspections.filter((i) => i.supervisorId === filter.supervisorId);
  }

  // Quick filters
  if (filter.showDrafts) {
    inspections = inspections.filter((i) => i.status === 'Draft');
  }

  if (filter.showFailed) {
    inspections = inspections.filter((i) => i.result === 'Fail');
  }

  if (filter.showMyInspections) {
    // Would filter by current user - placeholder
    // inspections = inspections.filter((i) => i.inspectorId === currentUserId);
  }

  if (filter.showDueSoon) {
    const today = new Date();
    const in7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    inspections = inspections.filter((i) => {
      if (!i.dueDate) return false;
      const due = new Date(i.dueDate);
      return due >= today && due <= in7Days && i.status !== 'Closed';
    });
  }

  if (filter.showOverdue) {
    const today = new Date();
    inspections = inspections.filter((i) => {
      if (!i.dueDate) return false;
      return new Date(i.dueDate) < today && i.status !== 'Closed';
    });
  }

  // Date range filter
  if (filter.dateFrom) {
    const from = new Date(filter.dateFrom);
    inspections = inspections.filter((i) => new Date(i.inspectionDate) >= from);
  }

  if (filter.dateTo) {
    const to = new Date(filter.dateTo);
    inspections = inspections.filter((i) => new Date(i.inspectionDate) <= to);
  }

  // Search filter
  if (filter.search) {
    const searchLower = filter.search.toLowerCase();
    inspections = inspections.filter(
      (i) =>
        i.inspectionCode.toLowerCase().includes(searchLower) ||
        i.templateName.toLowerCase().includes(searchLower) ||
        i.assetId?.toLowerCase().includes(searchLower) ||
        i.inspectorName.toLowerCase().includes(searchLower)
    );
  }

  return inspections;
}

// Summary stats
export async function getInspectionSummary(): Promise<{
  total: number;
  completedThisWeek: number;
  overdue: number;
  failed: number;
  openDefectsFromInspections: number;
  complianceInspections: number;
}> {
  const inspections = await getAllInspections();
  const now = new Date();
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Get defects from defects module
  const { getAllDefects } = await import('../../defects/db/repository');
  const allDefects = await getAllDefects();
  const defectsFromInspections = allDefects.filter((d) => d.inspectionId);

  return {
    total: inspections.length,
    completedThisWeek: inspections.filter((i) => {
      if (!i.completedAt) return false;
      return new Date(i.completedAt) >= weekStart;
    }).length,
    overdue: inspections.filter((i) => {
      if (!i.dueDate) return false;
      return new Date(i.dueDate) < now && i.status !== 'Closed';
    }).length,
    failed: inspections.filter((i) => i.result === 'Fail').length,
    openDefectsFromInspections: defectsFromInspections.filter(
      (d) => d.status !== 'Closed' && d.status !== 'Resolved'
    ).length,
    complianceInspections: inspections.filter((i) => {
      // Check if any checklist items have compliance tags
      return i.items.some((item) => item.complianceTag === 'PUWER' || item.complianceTag === 'LOLER');
    }).length,
  };
}

// Template CRUD
export async function createTemplate(template: Omit<InspectionTemplate, 'id'>): Promise<InspectionTemplate> {
  const db = await getInspectionsDB();
  const newTemplate: InspectionTemplate = {
    ...template,
    id: crypto.randomUUID(),
  };
  await db.add('templates', newTemplate);
  return newTemplate;
}

export async function getTemplateById(id: string): Promise<InspectionTemplate | undefined> {
  const db = await getInspectionsDB();
  return db.get('templates', id);
}

export async function getAllTemplates(): Promise<InspectionTemplate[]> {
  const db = await getInspectionsDB();
  return db.getAll('templates');
}

export async function updateTemplate(id: string, updates: Partial<InspectionTemplate>): Promise<InspectionTemplate> {
  const db = await getInspectionsDB();
  const existing = await db.get('templates', id);
  if (!existing) {
    throw new Error(`Template ${id} not found`);
  }

  const updated: InspectionTemplate = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
    updatedBy: updates.updatedBy || existing.updatedBy,
    updatedByName: updates.updatedByName || existing.updatedByName,
  };

  await db.put('templates', updated);
  return updated;
}

export async function deleteTemplate(id: string): Promise<void> {
  const db = await getInspectionsDB();
  await db.delete('templates', id);
}
