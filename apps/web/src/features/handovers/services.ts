import type { FitterHandover, MasterHandover, HandoverFilter, AuditLogEntry } from './types';
import { mockFitterHandovers, mockMasterHandovers, mockAuditLog } from './mockData';

// In-memory store (MVP - will be replaced with API calls later)
let handovers: FitterHandover[] = [...mockFitterHandovers];
let masters: MasterHandover[] = [...mockMasterHandovers];
let auditLog: AuditLogEntry[] = [...mockAuditLog];

// Handover counter for generating IDs
let handoverCounter = handovers.length;
let masterCounter = masters.length;

export function getFitterHandovers(filter?: HandoverFilter, search?: string): FitterHandover[] {
  let filtered = [...handovers];

  // Apply filters
  if (filter?.siteId) {
    const sites = Array.isArray(filter.siteId) ? filter.siteId : [filter.siteId];
    filtered = filtered.filter(h => sites.includes(h.siteId));
  }

  if (filter?.dateFrom) {
    filtered = filtered.filter(h => h.date >= filter.dateFrom!);
  }

  if (filter?.dateTo) {
    filtered = filtered.filter(h => h.date <= filter.dateTo!);
  }

  if (filter?.shiftType) {
    filtered = filtered.filter(h => h.shiftType === filter.shiftType);
  }

  if (filter?.status) {
    const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
    filtered = filtered.filter(h => statuses.includes(h.status));
  }

  if (filter?.fitterUserId) {
    filtered = filtered.filter(h => h.fitterUserId === filter.fitterUserId);
  }

  if (filter?.hasAttachments !== undefined) {
    filtered = filtered.filter(h => 
      filter.hasAttachments ? h.attachments.length > 0 : h.attachments.length === 0
    );
  }

  // Apply search
  if (search) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter(h =>
      h.id.toLowerCase().includes(searchLower) ||
      h.fitterName.toLowerCase().includes(searchLower) ||
      h.siteName.toLowerCase().includes(searchLower) ||
      h.locations.some(loc => loc.toLowerCase().includes(searchLower)) ||
      h.shiftComments.toLowerCase().includes(searchLower)
    );
  }

  return filtered;
}

export function getFitterHandoverById(id: string): FitterHandover | undefined {
  return handovers.find(h => h.id === id);
}

export function createFitterHandover(handover: Omit<FitterHandover, 'id' | 'createdAt' | 'updatedAt'>): FitterHandover {
  handoverCounter++;
  const newHandover: FitterHandover = {
    ...handover,
    id: `HND-${String(handoverCounter).padStart(6, '0')}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  handovers.push(newHandover);
  
  // Add audit log
  addAuditLog({
    handoverId: newHandover.id,
    handoverType: 'Fitter',
    action: 'Create',
    userId: newHandover.fitterUserId,
    userName: newHandover.fitterName,
  });

  return newHandover;
}

export function updateFitterHandover(id: string, updates: Partial<FitterHandover>): FitterHandover | null {
  const index = handovers.findIndex(h => h.id === id);
  if (index === -1) return null;

  const updated = {
    ...handovers[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  handovers[index] = updated;

  // Add audit log
  addAuditLog({
    handoverId: id,
    handoverType: 'Fitter',
    action: 'Update',
    userId: updated.fitterUserId,
    userName: updated.fitterName,
  });

  return updated;
}

export function submitFitterHandover(id: string): FitterHandover | null {
  const handover = getFitterHandoverById(id);
  if (!handover) return null;

  return updateFitterHandover(id, { status: 'Submitted' });
}

export function approveFitterHandover(id: string, supervisorUserId: string, supervisorName: string): FitterHandover | null {
  const handover = getFitterHandoverById(id);
  if (!handover) return null;

  const updated = updateFitterHandover(id, { status: 'Approved' });
  
  if (updated) {
    addAuditLog({
      handoverId: id,
      handoverType: 'Fitter',
      action: 'Approve',
      userId: supervisorUserId,
      userName: supervisorName,
    });
  }

  return updated;
}

export function requestChanges(id: string, supervisorUserId: string, supervisorName: string, notes: string): FitterHandover | null {
  const handover = getFitterHandoverById(id);
  if (!handover) return null;

  const updated = updateFitterHandover(id, { 
    status: 'ChangesRequested',
    supervisorNotes: notes,
  });
  
  if (updated) {
    addAuditLog({
      handoverId: id,
      handoverType: 'Fitter',
      action: 'RequestChanges',
      userId: supervisorUserId,
      userName: supervisorName,
      notes,
    });
  }

  return updated;
}

export function getMasterHandovers(filter?: { siteId?: string; dateFrom?: string; dateTo?: string }): MasterHandover[] {
  let filtered = [...masters];

  if (filter?.siteId) {
    filtered = filtered.filter(m => m.siteId === filter.siteId);
  }

  if (filter?.dateFrom) {
    filtered = filtered.filter(m => m.date >= filter.dateFrom!);
  }

  if (filter?.dateTo) {
    filtered = filtered.filter(m => m.date <= filter.dateTo!);
  }

  return filtered;
}

export function getMasterHandoverById(id: string): MasterHandover | undefined {
  return masters.find(m => m.id === id);
}

export function createMasterHandover(master: Omit<MasterHandover, 'id' | 'createdAt' | 'updatedAt'>): MasterHandover {
  masterCounter++;
  const newMaster: MasterHandover = {
    ...master,
    id: `MHD-${String(masterCounter).padStart(6, '0')}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  masters.push(newMaster);

  // Update included handovers to "IncludedInMaster"
  master.includedHandoverIds.forEach(handoverId => {
    const handover = getFitterHandoverById(handoverId);
    if (handover && handover.status === 'Approved') {
      updateFitterHandover(handoverId, { status: 'IncludedInMaster' });
    }
  });

  // Add audit log
  addAuditLog({
    handoverId: newMaster.id,
    handoverType: 'Master',
    action: 'CreateMaster',
    userId: newMaster.supervisorUserId,
    userName: newMaster.supervisorName,
  });

  return newMaster;
}

export function updateMasterHandover(id: string, updates: Partial<MasterHandover>): MasterHandover | null {
  const index = masters.findIndex(m => m.id === id);
  if (index === -1) return null;

  const updated = {
    ...masters[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  masters[index] = updated;

  return updated;
}

export function submitMasterToManagement(id: string, sentTo: string): MasterHandover | null {
  const master = getMasterHandoverById(id);
  if (!master) return null;

  const updated = updateMasterHandover(id, {
    status: 'SubmittedToManagement',
    distributionLog: [
      ...master.distributionLog,
      {
        sentTo,
        sentAt: new Date().toISOString(),
        method: 'Link',
      },
    ],
  });

  if (updated) {
    addAuditLog({
      handoverId: id,
      handoverType: 'Master',
      action: 'SubmitMaster',
      userId: master.supervisorUserId,
      userName: master.supervisorName,
    });
  }

  return updated;
}

export function acknowledgeMaster(id: string, userId: string, userName: string): MasterHandover | null {
  const master = getMasterHandoverById(id);
  if (!master) return null;

  const updated = updateMasterHandover(id, { status: 'Acknowledged' });

  if (updated) {
    addAuditLog({
      handoverId: id,
      handoverType: 'Master',
      action: 'Acknowledge',
      userId,
      userName,
    });
  }

  return updated;
}

export function getAuditLog(handoverId?: string): AuditLogEntry[] {
  if (handoverId) {
    return auditLog.filter(entry => entry.handoverId === handoverId);
  }
  return [...auditLog];
}

function addAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): void {
  auditLog.push({
    ...entry,
    id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
  });
}

// Get handover statistics
export function getHandoverStats(filter?: HandoverFilter) {
  const all = getFitterHandovers(filter);
  const masters = getMasterHandovers();

  return {
    total: all.length,
    drafts: all.filter(h => h.status === 'Draft').length,
    submitted: all.filter(h => h.status === 'Submitted').length,
    changesRequested: all.filter(h => h.status === 'ChangesRequested').length,
    approved: all.filter(h => h.status === 'Approved').length,
    masters: masters.length,
  };
}

