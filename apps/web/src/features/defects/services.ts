import type { Defect, DefectUpdate, DefectFilter } from './types';
import { mockSites } from '../assets/services';

const mockDefects: Defect[] = [
  {
    id: 'DEF-000001',
    description: 'Hydraulic leak detected on main cylinder',
    severity: 'High',
    status: 'Open',
    category: 'Hydraulic',
    assetId: 'AST-000001',
    assetTypeCode: 'EX',
    assetMake: 'Caterpillar',
    assetModel: '320D',
    siteId: '1',
    siteName: 'Site A',
    location: 'Yard 1',
    reportedById: 'user-2',
    reportedByName: 'Sarah Johnson',
    linkedInspectionId: 'INS-000002',
    createdAt: '2025-12-13T15:30:00Z',
    hasPhoto: true,
  },
  {
    id: 'DEF-000002',
    description: 'Brake system failure - safety critical',
    severity: 'Critical',
    status: 'Assigned',
    category: 'Safety',
    assetId: 'AST-000004',
    assetTypeCode: 'FL',
    assetMake: 'Toyota',
    assetModel: '8FBE20',
    siteId: '3',
    siteName: 'Site C',
    location: 'Warehouse',
    reportedById: 'user-4',
    reportedByName: 'Emma Wilson',
    assignedToId: 'user-1',
    assignedToName: 'John Smith',
    linkedInspectionId: 'INS-000005',
    linkedWorkOrderId: 'WO-000003',
    createdAt: '2025-12-12T12:20:00Z',
    hasPhoto: true,
  },
  {
    id: 'DEF-000003',
    description: 'Engine overheating during operation',
    severity: 'High',
    status: 'WaitingParts',
    category: 'Mechanical',
    assetId: 'AST-000006',
    assetTypeCode: 'COM',
    assetMake: 'Atlas Copco',
    assetModel: 'GA90',
    siteId: '1',
    siteName: 'Site A',
    location: 'Workshop',
    reportedById: 'user-8',
    reportedByName: 'Rachel Green',
    assignedToId: 'user-1',
    assignedToName: 'John Smith',
    createdAt: '2025-12-11T10:00:00Z',
    hasPhoto: false,
  },
  {
    id: 'DEF-000004',
    description: 'Minor electrical fault in control panel',
    severity: 'Low',
    status: 'InProgress',
    category: 'Electrical',
    assetId: 'AST-000005',
    assetTypeCode: 'GEN',
    assetMake: 'Cummins',
    assetModel: 'QSK60',
    siteId: '1',
    siteName: 'Site A',
    location: 'Power Station',
    reportedById: 'user-7',
    reportedByName: 'David Lee',
    assignedToId: 'user-7',
    assignedToName: 'David Lee',
    createdAt: '2025-12-10T14:00:00Z',
    hasPhoto: false,
  },
  {
    id: 'DEF-000005',
    description: 'Worn tire tread below minimum',
    severity: 'Medium',
    status: 'Open',
    category: 'Mechanical',
    assetId: 'AST-000002',
    assetTypeCode: 'MEWP',
    assetMake: 'JLG',
    assetModel: '600S',
    siteId: '1',
    siteName: 'Site A',
    reportedById: 'user-1',
    reportedByName: 'John Smith',
    createdAt: '2025-12-14T09:00:00Z',
    hasPhoto: true,
  },
  {
    id: 'DEF-000006',
    description: 'Safety guard missing on rotating parts',
    severity: 'Critical',
    status: 'Open',
    category: 'Safety',
    assetId: 'AST-000007',
    assetTypeCode: 'PU',
    assetMake: 'Grundfos',
    assetModel: 'CR 32-4',
    siteId: '3',
    siteName: 'Site C',
    location: 'Pump House',
    reportedById: 'user-6',
    reportedByName: 'Lisa Anderson',
    createdAt: '2025-12-14T11:00:00Z',
    hasPhoto: false,
  },
  {
    id: 'DEF-000007',
    description: 'Cracked windshield on operator cab',
    severity: 'Medium',
    status: 'InProgress',
    category: 'Safety',
    assetId: 'AST-000008',
    assetTypeCode: 'EX',
    assetMake: 'JCB',
    assetModel: '3CX',
    siteId: '2',
    siteName: 'Site B',
    location: 'Yard 2',
    reportedById: 'user-3',
    reportedByName: 'Mike Davis',
    assignedToId: 'user-3',
    assignedToName: 'Mike Davis',
    createdAt: '2025-12-13T08:00:00Z',
    targetRectificationDate: '2025-12-20T17:00:00Z',
    hasPhoto: true,
  },
  {
    id: 'DEF-000008',
    description: 'Battery not holding charge',
    severity: 'Low',
    status: 'Open',
    category: 'Electrical',
    assetId: 'AST-000009',
    assetTypeCode: 'FL',
    assetMake: 'Crown',
    assetModel: 'WP3000',
    siteId: '1',
    siteName: 'Site A',
    location: 'Warehouse',
    reportedById: 'user-1',
    reportedByName: 'John Smith',
    createdAt: '2025-12-15T10:00:00Z',
    hasPhoto: false,
  },
  {
    id: 'DEF-000009',
    description: 'Fuel injector failure - engine misfiring',
    severity: 'High',
    status: 'WaitingParts',
    category: 'Mechanical',
    assetId: 'AST-000010',
    assetTypeCode: 'GEN',
    assetMake: 'Perkins',
    assetModel: '1104D',
    siteId: '3',
    siteName: 'Site C',
    location: 'Power Station',
    reportedById: 'user-6',
    reportedByName: 'Lisa Anderson',
    assignedToId: 'user-7',
    assignedToName: 'David Lee',
    createdAt: '2025-12-12T14:00:00Z',
    targetRectificationDate: '2025-12-18T17:00:00Z',
    hasPhoto: true,
  },
  {
    id: 'DEF-000010',
    description: 'Loose hydraulic fitting - fluid leak',
    severity: 'Medium',
    status: 'Closed',
    category: 'Hydraulic',
    assetId: 'AST-000011',
    assetTypeCode: 'MEWP',
    assetMake: 'Genie',
    assetModel: 'S-85',
    siteId: '2',
    siteName: 'Site B',
    location: 'Construction Area',
    reportedById: 'user-7',
    reportedByName: 'David Lee',
    assignedToId: 'user-7',
    assignedToName: 'David Lee',
    createdAt: '2025-12-08T09:00:00Z',
    closedAt: '2025-12-10T15:00:00Z',
    hasPhoto: true,
  },
  {
    id: 'DEF-000011',
    description: 'Safety interlock bypassed - CRITICAL',
    severity: 'Critical',
    status: 'Open',
    category: 'Safety',
    assetId: 'AST-000012',
    assetTypeCode: 'CR',
    assetMake: 'Terex',
    assetModel: 'AC 350',
    siteId: '1',
    siteName: 'Site A',
    location: 'Crane Pad',
    reportedById: 'user-2',
    reportedByName: 'Sarah Johnson',
    unsafeDoNotUse: true,
    createdAt: '2025-12-14T16:00:00Z',
    targetRectificationDate: '2025-12-15T12:00:00Z',
    hasPhoto: true,
  },
  {
    id: 'DEF-000012',
    description: 'Worn brake pads - below minimum thickness',
    severity: 'High',
    status: 'Assigned',
    category: 'Safety',
    assetId: 'AST-000013',
    assetTypeCode: 'COM',
    assetMake: 'Ingersoll Rand',
    assetModel: 'SSR EP200',
    siteId: '3',
    siteName: 'Site C',
    location: 'Workshop',
    reportedById: 'user-4',
    reportedByName: 'Emma Wilson',
    assignedToId: 'user-1',
    assignedToName: 'John Smith',
    createdAt: '2025-12-13T11:00:00Z',
    targetRectificationDate: '2025-12-19T17:00:00Z',
    hasPhoto: false,
  },
  {
    id: 'DEF-000013',
    description: 'Coolant leak from radiator',
    severity: 'Medium',
    status: 'InProgress',
    category: 'Mechanical',
    assetId: 'AST-000014',
    assetTypeCode: 'PU',
    assetMake: 'Flygt',
    assetModel: 'N3067',
    siteId: '1',
    siteName: 'Site A',
    location: 'Pump Station',
    reportedById: 'user-1',
    reportedByName: 'John Smith',
    assignedToId: 'user-1',
    assignedToName: 'John Smith',
    createdAt: '2025-12-12T13:00:00Z',
    hasPhoto: true,
  },
  {
    id: 'DEF-000014',
    description: 'Faulty pressure sensor reading incorrectly',
    severity: 'Low',
    status: 'Open',
    category: 'Electrical',
    assetId: 'AST-000015',
    assetTypeCode: 'EX',
    assetMake: 'Volvo',
    assetModel: 'EC210',
    siteId: '2',
    siteName: 'Site B',
    location: 'Yard 1',
    reportedById: 'user-3',
    reportedByName: 'Mike Davis',
    createdAt: '2025-12-15T09:00:00Z',
    hasPhoto: false,
  },
  {
    id: 'DEF-000015',
    description: 'Structural crack in boom - UNSAFE TO OPERATE',
    severity: 'Critical',
    status: 'Open',
    category: 'Structural',
    assetId: 'AST-000016',
    assetTypeCode: 'CR',
    assetMake: 'Grove',
    assetModel: 'GMK3055',
    siteId: '3',
    siteName: 'Site C',
    location: 'Crane Pad',
    reportedById: 'user-7',
    reportedByName: 'David Lee',
    unsafeDoNotUse: true,
    createdAt: '2025-12-11T10:00:00Z',
    targetRectificationDate: '2025-12-16T17:00:00Z',
    hasPhoto: true,
  },
  {
    id: 'DEF-000016',
    description: 'Worn drive chain - excessive slack',
    severity: 'Medium',
    status: 'Closed',
    category: 'Mechanical',
    assetId: 'AST-000017',
    assetTypeCode: 'MEWP',
    assetMake: 'Skyjack',
    assetModel: 'SJ63',
    siteId: '1',
    siteName: 'Site A',
    location: 'Construction Area',
    reportedById: 'user-2',
    reportedByName: 'Sarah Johnson',
    assignedToId: 'user-2',
    assignedToName: 'Sarah Johnson',
    createdAt: '2025-12-09T08:00:00Z',
    closedAt: '2025-12-11T14:00:00Z',
    hasPhoto: false,
  },
  {
    id: 'DEF-000017',
    description: 'Faulty emergency stop button',
    severity: 'High',
    status: 'Assigned',
    category: 'Safety',
    assetId: 'AST-000018',
    assetTypeCode: 'FL',
    assetMake: 'Hyster',
    assetModel: 'H40-60XM',
    siteId: '2',
    siteName: 'Site B',
    location: 'Warehouse',
    reportedById: 'user-5',
    reportedByName: 'Tom Brown',
    assignedToId: 'user-4',
    assignedToName: 'Emma Wilson',
    createdAt: '2025-12-14T07:00:00Z',
    targetRectificationDate: '2025-12-17T17:00:00Z',
    hasPhoto: true,
  },
  {
    id: 'DEF-000018',
    description: 'Oil filter clogged - reduced engine performance',
    severity: 'Low',
    status: 'InProgress',
    category: 'Mechanical',
    assetId: 'AST-000019',
    assetTypeCode: 'GEN',
    assetMake: 'Caterpillar',
    assetModel: 'C15',
    siteId: '1',
    siteName: 'Site A',
    location: 'Power Station',
    reportedById: 'user-1',
    reportedByName: 'John Smith',
    assignedToId: 'user-1',
    assignedToName: 'John Smith',
    createdAt: '2025-12-13T15:00:00Z',
    hasPhoto: false,
  },
  {
    id: 'DEF-000019',
    description: 'Compressor belt slipping - needs replacement',
    severity: 'Medium',
    status: 'Open',
    category: 'Mechanical',
    assetId: 'AST-000020',
    assetTypeCode: 'COM',
    assetMake: 'Kaeser',
    assetModel: 'SM 11',
    siteId: '3',
    siteName: 'Site C',
    location: 'Workshop',
    reportedById: 'user-6',
    reportedByName: 'Lisa Anderson',
    createdAt: '2025-12-15T11:00:00Z',
    hasPhoto: false,
  },
  {
    id: 'DEF-000020',
    description: 'Pump impeller damaged - reduced flow rate',
    severity: 'High',
    status: 'WaitingParts',
    category: 'Mechanical',
    assetId: 'AST-000021',
    assetTypeCode: 'PU',
    assetMake: 'Ebara',
    assetModel: 'CDX 200',
    siteId: '2',
    siteName: 'Site B',
    location: 'Pump House',
    reportedById: 'user-3',
    reportedByName: 'Mike Davis',
    assignedToId: 'user-3',
    assignedToName: 'Mike Davis',
    createdAt: '2025-12-10T12:00:00Z',
    targetRectificationDate: '2025-12-22T17:00:00Z',
    hasPhoto: true,
  },
  {
    id: 'DEF-000021',
    description: 'Faulty alternator - battery not charging',
    severity: 'Medium',
    status: 'InProgress',
    category: 'Electrical',
    assetId: 'AST-000022',
    assetTypeCode: 'EX',
    assetMake: 'Komatsu',
    assetModel: 'PC200',
    siteId: '1',
    siteName: 'Site A',
    location: 'Yard 1',
    reportedById: 'user-2',
    reportedByName: 'Sarah Johnson',
    assignedToId: 'user-2',
    assignedToName: 'Sarah Johnson',
    createdAt: '2025-12-12T10:00:00Z',
    hasPhoto: false,
  },
  {
    id: 'DEF-000022',
    description: 'Loose guard rail on platform',
    severity: 'High',
    status: 'Open',
    category: 'Safety',
    assetId: 'AST-000023',
    assetTypeCode: 'MEWP',
    assetMake: 'Snorkel',
    assetModel: 'TB60',
    siteId: '3',
    siteName: 'Site C',
    location: 'Construction Area',
    reportedById: 'user-4',
    reportedByName: 'Emma Wilson',
    unsafeDoNotUse: true,
    createdAt: '2025-12-14T13:00:00Z',
    targetRectificationDate: '2025-12-18T17:00:00Z',
    hasPhoto: true,
  },
  {
    id: 'DEF-000023',
    description: 'Worn mast chain - needs replacement',
    severity: 'Medium',
    status: 'Assigned',
    category: 'Mechanical',
    assetId: 'AST-000024',
    assetTypeCode: 'FL',
    assetMake: 'Linde',
    assetModel: 'T20',
    siteId: '2',
    siteName: 'Site B',
    location: 'Warehouse',
    reportedById: 'user-5',
    reportedByName: 'Tom Brown',
    assignedToId: 'user-5',
    assignedToName: 'Tom Brown',
    createdAt: '2025-12-13T16:00:00Z',
    hasPhoto: false,
  },
  {
    id: 'DEF-000024',
    description: 'Generator voltage regulator failure',
    severity: 'High',
    status: 'Open',
    category: 'Electrical',
    assetId: 'AST-000025',
    assetTypeCode: 'GEN',
    assetMake: 'Kohler',
    assetModel: '20RZ',
    siteId: '1',
    siteName: 'Site A',
    location: 'Power Station',
    reportedById: 'user-1',
    reportedByName: 'John Smith',
    createdAt: '2025-12-15T08:00:00Z',
    targetRectificationDate: '2025-12-21T17:00:00Z',
    hasPhoto: false,
  },
  {
    id: 'DEF-000025',
    description: 'Compressor air filter blocked',
    severity: 'Low',
    status: 'Closed',
    category: 'Mechanical',
    assetId: 'AST-000026',
    assetTypeCode: 'COM',
    assetMake: 'Atlas Copco',
    assetModel: 'GA37',
    siteId: '3',
    siteName: 'Site C',
    location: 'Workshop',
    reportedById: 'user-6',
    reportedByName: 'Lisa Anderson',
    assignedToId: 'user-6',
    assignedToName: 'Lisa Anderson',
    createdAt: '2025-12-07T09:00:00Z',
    closedAt: '2025-12-08T11:00:00Z',
    hasPhoto: false,
  },
  {
    id: 'DEF-000026',
    description: 'Pump seal failure - water ingress',
    severity: 'Medium',
    status: 'InProgress',
    category: 'Mechanical',
    assetId: 'AST-000027',
    assetTypeCode: 'PU',
    assetMake: 'Grundfos',
    assetModel: 'CR 64-2',
    siteId: '2',
    siteName: 'Site B',
    location: 'Pump House',
    reportedById: 'user-7',
    reportedByName: 'David Lee',
    assignedToId: 'user-7',
    assignedToName: 'David Lee',
    createdAt: '2025-12-11T14:00:00Z',
    hasPhoto: true,
  },
];

const mockDefectUpdates: DefectUpdate[] = [
  {
    id: '1',
    defectId: 'DEF-000001',
    userId: 'user-1',
    userName: 'John Smith',
    note: 'Inspected the hydraulic system. Leak confirmed at main cylinder seal.',
    createdAt: '2025-12-13T16:00:00Z',
  },
  {
    id: '2',
    defectId: 'DEF-000002',
    userId: 'user-1',
    userName: 'John Smith',
    note: 'Assigned to repair team. Parts ordered.',
    createdAt: '2025-12-12T13:00:00Z',
  },
  {
    id: '3',
    defectId: 'DEF-000003',
    userId: 'user-1',
    userName: 'John Smith',
    note: 'Waiting for replacement thermostat to arrive.',
    createdAt: '2025-12-11T11:00:00Z',
  },
];

export function getDefects(filter?: DefectFilter): Defect[] {
  let filtered = [...mockDefects];

  if (!filter) {
    return filtered;
  }

  // Search filter
  if (filter.search) {
    const searchLower = filter.search.toLowerCase();
    filtered = filtered.filter(
      (def) =>
        def.id.toLowerCase().includes(searchLower) ||
        def.assetId.toLowerCase().includes(searchLower) ||
        def.description.toLowerCase().includes(searchLower) ||
        def.reportedByName.toLowerCase().includes(searchLower)
    );
  }

  // Status filter
  if (filter.status) {
    filtered = filtered.filter((def) => def.status === filter.status);
  }

  // Severity filter
  if (filter.severity) {
    filtered = filtered.filter((def) => def.severity === filter.severity);
  }

  // Category filter
  if (filter.category) {
    filtered = filtered.filter((def) => def.category === filter.category);
  }

  // Site filter
  if (filter.siteId) {
    filtered = filtered.filter((def) => def.siteId === filter.siteId);
  }

  // Quick filters
  if (filter.showOpen) {
    filtered = filtered.filter((def) => def.status === 'Open');
  }

  if (filter.showCritical) {
    filtered = filtered.filter((def) => def.severity === 'Critical' && def.status !== 'Closed' && def.status !== 'Resolved');
  }

  if (filter.showWaitingParts) {
    filtered = filtered.filter((def) => def.status === 'WaitingParts');
  }

  if (filter.showUnassigned) {
    filtered = filtered.filter((def) => !def.assignedToId);
  }

  if (filter.showFromInspection) {
    filtered = filtered.filter((def) => !!def.linkedInspectionId);
  }

  return filtered;
}

export function getDefectById(id: string): Defect | undefined {
  return mockDefects.find((def) => def.id === id);
}

export function getDefectUpdates(defectId: string): DefectUpdate[] {
  return mockDefectUpdates.filter((update) => update.defectId === defectId);
}

export function getDefectAlerts(): Defect[] {
  return mockDefects.filter((def) => {
    const isCriticalOpen = def.severity === 'Critical' && def.status !== 'Closed' && def.status !== 'Resolved';
    const hasNoLinkedWO = !def.linkedWorkOrderId && def.status !== 'Closed' && def.status !== 'Resolved';
    return isCriticalOpen || hasNoLinkedWO;
  });
}

function generateNextDefectCode(): string {
  const existingIds = mockDefects.map((d) => d.defectCode);
  const maxNum = existingIds.reduce((max, code) => {
    const match = code.match(/DEF-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      return num > max ? num : max;
    }
    return max;
  }, 0);
  return `DEF-${String(maxNum + 1).padStart(6, '0')}`;
}

interface CreateDefectData {
  title: string;
  description?: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  severityModel: 'LMH' | 'MMC';
  unsafeDoNotUse: boolean;
  assetId?: string;
  siteId?: string;
  assignedToId?: string;
  targetRectificationDate?: string;
  status?: DefectStatus;
  pmScheduleId?: string;
  pmTaskId?: string;
  pmChecklistItemId?: string;
  attachments?: Array<{ filename: string; uri: string; type: 'photo' | 'document' | 'video' }>;
  createdBy: string;
  createdByName: string;
}

export function createDefect(data: CreateDefectData): Defect {
  const defectCode = generateNextDefectCode();
  const now = new Date().toISOString();
  
  const defect: Defect = {
    id: `def-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    defectCode,
    title: data.title,
    description: data.description,
    severity: data.severity,
    severityModel: data.severityModel,
    unsafeDoNotUse: data.unsafeDoNotUse,
    status: data.status || 'Draft',
    assetId: data.assetId,
    siteId: data.siteId,
    siteName: data.siteId ? mockSites.find((s) => s.id === data.siteId)?.name : undefined,
    assignedToId: data.assignedToId,
    targetRectificationDate: data.targetRectificationDate,
    complianceTags: [],
    actions: [],
    attachments: data.attachments?.map((att, idx) => ({
      id: `att-${idx}`,
      type: att.type,
      filename: att.filename,
      uri: att.uri,
      createdAt: now,
    })) || [],
    beforeAfterRequired: false,
    reopenedCount: 0,
    history: [],
    comments: [],
    createdAt: now,
    createdBy: data.createdBy,
    createdByName: data.createdByName,
    updatedAt: now,
    updatedBy: data.createdBy,
    updatedByName: data.createdByName,
    // PM Task linkage (store in metadata/history for now)
    inspectionId: data.pmScheduleId ? `pm-schedule-${data.pmScheduleId}` : undefined,
  };
  
  mockDefects.push(defect);
  return defect;
}
