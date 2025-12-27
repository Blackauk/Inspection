import type { WorkOrderType, WorkOrderStatus } from '@ppm/shared';

export type WorkOrderPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface WorkOrder {
  id: string; // WO-xxxxxx format
  type: WorkOrderType;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  title: string;
  description?: string;
  assetId: string;
  assetTypeCode: string;
  assetMake: string;
  assetModel: string;
  assetInternalClientNumber?: string;
  assetSerialNumber?: string;
  siteId: string;
  siteName: string;
  location?: string;
  assignedToId?: string;
  assignedToName?: string;
  createdById: string;
  createdByName: string;
  createdAt: string;
  dueDate?: string;
  completedAt?: string;
  closedAt?: string;
  completionNotes?: string;
  age: number; // days since creation
  isDraft?: boolean; // Draft flag for work orders created from PM tasks
  pmScheduleId?: string; // Link to PM schedule if created from PM task
  pmTaskId?: string; // Link to PM task if created from PM task
  pmChecklistItemId?: string; // Link to specific checklist item
}

export interface WorkOrderPart {
  id: string;
  workOrderId: string;
  partNumber: string;
  description?: string;
  quantity: number;
  createdAt: string;
}

export interface WorkOrderUpdate {
  id: string;
  workOrderId: string;
  userId: string;
  userName: string;
  note: string;
  createdAt: string;
}

export interface WorkOrderFilter {
  search?: string;
  status?: WorkOrderStatus;
  priority?: WorkOrderPriority;
  type?: WorkOrderType;
  siteId?: string;
  assignedToId?: string;
  showMyWOs?: boolean;
  showOverdue?: boolean;
  showWaitingParts?: boolean;
  showCritical?: boolean;
}
