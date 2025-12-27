export type ShiftType = 'Days' | 'Nights';
export type FitterHandoverStatus = 'Draft' | 'Submitted' | 'ChangesRequested' | 'Approved' | 'IncludedInMaster';
export type MasterHandoverStatus = 'Draft' | 'SubmittedToManagement' | 'Acknowledged';
export type EntityType = 'WorkOrder' | 'Defect' | 'Inspection' | 'Asset';

export interface Personnel {
  name: string;
  occupation: string;
  location?: string;
  remarks?: string;
}

export interface MaterialItem {
  item: string;
  qty?: string;
  unit?: string;
  notes?: string;
}

export interface Task {
  id: string;
  description: string;
  location?: string;
  assetReference?: string;
  status: 'Completed' | 'PartiallyCompleted';
  requiresFollowUp: boolean;
}

export interface PhotoAttachment {
  id: string;
  name: string;
  type: string;
  url?: string;
  caption?: string;
  linkedTaskId?: string;
  location?: string;
  timestamp: string;
  uploadedBy: string;
}

export interface LinkedEntity {
  type: EntityType;
  id: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  url?: string;
}

export interface FitterHandover {
  id: string; // e.g. HND-000001
  siteId: string;
  siteName: string;
  date: string; // ISO date
  shiftType: ShiftType;
  shiftPattern: string; // e.g. "5-2", "7D3O", "7N4O"
  fitterUserId: string;
  fitterName: string;
  locations: string[];
  personnel?: Personnel[];
  tasksCompleted?: Task[];
  shiftComments: string; // required
  materialsUsed: MaterialItem[];
  materialsRequired: MaterialItem[];
  nextShiftNotes?: string;
  linkedEntities?: LinkedEntity[];
  attachments: Attachment[];
  status: FitterHandoverStatus;
  supervisorNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MasterHandoverSection {
  id: string;
  name: string; // e.g. "Tunnels", "Surface", "SEL"
  tasks: string[];
  issues: string[];
  notes: string;
  materialsUsed: MaterialItem[];
  materialsRequired: MaterialItem[];
}

export interface MasterHandover {
  id: string; // e.g. MHD-000001
  siteId: string;
  siteName: string;
  date: string; // ISO date
  shiftType: ShiftType;
  shiftPattern: string;
  supervisorUserId: string;
  supervisorName: string;
  includedHandoverIds: string[];
  compiledSummary: string;
  // Aggregated and editable personnel list
  personnel: Personnel[];
  // Sectioned content
  sections: MasterHandoverSection[];
  // Overarching comments
  overarchingComments?: string;
  status: MasterHandoverStatus;
  distributionLog: Array<{
    sentTo: string;
    sentAt: string;
    method: 'Link' | 'PDF';
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface HandoverFilter {
  siteId?: string | string[];
  dateFrom?: string;
  dateTo?: string;
  shiftType?: ShiftType;
  status?: FitterHandoverStatus | FitterHandoverStatus[];
  fitterUserId?: string;
  hasAttachments?: boolean;
}

export interface AuditLogEntry {
  id: string;
  handoverId: string;
  handoverType: 'Fitter' | 'Master';
  action: 'Create' | 'Update' | 'Submit' | 'RequestChanges' | 'Approve' | 'CreateMaster' | 'SubmitMaster' | 'Acknowledge';
  userId: string;
  userName: string;
  timestamp: string;
  notes?: string;
  metadata?: Record<string, any>;
}

