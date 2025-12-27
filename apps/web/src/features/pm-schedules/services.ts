import type { PMSchedule, PMScheduleHistory, PMScheduleFilter, ShiftChangeoverEvent, PMChecklistItem, PMTask, PMScheduleDocument, PMScheduleActivity, Frequency } from './types';
import type { ScheduleType } from '@ppm/shared';
import { calculateComplianceRAG, getAssetById, mockSites } from '../assets/services';

// Helper to derive frequency from intervalDays
export function getFrequencyFromIntervalDays(intervalDays?: number): Frequency | undefined {
  if (!intervalDays) return undefined;
  if (intervalDays === 1) return 'Daily';
  if (intervalDays === 7) return 'Weekly';
  if (intervalDays === 30) return 'Monthly';
  if (intervalDays === 90) return 'Quarterly';
  if (intervalDays === 180) return '6-Monthly';
  if (intervalDays === 365) return 'Annual';
  return undefined;
}

// Helper to calculate PM schedule status
export function getPMScheduleStatus(schedule: PMSchedule): 'completed' | 'overdue' | 'due' | 'upcoming' {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(schedule.nextDueDate);
  dueDate.setHours(0, 0, 0, 0);

  // If completed, always show as completed
  if (schedule.completedAt) {
    return 'completed';
  }

  // If past due date, show as overdue
  if (dueDate < today) {
    return 'overdue';
  }

  // If due today, show as due
  if (dueDate.getTime() === today.getTime()) {
    return 'due';
  }

  // Otherwise upcoming
  return 'upcoming';
}

const mockPMSchedules: PMSchedule[] = [
  {
    id: 'PM-000001',
    name: 'Monthly PM - Excavator EX-001',
    description: 'Monthly preventive maintenance for excavator',
    assetId: 'AST-000001',
    assetTypeCode: 'EX',
    assetMake: 'Caterpillar',
    assetModel: '320D',
    siteId: '1',
    siteName: 'Site A',
    scheduleType: 'TimeBased',
    intervalDays: 30,
    frequency: 'Monthly',
    importanceLevel: 'Operational',
    lastDoneDate: '2025-11-15',
    nextDueDate: '2025-12-18',
    ragStatus: calculateComplianceRAG('2025-12-18'),
    assignedTeam: 'Plant Team',
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    checklistItems: [
      {
        id: 'check-1',
        order: 1,
        checkItem: 'Check hydraulic fluid level',
        checkType: 'PassFailNA',
        required: true,
        notesGuidance: 'Check sight glass, top up if below minimum',
      },
      {
        id: 'check-2',
        order: 2,
        checkItem: 'Engine oil level',
        checkType: 'PassFailNA',
        required: true,
        notesGuidance: 'Check dipstick, ensure within range',
      },
      {
        id: 'check-3',
        order: 3,
        checkItem: 'Hydraulic pressure (psi)',
        checkType: 'Numeric',
        required: true,
        expectedValue: 3000,
        units: 'psi',
        minValue: 2800,
        maxValue: 3200,
      },
      {
        id: 'check-4',
        order: 4,
        checkItem: 'Engine hours',
        checkType: 'Hours',
        required: true,
        units: 'hours',
      },
      {
        id: 'check-5',
        order: 5,
        checkItem: 'Visual inspection of tracks',
        checkType: 'PassFailNA',
        required: true,
        notesGuidance: 'Check for wear, damage, or missing links',
      },
      {
        id: 'check-6',
        order: 6,
        checkItem: 'Safety systems functional',
        checkType: 'YesNoNA',
        required: true,
        notesGuidance: 'Test emergency stop, alarms, safety interlocks',
      },
    ],
  },
  {
    id: 'PM-000002',
    name: 'Quarterly Service - Generator GEN-012',
    description: 'Quarterly service and inspection',
    assetId: 'AST-000005',
    assetTypeCode: 'GEN',
    assetMake: 'Cummins',
    assetModel: 'QSK60',
    siteId: '1',
    siteName: 'Site A',
    scheduleType: 'TimeBased',
    intervalDays: 90,
    frequency: 'Quarterly',
    importanceLevel: 'Operational',
    lastDoneDate: '2025-09-10',
    nextDueDate: '2025-12-22',
    ragStatus: calculateComplianceRAG('2025-12-22'),
    assignedTeam: 'Electrical',
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    checklistItems: [
      {
        id: 'check-gen-1',
        order: 1,
        checkItem: 'Check engine oil level',
        checkType: 'PassFailNA',
        required: true,
        notesGuidance: 'Check dipstick, ensure within range',
      },
      {
        id: 'check-gen-2',
        order: 2,
        checkItem: 'Coolant level',
        checkType: 'PassFailNA',
        required: true,
        notesGuidance: 'Check expansion tank',
      },
      {
        id: 'check-gen-3',
        order: 3,
        checkItem: 'Battery voltage',
        checkType: 'Numeric',
        required: true,
        expectedValue: 12.6,
        units: 'V',
        minValue: 12.0,
        maxValue: 13.2,
      },
      {
        id: 'check-gen-4',
        order: 4,
        checkItem: 'Engine hours',
        checkType: 'Hours',
        required: true,
        units: 'hours',
      },
      {
        id: 'check-gen-5',
        order: 5,
        checkItem: 'Air filter condition',
        checkType: 'PassFailNA',
        required: true,
        notesGuidance: 'Visual inspection, replace if dirty',
      },
      {
        id: 'check-gen-6',
        order: 6,
        checkItem: 'Fuel system check',
        checkType: 'YesNoNA',
        required: true,
        notesGuidance: 'Check for leaks, ensure fuel quality',
      },
    ],
  },
  {
    id: 'PM-000003',
    name: 'Weekly Check - Compressor COM-015',
    description: 'Weekly operational check',
    assetId: 'AST-000006',
    assetTypeCode: 'COM',
    assetMake: 'Atlas Copco',
    assetModel: 'GA90',
    siteId: '1',
    siteName: 'Site A',
    scheduleType: 'TimeBased',
    intervalDays: 7,
    frequency: 'Weekly',
    importanceLevel: 'Housekeeping',
    lastDoneDate: '2025-12-09',
    nextDueDate: '2025-12-16',
    ragStatus: calculateComplianceRAG('2025-12-16'),
    assignedTeam: 'Workshop',
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    checklistItems: [
      {
        id: 'check-com-1',
        order: 1,
        checkItem: 'Check air pressure',
        checkType: 'Numeric',
        required: true,
        expectedValue: 7,
        units: 'bar',
        minValue: 6.5,
        maxValue: 7.5,
      },
      {
        id: 'check-com-2',
        order: 2,
        checkItem: 'Oil level check',
        checkType: 'PassFailNA',
        required: true,
        notesGuidance: 'Check sight glass',
      },
      {
        id: 'check-com-3',
        order: 3,
        checkItem: 'Drain condensate',
        checkType: 'YesNoNA',
        required: true,
        notesGuidance: 'Drain air receiver and filters',
      },
      {
        id: 'check-com-4',
        order: 4,
        checkItem: 'Visual inspection',
        checkType: 'FreeText',
        required: true,
        notesGuidance: 'Check for leaks, unusual noises, vibrations',
      },
    ],
  },
  {
    id: 'PM-000004',
    name: '250 Hour Service - MEWP',
    description: 'Service every 250 operating hours',
    assetId: 'AST-000002',
    assetTypeCode: 'MEWP',
    assetMake: 'JLG',
    assetModel: '600S',
    siteId: '1',
    siteName: 'Site A',
    scheduleType: 'HoursBased',
    intervalHours: 250,
    importanceLevel: 'Safety Critical',
    tags: ['MEWP'],
    lastDoneDate: '2025-10-20',
    nextDueDate: '2025-12-25',
    ragStatus: calculateComplianceRAG('2025-12-25'),
    assignedTeam: 'Plant Team',
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    checklistItems: [
      {
        id: 'check-mewp-1',
        order: 1,
        checkItem: 'Platform controls functional',
        checkType: 'YesNoNA',
        required: true,
        notesGuidance: 'Test all platform controls',
      },
      {
        id: 'check-mewp-2',
        order: 2,
        checkItem: 'Hydraulic fluid level',
        checkType: 'PassFailNA',
        required: true,
        notesGuidance: 'Check reservoir level',
      },
      {
        id: 'check-mewp-3',
        order: 3,
        checkItem: 'Operating hours',
        checkType: 'Hours',
        required: true,
        units: 'hours',
      },
      {
        id: 'check-mewp-4',
        order: 4,
        checkItem: 'Safety systems test',
        checkType: 'PassFailNA',
        required: true,
        notesGuidance: 'Test emergency stop, tilt alarm, overload protection',
      },
      {
        id: 'check-mewp-5',
        order: 5,
        checkItem: 'Tire condition',
        checkType: 'FreeText',
        required: true,
        notesGuidance: 'Check tread depth, pressure, damage',
      },
    ],
  },
  {
    id: 'PM-000005',
    name: 'Annual Inspection - Crane CR-005',
    description: 'Annual LOLER inspection',
    assetId: 'AST-000003',
    assetTypeCode: 'CR',
    assetMake: 'Liebherr',
    assetModel: 'LTM 1050',
    siteId: '2',
    siteName: 'Site B',
    scheduleType: 'TimeBased',
    intervalDays: 365,
    frequency: 'Annual',
    importanceLevel: 'Statutory',
    tags: ['LOLER'],
    lastDoneDate: '2024-12-20',
    nextDueDate: '2025-12-20',
    ragStatus: calculateComplianceRAG('2025-12-20'),
    assignedTeam: 'Heavy Plant',
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
  },
  // Additional schedules for 2026 testing
  {
    id: 'PM-000006',
    name: 'Monthly PM - Excavator EX-001',
    description: 'Monthly preventive maintenance',
    assetId: 'AST-000001',
    assetTypeCode: 'EX',
    assetMake: 'Caterpillar',
    assetModel: '320D',
    siteId: '1',
    siteName: 'Site A',
    scheduleType: 'TimeBased',
    intervalDays: 30,
    frequency: 'Monthly',
    importanceLevel: 'Operational',
    lastDoneDate: '2025-12-18',
    nextDueDate: '2026-01-18',
    ragStatus: calculateComplianceRAG('2026-01-18'),
    assignedTeam: 'Plant Team',
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'PM-000007',
    name: 'Weekly Safety Check - Forklift FL-023',
    description: 'Weekly operational safety check',
    assetId: 'AST-000004',
    assetTypeCode: 'FL',
    assetMake: 'Toyota',
    assetModel: '8FBE20',
    siteId: '3',
    siteName: 'Site C',
    scheduleType: 'TimeBased',
    intervalDays: 7,
    frequency: 'Weekly',
    importanceLevel: 'Housekeeping',
    lastDoneDate: '2025-12-15',
    nextDueDate: '2026-01-05',
    ragStatus: calculateComplianceRAG('2026-01-05'),
    assignedTeam: 'Workshop',
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'PM-000009',
    name: 'Fire Suppression System Inspection',
    description: 'Monthly fire suppression system check',
    assetId: 'AST-000010',
    assetTypeCode: 'FIRE',
    assetMake: 'Ansul',
    assetModel: 'R-102',
    siteId: '1',
    siteName: 'Site A',
    scheduleType: 'TimeBased',
    intervalDays: 30,
    frequency: 'Monthly',
    importanceLevel: 'Safety Critical',
    tags: ['Fire Suppression', 'FIRE'],
    lastDoneDate: '2025-11-20',
    nextDueDate: '2025-12-20',
    ragStatus: calculateComplianceRAG('2025-12-20'),
    assignedTeam: 'Maintenance',
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'PM-000010',
    name: 'Daily Safety Inspection - Crane CR-005',
    description: 'Daily pre-use safety inspection',
    assetId: 'AST-000003',
    assetTypeCode: 'CR',
    assetMake: 'Liebherr',
    assetModel: 'LTM 1050',
    siteId: '2',
    siteName: 'Site B',
    scheduleType: 'TimeBased',
    intervalDays: 1,
    frequency: 'Daily',
    importanceLevel: 'Safety Critical',
    tags: ['LOLER', 'Daily Check'],
    lastDoneDate: '2025-12-15',
    nextDueDate: '2025-12-16',
    ragStatus: calculateComplianceRAG('2025-12-16'),
    assignedTeam: 'Heavy Plant',
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'PM-000008',
    name: 'Quarterly Service - Generator GEN-012',
    description: 'Quarterly service and inspection',
    assetId: 'AST-000005',
    assetTypeCode: 'GEN',
    assetMake: 'Cummins',
    assetModel: 'QSK60',
    siteId: '1',
    siteName: 'Site A',
    scheduleType: 'TimeBased',
    intervalDays: 90,
    lastDoneDate: '2025-12-22',
    nextDueDate: '2026-02-15',
    ragStatus: calculateComplianceRAG('2026-02-15'),
    assignedTeam: 'Electrical',
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'PM-000009',
    name: 'Monthly PM - Compressor COM-015',
    description: 'Monthly operational check',
    assetId: 'AST-000006',
    assetTypeCode: 'COM',
    assetMake: 'Atlas Copco',
    assetModel: 'GA90',
    siteId: '1',
    siteName: 'Site A',
    scheduleType: 'TimeBased',
    intervalDays: 30,
    lastDoneDate: '2025-12-20',
    nextDueDate: '2026-01-20',
    ragStatus: calculateComplianceRAG('2026-01-20'),
    assignedTeam: 'Workshop',
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'PM-000010',
    name: '6-Monthly Service - MEWP',
    description: 'Semi-annual service',
    assetId: 'AST-000002',
    assetTypeCode: 'MEWP',
    assetMake: 'JLG',
    assetModel: '600S',
    siteId: '1',
    siteName: 'Site A',
    scheduleType: 'TimeBased',
    intervalDays: 180,
    lastDoneDate: '2025-12-25',
    nextDueDate: '2026-03-15',
    ragStatus: calculateComplianceRAG('2026-03-15'),
    assignedTeam: 'Plant Team',
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'PM-000011',
    name: 'Weekly Check - Pump PU-042',
    description: 'Weekly operational check',
    assetId: 'AST-000007',
    assetTypeCode: 'PU',
    assetMake: 'Grundfos',
    assetModel: 'CR 32-4',
    siteId: '3',
    siteName: 'Site C',
    scheduleType: 'TimeBased',
    intervalDays: 7,
    lastDoneDate: '2025-12-10',
    nextDueDate: '2026-01-10',
    ragStatus: calculateComplianceRAG('2026-01-10'),
    assignedTeam: 'Maintenance',
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'PM-000012',
    name: 'Monthly PM - Excavator EX-001',
    description: 'Monthly preventive maintenance',
    assetId: 'AST-000001',
    assetTypeCode: 'EX',
    assetMake: 'Caterpillar',
    assetModel: '320D',
    siteId: '1',
    siteName: 'Site A',
    scheduleType: 'TimeBased',
    intervalDays: 30,
    lastDoneDate: '2026-01-18',
    nextDueDate: '2026-02-17',
    ragStatus: calculateComplianceRAG('2026-02-17'),
    assignedTeam: 'Plant Team',
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'PM-000013',
    name: 'Quarterly Inspection - Crane CR-005',
    description: 'Quarterly safety inspection',
    assetId: 'AST-000003',
    assetTypeCode: 'CR',
    assetMake: 'Liebherr',
    assetModel: 'LTM 1050',
    siteId: '2',
    siteName: 'Site B',
    scheduleType: 'TimeBased',
    intervalDays: 90,
    lastDoneDate: '2025-12-20',
    nextDueDate: '2026-03-20',
    ragStatus: calculateComplianceRAG('2026-03-20'),
    assignedTeam: 'Heavy Plant',
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'PM-000014',
    name: 'Monthly PM - Generator GEN-012',
    description: 'Monthly service check',
    assetId: 'AST-000005',
    assetTypeCode: 'GEN',
    assetMake: 'Cummins',
    assetModel: 'QSK60',
    siteId: '1',
    siteName: 'Site A',
    scheduleType: 'TimeBased',
    intervalDays: 30,
    lastDoneDate: '2025-12-15',
    nextDueDate: '2026-04-10',
    ragStatus: calculateComplianceRAG('2026-04-10'),
    assignedTeam: 'Electrical',
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'PM-000015',
    name: 'Weekly Check - Compressor COM-015',
    description: 'Weekly operational check',
    assetId: 'AST-000006',
    assetTypeCode: 'COM',
    assetMake: 'Atlas Copco',
    assetModel: 'GA90',
    siteId: '1',
    siteName: 'Site A',
    scheduleType: 'TimeBased',
    intervalDays: 7,
    lastDoneDate: '2025-12-16',
    nextDueDate: '2026-05-05',
    ragStatus: calculateComplianceRAG('2026-05-05'),
    assignedTeam: 'Workshop',
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'PM-000016',
    name: 'Monthly PM - Forklift FL-023',
    description: 'Monthly safety inspection',
    assetId: 'AST-000004',
    assetTypeCode: 'FL',
    assetMake: 'Toyota',
    assetModel: '8FBE20',
    siteId: '3',
    siteName: 'Site C',
    scheduleType: 'TimeBased',
    intervalDays: 30,
    lastDoneDate: '2025-12-10',
    nextDueDate: '2026-06-12',
    ragStatus: calculateComplianceRAG('2026-06-12'),
    assignedTeam: 'Workshop',
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'PM-000017',
    name: 'Quarterly Service - MEWP',
    description: 'Quarterly service',
    assetId: 'AST-000002',
    assetTypeCode: 'MEWP',
    assetMake: 'JLG',
    assetModel: '600S',
    siteId: '1',
    siteName: 'Site A',
    scheduleType: 'TimeBased',
    intervalDays: 90,
    lastDoneDate: '2025-12-01',
    nextDueDate: '2026-07-08',
    ragStatus: calculateComplianceRAG('2026-07-08'),
    assignedTeam: 'Plant Team',
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'PM-000018',
    name: 'Monthly PM - Excavator EX-001',
    description: 'Monthly preventive maintenance',
    assetId: 'AST-000001',
    assetTypeCode: 'EX',
    assetMake: 'Caterpillar',
    assetModel: '320D',
    siteId: '1',
    siteName: 'Site A',
    scheduleType: 'TimeBased',
    intervalDays: 30,
    lastDoneDate: '2026-02-17',
    nextDueDate: '2026-08-15',
    ragStatus: calculateComplianceRAG('2026-08-15'),
    assignedTeam: 'Plant Team',
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'PM-000019',
    name: '6-Monthly Service - Generator GEN-012',
    description: 'Semi-annual service',
    assetId: 'AST-000005',
    assetTypeCode: 'GEN',
    assetMake: 'Cummins',
    assetModel: 'QSK60',
    siteId: '1',
    siteName: 'Site A',
    scheduleType: 'TimeBased',
    intervalDays: 180,
    lastDoneDate: '2025-12-22',
    nextDueDate: '2026-09-20',
    ragStatus: calculateComplianceRAG('2026-09-20'),
    assignedTeam: 'Electrical',
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'PM-000020',
    name: 'Quarterly Inspection - Crane CR-005',
    description: 'Quarterly safety inspection',
    assetId: 'AST-000003',
    assetTypeCode: 'CR',
    assetMake: 'Liebherr',
    assetModel: 'LTM 1050',
    siteId: '2',
    siteName: 'Site B',
    scheduleType: 'TimeBased',
    intervalDays: 90,
    lastDoneDate: '2026-03-20',
    nextDueDate: '2026-10-18',
    ragStatus: calculateComplianceRAG('2026-10-18'),
    assignedTeam: 'Heavy Plant',
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
  },
];

const mockPMScheduleHistory: PMScheduleHistory[] = [
  {
    id: '1',
    scheduleId: 'PM-000001',
    completedDate: '2025-11-15',
    completedBy: 'user-1',
    completedByName: 'John Smith',
    notes: 'Monthly PM completed successfully. All checks passed.',
    result: 'Completed',
  },
  {
    id: '2',
    scheduleId: 'PM-000001',
    completedDate: '2025-10-15',
    completedBy: 'user-1',
    completedByName: 'John Smith',
    notes: 'Routine maintenance completed.',
    result: 'Completed',
  },
  {
    id: '3',
    scheduleId: 'PM-000001',
    completedDate: '2025-09-15',
    completedBy: 'user-1',
    completedByName: 'John Smith',
    notes: 'Monthly PM completed. Minor hydraulic leak noted, work order created.',
    result: 'Issues found',
    workOrderId: 'WO-000001',
  },
  {
    id: '4',
    scheduleId: 'PM-000001',
    completedDate: '2025-08-15',
    completedBy: 'user-2',
    completedByName: 'Sarah Johnson',
    notes: 'All checks passed. Equipment in good condition.',
    result: 'Completed',
  },
  {
    id: '5',
    scheduleId: 'PM-000001',
    completedDate: '2025-07-15',
    completedBy: 'user-1',
    completedByName: 'John Smith',
    notes: 'Routine maintenance completed successfully.',
    result: 'Completed',
  },
  {
    id: '6',
    scheduleId: 'PM-000001',
    completedDate: '2025-06-15',
    completedBy: 'user-3',
    completedByName: 'Mike Davis',
    notes: 'PM completed. Track wear noted, scheduled for replacement.',
    result: 'Issues found',
    workOrderId: 'WO-000002',
  },
  {
    id: '7',
    scheduleId: 'PM-000001',
    completedDate: '2025-05-15',
    completedBy: 'user-1',
    completedByName: 'John Smith',
    notes: 'Monthly PM completed. All systems operational.',
    result: 'Completed',
  },
  {
    id: '8',
    scheduleId: 'PM-000001',
    completedDate: '2025-04-15',
    completedBy: 'user-2',
    completedByName: 'Sarah Johnson',
    notes: 'Routine maintenance completed.',
    result: 'Completed',
  },
  {
    id: '9',
    scheduleId: 'PM-000001',
    completedDate: '2025-03-15',
    completedBy: 'user-1',
    completedByName: 'John Smith',
    notes: 'PM completed successfully.',
    result: 'Completed',
  },
  {
    id: '10',
    scheduleId: 'PM-000001',
    completedDate: '2025-02-15',
    completedBy: 'user-3',
    completedByName: 'Mike Davis',
    notes: 'Monthly PM completed. Engine oil changed.',
    result: 'Completed',
  },
  {
    id: '11',
    scheduleId: 'PM-000001',
    completedDate: '2025-01-15',
    completedBy: 'user-1',
    completedByName: 'John Smith',
    notes: 'First PM of the year completed. All checks passed.',
    result: 'Completed',
  },
  {
    id: '12',
    scheduleId: 'PM-000002',
    completedDate: '2025-09-10',
    completedBy: 'user-7',
    completedByName: 'David Lee',
    notes: 'Quarterly service completed. Generator running smoothly.',
    result: 'Completed',
  },
];

export function getPMSchedules(filter?: PMScheduleFilter): PMSchedule[] {
  let filtered = [...mockPMSchedules];
  
  // Ensure frequency is derived if not set
  filtered = filtered.map((pm) => {
    if (!pm.frequency && pm.intervalDays) {
      return { ...pm, frequency: getFrequencyFromIntervalDays(pm.intervalDays) };
    }
    return pm;
  });
  
  // Filter by active status if specified, otherwise show only active
  if (filter?.isActive !== undefined) {
    filtered = filtered.filter((pm) => pm.isActive === filter.isActive);
  } else {
    // Default: show only active schedules
    filtered = filtered.filter((pm) => pm.isActive);
  }

  if (!filter) {
    return filtered;
  }

  // Search filter
  if (filter.search) {
    const searchLower = filter.search.toLowerCase();
    filtered = filtered.filter(
      (pm) =>
        pm.assetId.toLowerCase().includes(searchLower) ||
        pm.assetTypeCode.toLowerCase().includes(searchLower) ||
        pm.name.toLowerCase().includes(searchLower)
    );
  }

  // Site filter (handled in multi-select section below)

  // Asset type filter (would need asset type mapping)
  if (filter.assetTypeId) {
    // Simplified - in real app would map asset type
    filtered = filtered.filter((pm) => {
      // This is a placeholder - would need proper mapping
      return true;
    });
  }

  // Frequency category filter (new: Daily, Weekly, Monthly, etc.)
  if (filter.frequencyCategory) {
    const frequencies = Array.isArray(filter.frequencyCategory) ? filter.frequencyCategory : [filter.frequencyCategory];
    filtered = filtered.filter((pm) => {
      const pmFrequency = pm.frequency || getFrequencyFromIntervalDays(pm.intervalDays);
      return pmFrequency && frequencies.includes(pmFrequency);
    });
  }

  // Importance level filter
  if (filter.importanceLevel) {
    const levels = Array.isArray(filter.importanceLevel) ? filter.importanceLevel : [filter.importanceLevel];
    filtered = filtered.filter((pm) => pm.importanceLevel && levels.includes(pm.importanceLevel));
  }

  // Status filters (OR logic - if multiple are selected, show items matching any)
  const hasStatusFilters = filter.showDueSoon || filter.showOverdue || filter.showCompleted;
  if (hasStatusFilters) {
    filtered = filtered.filter((pm) => {
      const status = getPMScheduleStatus(pm);
      const today = new Date();
      const dueDate = new Date(pm.nextDueDate);
      const in14Days = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
      
      // Check each status filter (OR logic)
      if (filter.showDueSoon && dueDate >= today && dueDate <= in14Days) {
        return true;
      }
      if (filter.showOverdue && status === 'overdue') {
        return true;
      }
      if (filter.showCompleted && status === 'completed') {
        return true;
      }
      
      // If none match, exclude this item
      return false;
    });
  }

  // Multi-select filters
  if (filter.siteId) {
    const siteIds = Array.isArray(filter.siteId) ? filter.siteId : [filter.siteId];
    filtered = filtered.filter((pm) => siteIds.includes(pm.siteId));
  }

  if (filter.frequency) {
    const frequencies = Array.isArray(filter.frequency) ? filter.frequency : [filter.frequency];
    filtered = filtered.filter((pm) => frequencies.includes(pm.scheduleType));
  }

  if (filter.assignedTeam) {
    const teams = Array.isArray(filter.assignedTeam) ? filter.assignedTeam : [filter.assignedTeam];
    filtered = filtered.filter((pm) => pm.assignedTeam && teams.includes(pm.assignedTeam));
  }

  if (filter.isActive !== undefined) {
    filtered = filtered.filter((pm) => pm.isActive === filter.isActive);
  }

  return filtered;
}

export function getPMScheduleById(id: string): PMSchedule | undefined {
  return mockPMSchedules.find((pm) => pm.id === id);
}


interface CreatePMScheduleData {
  name: string;
  description?: string;
  assetId: string;
  siteId: string;
  frequency: string; // 'Daily', 'Weekly', etc.
  startDate: string;
  nextDueDate: string;
  assignedTeam?: string;
  notes?: string;
  isActive: boolean;
}

/**
 * Generate next PM schedule ID (PM-000XXX format)
 */
function generateNextPMScheduleId(): string {
  const existingIds = mockPMSchedules.map((pm) => pm.id);
  const maxNum = existingIds.reduce((max, id) => {
    const match = id.match(/PM-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      return Math.max(max, num);
    }
    return max;
  }, 0);
  
  const nextNum = maxNum + 1;
  return `PM-${String(nextNum).padStart(6, '0')}`;
}

/**
 * Create a new PM schedule
 */
export function createPMSchedule(data: CreatePMScheduleData): string {
  const asset = getAssetById(data.assetId);
  if (!asset) {
    throw new Error(`Asset ${data.assetId} not found`);
  }

  const site = mockSites.find((s) => s.id === data.siteId);
  if (!site) {
    throw new Error(`Site ${data.siteId} not found`);
  }

  // Convert frequency to scheduleType and intervalDays
  const frequencyToDays: Record<string, number> = {
    Daily: 1,
    Weekly: 7,
    Monthly: 30,
    Quarterly: 90,
    '6-Monthly': 180,
    Annually: 365,
  };

  const intervalDays = frequencyToDays[data.frequency];
  if (!intervalDays) {
    throw new Error(`Invalid frequency: ${data.frequency}`);
  }

  const schedule: PMSchedule = {
    id: generateNextPMScheduleId(),
    name: data.name,
    description: data.description,
    assetId: asset.id,
    assetTypeCode: asset.assetTypeCode,
    assetMake: asset.make,
    assetModel: asset.model,
    siteId: site.id,
    siteName: site.name,
    scheduleType: 'TimeBased',
    intervalDays,
    nextDueDate: data.nextDueDate,
    ragStatus: calculateComplianceRAG(data.nextDueDate),
    assignedTeam: data.assignedTeam,
    isActive: data.isActive,
    createdAt: new Date().toISOString(),
  };

  mockPMSchedules.push(schedule);
  return schedule.id;
}

export function updatePMSchedule(id: string, updates: Partial<PMSchedule>): void {
  const index = mockPMSchedules.findIndex((pm) => pm.id === id);
  if (index >= 0) {
    mockPMSchedules[index] = {
      ...mockPMSchedules[index],
      ...updates,
    };
    // Persist to localStorage
    localStorage.setItem('pm-schedules', JSON.stringify(mockPMSchedules));
  }
}

// Mock Shift Changeover Events
const mockShiftChangeovers: ShiftChangeoverEvent[] = [
  {
    id: 'SHIFT-000001',
    siteId: '1',
    siteName: 'Site A',
    startDateTime: '2025-12-20T06:00:00Z',
    endDateTime: '2025-12-20T06:30:00Z',
    title: 'Shift Changeover',
    shiftType: 'NightsToDays',
    notes: 'Night shift to Day shift handover',
    color: '#3B82F6',
  },
  {
    id: 'SHIFT-000002',
    siteId: '1',
    siteName: 'Site A',
    startDateTime: '2025-12-20T18:00:00Z',
    endDateTime: '2025-12-20T18:30:00Z',
    title: 'Shift Changeover',
    shiftType: 'DaysToNights',
    notes: 'Day shift to Night shift handover',
    color: '#8B5CF6',
  },
  {
    id: 'SHIFT-000003',
    siteId: '2',
    siteName: 'Site B',
    startDateTime: '2026-01-15T06:00:00Z',
    endDateTime: '2026-01-15T06:30:00Z',
    title: 'Shift Changeover',
    shiftType: 'NightsToDays',
    notes: 'Night shift to Day shift handover',
    color: '#3B82F6',
  },
  {
    id: 'SHIFT-000004',
    siteId: '1',
    siteName: 'Site A',
    startDateTime: '2026-02-10T18:00:00Z',
    endDateTime: '2026-02-10T18:30:00Z',
    title: 'Shift Changeover',
    shiftType: 'DaysToNights',
    notes: 'Day shift to Night shift handover',
    color: '#8B5CF6',
  },
  {
    id: 'SHIFT-000005',
    siteId: '3',
    siteName: 'Site C',
    startDateTime: '2026-03-05T12:00:00Z',
    endDateTime: '2026-03-05T12:30:00Z',
    title: 'Shift Changeover',
    shiftType: 'AMHandover',
    notes: 'AM shift handover',
    color: '#10B981',
  },
  {
    id: 'SHIFT-000006',
    siteId: '1',
    siteName: 'Site A',
    startDateTime: '2026-04-20T06:00:00Z',
    endDateTime: '2026-04-20T06:30:00Z',
    title: 'Shift Changeover',
    shiftType: 'NightsToDays',
    notes: 'Night shift to Day shift handover',
    color: '#3B82F6',
  },
  {
    id: 'SHIFT-000007',
    siteId: '2',
    siteName: 'Site B',
    startDateTime: '2026-05-15T18:00:00Z',
    endDateTime: '2026-05-15T18:30:00Z',
    title: 'Shift Changeover',
    shiftType: 'DaysToNights',
    notes: 'Day shift to Night shift handover',
    color: '#8B5CF6',
  },
  {
    id: 'SHIFT-000008',
    siteId: '1',
    siteName: 'Site A',
    startDateTime: '2026-06-10T06:00:00Z',
    endDateTime: '2026-06-10T06:30:00Z',
    title: 'Shift Changeover',
    shiftType: 'NightsToDays',
    notes: 'Night shift to Day shift handover',
    color: '#3B82F6',
  },
  {
    id: 'SHIFT-000009',
    siteId: '3',
    siteName: 'Site C',
    startDateTime: '2026-07-25T12:00:00Z',
    endDateTime: '2026-07-25T12:30:00Z',
    title: 'Shift Changeover',
    shiftType: 'PMHandover',
    notes: 'PM shift handover',
    color: '#F59E0B',
  },
  {
    id: 'SHIFT-000010',
    siteId: '1',
    siteName: 'Site A',
    startDateTime: '2026-08-15T18:00:00Z',
    endDateTime: '2026-08-15T18:30:00Z',
    title: 'Shift Changeover',
    shiftType: 'DaysToNights',
    notes: 'Day shift to Night shift handover',
    color: '#8B5CF6',
  },
  {
    id: 'SHIFT-000011',
    siteId: '2',
    siteName: 'Site B',
    startDateTime: '2026-09-20T06:00:00Z',
    endDateTime: '2026-09-20T06:30:00Z',
    title: 'Shift Changeover',
    shiftType: 'NightsToDays',
    notes: 'Night shift to Day shift handover',
    color: '#3B82F6',
  },
  {
    id: 'SHIFT-000012',
    siteId: '1',
    siteName: 'Site A',
    startDateTime: '2026-10-10T18:00:00Z',
    endDateTime: '2026-10-10T18:30:00Z',
    title: 'Shift Changeover',
    shiftType: 'DaysToNights',
    notes: 'Day shift to Night shift handover',
    color: '#8B5CF6',
  },
];

/**
 * Get shift changeover events for a date range
 */
export function getShiftChangeovers(filter?: { siteId?: string | string[]; shiftType?: string | string[] }): ShiftChangeoverEvent[] {
  let filtered = [...mockShiftChangeovers];

  if (!filter) {
    return filtered;
  }

  // Site filter
  if (filter.siteId) {
    const siteIds = Array.isArray(filter.siteId) ? filter.siteId : [filter.siteId];
    filtered = filtered.filter((shift) => siteIds.includes(shift.siteId));
  }

  // Shift type filter
  if (filter.shiftType) {
    const shiftTypes = Array.isArray(filter.shiftType) ? filter.shiftType : [filter.shiftType];
    filtered = filtered.filter((shift) => shiftTypes.includes(shift.shiftType));
  }

  return filtered;
}

/**
 * Get shift changeover by ID
 */
export function getShiftChangeoverById(id: string): ShiftChangeoverEvent | undefined {
  return mockShiftChangeovers.find((shift) => shift.id === id);
}

// Mock PM Schedule Documents
const mockPMScheduleDocuments: PMScheduleDocument[] = [
  {
    id: 'doc-1',
    scheduleId: 'PM-000001',
    filename: 'Caterpillar_320D_Service_Manual.pdf',
    type: 'Manual',
    uri: '/documents/cat-320d-manual.pdf',
    uploadedAt: '2025-01-15T10:00:00Z',
    uploadedBy: 'user-2',
    uploadedByName: 'Sarah Johnson',
    tags: ['OEM', 'Service Manual'],
  },
  {
    id: 'doc-2',
    scheduleId: 'PM-000001',
    filename: 'PM_Procedure_RAMS.pdf',
    type: 'Procedure',
    uri: '/documents/pm-procedure-rams.pdf',
    uploadedAt: '2025-02-01T14:30:00Z',
    uploadedBy: 'user-1',
    uploadedByName: 'John Smith',
    tags: ['RAMS', 'Method Statement'],
  },
  {
    id: 'doc-3',
    scheduleId: 'PM-000001',
    filename: 'Hydraulic_System_Photo.jpg',
    type: 'Photo',
    uri: '/documents/hydraulic-photo.jpg',
    uploadedAt: '2025-11-15T09:00:00Z',
    uploadedBy: 'user-1',
    uploadedByName: 'John Smith',
  },
  {
    id: 'doc-4',
    scheduleId: 'PM-000001',
    filename: 'PM_Report_Nov_2025.pdf',
    type: 'Report',
    uri: '/documents/pm-report-nov-2025.pdf',
    uploadedAt: '2025-11-20T16:00:00Z',
    uploadedBy: 'user-1',
    uploadedByName: 'John Smith',
  },
];

// Mock PM Schedule Activity Log
const mockPMScheduleActivity: PMScheduleActivity[] = [
  {
    id: 'act-1',
    scheduleId: 'PM-000001',
    timestamp: '2025-01-01T00:00:00Z',
    userId: 'user-2',
    userName: 'Sarah Johnson',
    action: 'schedule_created',
    details: 'PM Schedule created',
  },
  {
    id: 'act-2',
    scheduleId: 'PM-000001',
    timestamp: '2025-01-15T10:00:00Z',
    userId: 'user-2',
    userName: 'Sarah Johnson',
    action: 'document_uploaded',
    details: 'Uploaded: Caterpillar_320D_Service_Manual.pdf',
  },
  {
    id: 'act-3',
    scheduleId: 'PM-000001',
    timestamp: '2025-02-01T14:30:00Z',
    userId: 'user-1',
    userName: 'John Smith',
    action: 'document_uploaded',
    details: 'Uploaded: PM_Procedure_RAMS.pdf',
  },
  {
    id: 'act-4',
    scheduleId: 'PM-000001',
    timestamp: '2025-02-10T09:00:00Z',
    userId: 'user-1',
    userName: 'John Smith',
    action: 'checklist_edited',
    details: 'Updated checklist items',
  },
  {
    id: 'act-5',
    scheduleId: 'PM-000001',
    timestamp: '2025-03-15T08:00:00Z',
    userId: 'user-1',
    userName: 'John Smith',
    action: 'pm_task_generated',
    details: 'Generated PM Task PMT-000001',
  },
  {
    id: 'act-6',
    scheduleId: 'PM-000001',
    timestamp: '2025-03-15T10:30:00Z',
    userId: 'user-1',
    userName: 'John Smith',
    action: 'marked_completed',
    details: 'PM Task completed successfully',
  },
  {
    id: 'act-7',
    scheduleId: 'PM-000001',
    timestamp: '2025-04-15T08:00:00Z',
    userId: 'user-1',
    userName: 'John Smith',
    action: 'pm_task_generated',
    details: 'Generated PM Task PMT-000002',
  },
  {
    id: 'act-8',
    scheduleId: 'PM-000001',
    timestamp: '2025-04-15T11:00:00Z',
    userId: 'user-1',
    userName: 'John Smith',
    action: 'marked_completed',
    details: 'PM Task completed',
  },
  {
    id: 'act-9',
    scheduleId: 'PM-000001',
    timestamp: '2025-05-20T13:00:00Z',
    userId: 'user-2',
    userName: 'Sarah Johnson',
    action: 'rescheduled',
    details: 'Next due date changed to 2025-06-20',
  },
  {
    id: 'act-10',
    scheduleId: 'PM-000001',
    timestamp: '2025-06-15T08:00:00Z',
    userId: 'user-3',
    userName: 'Mike Davis',
    action: 'pm_task_generated',
    details: 'Generated PM Task PMT-000003',
  },
  {
    id: 'act-11',
    scheduleId: 'PM-000001',
    timestamp: '2025-06-15T14:00:00Z',
    userId: 'user-3',
    userName: 'Mike Davis',
    action: 'marked_completed',
    details: 'PM Task completed. Track wear noted.',
  },
  {
    id: 'act-12',
    scheduleId: 'PM-000001',
    timestamp: '2025-11-15T09:00:00Z',
    userId: 'user-1',
    userName: 'John Smith',
    action: 'document_uploaded',
    details: 'Uploaded: Hydraulic_System_Photo.jpg',
  },
  {
    id: 'act-13',
    scheduleId: 'PM-000001',
    timestamp: '2025-11-20T16:00:00Z',
    userId: 'user-1',
    userName: 'John Smith',
    action: 'document_uploaded',
    details: 'Uploaded: PM_Report_Nov_2025.pdf',
  },
];

export function getPMScheduleDocuments(scheduleId: string): PMScheduleDocument[] {
  return mockPMScheduleDocuments.filter((doc) => doc.scheduleId === scheduleId);
}

export function getPMScheduleActivity(scheduleId: string): PMScheduleActivity[] {
  // Merge mock data with localStorage entries
  const stored = JSON.parse(localStorage.getItem('pm-schedule-activity') || '[]');
  const allActivity = [...mockPMScheduleActivity, ...stored];
  return allActivity
    .filter((act) => act.scheduleId === scheduleId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function getPMScheduleHistory(scheduleId: string): PMScheduleHistory[] {
  // Merge mock data with localStorage entries
  const stored = JSON.parse(localStorage.getItem('pm-schedule-history') || '[]');
  const allHistory = [...mockPMScheduleHistory, ...stored];
  return allHistory
    .filter((history) => history.scheduleId === scheduleId)
    .sort((a, b) => new Date(b.completedDate).getTime() - new Date(a.completedDate).getTime());
}

/**
 * Create a new shift changeover event
 */
export function createShiftChangeover(data: Omit<ShiftChangeoverEvent, 'id'>): string {
  const id = `SHIFT-${String(mockShiftChangeovers.length + 1).padStart(3, '0')}`;
  const event: ShiftChangeoverEvent = {
    id,
    ...data,
  };
  mockShiftChangeovers.push(event);
  return id;
}
