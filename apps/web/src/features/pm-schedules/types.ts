import type { ScheduleType } from '@ppm/shared';
import type { ComplianceRAG } from '../../assets/types';

export type Frequency = 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | '6-Monthly' | 'Annual';
export type ImportanceLevel = 'Safety Critical' | 'Statutory' | 'Operational' | 'Housekeeping';

export interface PMSchedule {
  id: string;
  name: string;
  description?: string;
  assetId: string;
  assetTypeCode: string;
  assetMake: string;
  assetModel: string;
  siteId: string;
  siteName: string;
  scheduleType: ScheduleType;
  intervalDays?: number;
  intervalHours?: number;
  lastDoneDate?: string;
  nextDueDate: string;
  completedAt?: string; // When the current due date was completed
  ragStatus: ComplianceRAG;
  assignedTeam?: string;
  isActive: boolean;
  createdAt: string;
  checklistItems?: PMChecklistItem[]; // Template checklist items
  // New fields for filtering
  frequency?: Frequency; // Derived from intervalDays, but can be explicitly set
  importanceLevel?: ImportanceLevel;
  tags?: string[]; // e.g. ["LOLER", "Fire Suppression", "PUWER"]
}

export interface PMScheduleHistory {
  id: string;
  scheduleId: string;
  completedDate: string;
  completedBy: string;
  completedByName: string;
  notes?: string;
  result?: 'Completed' | 'Failed' | 'Issues found';
  workOrderId?: string;
}

export interface ShiftChangeoverEvent {
  id: string;
  siteId: string;
  siteName: string;
  startDateTime: string; // ISO string
  endDateTime: string; // ISO string
  title: string;
  shiftType: 'DaysToNights' | 'NightsToDays' | 'AMHandover' | 'PMHandover';
  notes?: string;
  color?: string;
}

export interface PMScheduleFilter {
  search?: string;
  siteId?: string | string[];
  assetTypeId?: string;
  showDueSoon?: boolean;
  showOverdue?: boolean;
  showCompleted?: boolean;
  frequency?: ScheduleType | ScheduleType[]; // Legacy: schedule type
  frequencyCategory?: Frequency | Frequency[]; // New: Daily, Weekly, Monthly, etc.
  importanceLevel?: ImportanceLevel | ImportanceLevel[];
  assignedTeam?: string | string[];
  isActive?: boolean;
  showShiftChangeovers?: boolean;
  shiftType?: string | string[];
}

// Checklist Item Types
export type ChecklistItemType = 
  | 'PassFailNA'
  | 'YesNoNA'
  | 'Numeric'
  | 'Hours'
  | 'DateTime'
  | 'FreeText';

// Checklist Item
export interface PMChecklistItem {
  id: string;
  order: number;
  checkItem: string; // Description/question
  checkType: ChecklistItemType;
  required: boolean;
  expectedValue?: string | number; // Target/expected value
  units?: string; // e.g., "psi", "hours", "°C"
  minValue?: number; // For numeric
  maxValue?: number; // For numeric
  notesGuidance?: string; // Helper text
}

// PM Task (instance created from schedule)
export interface PMTask {
  id: string;
  taskCode: string; // Auto-generated PMT-000001
  scheduleId: string;
  scheduleName: string;
  assetId: string;
  assetTypeCode: string;
  assetMake: string;
  assetModel: string;
  siteId: string;
  siteName: string;
  title: string;
  description?: string;
  taskType: 'PM';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Draft' | 'Assigned' | 'InProgress' | 'Completed' | 'Failed';
  assignedToId?: string;
  assignedToName?: string;
  assignedTeam?: string;
  dueDate: string;
  startDate?: string;
  completedAt?: string;
  completedBy?: string;
  completedByName?: string;
  checklistItems: PMChecklistItem[];
  checklistAnswers: PMChecklistAnswer[];
  attachments: PMTaskAttachment[];
  notes?: string;
  workOrderId?: string; // If converted to work order
  createdAt: string;
  createdBy: string;
  createdByName: string;
}

// Issue Payload (for checklist items that raise issues)
export interface PMChecklistIssuePayload {
  title: string;
  description: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  unsafeDoNotUse: boolean;
  createDefect: boolean;
  createWorkOrder: boolean;
  assignedToId?: string;
  targetDate?: string;
}

// Checklist Answer (for a task instance)
export interface PMChecklistAnswer {
  id: string;
  checklistItemId: string;
  result?: 'Pass' | 'Fail' | 'NA' | 'Yes' | 'No';
  numericValue?: number;
  hoursValue?: number;
  dateTimeValue?: string;
  textValue?: string;
  notes?: string;
  photoUri?: string;
  issueFound?: boolean;
  issuePayload?: PMChecklistIssuePayload;
  generatedDefectId?: string;
  generatedWorkOrderId?: string;
}

// PM Task Attachment
export interface PMTaskAttachment {
  id: string;
  type: 'photo' | 'document' | 'video';
  filename: string;
  uri: string;
  uploadedAt: string;
  uploadedBy: string;
}

// PM Schedule Document
export interface PMScheduleDocument {
  id: string;
  scheduleId: string;
  filename: string;
  type: 'Manual' | 'Procedure' | 'Photo' | 'Report' | 'Certificate';
  uri: string;
  uploadedAt: string;
  uploadedBy: string;
  uploadedByName: string;
  tags?: string[];
}

// PM Schedule Activity Log Entry
export interface PMScheduleActivity {
  id: string;
  scheduleId: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: 
    | 'schedule_created'
    | 'checklist_edited'
    | 'pm_task_generated'
    | 'marked_completed'
    | 'rescheduled'
    | 'document_uploaded'
    | 'status_changed'
    | 'assigned_team_changed';
  details?: string;
  metadata?: Record<string, unknown>;
}
