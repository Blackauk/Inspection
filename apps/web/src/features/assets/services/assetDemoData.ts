// Demo data for AST-000001 asset tabs
import type { WorkOrder } from '../../work-orders/types';
import type { WorkOrderStatus, WorkOrderType } from '@ppm/shared';
import type { Inspection, InspectionStatus, InspectionType } from '../../inspections/types';

// Work Orders for AST-000001
export const getWorkOrdersForAsset = (assetId: string): WorkOrder[] => {
  if (assetId !== 'AST-000001') return [];
  
  return [
    {
      id: 'WO-000123',
      type: 'Breakdown' as WorkOrderType,
      status: 'InProgress' as WorkOrderStatus,
      priority: 'High',
      title: 'Fix hydraulic leak on main boom',
      description: 'Hydraulic fluid leaking from main boom cylinder. Requires immediate attention.',
      assetId: 'AST-000001',
      assetTypeCode: 'EX',
      assetMake: 'Caterpillar',
      assetModel: '320D',
      siteId: '1',
      siteName: 'Site A',
      location: 'Yard 1',
      assignedToId: 'user-1',
      assignedToName: 'John Smith',
      createdById: 'user-2',
      createdByName: 'Supervisor',
      createdAt: '2025-12-20T08:00:00Z',
      dueDate: '2025-12-25T17:00:00Z',
      age: 5,
    },
    {
      id: 'WO-000124',
      type: 'PPM' as WorkOrderType,
      status: 'Open' as WorkOrderStatus,
      priority: 'Medium',
      title: 'Monthly service - Hydraulic system check',
      description: 'Routine monthly service including hydraulic fluid check and filter replacement.',
      assetId: 'AST-000001',
      assetTypeCode: 'EX',
      assetMake: 'Caterpillar',
      assetModel: '320D',
      siteId: '1',
      siteName: 'Site A',
      location: 'Yard 1',
      assignedToId: 'user-3',
      assignedToName: 'Mike Davis',
      createdById: 'user-2',
      createdByName: 'Supervisor',
      createdAt: '2025-12-22T09:00:00Z',
      dueDate: '2025-12-30T17:00:00Z',
      age: 3,
    },
    {
      id: 'WO-000125',
      type: 'Defect' as WorkOrderType,
      status: 'Overdue' as WorkOrderStatus,
      priority: 'Critical',
      title: 'Replace worn track pads',
      description: 'Track pads showing excessive wear. Replacement required before next shift.',
      assetId: 'AST-000001',
      assetTypeCode: 'EX',
      assetMake: 'Caterpillar',
      assetModel: '320D',
      siteId: '1',
      siteName: 'Site A',
      location: 'Yard 1',
      assignedToId: 'user-1',
      assignedToName: 'John Smith',
      createdById: 'user-2',
      createdByName: 'Supervisor',
      createdAt: '2025-12-15T10:00:00Z',
      dueDate: '2025-12-18T17:00:00Z',
      completedAt: undefined,
      age: 10,
    },
    {
      id: 'WO-000126',
      type: 'Inspection' as WorkOrderType,
      status: 'Completed' as WorkOrderStatus,
      priority: 'Medium',
      title: 'Weekly safety inspection',
      description: 'Completed weekly safety inspection. All checks passed.',
      assetId: 'AST-000001',
      assetTypeCode: 'EX',
      assetMake: 'Caterpillar',
      assetModel: '320D',
      siteId: '1',
      siteName: 'Site A',
      location: 'Yard 1',
      assignedToId: 'user-3',
      assignedToName: 'Mike Davis',
      createdById: 'user-2',
      createdByName: 'Supervisor',
      createdAt: '2025-12-10T08:00:00Z',
      dueDate: '2025-12-12T17:00:00Z',
      completedAt: '2025-12-12T16:30:00Z',
      closedAt: '2025-12-12T16:30:00Z',
      age: 15,
    },
    {
      id: 'WO-000127',
      type: 'Calibration' as WorkOrderType,
      status: 'WaitingParts' as WorkOrderStatus,
      priority: 'Low',
      title: 'Calibrate pressure sensors',
      description: 'Calibration kit on order. Expected delivery 28/12/2025.',
      assetId: 'AST-000001',
      assetTypeCode: 'EX',
      assetMake: 'Caterpillar',
      assetModel: '320D',
      siteId: '1',
      siteName: 'Site A',
      location: 'Yard 1',
      assignedToId: 'user-1',
      assignedToName: 'John Smith',
      createdById: 'user-2',
      createdByName: 'Supervisor',
      createdAt: '2025-12-18T11:00:00Z',
      dueDate: '2026-01-05T17:00:00Z',
      age: 7,
    },
  ];
};

// PM Schedule for AST-000001
export interface PMScheduleItem {
  id: string;
  name: string;
  frequency: string;
  lastDone?: string;
  nextDue: string;
  status: 'Overdue' | 'Due Today' | 'Upcoming' | 'Completed';
  assignedTeam: string;
}

export const getPMScheduleForAsset = (assetId: string): PMScheduleItem[] => {
  if (assetId !== 'AST-000001') return [];
  
  return [
    {
      id: 'pm-001',
      name: 'Weekly Hydraulic System Check',
      frequency: 'Weekly',
      lastDone: '2025-12-18',
      nextDue: '2025-12-25',
      status: 'Upcoming',
      assignedTeam: 'Plant Team',
    },
    {
      id: 'pm-002',
      name: 'Monthly Full Service',
      frequency: 'Monthly',
      lastDone: '2025-11-15',
      nextDue: '2025-12-15',
      status: 'Overdue',
      assignedTeam: 'Plant Team',
    },
    {
      id: 'pm-003',
      name: 'Quarterly Engine Overhaul',
      frequency: 'Quarterly',
      lastDone: '2025-10-01',
      nextDue: '2026-01-01',
      status: 'Upcoming',
      assignedTeam: 'Heavy Plant',
    },
    {
      id: 'pm-004',
      name: 'Daily Pre-Start Checks',
      frequency: 'Daily',
      lastDone: '2025-12-24',
      nextDue: '2025-12-25',
      status: 'Due Today',
      assignedTeam: 'Plant Team',
    },
    {
      id: 'pm-005',
      name: 'Annual LOLER Inspection',
      frequency: 'Annually',
      lastDone: '2024-12-20',
      nextDue: '2025-12-20',
      status: 'Overdue',
      assignedTeam: 'Compliance Team',
    },
  ];
};

// Checks for AST-000001
export interface CheckItem {
  id: string;
  checkId: string;
  checkType: string;
  frequency: string;
  lastCompleted?: string;
  result: 'Pass' | 'Fail' | 'Pending';
  status: 'Due' | 'Overdue' | 'Completed' | 'Pending';
}

export const getChecksForAsset = (assetId: string): CheckItem[] => {
  if (assetId !== 'AST-000001') return [];
  
  return [
    {
      id: 'check-001',
      checkId: 'CHK-001',
      checkType: 'Daily Pre-Start',
      frequency: 'Daily',
      lastCompleted: '2025-12-24',
      result: 'Pass',
      status: 'Completed',
    },
    {
      id: 'check-002',
      checkId: 'CHK-002',
      checkType: 'Weekly Hydraulic',
      frequency: 'Weekly',
      lastCompleted: '2025-12-18',
      result: 'Pass',
      status: 'Due',
    },
    {
      id: 'check-003',
      checkId: 'CHK-003',
      checkType: 'Monthly Safety',
      frequency: 'Monthly',
      lastCompleted: '2025-11-20',
      result: 'Pass',
      status: 'Overdue',
    },
    {
      id: 'check-004',
      checkId: 'CHK-004',
      checkType: 'LOLER Inspection',
      frequency: 'Annually',
      lastCompleted: '2024-12-20',
      result: 'Pass',
      status: 'Overdue',
    },
    {
      id: 'check-005',
      checkId: 'CHK-005',
      checkType: 'PUWER Assessment',
      frequency: 'Annually',
      lastCompleted: undefined,
      result: 'Pending',
      status: 'Pending',
    },
  ];
};

// Issues / Defects for AST-000001
export interface DefectItem {
  id: string;
  defectId: string;
  title: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  reportedDate: string;
  linkedWO?: string;
}

export const getDefectsForAsset = (assetId: string): DefectItem[] => {
  if (assetId !== 'AST-000001') return [];
  
  return [
    {
      id: 'defect-001',
      defectId: 'DEF-001',
      title: 'Minor hydraulic leak - main boom cylinder',
      severity: 'Medium',
      status: 'In Progress',
      reportedDate: '2025-12-20',
      linkedWO: 'WO-000123',
    },
    {
      id: 'defect-002',
      defectId: 'DEF-002',
      title: 'Worn track pads - left side',
      severity: 'High',
      status: 'Open',
      reportedDate: '2025-12-15',
      linkedWO: 'WO-000125',
    },
    {
      id: 'defect-003',
      defectId: 'DEF-003',
      title: 'Pressure sensor calibration overdue',
      severity: 'Low',
      status: 'Open',
      reportedDate: '2025-12-18',
      linkedWO: 'WO-000127',
    },
    {
      id: 'defect-004',
      defectId: 'DEF-004',
      title: 'Cabin door latch loose',
      severity: 'Low',
      status: 'Resolved',
      reportedDate: '2025-12-10',
      linkedWO: undefined,
    },
    {
      id: 'defect-005',
      defectId: 'DEF-005',
      title: 'LOLER certificate expired',
      severity: 'Critical',
      status: 'Open',
      reportedDate: '2025-12-20',
      linkedWO: undefined,
    },
  ];
};

// Inspections for AST-000001
export const getInspectionsForAsset = (assetId: string): Inspection[] => {
  if (assetId !== 'AST-000001') return [];
  
  return [
    {
      id: 'ins-001',
      inspectionCode: 'INS-2025-001',
      templateId: 'template-daily',
      templateName: 'Daily Pre-Start Inspection',
      templateVersion: 'v1',
      inspectionType: 'Daily' as InspectionType,
      assetId: 'AST-000001',
      assetTypeCode: 'EX',
      assetMake: 'Caterpillar',
      assetModel: '320D',
      siteId: '1',
      siteName: 'Site A',
      locationName: 'Yard 1',
      inspectorId: 'user-1',
      inspectorName: 'John Smith',
      status: 'Closed' as InspectionStatus,
      result: 'Pass',
      inspectionDate: '2025-12-24',
      dueDate: '2025-12-24',
      completedAt: '2025-12-24T08:30:00Z',
      submittedAt: '2025-12-24T08:35:00Z',
      approvedAt: '2025-12-24T09:00:00Z',
      closedAt: '2025-12-24T09:00:00Z',
      startedAt: '2025-12-24T08:00:00Z',
      items: [],
      answers: [],
      linkedDefectIds: [],
      sections: [],
      attachments: [],
      signatures: [],
      history: [],
      revisionNumber: 1,
      createdAt: '2025-12-24T08:00:00Z',
      createdBy: 'user-1',
      createdByName: 'John Smith',
      updatedAt: '2025-12-24T09:00:00Z',
      updatedBy: 'user-1',
      updatedByName: 'John Smith',
      signatures: [],
      history: [],
      revisionNumber: 1,
      createdAt: '2025-12-24T08:00:00Z',
      createdBy: 'user-1',
      createdByName: 'John Smith',
      updatedAt: '2025-12-24T09:00:00Z',
      updatedBy: 'user-1',
      updatedByName: 'John Smith',
    },
    {
      id: 'ins-002',
      inspectionCode: 'INS-2025-002',
      templateId: 'template-weekly',
      templateName: 'Weekly Safety Inspection',
      templateVersion: 'v1',
      inspectionType: 'Weekly' as InspectionType,
      assetId: 'AST-000001',
      assetTypeCode: 'EX',
      assetMake: 'Caterpillar',
      assetModel: '320D',
      siteId: '1',
      siteName: 'Site A',
      locationName: 'Yard 1',
      inspectorId: 'user-3',
      inspectorName: 'Mike Davis',
      status: 'Closed' as InspectionStatus,
      result: 'Pass',
      inspectionDate: '2025-12-18',
      dueDate: '2025-12-18',
      completedAt: '2025-12-18T14:00:00Z',
      submittedAt: '2025-12-18T14:15:00Z',
      approvedAt: '2025-12-18T15:00:00Z',
      closedAt: '2025-12-18T15:00:00Z',
      startedAt: '2025-12-18T13:30:00Z',
      items: [],
      answers: [],
      linkedDefectIds: [],
      sections: [],
      attachments: [],
      signatures: [],
      history: [],
      revisionNumber: 1,
      createdAt: '2025-12-18T13:30:00Z',
      createdBy: 'user-3',
      createdByName: 'Mike Davis',
      updatedAt: '2025-12-18T15:00:00Z',
      updatedBy: 'user-3',
      updatedByName: 'Mike Davis',
    },
    {
      id: 'ins-003',
      inspectionCode: 'INS-2025-003',
      templateId: 'template-monthly',
      templateName: 'Monthly Comprehensive Inspection',
      templateVersion: 'v1',
      inspectionType: 'Monthly' as InspectionType,
      assetId: 'AST-000001',
      assetTypeCode: 'EX',
      assetMake: 'Caterpillar',
      assetModel: '320D',
      siteId: '1',
      siteName: 'Site A',
      locationName: 'Yard 1',
      inspectorId: 'user-2',
      inspectorName: 'Supervisor',
      status: 'InProgress' as InspectionStatus,
      result: 'Pending',
      inspectionDate: '2025-12-20',
      dueDate: '2025-12-20',
      startedAt: '2025-12-20T10:00:00Z',
      items: [],
      answers: [],
      linkedDefectIds: [],
      sections: [],
      attachments: [],
      signatures: [],
      history: [],
      revisionNumber: 1,
      createdAt: '2025-12-20T10:00:00Z',
      createdBy: 'user-2',
      createdByName: 'Supervisor',
      updatedAt: '2025-12-20T10:00:00Z',
      updatedBy: 'user-2',
      updatedByName: 'Supervisor',
    },
    {
      id: 'ins-004',
      inspectionCode: 'INS-2025-004',
      templateId: 'template-yearly',
      templateName: 'Annual LOLER Inspection',
      templateVersion: 'v1',
      inspectionType: 'TimeBased' as InspectionType,
      assetId: 'AST-000001',
      assetTypeCode: 'EX',
      assetMake: 'Caterpillar',
      assetModel: '320D',
      siteId: '1',
      siteName: 'Site A',
      locationName: 'Yard 1',
      inspectorId: 'user-4',
      inspectorName: 'External Inspector',
      status: 'Draft' as InspectionStatus,
      result: 'Pending',
      inspectionDate: '2025-12-20',
      dueDate: '2025-12-20',
      items: [],
      answers: [],
      linkedDefectIds: [],
      sections: [],
      attachments: [],
      signatures: [],
      history: [],
      revisionNumber: 1,
      createdAt: '2025-12-20T08:00:00Z',
      createdBy: 'user-4',
      createdByName: 'External Inspector',
      updatedAt: '2025-12-20T08:00:00Z',
      updatedBy: 'user-4',
      updatedByName: 'External Inspector',
    },
    {
      id: 'ins-005',
      inspectionCode: 'INS-2025-005',
      templateId: 'template-preuse',
      templateName: 'Pre-Use Safety Check',
      templateVersion: 'v1',
      inspectionType: 'PreUse' as InspectionType,
      assetId: 'AST-000001',
      assetTypeCode: 'EX',
      assetMake: 'Caterpillar',
      assetModel: '320D',
      siteId: '1',
      siteName: 'Site A',
      locationName: 'Yard 1',
      inspectorId: 'user-1',
      inspectorName: 'John Smith',
      status: 'Closed' as InspectionStatus,
      result: 'Fail',
      inspectionDate: '2025-12-22',
      dueDate: '2025-12-22',
      completedAt: '2025-12-22T07:45:00Z',
      submittedAt: '2025-12-22T08:00:00Z',
      approvedAt: '2025-12-22T08:30:00Z',
      closedAt: '2025-12-22T08:30:00Z',
      startedAt: '2025-12-22T07:30:00Z',
      items: [],
      answers: [],
      linkedDefectIds: ['defect-001'],
      sections: [],
      attachments: [],
      signatures: [],
      history: [],
      revisionNumber: 1,
      createdAt: '2025-12-22T07:30:00Z',
      createdBy: 'user-1',
      createdByName: 'John Smith',
      updatedAt: '2025-12-22T08:30:00Z',
      updatedBy: 'user-1',
      updatedByName: 'John Smith',
    },
  ];
};

// Documents for AST-000001
export interface AssetDocument {
  id: string;
  filename: string;
  type: 'photo' | 'document';
  uploadedAt: string;
  uploadedBy: string;
  uri?: string;
}

export const getDocumentsForAsset = (assetId: string): AssetDocument[] => {
  if (assetId !== 'AST-000001') return [];
  
  return [
    {
      id: 'doc-001',
      filename: 'AST-000001_ServiceReport_2025-11-15.pdf',
      type: 'document',
      uploadedAt: '2025-11-15T14:30:00Z',
      uploadedBy: 'Mike Davis',
    },
    {
      id: 'doc-002',
      filename: 'HydraulicLeak_Photo_2025-12-02.jpg',
      type: 'photo',
      uploadedAt: '2025-12-02T10:15:00Z',
      uploadedBy: 'John Smith',
    },
  ];
};

// Activity Log for AST-000001
export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  details?: string;
  // Meter reading fields
  meterReadingAtEvent?: number; // Snapshot of meter reading at the time of the event
  meterReadingUnit?: 'hours' | 'miles' | 'km'; // Unit for the meter reading
  previousReading?: number; // Previous reading (for Meter Reading Updated entries)
  newReading?: number; // New reading (for Meter Reading Updated entries)
}

export const getActivityLogForAsset = (assetId: string): ActivityLogEntry[] => {
  if (assetId !== 'AST-000001') return [];
  
  return [
    {
      id: 'activity-001',
      timestamp: '2025-12-24T08:30:00Z',
      action: 'Inspection Completed',
      user: 'John Smith',
      details: 'Daily Pre-Start Inspection (INS-2025-001) - Pass',
      meterReadingAtEvent: 2520,
      meterReadingUnit: 'hours',
    },
    {
      id: 'activity-002',
      timestamp: '2025-12-22T08:00:00Z',
      action: 'Inspection Completed',
      user: 'John Smith',
      details: 'Pre-Use Safety Check (INS-2025-005) - Fail - Defect created',
      meterReadingAtEvent: 2480,
      meterReadingUnit: 'hours',
    },
    {
      id: 'activity-003',
      timestamp: '2025-12-20T10:00:00Z',
      action: 'Work Order Created',
      user: 'Supervisor',
      details: 'WO-000123 - Fix hydraulic leak on main boom',
      meterReadingAtEvent: 2450,
      meterReadingUnit: 'hours',
    },
    {
      id: 'activity-meter-001',
      timestamp: '2025-12-19T14:00:00Z',
      action: 'Meter Reading Updated',
      user: 'John Smith',
      previousReading: 2400,
      newReading: 2450,
      meterReadingUnit: 'hours',
      details: 'Meter Reading: 2400 hours → 2450 hours',
    },
    {
      id: 'activity-004',
      timestamp: '2025-12-18T14:15:00Z',
      action: 'Inspection Completed',
      user: 'Mike Davis',
      details: 'Weekly Safety Inspection (INS-2025-002) - Pass',
      meterReadingAtEvent: 2380,
      meterReadingUnit: 'hours',
    },
    {
      id: 'activity-005',
      timestamp: '2025-12-15T10:00:00Z',
      action: 'Defect Reported',
      user: 'Supervisor',
      details: 'DEF-002 - Worn track pads - left side',
      meterReadingAtEvent: 2320,
      meterReadingUnit: 'hours',
    },
    {
      id: 'activity-meter-002',
      timestamp: '2025-12-12T16:00:00Z',
      action: 'Meter Reading Updated',
      user: 'Mike Davis',
      previousReading: 2300,
      newReading: 2320,
      meterReadingUnit: 'hours',
      details: 'Meter Reading: 2300 hours → 2320 hours',
    },
  ];
};


