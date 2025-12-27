import type { FitterHandover, MasterHandover, AuditLogEntry } from './types';

// Mock users for handovers
const mockFitters = [
  { id: 'user-1', name: 'John Smith' },
  { id: 'user-2', name: 'Sarah Johnson' },
  { id: 'user-3', name: 'Mike Davis' },
  { id: 'user-4', name: 'Emma Wilson' },
  { id: 'user-5', name: 'Tom Brown' },
  { id: 'user-6', name: 'Lisa Anderson' },
];

const mockSupervisors = [
  { id: 'super-1', name: 'David Lee' },
  { id: 'super-2', name: 'Rachel Green' },
  { id: 'super-3', name: 'Mark Roache' },
];

const mockSites = [
  { id: '1', name: 'Site A' },
  { id: '2', name: 'Site B' },
  { id: '3', name: 'Site C' },
];

const locations = ['Yard 1', 'Yard 2', 'Workshop', 'Field 1', 'Field 2', 'Storage', 'Office'];

const occupations = ['Fitter', 'Welder', 'Chargehand', 'Operator', 'Technician', 'Foreman'];

const materials = [
  'Hydraulic Oil',
  'Engine Oil',
  'Grease',
  'Filters',
  'Belts',
  'Hoses',
  'Bolts',
  'Welding Rods',
  'Safety Equipment',
];

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomElements<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function randomDate(daysAgo: number = 30): string {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  return date.toISOString().split('T')[0];
}

function generateHandoverId(index: number): string {
  return `HND-${String(index).padStart(6, '0')}`;
}

function generateMasterId(index: number): string {
  return `MHD-${String(index).padStart(6, '0')}`;
}

// Create 5 specific handovers as per requirements
const specificHandovers: FitterHandover[] = [
  // Handover #1 — Draft (Fitter in Progress)
  {
    id: 'HND-000001',
    siteId: '1',
    siteName: 'Site A',
    date: '2025-12-25',
    shiftType: 'Days',
    shiftPattern: '5-2',
    fitterUserId: 'user-1',
    fitterName: 'John Smith',
    locations: ['Workshop', 'Yard 1'],
    personnel: [
      { name: 'John Smith', occupation: 'Fitter', location: 'Workshop' },
      { name: 'Mike Davis', occupation: 'Fitter', location: 'Yard 1' },
    ],
    tasksCompleted: [
      {
        id: 'task-1-1',
        description: 'Cleaned workshop',
        location: 'Workshop',
        status: 'Completed',
        requiresFollowUp: false,
      },
      {
        id: 'task-1-2',
        description: 'Drained compressor lines',
        location: 'Workshop',
        status: 'Completed',
        requiresFollowUp: false,
      },
      {
        id: 'task-1-3',
        description: 'Checked hydraulic hoses on EX-001',
        location: 'Yard 1',
        assetReference: 'EX-001',
        status: 'Completed',
        requiresFollowUp: true,
      },
    ],
    shiftComments: 'Workshop shutdown preparation for Christmas. All tools isolated and locked off.',
    materialsUsed: [
      { item: 'Hydraulic oil', qty: '5L' },
      { item: 'Cleaning rags', qty: '1 pack' },
    ],
    materialsRequired: [
      { item: 'Replacement hydraulic hose (EX-001)', qty: '1', notes: 'For EX-001' },
    ],
    nextShiftNotes: 'Next shift to replace leaking hose on EX-001 before restart.',
    attachments: [
      { id: 'att-1-1', name: 'workshop-isolation.jpg', type: 'image/jpeg' },
    ],
    status: 'Draft',
    createdAt: new Date('2025-12-25T14:00:00').toISOString(),
    updatedAt: new Date('2025-12-25T14:00:00').toISOString(),
  },
  // Handover #2 — Submitted (Awaiting Supervisor Review)
  {
    id: 'HND-000002',
    siteId: '2',
    siteName: 'Site B',
    date: '2025-12-24',
    shiftType: 'Nights',
    shiftPattern: '7-4',
    fitterUserId: 'user-4',
    fitterName: 'Emma Wilson',
    locations: ['Crane Pad', 'Laydown Area'],
    personnel: [
      { name: 'Emma Wilson', occupation: 'Fitter', location: 'Crane Pad' },
      { name: 'David Lee', occupation: 'Welder', location: 'Laydown' },
    ],
    tasksCompleted: [
      {
        id: 'task-2-1',
        description: 'Inspected crane CR-005 slewing ring',
        location: 'Crane Pad',
        assetReference: 'CR-005',
        status: 'Completed',
        requiresFollowUp: true,
      },
      {
        id: 'task-2-2',
        description: 'Welded cracked bracket',
        location: 'Laydown Area',
        assetReference: 'CR-005',
        status: 'Completed',
        requiresFollowUp: true,
      },
    ],
    shiftComments: 'Temporary weld applied. Requires full repair during planned outage.',
    materialsUsed: [
      { item: 'Welding rods', qty: '10 units' },
    ],
    materialsRequired: [
      { item: 'Replacement bracket (CR-005)', qty: '1', notes: 'For CR-005' },
    ],
    nextShiftNotes: 'Engineering review required before crane returns to service.',
    attachments: [
      { id: 'att-2-1', name: 'weld-before.jpg', type: 'image/jpeg' },
      { id: 'att-2-2', name: 'weld-after.jpg', type: 'image/jpeg' },
    ],
    status: 'Submitted',
    createdAt: new Date('2025-12-24T20:00:00').toISOString(),
    updatedAt: new Date('2025-12-24T20:00:00').toISOString(),
  },
  // Handover #3 — Changes Requested (Supervisor Feedback Given)
  {
    id: 'HND-000003',
    siteId: '3',
    siteName: 'Site C',
    date: '2025-12-23',
    shiftType: 'Days',
    shiftPattern: '5-2',
    fitterUserId: 'user-3',
    fitterName: 'Mike Davis',
    locations: ['Shaft B'],
    personnel: [
      { name: 'Mike Davis', occupation: 'Fitter', location: 'Shaft B' },
    ],
    tasksCompleted: [
      {
        id: 'task-3-1',
        description: 'Pump PU-042 inspection',
        location: 'Shaft B',
        assetReference: 'PU-042',
        status: 'PartiallyCompleted',
        requiresFollowUp: true,
      },
    ],
    shiftComments: 'Pump inspected but flow readings not recorded.',
    materialsUsed: [],
    materialsRequired: [],
    nextShiftNotes: 'Re-inspect pump with calibrated gauge.',
    attachments: [
      { id: 'att-3-1', name: 'pump-setup.jpg', type: 'image/jpeg' },
    ],
    status: 'ChangesRequested',
    supervisorNotes: 'Please add pressure and flow readings\nClarify isolation method used',
    createdAt: new Date('2025-12-23T14:00:00').toISOString(),
    updatedAt: new Date('2025-12-23T16:30:00').toISOString(),
  },
  // Handover #4 — Approved (Supervisor Approved)
  {
    id: 'HND-000004',
    siteId: '1',
    siteName: 'Site A',
    date: '2025-12-22',
    shiftType: 'Nights',
    shiftPattern: '7-4',
    fitterUserId: 'user-2',
    fitterName: 'Sarah Johnson',
    locations: ['Tunnel East'],
    personnel: [
      { name: 'Sarah Johnson', occupation: 'Fitter', location: 'Tunnel East' },
      { name: 'Tom Brown', occupation: 'Electrician', location: 'Tunnel East' },
    ],
    tasksCompleted: [
      {
        id: 'task-4-1',
        description: 'MSV weekly checks',
        location: 'Tunnel East',
        status: 'Completed',
        requiresFollowUp: false,
      },
      {
        id: 'task-4-2',
        description: 'Lighting repairs',
        location: 'Tunnel East',
        status: 'Completed',
        requiresFollowUp: false,
      },
    ],
    shiftComments: 'All MSVs inspected and compliant.',
    materialsUsed: [
      { item: 'LED light fittings', qty: '3', notes: 'Replaced in Tunnel East' },
    ],
    materialsRequired: [],
    nextShiftNotes: 'No follow-up actions required.',
    attachments: [
      { id: 'att-4-1', name: 'lighting-repair-1.jpg', type: 'image/jpeg' },
      { id: 'att-4-2', name: 'lighting-repair-2.jpg', type: 'image/jpeg' },
    ],
    status: 'Approved',
    createdAt: new Date('2025-12-22T20:00:00').toISOString(),
    updatedAt: new Date('2025-12-23T08:00:00').toISOString(),
  },
];

// Create 7 example handovers for current user (dev-user-1) - for "My Handovers" testing
const myHandoversExamples: FitterHandover[] = [
  // Example 1: Draft
  {
    id: 'HND-000006',
    siteId: '1',
    siteName: 'Site A',
    date: new Date().toISOString().split('T')[0], // Today
    shiftType: 'Days',
    shiftPattern: '5-2',
    fitterUserId: 'dev-user-1',
    fitterName: 'Dev User',
    locations: ['Workshop', 'Main Yard'],
    personnel: [
      { name: 'Dev User', occupation: 'Fitter', location: 'Workshop' },
      { name: 'John Smith', occupation: 'Technician', location: 'Main Yard' },
    ],
    tasksCompleted: [
      {
        id: 'task-my-1',
        description: 'Routine equipment inspection',
        location: 'Workshop',
        status: 'Completed',
        requiresFollowUp: false,
      },
      {
        id: 'task-my-2',
        description: 'Lubrication service on EX-002',
        location: 'Main Yard',
        assetReference: 'EX-002',
        status: 'Completed',
        requiresFollowUp: false,
      },
    ],
    shiftComments: 'Completed routine maintenance tasks. All equipment operating normally. Workshop cleaned and tools organized.',
    materialsUsed: [
      { item: 'Hydraulic oil', qty: '10L' },
      { item: 'Grease', qty: '2 tubes' },
    ],
    materialsRequired: [],
    nextShiftNotes: 'Continue with scheduled maintenance program.',
    attachments: [
      { id: 'att-my-1', name: 'equipment-inspection.jpg', type: 'image/jpeg' },
    ],
    status: 'Draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // Example 2: Draft (in progress)
  {
    id: 'HND-000007',
    siteId: '2',
    siteName: 'Site B',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
    shiftType: 'Nights',
    shiftPattern: '7-4',
    fitterUserId: 'dev-user-1',
    fitterName: 'Dev User',
    locations: ['Crane Pad', 'Storage Area'],
    personnel: [
      { name: 'Dev User', occupation: 'Fitter', location: 'Crane Pad' },
    ],
    tasksCompleted: [
      {
        id: 'task-my-3',
        description: 'Crane CR-003 weekly inspection',
        location: 'Crane Pad',
        assetReference: 'CR-003',
        status: 'PartiallyCompleted',
        requiresFollowUp: true,
      },
    ],
    shiftComments: 'Started crane inspection. Need to complete hydraulic pressure checks in next shift.',
    materialsUsed: [],
    materialsRequired: [
      { item: 'Hydraulic test gauge', qty: '1', notes: 'For CR-003 pressure check' },
    ],
    nextShiftNotes: 'Complete CR-003 inspection. Pressure gauge required.',
    attachments: [],
    status: 'Draft',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  // Example 3: Submitted
  {
    id: 'HND-000008',
    siteId: '1',
    siteName: 'Site A',
    date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0], // 2 days ago
    shiftType: 'Days',
    shiftPattern: '5-2',
    fitterUserId: 'dev-user-1',
    fitterName: 'Dev User',
    locations: ['Tunnel West', 'Equipment Bay'],
    personnel: [
      { name: 'Dev User', occupation: 'Fitter', location: 'Tunnel West' },
      { name: 'Sarah Johnson', occupation: 'Electrician', location: 'Equipment Bay' },
    ],
    tasksCompleted: [
      {
        id: 'task-my-4',
        description: 'MSV inspection and testing',
        location: 'Tunnel West',
        status: 'Completed',
        requiresFollowUp: false,
      },
      {
        id: 'task-my-5',
        description: 'Electrical panel maintenance',
        location: 'Equipment Bay',
        status: 'Completed',
        requiresFollowUp: false,
      },
    ],
    shiftComments: 'All scheduled maintenance completed successfully. Equipment tested and verified operational.',
    materialsUsed: [
      { item: 'Electrical connectors', qty: '5 units' },
      { item: 'Insulation tape', qty: '1 roll' },
    ],
    materialsRequired: [],
    nextShiftNotes: 'No outstanding issues. All systems operational.',
    attachments: [
      { id: 'att-my-2', name: 'msv-inspection.jpg', type: 'image/jpeg' },
      { id: 'att-my-3', name: 'electrical-panel.jpg', type: 'image/jpeg' },
    ],
    status: 'Submitted',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000 + 3600000).toISOString(), // 1 hour after creation
  },
  // Example 4: Changes Requested
  {
    id: 'HND-000009',
    siteId: '3',
    siteName: 'Site C',
    date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0], // 3 days ago
    shiftType: 'Nights',
    shiftPattern: '7-4',
    fitterUserId: 'dev-user-1',
    fitterName: 'Dev User',
    locations: ['Shaft A', 'Pump Station'],
    personnel: [
      { name: 'Dev User', occupation: 'Fitter', location: 'Shaft A' },
    ],
    tasksCompleted: [
      {
        id: 'task-my-6',
        description: 'Pump PU-015 maintenance',
        location: 'Pump Station',
        assetReference: 'PU-015',
        status: 'PartiallyCompleted',
        requiresFollowUp: true,
      },
    ],
    shiftComments: 'Pump maintenance started. Some readings need clarification.',
    materialsUsed: [
      { item: 'Pump seals', qty: '2 units' },
    ],
    materialsRequired: [],
    nextShiftNotes: 'Complete pump maintenance documentation.',
    attachments: [
      { id: 'att-my-4', name: 'pump-maintenance.jpg', type: 'image/jpeg' },
    ],
    status: 'ChangesRequested',
    supervisorNotes: 'Please provide detailed pressure readings and flow rates. Include isolation procedure used.',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 86400000 + 7200000).toISOString(), // 2 hours after creation
  },
  // Example 5: Approved
  {
    id: 'HND-000010',
    siteId: '1',
    siteName: 'Site A',
    date: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0], // 4 days ago
    shiftType: 'Days',
    shiftPattern: '5-2',
    fitterUserId: 'dev-user-1',
    fitterName: 'Dev User',
    locations: ['Workshop', 'Yard 2'],
    personnel: [
      { name: 'Dev User', occupation: 'Fitter', location: 'Workshop' },
      { name: 'Mike Davis', occupation: 'Welder', location: 'Yard 2' },
    ],
    tasksCompleted: [
      {
        id: 'task-my-7',
        description: 'Welding equipment inspection',
        location: 'Yard 2',
        status: 'Completed',
        requiresFollowUp: false,
      },
      {
        id: 'task-my-8',
        description: 'Workshop safety audit',
        location: 'Workshop',
        status: 'Completed',
        requiresFollowUp: false,
      },
    ],
    shiftComments: 'All welding equipment inspected and certified. Workshop safety standards verified and compliant.',
    materialsUsed: [
      { item: 'Welding wire', qty: '5kg' },
      { item: 'Safety signs', qty: '3 units' },
    ],
    materialsRequired: [],
    nextShiftNotes: 'All equipment ready for use. No follow-up required.',
    attachments: [
      { id: 'att-my-5', name: 'welding-inspection.jpg', type: 'image/jpeg' },
    ],
    status: 'Approved',
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 86400000 + 10800000).toISOString(), // 3 hours after creation
  },
  // Example 6: Approved (older)
  {
    id: 'HND-000011',
    siteId: '2',
    siteName: 'Site B',
    date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0], // 5 days ago
    shiftType: 'Nights',
    shiftPattern: '7-4',
    fitterUserId: 'dev-user-1',
    fitterName: 'Dev User',
    locations: ['Tunnel East', 'Ventilation Shaft'],
    personnel: [
      { name: 'Dev User', occupation: 'Fitter', location: 'Tunnel East' },
      { name: 'Tom Brown', occupation: 'Operator', location: 'Ventilation Shaft' },
    ],
    tasksCompleted: [
      {
        id: 'task-my-9',
        description: 'Ventilation system check',
        location: 'Ventilation Shaft',
        status: 'Completed',
        requiresFollowUp: false,
      },
      {
        id: 'task-my-10',
        description: 'Tunnel lighting maintenance',
        location: 'Tunnel East',
        status: 'Completed',
        requiresFollowUp: false,
      },
    ],
    shiftComments: 'Ventilation and lighting systems operating at full capacity. All safety systems verified.',
    materialsUsed: [
      { item: 'LED bulbs', qty: '8 units' },
      { item: 'Air filters', qty: '4 units' },
    ],
    materialsRequired: [],
    nextShiftNotes: 'Systems operating normally. No issues reported.',
    attachments: [
      { id: 'att-my-6', name: 'ventilation-check.jpg', type: 'image/jpeg' },
    ],
    status: 'Approved',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 86400000 + 14400000).toISOString(), // 4 hours after creation
  },
  // Example 7: Submitted (recent)
  {
    id: 'HND-000012',
    siteId: '3',
    siteName: 'Site C',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
    shiftType: 'Days',
    shiftPattern: '5-2',
    fitterUserId: 'dev-user-1',
    fitterName: 'Dev User',
    locations: ['Field 1', 'Storage'],
    personnel: [
      { name: 'Dev User', occupation: 'Fitter', location: 'Field 1' },
      { name: 'Emma Wilson', occupation: 'Chargehand', location: 'Storage' },
    ],
    tasksCompleted: [
      {
        id: 'task-my-11',
        description: 'Field equipment service',
        location: 'Field 1',
        status: 'Completed',
        requiresFollowUp: false,
      },
      {
        id: 'task-my-12',
        description: 'Storage area organization',
        location: 'Storage',
        status: 'Completed',
        requiresFollowUp: false,
      },
    ],
    shiftComments: 'Field equipment serviced and ready. Storage area reorganized and inventory updated.',
    materialsUsed: [
      { item: 'Service kit', qty: '1 unit' },
      { item: 'Organizational supplies', qty: '1 pack' },
    ],
    materialsRequired: [],
    nextShiftNotes: 'Equipment ready for field operations.',
    attachments: [
      { id: 'att-my-7', name: 'field-service.jpg', type: 'image/jpeg' },
    ],
    status: 'Submitted',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 + 1800000).toISOString(), // 30 minutes after creation
  },
];

// Generate additional random handovers (keeping some for variety)
const additionalHandovers: FitterHandover[] = Array.from({ length: 23 }, (_, i) => {
  const index = i + 13; // Start from 13 since we have 12 specific ones (5 original + 7 my handovers)
  const fitter = randomElement(mockFitters);
  const site = randomElement(mockSites);
  const shiftType: 'Days' | 'Nights' = Math.random() > 0.5 ? 'Days' : 'Nights';
  const shiftPatterns = ['5-2', '7D3O', '7N4O', '4-4', '6-3'];
  const statuses: FitterHandover['status'][] = ['Draft', 'Submitted', 'ChangesRequested', 'Approved', 'IncludedInMaster'];
  const status = randomElement(statuses);
  
  const date = randomDate(30);
  const createdAt = new Date(date).toISOString();
  const updatedAt = new Date(date + (Math.random() > 0.5 ? 'T12:00:00' : 'T20:00:00')).toISOString();

  const personnelCount = Math.floor(Math.random() * 4);
  const materialsUsedCount = Math.floor(Math.random() * 5);
  const materialsRequiredCount = Math.floor(Math.random() * 4);
  const attachmentsCount = Math.floor(Math.random() * 3);

  return {
    id: generateHandoverId(index),
    siteId: site.id,
    siteName: site.name,
    date,
    shiftType,
    shiftPattern: randomElement(shiftPatterns),
    fitterUserId: fitter.id,
    fitterName: fitter.name,
    locations: randomElements(locations, Math.floor(Math.random() * 3) + 1),
    personnel: personnelCount > 0 ? Array.from({ length: personnelCount }, () => ({
      name: `${randomElement(['John', 'Sarah', 'Mike', 'Emma', 'Tom', 'Lisa'])} ${randomElement(['Smith', 'Johnson', 'Davis', 'Wilson', 'Brown', 'Anderson'])}`,
      occupation: randomElement(occupations),
      location: Math.random() > 0.5 ? randomElement(locations) : undefined,
      remarks: Math.random() > 0.7 ? 'Additional notes here' : undefined,
    })) : undefined,
    tasksCompleted: Math.random() > 0.3 ? Array.from({ length: Math.floor(Math.random() * 3) + 1 }, (_, taskIdx) => ({
      id: `task-${index}-${taskIdx}`,
      description: `Task ${taskIdx + 1} description`,
      location: Math.random() > 0.5 ? randomElement(locations) : undefined,
      status: Math.random() > 0.5 ? 'Completed' : 'PartiallyCompleted',
      requiresFollowUp: Math.random() > 0.7,
    })) : undefined,
    shiftComments: `Shift handover comments for ${date}. Completed scheduled maintenance on equipment. ${Math.random() > 0.5 ? 'No issues reported.' : 'Minor issues noted and logged.'}`,
    materialsUsed: Array.from({ length: materialsUsedCount }, () => ({
      item: randomElement(materials),
      qty: `${Math.floor(Math.random() * 10) + 1}${Math.random() > 0.5 ? 'L' : 'units'}`,
      notes: Math.random() > 0.6 ? 'Used for maintenance' : undefined,
    })),
    materialsRequired: Array.from({ length: materialsRequiredCount }, () => ({
      item: randomElement(materials),
      qty: `${Math.floor(Math.random() * 5) + 1}${Math.random() > 0.5 ? 'L' : 'units'}`,
      notes: Math.random() > 0.6 ? 'Required for next shift' : undefined,
    })),
    nextShiftNotes: Math.random() > 0.5 ? 'No follow-up required.' : undefined,
    linkedEntities: Math.random() > 0.7 ? [
      { type: 'WorkOrder' as const, id: `WO-${Math.floor(Math.random() * 1000)}` },
    ] : undefined,
    attachments: Array.from({ length: attachmentsCount }, (_, i) => ({
      id: `att-${index}-${i}`,
      name: `photo-${i + 1}.jpg`,
      type: 'image/jpeg',
      url: undefined,
    })),
    status,
    supervisorNotes: status === 'ChangesRequested' ? 'Please provide more details on the maintenance performed.' : undefined,
    createdAt,
    updatedAt,
  };
});

export const mockFitterHandovers: FitterHandover[] = [...specificHandovers, ...myHandoversExamples, ...additionalHandovers];

// Create specific Master Handover #5
const specificMasterHandover: MasterHandover = {
  id: 'MHD-000001',
  siteId: '1',
  siteName: 'Site A',
  date: '2025-12-22',
  shiftType: 'Days',
  shiftPattern: '5-2',
  supervisorUserId: 'super-3',
  supervisorName: 'Mark Roache',
  includedHandoverIds: ['HND-000001', 'HND-000004'],
  compiledSummary: 'Day shift shutdown activities completed. All areas safe for holiday stand-down.',
  personnel: [
    { name: 'John Smith', occupation: 'Fitter', location: 'Workshop' },
    { name: 'Mike Davis', occupation: 'Fitter', location: 'Yard 1' },
    { name: 'Sarah Johnson', occupation: 'Fitter', location: 'Tunnel East' },
    { name: 'Tom Brown', occupation: 'Electrician', location: 'Tunnel East' },
  ],
  sections: [
    {
      id: 'section-1',
      name: 'Workshop',
      tasks: ['Cleaned workshop', 'Drained compressor lines', 'Checked hydraulic hoses on EX-001'],
      issues: ['Replacement hydraulic hose required for EX-001'],
      notes: 'Workshop shutdown preparation completed. All tools isolated and locked off.',
      materialsUsed: [{ item: 'Hydraulic oil', qty: '5L' }, { item: 'Cleaning rags' }],
      materialsRequired: [{ item: 'Replacement hydraulic hose', qty: '1', notes: 'EX-001' }],
    },
    {
      id: 'section-2',
      name: 'Tunnel East',
      tasks: ['MSV weekly checks', 'Lighting repairs'],
      issues: [],
      notes: 'All MSVs inspected and compliant. Lighting system operational.',
      materialsUsed: [{ item: 'LED light fittings', qty: '3 units' }],
      materialsRequired: [],
    },
  ],
  overarchingComments: 'Day shift shutdown activities completed successfully. All areas safe for holiday stand-down. No critical issues identified.',
  status: 'SubmittedToManagement',
  distributionLog: [
    {
      sentTo: 'management@example.com',
      sentAt: new Date('2025-12-22T18:00:00').toISOString(),
      method: 'Link' as const,
    },
  ],
  createdAt: new Date('2025-12-22T18:00:00').toISOString(),
  updatedAt: new Date('2025-12-22T18:00:00').toISOString(),
};

// Generate additional random master handovers
const additionalMasterHandovers: MasterHandover[] = Array.from({ length: 4 }, (_, i) => {
  const index = i + 2; // Start from 2 since we have 1 specific one
  const supervisor = randomElement(mockSupervisors);
  const site = randomElement(mockSites);
  const shiftType: 'Days' | 'Nights' = Math.random() > 0.5 ? 'Days' : 'Nights';
  const date = randomDate(20);
  
  // Get approved handovers for this site/date/shift
  const approvedForSite = mockFitterHandovers.filter(
    h => h.siteId === site.id && h.date === date && h.shiftType === shiftType && h.status === 'Approved'
  );
  
  const includedIds = approvedForSite.length > 0 
    ? approvedForSite.slice(0, 5).map(h => h.id)
    : mockFitterHandovers.filter(h => h.status === 'Approved').slice(0, 3).map(h => h.id);

  const statuses: MasterHandover['status'][] = ['Draft', 'SubmittedToManagement', 'Acknowledged'];
  const status = randomElement(statuses);

  const createdAt = new Date(date).toISOString();
  const updatedAt = new Date(date + 'T18:00:00').toISOString();

  return {
    id: generateMasterId(index),
    siteId: site.id,
    siteName: site.name,
    date,
    shiftType,
    shiftPattern: '5-2',
    supervisorUserId: supervisor.id,
    supervisorName: supervisor.name,
    includedHandoverIds: includedIds,
    compiledSummary: `Master shift handover compiled from ${includedIds.length} fitter handovers. All scheduled maintenance completed. Equipment status normal.`,
    status,
    distributionLog: status !== 'Draft' ? [
      {
        sentTo: 'management@example.com',
        sentAt: updatedAt,
        method: 'Link' as const,
      },
    ] : [],
    createdAt,
    updatedAt,
  };
});

export const mockMasterHandovers: MasterHandover[] = [specificMasterHandover, ...additionalMasterHandovers];

// Generate audit log entries
export const mockAuditLog: AuditLogEntry[] = [];

// Add audit entries for each handover
mockFitterHandovers.forEach(handover => {
  mockAuditLog.push({
    id: `audit-${handover.id}-create`,
    handoverId: handover.id,
    handoverType: 'Fitter',
    action: 'Create',
    userId: handover.fitterUserId,
    userName: handover.fitterName,
    timestamp: handover.createdAt,
  });

  if (handover.status !== 'Draft') {
    mockAuditLog.push({
      id: `audit-${handover.id}-submit`,
      handoverId: handover.id,
      handoverType: 'Fitter',
      action: 'Submit',
      userId: handover.fitterUserId,
      userName: handover.fitterName,
      timestamp: new Date(new Date(handover.createdAt).getTime() + 3600000).toISOString(), // 1 hour after creation
    });
  }

  if (handover.status === 'Approved' || handover.status === 'ChangesRequested') {
    const supervisorId = handover.id === 'HND-000004' ? 'super-1' : 'super-1'; // Use appropriate supervisor
    const supervisorName = handover.id === 'HND-000004' ? 'Supervisor User' : 'David Lee';
    mockAuditLog.push({
      id: `audit-${handover.id}-${handover.status === 'Approved' ? 'approve' : 'request'}`,
      handoverId: handover.id,
      handoverType: 'Fitter',
      action: handover.status === 'Approved' ? 'Approve' : 'RequestChanges',
      userId: supervisorId,
      userName: supervisorName,
      timestamp: handover.updatedAt,
      notes: handover.supervisorNotes,
    });
  }
});

// Add audit entries for master handovers
mockMasterHandovers.forEach(master => {
  mockAuditLog.push({
    id: `audit-${master.id}-create`,
    handoverId: master.id,
    handoverType: 'Master',
    action: 'CreateMaster',
    userId: master.supervisorUserId,
    userName: master.supervisorName,
    timestamp: master.createdAt,
  });

  if (master.status !== 'Draft') {
    mockAuditLog.push({
      id: `audit-${master.id}-submit`,
      handoverId: master.id,
      handoverType: 'Master',
      action: 'SubmitMaster',
      userId: master.supervisorUserId,
      userName: master.supervisorName,
      timestamp: master.updatedAt,
    });
  }

  if (master.status === 'Acknowledged') {
    mockAuditLog.push({
      id: `audit-${master.id}-ack`,
      handoverId: master.id,
      handoverType: 'Master',
      action: 'Acknowledge',
      userId: 'mgmt-1',
      userName: 'Management User',
      timestamp: master.updatedAt,
    });
  }
});

