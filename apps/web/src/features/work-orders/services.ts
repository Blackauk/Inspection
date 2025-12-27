import type { WorkOrder, WorkOrderPart, WorkOrderUpdate, WorkOrderFilter, WorkOrderPriority } from './types';
import type { WorkOrderStatus, WorkOrderType } from '@ppm/shared';
import { mockSites, getAssetById } from '../assets/services';

let mockWorkOrders: WorkOrder[] = [
  {
    id: 'WO-000001',
    type: 'Breakdown',
    status: 'InProgress',
    priority: 'High',
    title: 'Replace hydraulic filter - Excavator EX-001',
    description: 'Hydraulic filter needs replacement due to contamination',
    assetId: 'AST-000001',
    assetTypeCode: 'EX',
    assetMake: 'Caterpillar',
    assetModel: '320D',
    assetInternalClientNumber: 'CLIENT-EX-001',
    assetSerialNumber: 'SN-EX-001-2020',
    siteId: '1',
    siteName: 'Site A',
    location: 'Yard 1',
    assignedToId: 'user-1',
    assignedToName: 'John Smith',
    createdById: 'user-2',
    createdByName: 'Sarah Johnson',
    createdAt: '2025-12-10T08:00:00Z',
    dueDate: '2025-12-16T17:00:00Z',
    age: 5,
  },
  {
    id: 'WO-000002',
    type: 'PPM',
    status: 'Assigned',
    priority: 'Medium',
    title: 'Monthly PM - Generator GEN-012',
    description: 'Routine monthly preventive maintenance',
    assetId: 'AST-000005',
    assetTypeCode: 'GEN',
    assetMake: 'Cummins',
    assetModel: 'QSK60',
    assetInternalClientNumber: 'CLIENT-GEN-012',
    siteId: '1',
    siteName: 'Site A',
    location: 'Power Station',
    assignedToId: 'user-1',
    assignedToName: 'John Smith',
    createdById: 'user-3',
    createdByName: 'Mike Davis',
    createdAt: '2025-12-12T09:00:00Z',
    dueDate: '2025-12-17T17:00:00Z',
    age: 3,
  },
  {
    id: 'WO-000003',
    type: 'Defect',
    status: 'WaitingParts',
    priority: 'Critical',
    title: 'Repair brake system - Forklift FL-023',
    description: 'Brake system failure - requires immediate attention',
    assetId: 'AST-000004',
    assetTypeCode: 'FL',
    assetMake: 'Toyota',
    assetModel: '8FBE20',
    assetInternalClientNumber: 'CLIENT-FL-023',
    siteId: '3',
    siteName: 'Site C',
    location: 'Warehouse',
    assignedToId: 'user-4',
    assignedToName: 'Emma Wilson',
    createdById: 'user-5',
    createdByName: 'Tom Brown',
    createdAt: '2025-12-08T10:00:00Z',
    dueDate: '2025-12-13T17:00:00Z',
    age: 7,
  },
  {
    id: 'WO-000004',
    type: 'Calibration',
    status: 'Open',
    priority: 'Low',
    title: 'Calibrate pressure gauge - Pump PU-042',
    description: 'Annual calibration required',
    assetId: 'AST-000007',
    assetTypeCode: 'PU',
    assetMake: 'Grundfos',
    assetModel: 'CR 32-4',
    assetInternalClientNumber: 'CLIENT-PU-042',
    siteId: '3',
    siteName: 'Site C',
    location: 'Pump House',
    createdById: 'user-6',
    createdByName: 'Lisa Anderson',
    createdAt: '2025-12-14T11:00:00Z',
    age: 1,
  },
  {
    id: 'WO-000005',
    type: 'Inspection',
    status: 'Completed',
    priority: 'Medium',
    title: 'Weekly safety inspection - Crane CR-005',
    description: 'Weekly safety check completed',
    assetId: 'AST-000003',
    assetTypeCode: 'CR',
    assetMake: 'Liebherr',
    assetModel: 'LTM 1050',
    assetInternalClientNumber: 'CLIENT-CR-005',
    siteId: '2',
    siteName: 'Site B',
    location: 'Main Site',
    assignedToId: 'user-7',
    assignedToName: 'David Lee',
    createdById: 'user-2',
    createdByName: 'Sarah Johnson',
    createdAt: '2025-12-11T08:30:00Z',
    completedAt: '2025-12-14T16:00:00Z',
    closedAt: '2025-12-14T16:30:00Z',
    completionNotes: 'All checks passed. Equipment in good condition.',
    age: 4,
  },
  {
    id: 'WO-000006',
    type: 'Breakdown',
    status: 'Assigned',
    priority: 'High',
    title: 'Engine overheating - Compressor COM-015',
    description: 'Engine temperature rising above normal operating range',
    assetId: 'AST-000006',
    assetTypeCode: 'COM',
    assetMake: 'Atlas Copco',
    assetModel: 'GA90',
    assetInternalClientNumber: 'CLIENT-COM-015',
    siteId: '1',
    siteName: 'Site A',
    location: 'Workshop',
    assignedToId: 'user-1',
    assignedToName: 'John Smith',
    createdById: 'user-8',
    createdByName: 'Rachel Green',
    createdAt: '2025-12-13T14:00:00Z',
    dueDate: '2025-12-15T17:00:00Z',
    age: 2,
  },
  {
    id: 'WO-000007',
    type: 'Corrective',
    status: 'Open',
    priority: 'Low',
    title: 'Replace air filter - Compressor COM-015',
    description: 'Routine air filter replacement',
    assetId: 'AST-000006',
    assetTypeCode: 'COM',
    assetMake: 'Atlas Copco',
    assetModel: 'GA90',
    assetInternalClientNumber: 'CLIENT-COM-015',
    siteId: '1',
    siteName: 'Site A',
    location: 'Workshop',
    createdById: 'user-3',
    createdByName: 'Mike Davis',
    createdAt: '2025-12-14T10:00:00Z',
    age: 1,
  },
  {
    id: 'WO-000008',
    type: 'PPM',
    status: 'Assigned',
    priority: 'Medium',
    title: 'Monthly service - Pump PU-042',
    description: 'Monthly preventive maintenance check',
    assetId: 'AST-000007',
    assetTypeCode: 'PU',
    assetMake: 'Grundfos',
    assetModel: 'CR 32-4',
    assetInternalClientNumber: 'CLIENT-PU-042',
    siteId: '3',
    siteName: 'Site C',
    location: 'Pump House',
    assignedToId: 'user-6',
    assignedToName: 'Lisa Anderson',
    createdById: 'user-2',
    createdByName: 'Sarah Johnson',
    createdAt: '2025-12-13T08:00:00Z',
    dueDate: '2025-12-20T17:00:00Z',
    age: 2,
  },
  {
    id: 'WO-000009',
    type: 'Breakdown',
    status: 'InProgress',
    priority: 'High',
    title: 'Hydraulic leak - Excavator EX-001',
    description: 'Hydraulic fluid leak detected during operation',
    assetId: 'AST-000001',
    assetTypeCode: 'EX',
    assetMake: 'Caterpillar',
    assetModel: '320D',
    assetInternalClientNumber: 'CLIENT-EX-001',
    siteId: '1',
    siteName: 'Site A',
    location: 'Yard 1',
    assignedToId: 'user-1',
    assignedToName: 'John Smith',
    createdById: 'user-4',
    createdByName: 'Emma Wilson',
    createdAt: '2025-12-12T14:30:00Z',
    dueDate: '2025-12-14T17:00:00Z',
    age: 3,
  },
  {
    id: 'WO-000010',
    type: 'Inspection',
    status: 'Completed',
    priority: 'Medium',
    title: 'Weekly safety check - Forklift FL-023',
    description: 'Weekly safety inspection completed',
    assetId: 'AST-000004',
    assetTypeCode: 'FL',
    assetMake: 'Toyota',
    assetModel: '8FBE20',
    assetInternalClientNumber: 'CLIENT-FL-023',
    siteId: '3',
    siteName: 'Site C',
    location: 'Warehouse',
    assignedToId: 'user-4',
    assignedToName: 'Emma Wilson',
    createdById: 'user-5',
    createdByName: 'Tom Brown',
    createdAt: '2025-12-10T09:00:00Z',
    completedAt: '2025-12-10T11:00:00Z',
    closedAt: '2025-12-10T11:15:00Z',
    completionNotes: 'All checks passed. Equipment in good condition.',
    age: 5,
  },
  {
    id: 'WO-000011',
    type: 'Corrective',
    status: 'WaitingParts',
    priority: 'High',
    title: 'Replace brake pads - Forklift FL-023',
    description: 'Brake pads worn, replacement required',
    assetId: 'AST-000004',
    assetTypeCode: 'FL',
    assetMake: 'Toyota',
    assetModel: '8FBE20',
    assetInternalClientNumber: 'CLIENT-FL-023',
    siteId: '3',
    siteName: 'Site C',
    location: 'Warehouse',
    assignedToId: 'user-4',
    assignedToName: 'Emma Wilson',
    createdById: 'user-5',
    createdByName: 'Tom Brown',
    createdAt: '2025-12-11T10:00:00Z',
    dueDate: '2025-12-18T17:00:00Z',
    age: 4,
  },
  {
    id: 'WO-000012',
    type: 'PPM',
    status: 'Open',
    priority: 'Low',
    title: 'Quarterly service - Generator GEN-012',
    description: 'Quarterly service and inspection',
    assetId: 'AST-000005',
    assetTypeCode: 'GEN',
    assetMake: 'Cummins',
    assetModel: 'QSK60',
    assetInternalClientNumber: 'CLIENT-GEN-012',
    siteId: '1',
    siteName: 'Site A',
    location: 'Power Station',
    createdById: 'user-3',
    createdByName: 'Mike Davis',
    createdAt: '2025-12-15T08:00:00Z',
    dueDate: '2025-12-22T17:00:00Z',
    age: 0,
  },
  {
    id: 'WO-000013',
    type: 'Breakdown',
    status: 'Assigned',
    priority: 'Critical',
    title: 'Engine failure - Compressor COM-015',
    description: 'Engine will not start, suspected fuel system issue',
    assetId: 'AST-000006',
    assetTypeCode: 'COM',
    assetMake: 'Atlas Copco',
    assetModel: 'GA90',
    assetInternalClientNumber: 'CLIENT-COM-015',
    siteId: '1',
    siteName: 'Site A',
    location: 'Workshop',
    assignedToId: 'user-1',
    assignedToName: 'John Smith',
    createdById: 'user-8',
    createdByName: 'Rachel Green',
    createdAt: '2025-12-14T16:00:00Z',
    dueDate: '2025-12-15T12:00:00Z',
    age: 1,
  },
  {
    id: 'WO-000014',
    type: 'Calibration',
    status: 'Completed',
    priority: 'Medium',
    title: 'Calibrate pressure gauge - Pump PU-042',
    description: 'Annual calibration completed',
    assetId: 'AST-000007',
    assetTypeCode: 'PU',
    assetMake: 'Grundfos',
    assetModel: 'CR 32-4',
    assetInternalClientNumber: 'CLIENT-PU-042',
    siteId: '3',
    siteName: 'Site C',
    location: 'Pump House',
    assignedToId: 'user-6',
    assignedToName: 'Lisa Anderson',
    createdById: 'user-2',
    createdByName: 'Sarah Johnson',
    createdAt: '2025-12-12T09:00:00Z',
    completedAt: '2025-12-12T14:00:00Z',
    closedAt: '2025-12-12T14:30:00Z',
    completionNotes: 'Calibration certificate issued.',
    age: 3,
  },
  {
    id: 'WO-000015',
    type: 'Corrective',
    status: 'InProgress',
    priority: 'Medium',
    title: 'Replace hydraulic hose - Excavator EX-001',
    description: 'Hydraulic hose showing signs of wear',
    assetId: 'AST-000001',
    assetTypeCode: 'EX',
    assetMake: 'Caterpillar',
    assetModel: '320D',
    assetInternalClientNumber: 'CLIENT-EX-001',
    siteId: '1',
    siteName: 'Site A',
    location: 'Yard 1',
    assignedToId: 'user-1',
    assignedToName: 'John Smith',
    createdById: 'user-3',
    createdByName: 'Mike Davis',
    createdAt: '2025-12-11T11:00:00Z',
    dueDate: '2025-12-16T17:00:00Z',
    age: 4,
  },
  {
    id: 'WO-000016',
    type: 'PPM',
    status: 'Open',
    priority: 'Low',
    title: 'Monthly PM - MEWP',
    description: 'Monthly preventive maintenance',
    assetId: 'AST-000002',
    assetTypeCode: 'MEWP',
    assetMake: 'JLG',
    assetModel: '600S',
    assetInternalClientNumber: 'CLIENT-MEWP-001',
    siteId: '1',
    siteName: 'Site A',
    location: 'Yard 2',
    createdById: 'user-2',
    createdByName: 'Sarah Johnson',
    createdAt: '2025-12-15T07:00:00Z',
    dueDate: '2025-12-22T17:00:00Z',
    age: 0,
  },
  {
    id: 'WO-000017',
    type: 'Breakdown',
    status: 'WaitingParts',
    priority: 'High',
    title: 'Replace starter motor - Generator GEN-012',
    description: 'Starter motor failed, replacement required',
    assetId: 'AST-000005',
    assetTypeCode: 'GEN',
    assetMake: 'Cummins',
    assetModel: 'QSK60',
    assetInternalClientNumber: 'CLIENT-GEN-012',
    siteId: '1',
    siteName: 'Site A',
    location: 'Power Station',
    assignedToId: 'user-7',
    assignedToName: 'David Lee',
    createdById: 'user-8',
    createdByName: 'Rachel Green',
    createdAt: '2025-12-13T13:00:00Z',
    dueDate: '2025-12-17T17:00:00Z',
    age: 2,
  },
  {
    id: 'WO-000018',
    type: 'Inspection',
    status: 'Assigned',
    priority: 'Medium',
    title: 'Pre-use inspection - Crane CR-005',
    description: 'Pre-use safety inspection',
    assetId: 'AST-000003',
    assetTypeCode: 'CR',
    assetMake: 'Liebherr',
    assetModel: 'LTM 1050',
    assetInternalClientNumber: 'CLIENT-CR-005',
    siteId: '2',
    siteName: 'Site B',
    location: 'Crane Pad',
    assignedToId: 'user-7',
    assignedToName: 'David Lee',
    createdById: 'user-2',
    createdByName: 'Sarah Johnson',
    createdAt: '2025-12-14T08:00:00Z',
    dueDate: '2025-12-15T08:00:00Z',
    age: 1,
  },
  {
    id: 'WO-000019',
    type: 'Corrective',
    status: 'Open',
    priority: 'Low',
    title: 'Tighten loose bolts - Compressor COM-015',
    description: 'Routine maintenance - tighten mounting bolts',
    assetId: 'AST-000006',
    assetTypeCode: 'COM',
    assetMake: 'Atlas Copco',
    assetModel: 'GA90',
    assetInternalClientNumber: 'CLIENT-COM-015',
    siteId: '1',
    siteName: 'Site A',
    location: 'Workshop',
    createdById: 'user-1',
    createdByName: 'John Smith',
    createdAt: '2025-12-15T09:00:00Z',
    dueDate: '2025-12-18T17:00:00Z',
    age: 0,
  },
  {
    id: 'WO-000020',
    type: 'PPM',
    status: 'Completed',
    priority: 'Medium',
    title: 'Weekly check - Pump PU-042',
    description: 'Weekly operational check completed',
    assetId: 'AST-000007',
    assetTypeCode: 'PU',
    assetMake: 'Grundfos',
    assetModel: 'CR 32-4',
    assetInternalClientNumber: 'CLIENT-PU-042',
    siteId: '3',
    siteName: 'Site C',
    location: 'Pump House',
    assignedToId: 'user-6',
    assignedToName: 'Lisa Anderson',
    createdById: 'user-3',
    createdByName: 'Mike Davis',
    createdAt: '2025-12-10T08:00:00Z',
    completedAt: '2025-12-10T10:00:00Z',
    closedAt: '2025-12-10T10:15:00Z',
    completionNotes: 'All systems operational.',
    age: 5,
  },
];

const mockWorkOrderParts: WorkOrderPart[] = [
  {
    id: '1',
    workOrderId: 'WO-000001',
    partNumber: 'FIL-HYD-001',
    description: 'Hydraulic Filter',
    quantity: 2,
    createdAt: '2025-12-10T08:00:00Z',
  },
  {
    id: '2',
    workOrderId: 'WO-000003',
    partNumber: 'BRK-PAD-FL-023',
    description: 'Brake Pads',
    quantity: 4,
    createdAt: '2025-12-08T10:00:00Z',
  },
  {
    id: '3',
    workOrderId: 'WO-000003',
    partNumber: 'BRK-FLUID-001',
    description: 'Brake Fluid',
    quantity: 1,
    createdAt: '2025-12-08T10:00:00Z',
  },
];

const mockWorkOrderUpdates: WorkOrderUpdate[] = [
  {
    id: '1',
    workOrderId: 'WO-000001',
    userId: 'user-1',
    userName: 'John Smith',
    note: 'Started work on hydraulic filter replacement',
    createdAt: '2025-12-10T09:00:00Z',
  },
  {
    id: '2',
    workOrderId: 'WO-000001',
    userId: 'user-1',
    userName: 'John Smith',
    note: 'Old filter removed. Installing new filter.',
    createdAt: '2025-12-10T10:30:00Z',
  },
  {
    id: '3',
    workOrderId: 'WO-000003',
    userId: 'user-4',
    userName: 'Emma Wilson',
    note: 'Waiting for brake pads to arrive from supplier',
    createdAt: '2025-12-09T11:00:00Z',
  },
];

export function getWorkOrders(filter?: WorkOrderFilter): WorkOrder[] {
  let filtered = [...mockWorkOrders];

  if (!filter) {
    return filtered;
  }

  // Search filter
  if (filter.search) {
    const searchLower = filter.search.toLowerCase();
    filtered = filtered.filter(
      (wo) =>
        wo.id.toLowerCase().includes(searchLower) ||
        wo.assetId.toLowerCase().includes(searchLower) ||
        wo.title.toLowerCase().includes(searchLower) ||
        wo.assetInternalClientNumber?.toLowerCase().includes(searchLower) ||
        wo.assetSerialNumber?.toLowerCase().includes(searchLower)
    );
  }

  // Status filter
  if (filter.status) {
    filtered = filtered.filter((wo) => wo.status === filter.status);
  }

  // Priority filter
  if (filter.priority) {
    filtered = filtered.filter((wo) => wo.priority === filter.priority);
  }

  // Type filter
  if (filter.type) {
    filtered = filtered.filter((wo) => wo.type === filter.type);
  }

  // Site filter
  if (filter.siteId) {
    filtered = filtered.filter((wo) => wo.siteId === filter.siteId);
  }

  // Assigned to filter
  if (filter.assignedToId) {
    filtered = filtered.filter((wo) => wo.assignedToId === filter.assignedToId);
  }

  // Quick filters (these can be combined - OR logic for different types, AND within same type)
  if (filter.showMyWOs || filter.assignedToId) {
    // Filter by assigned user ID (either from showMyWOs or explicit assignedToId)
    const userId = filter.assignedToId;
    if (userId) {
      filtered = filtered.filter((wo) => wo.assignedToId === userId);
    }
  }

  // Apply wildcard filters with OR logic (if multiple are selected, show items matching ANY of them)
  const hasWildcardFilters = filter.showOverdue || filter.showWaitingParts || filter.showCritical;
  
  if (hasWildcardFilters) {
    const today = new Date();
    filtered = filtered.filter((wo) => {
      // Match ANY of the active wildcard filters (OR logic)
      if (filter.showOverdue) {
        if (wo.dueDate) {
          const isOverdue = new Date(wo.dueDate) < today && 
                            wo.status !== 'Completed' && 
                            wo.status !== 'ApprovedClosed' && 
                            wo.status !== 'Cancelled';
          if (isOverdue) return true;
        }
      }
      
      if (filter.showWaitingParts) {
        if (wo.status === 'WaitingParts') return true;
      }
      
      if (filter.showCritical) {
        if (wo.priority === 'Critical') return true;
      }
      
      return false; // Only include if matches at least one wildcard
    });
  }

  return filtered;
}

export function getWorkOrderById(id: string): WorkOrder | undefined {
  return mockWorkOrders.find((wo) => wo.id === id);
}

export function getWorkOrderParts(workOrderId: string): WorkOrderPart[] {
  return mockWorkOrderParts.filter((part) => part.workOrderId === workOrderId);
}

export function getWorkOrderUpdates(workOrderId: string): WorkOrderUpdate[] {
  return mockWorkOrderUpdates.filter((update) => update.workOrderId === workOrderId);
}

export function getWorkOrderAlerts(): WorkOrder[] {
  const today = new Date();
  return mockWorkOrders.filter((wo) => {
    const isOverdue = wo.dueDate && new Date(wo.dueDate) < today && wo.status !== 'Completed' && wo.status !== 'ApprovedClosed';
    const isCritical = wo.priority === 'Critical' && wo.status !== 'Completed' && wo.status !== 'ApprovedClosed';
    const isWaitingParts = wo.status === 'WaitingParts';
    return isOverdue || isCritical || isWaitingParts;
  });
}

/**
 * Generate next work order ID (WO-000XXX format)
 */
function generateNextWorkOrderId(): string {
  const existingIds = mockWorkOrders.map((wo) => wo.id);
  const maxNum = existingIds.reduce((max, id) => {
    const match = id.match(/WO-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      return Math.max(max, num);
    }
    return max;
  }, 0);
  
  const nextNum = maxNum + 1;
  return `WO-${String(nextNum).padStart(6, '0')}`;
}

interface CreateWorkOrderData {
  title: string;
  description: string;
  assetId: string;
  siteId: string;
  category?: string;
  type: WorkOrderType;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  assignedToId?: string;
  dueDate: string;
  targetStart?: string;
  assetIsolated?: boolean;
  permitRequired?: boolean;
  steps?: string;
  attachments?: Array<{
    id: string;
    filename: string;
    type: 'photo' | 'document';
    uri: string;
    uploadedAt: string;
  }>;
  createdById: string;
  createdByName: string;
}

/**
 * Create a new work order
 */
export function createWorkOrder(data: CreateWorkOrderData): WorkOrder {
  const asset = getAssetById(data.assetId);
  if (!asset) {
    throw new Error(`Asset ${data.assetId} not found`);
  }

  const site = mockSites.find((s) => s.id === data.siteId);
  if (!site) {
    throw new Error(`Site ${data.siteId} not found`);
  }

  const today = new Date();
  const createdAt = today.toISOString();
  const dueDateObj = data.dueDate ? new Date(data.dueDate) : null;
  const age = 0; // New work order

  const workOrder: WorkOrder = {
    id: generateNextWorkOrderId(),
    type: data.type,
    status: data.status,
    priority: data.priority,
    title: data.title,
    description: data.description,
    assetId: asset.id,
    assetTypeCode: asset.assetTypeCode,
    assetMake: asset.make,
    assetModel: asset.model,
    assetInternalClientNumber: asset.internalClientAssetNumber,
    assetSerialNumber: asset.supplierSerialNumber,
    siteId: site.id,
    siteName: site.name,
    location: asset.location,
    assignedToId: data.assignedToId,
    assignedToName: data.assignedToId ? 'Assigned User' : undefined, // Mock - would get from user service
    createdById: data.createdById,
    createdByName: data.createdByName,
    createdAt,
    dueDate: data.dueDate,
    age,
  };

  mockWorkOrders.push(workOrder);
  return workOrder;
}

/**
 * Create a draft work order from PM task issue
 */
export function createWorkOrderDraft(data: CreateWorkOrderData & {
  isDraft?: boolean;
  pmScheduleId?: string;
  pmTaskId?: string;
  pmChecklistItemId?: string;
}): WorkOrder {
  const workOrder = createWorkOrder(data);
  if (data.isDraft) {
    workOrder.isDraft = true;
    workOrder.pmScheduleId = data.pmScheduleId;
    workOrder.pmTaskId = data.pmTaskId;
    workOrder.pmChecklistItemId = data.pmChecklistItemId;
  }
  return workOrder;
}

/**
 * Update an existing work order
 */
export function updateWorkOrder(id: string, updates: Partial<WorkOrder>): WorkOrder {
  const workOrderIndex = mockWorkOrders.findIndex((wo) => wo.id === id);
  if (workOrderIndex === -1) {
    throw new Error(`Work order ${id} not found`);
  }

  const workOrder = mockWorkOrders[workOrderIndex];
  const updatedWorkOrder: WorkOrder = {
    ...workOrder,
    ...updates,
  };

  mockWorkOrders[workOrderIndex] = updatedWorkOrder;
  return updatedWorkOrder;
}

/**
 * Bulk update multiple work orders
 */
export function bulkUpdateWorkOrders(
  workOrderIds: string[],
  updates: Partial<WorkOrder>
): { updated: number; errors: string[] } {
  const errors: string[] = [];
  let updated = 0;

  for (const id of workOrderIds) {
    try {
      updateWorkOrder(id, updates);
      updated++;
    } catch (error) {
      errors.push(`${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return { updated, errors };
}
