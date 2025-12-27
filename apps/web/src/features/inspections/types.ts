import type { UserRole } from '@ppm/shared';

// Inspection Types
export type InspectionType = 
  | 'PlantAcceptance'
  | 'Daily'
  | 'Weekly'
  | 'Monthly'
  | 'PreUse'
  | 'TimeBased';

// Inspection Status
export type InspectionStatus = 
  | 'Draft'
  | 'InProgress'
  | 'Submitted'
  | 'Approved'
  | 'Closed';

// Inspection Result
export type InspectionResult = 'Pass' | 'Fail' | 'Pending';

// Checklist Item Types
export type ChecklistItemType = 'PassFail' | 'PassFailNA' | 'Number' | 'Text' | 'Photo';

// Checklist Item Result
export type ChecklistItemResult = 'Pass' | 'Fail' | 'NA' | null;

// Attachment Types
export type AttachmentType = 'photo' | 'video' | 'document';

// Signature Methods
export type SignatureMethod = 'typed' | 'checkbox' | 'drawn';

// Template Version
export interface TemplateVersion {
  version: string; // v1, v2, etc.
  createdAt: string;
  createdBy: string;
  createdByName: string;
}

// Checklist Section
export interface ChecklistSection {
  id: string;
  title: string;
  order: number;
}

// Checklist Item
export interface ChecklistItem {
  id: string;
  sectionId?: string; // Optional section grouping
  question: string;
  type: ChecklistItemType;
  required: boolean;
  safetyCritical?: boolean; // If true, failure fails entire inspection (safety-critical risk)
  // Backward compatibility: support both critical and safetyCritical
  critical?: boolean; // Deprecated: use safetyCritical instead
  order: number;
  unit?: string; // For Number type
  minValue?: number; // For Number type
  maxValue?: number; // For Number type
  photoRequiredOnFail: boolean;
  failRequiresComment?: boolean; // Auto-enabled when safetyCritical is true
  defaultSeverity?: 'Low' | 'Medium' | 'High' | 'Critical' | 'Minor' | 'Major'; // For defect creation
  complianceTag?: 'PUWER' | 'LOLER' | 'SITE_RULE' | string; // For defect creation
}

// Checklist Item Answer (inspection instance)
export interface ChecklistItemAnswer {
  id: string;
  checklistItemId: string;
  result: ChecklistItemResult;
  numericValue?: number;
  textValue?: string;
  comment?: string;
  photoUri?: string; // If photo was captured (single photo for PassFail items)
  photoUris?: string[]; // Multiple photos for Photo type items
  unit?: string; // For Number items - selected unit
}

// Inspection Template
export interface InspectionTemplate {
  id: string;
  name: string;
  description?: string;
  inspectionType: InspectionType; // Keep for backward compatibility, but prefer frequencyId
  frequencyId?: string; // Reference to frequency definition
  frequencyName?: string; // Snapshot: resolved frequency name for reporting stability
  frequencyCategory?: 'TIME' | 'HOURS' | 'DISTANCE'; // Snapshot: category
  frequencyIntervalValue?: number; // Snapshot: interval value
  frequencyIntervalUnit?: string; // Snapshot: interval unit
  assetTypeId?: string; // Optional: specific asset type
  assetTypeCode?: string; // For display
  siteId?: string; // Optional: site-specific variant
  siteName?: string; // For display
  version: string; // Current version
  versions: TemplateVersion[]; // Version history
  sections: ChecklistSection[];
  items: ChecklistItem[];
  isActive: boolean;
  startDate?: string; // Template availability start date (ISO format)
  endDate?: string; // Template availability end date (ISO format)
  createdAt: string;
  createdBy: string;
  createdByName: string;
  updatedAt: string;
  updatedBy: string;
  updatedByName: string;
}

// Inspection Attachment
export interface InspectionAttachment {
  id: string;
  type: AttachmentType;
  filename: string;
  uri: string; // Blob URL or file path
  createdAt: string;
  createdBy: string;
}

// Inspection Signature
export interface InspectionSignature {
  id: string;
  role: 'inspector' | 'supervisor';
  method: SignatureMethod;
  signature: string; // Typed name, checkbox confirmation, or drawn signature data
  signedAt: string;
  signedBy: string;
  signedByName: string;
}

// Inspection History Entry
export interface InspectionHistoryEntry {
  id: string;
  at: string;
  by: string;
  byName: string;
  type: 'status_change' | 'edit' | 'revision' | 'approval' | 'reopen' | 'close';
  summary: string;
  data?: Record<string, unknown>;
}

// Main Inspection Entity
export interface Inspection {
  // Identity
  id: string; // Internal UUID
  inspectionCode: string; // Auto-generated INSP-000001, immutable

  // Template Reference
  templateId: string;
  templateName: string;
  templateVersion: string; // Version used at time of inspection

  // Type & Classification
  inspectionType: InspectionType;
  result: InspectionResult;
  status: InspectionStatus;

  // Linkages
  assetId: string; // Primary (required if no locationId)
  assetTypeCode?: string;
  assetMake?: string;
  assetModel?: string;
  locationId?: string; // Secondary (optional, but at least one of assetId/locationId required)
  locationName?: string;
  siteId?: string;
  siteName?: string;

  // Checklist
  sections: ChecklistSection[];
  items: ChecklistItem[]; // Template items at time of inspection
  answers: ChecklistItemAnswer[]; // Inspector's answers

  // Evidence
  attachments: InspectionAttachment[];
  signatures: InspectionSignature[];

  // Timing
  inspectionDate: string; // Scheduled/planned date
  startedAt?: string;
  completedAt?: string;
  submittedAt?: string;
  approvedAt?: string;
  closedAt?: string;
  dueDate?: string; // For scheduling

  // Assignment
  inspectorId: string;
  inspectorName: string;
  supervisorId?: string; // Reviewer
  supervisorName?: string;

  // Linked Entities
  linkedDefectIds: string[]; // Auto-created defects
  linkedWorkOrderId?: string; // Future-ready

  // Asset Runtime (if applicable)
  assetRuntimeHours?: number;
  assetRuntimeMiles?: number;

  // Audit
  createdAt: string;
  createdBy: string;
  createdByName: string;
  updatedAt: string;
  updatedBy: string;
  updatedByName: string;
  history: InspectionHistoryEntry[];

  // Revision tracking
  revisionNumber: number;
  parentInspectionId?: string; // If this is a revision
  
  // Pause/Freeze
  isPaused?: boolean; // If true, inspection is paused and doesn't count as overdue
  pausedAt?: string; // When inspection was paused
  pausedBy?: string; // Who paused the inspection
}

// Inspection Filter
export interface InspectionFilter {
  search?: string;
  status?: InspectionStatus;
  result?: InspectionResult;
  inspectionType?: InspectionType;
  siteId?: string;
  assetId?: string;
  inspectorId?: string;
  supervisorId?: string;
  showDueSoon?: boolean;
  showOverdue?: boolean;
  showFailed?: boolean;
  showMyInspections?: boolean;
  showDrafts?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

// Inspection Settings
export interface InspectionSettings {
  requireCommentOnFail: boolean;
  requirePhotoOnFail: boolean;
  requireDefectOnFail: boolean;
  enableApprovals: boolean;
  enableSignatures: boolean;
  checklistItemSeverityDefaults: boolean;
  conflictResolution: 'last-write-wins' | 'flag-for-review';
}

// Inspection Summary Stats
export interface InspectionSummary {
  total: number;
  completedThisWeek: number;
  overdue: number;
  failed: number;
  openDefectsFromInspections: number;
  complianceInspections: number; // PUWER/LOLER
}

// ============================================================================
// CHECKLIST LIBRARY (Reusable item lists)
// ============================================================================

export interface Checklist {
  id: string;
  name: string;
  description?: string;
  category?: string;
  items: ChecklistItem[];
  isActive: boolean;
  createdAt: string;
  createdBy: string;
  createdByName: string;
  updatedAt: string;
  updatedBy: string;
  updatedByName: string;
}

// ============================================================================
// CHECK SHEET TEMPLATE (Templates used to create inspections)
// ============================================================================

export interface CheckSheetTemplate {
  id: string;
  name: string;
  description?: string;
  category: string; // e.g., "MEWP Weekly", "Compressor Weekly", "Crane Pre-Start"
  assetTypeIds?: string[]; // Optional: applies to specific asset types
  assetTypeCodes?: string[]; // For display
  version: string; // v1, v2, etc.
  versions: TemplateVersion[];
  sections: ChecklistSection[];
  items: ChecklistItem[]; // Can reference checklist library OR custom questions
  checklistIds?: string[]; // Optional: references to Checklist library
  isActive: boolean;
  createdAt: string;
  createdBy: string;
  createdByName: string;
  updatedAt: string;
  updatedBy: string;
  updatedByName: string;
}

// ============================================================================
// INSPECTION RECORD (Actual inspection instance created from template)
// ============================================================================

// Alias for clarity - Inspection is the record
export type InspectionRecord = Inspection;
