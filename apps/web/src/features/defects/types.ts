import type { UserRole } from '@ppm/shared';

// Severity Models
export type SeverityModel = 'LMH' | 'MMC'; // Low/Medium/High OR Minor/Major/Critical
export type LMHSeverity = 'Low' | 'Medium' | 'High';
export type MMCSeverity = 'Minor' | 'Major' | 'Critical';
export type DefectSeverity = LMHSeverity | MMCSeverity;

// Status
export type DefectStatus = 'Draft' | 'Open' | 'Acknowledged' | 'InProgress' | 'Deferred' | 'Closed' | 'Overdue';

// Compliance Tags
export type ComplianceTag = 'PUWER' | 'LOLER' | 'SITE_RULE' | string; // Allow custom tags

// Attachment Types
export type AttachmentType = 'photo' | 'video' | 'document';

// History Entry Types
export type HistoryEntryType = 'status_change' | 'edit' | 'comment' | 'attachment' | 'reopen' | 'close';

// Defect Action
export interface DefectAction {
  id: string;
  title: string;
  required: boolean;
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
}

// Attachment
export interface DefectAttachment {
  id: string;
  type: AttachmentType;
  filename: string;
  uri: string; // Blob URL or file path
  createdAt: string;
  label?: 'before' | 'after' | 'other'; // For before/after photos
}

// Comment
export interface DefectComment {
  id: string;
  at: string;
  by: string;
  byName: string;
  text: string;
}

// History Entry
export interface DefectHistoryEntry {
  id: string;
  at: string;
  by: string;
  byName: string;
  type: HistoryEntryType;
  summary: string;
  data?: Record<string, unknown>;
}

// Main Defect Entity
export interface Defect {
  // Identity
  id: string; // Internal UUID
  defectCode: string; // Auto-generated DEF-000123, immutable

  // Linkages (optional)
  assetId?: string;
  locationId?: string;
  inspectionId?: string;
  workOrderId?: string; // Future-ready, optional
  parentDefectId?: string; // For recurrence tracking - links to original defect
  recurrenceCount?: number; // Number of times this defect has recurred

  // Classification
  severityModel: SeverityModel;
  severity: DefectSeverity;
  unsafeDoNotUse: boolean; // Auto-calculated from severity
  complianceTags: ComplianceTag[];

  // Workflow
  status: DefectStatus;
  reopenedCount: number;
  targetRectificationDate?: string;
  closedAt?: string;
  closedBy?: string;
  closedByName?: string;
  actionTaken?: 'Repaired' | 'Replaced' | 'Adjusted' | 'Cleaned' | 'Isolated' | 'Temporary Fix' | 'Other';

  // Actions
  actions: DefectAction[];

  // Evidence
  attachments: DefectAttachment[];
  beforeAfterRequired: boolean; // From settings

  // Assignment
  assignedToId?: string;
  assignedToName?: string;
  assignedToRole?: UserRole;
  assignedToTeam?: string;

  // Description
  title: string;
  description?: string;

  // Audit
  createdAt: string;
  createdBy: string;
  createdByName: string;
  updatedAt: string;
  updatedBy: string;
  updatedByName: string;

  // History & Notes
  history: DefectHistoryEntry[];
  comments: DefectComment[];

  // Site info (for filtering)
  siteId?: string;
  siteName?: string;
}

// Filter
export interface DefectFilter {
  search?: string;
  status?: DefectStatus;
  severity?: DefectSeverity;
  severityModel?: SeverityModel;
  assetId?: string;
  locationId?: string;
  siteId?: string;
  assignedToId?: string;
  showOverdue?: boolean;
  showUnsafe?: boolean;
  showUnassigned?: boolean;
  showFromInspection?: boolean;
  complianceTag?: ComplianceTag;
}

// Settings
export interface DefectSettings {
  severityModelDefault: SeverityModel;
  unsafeThresholds: {
    LMH: LMHSeverity[];
    MMC: MMCSeverity[];
  };
  beforeAfterRequired: boolean;
}

// Summary Stats
export interface DefectSummary {
  total: number;
  open: number;
  overdue: number;
  unsafe: number;
}
