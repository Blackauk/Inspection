// User roles
export type UserRole = 'Viewer' | 'Fitter' | 'Supervisor' | 'Manager' | 'Admin';

// Asset categories
export type AssetCategory = 'Plant' | 'Equipment';

// Asset ownership
export type AssetOwnership = 'Owned' | 'Hired';

// Asset status
export type AssetStatus = 'InUse' | 'OutOfUse' | 'OffHirePending' | 'OffHired' | 'Quarantined';

// Work order types
export type WorkOrderType = 
  | 'PPM' 
  | 'Inspection' 
  | 'Breakdown' 
  | 'Defect' 
  | 'Calibration' 
  | 'FireSuppression' 
  | 'LOLER' 
  | 'PUWER'
  | 'Corrective';

// Work order status
export type WorkOrderStatus = 
  | 'Open' 
  | 'Assigned' 
  | 'InProgress' 
  | 'WaitingParts' 
  | 'WaitingVendor' 
  | 'Completed' 
  | 'ApprovedClosed' 
  | 'Cancelled';

// Schedule type
export type ScheduleType = 'TimeBased' | 'HoursBased';

// Check question type
export type CheckQuestionType = 'YesNo' | 'Number' | 'Text';

// Audit log action
export type AuditAction = 
  | 'CREATE' 
  | 'UPDATE' 
  | 'DELETE' 
  | 'APPROVE' 
  | 'CLOSE' 
  | 'ASSIGN' 
  | 'STATUS_CHANGE';

// JWT payload
export interface JWTPayload {
  userId: string;
  role: UserRole;
  siteIds: string[];
}

// Offline queue item types
export type QueueItemType = 'createWorkOrder' | 'submitCheck' | 'createDefect' | 'updateDefect' | 'deleteDefect' | 'closeDefect' | 'reopenDefect';

export interface OfflineQueueItem {
  id: string;
  type: QueueItemType;
  data: unknown;
  retries: number;
  createdAt: number;
}


