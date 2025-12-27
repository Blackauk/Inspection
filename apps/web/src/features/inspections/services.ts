import type { 
  Inspection, 
  InspectionFilter, 
  Checklist, 
  CheckSheetTemplate,
  ChecklistItem,
  ChecklistSection,
  ChecklistItemAnswer,
  InspectionHistoryEntry,
  InspectionAttachment,
  InspectionSignature,
  TemplateVersion
} from './types';
import { mockSites, mockUsers } from './mockData';

// ============================================================================
// CHECKLISTS (Library - Reusable item lists)
// ============================================================================

const mockChecklists: Checklist[] = [
  {
    id: 'checklist-001',
    name: 'MEWP Weekly Checks',
    description: 'Standard weekly inspection checklist for Mobile Elevating Work Platforms',
    category: 'MEWP',
    items: [
      {
        id: 'item-001',
        question: 'Visual inspection of hydraulic hoses',
        type: 'PassFail',
        required: true,
        critical: false,
        order: 1,
        photoRequiredOnFail: true,
      },
      {
        id: 'item-002',
        question: 'Check fluid levels',
        type: 'PassFail',
        required: true,
        critical: false,
        order: 2,
        photoRequiredOnFail: false,
      },
      {
        id: 'item-003',
        question: 'Test emergency lowering system',
        type: 'PassFail',
        required: true,
        critical: true,
        order: 3,
        photoRequiredOnFail: true,
      },
    ],
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    createdBy: 'user-1',
    createdByName: 'John Smith',
    updatedAt: '2025-01-01T00:00:00Z',
    updatedBy: 'user-1',
    updatedByName: 'John Smith',
  },
  {
    id: 'checklist-002',
    name: 'Compressor Daily Checks',
    description: 'Daily pre-start checks for air compressors',
    category: 'Compressor',
    items: [
      {
        id: 'item-004',
        question: 'Check oil level',
        type: 'PassFail',
        required: true,
        critical: false,
        order: 1,
        photoRequiredOnFail: false,
      },
      {
        id: 'item-005',
        question: 'Inspect air filter',
        type: 'PassFail',
        required: true,
        critical: false,
        order: 2,
        photoRequiredOnFail: true,
      },
    ],
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    createdBy: 'user-1',
    createdByName: 'John Smith',
    updatedAt: '2025-01-01T00:00:00Z',
    updatedBy: 'user-1',
    updatedByName: 'John Smith',
  },
  {
    id: 'checklist-003',
    name: 'Crane Pre-Start Checks',
    description: 'Pre-use safety checks for cranes',
    category: 'Crane',
    items: [
      {
        id: 'item-006',
        question: 'Check wire rope condition',
        type: 'PassFail',
        required: true,
        critical: true,
        order: 1,
        photoRequiredOnFail: true,
      },
      {
        id: 'item-007',
        question: 'Test load limit indicator',
        type: 'PassFail',
        required: true,
        critical: true,
        order: 2,
        photoRequiredOnFail: false,
      },
    ],
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    createdBy: 'user-1',
    createdByName: 'John Smith',
    updatedAt: '2025-01-01T00:00:00Z',
    updatedBy: 'user-1',
    updatedByName: 'John Smith',
  },
  {
    id: 'checklist-004',
    name: 'Generator Weekly Checks',
    description: 'Weekly maintenance checks for generators',
    category: 'Generator',
    items: [
      {
        id: 'item-008',
        question: 'Check fuel level',
        type: 'PassFail',
        required: true,
        critical: false,
        order: 1,
        photoRequiredOnFail: false,
      },
      {
        id: 'item-009',
        question: 'Test battery voltage',
        type: 'Number',
        required: true,
        critical: false,
        order: 2,
        unit: 'V',
        minValue: 12,
        maxValue: 14,
        photoRequiredOnFail: false,
      },
    ],
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    createdBy: 'user-1',
    createdByName: 'John Smith',
    updatedAt: '2025-01-01T00:00:00Z',
    updatedBy: 'user-1',
    updatedByName: 'John Smith',
  },
  {
    id: 'checklist-005',
    name: 'Excavator Daily Checks',
    description: 'Daily pre-start inspection for excavators',
    category: 'Excavator',
    items: [
      {
        id: 'item-010',
        question: 'Check hydraulic fluid level',
        type: 'PassFail',
        required: true,
        critical: false,
        order: 1,
        photoRequiredOnFail: false,
      },
      {
        id: 'item-011',
        question: 'Inspect tracks for damage',
        type: 'PassFail',
        required: true,
        critical: true,
        order: 2,
        photoRequiredOnFail: true,
      },
    ],
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    createdBy: 'user-1',
    createdByName: 'John Smith',
    updatedAt: '2025-01-01T00:00:00Z',
    updatedBy: 'user-1',
    updatedByName: 'John Smith',
  },
  {
    id: 'checklist-006',
    name: 'Forklift Weekly Checks',
    description: 'Weekly safety inspection for forklifts',
    category: 'Forklift',
    items: [
      {
        id: 'item-012',
        question: 'Check mast chains',
        type: 'PassFail',
        required: true,
        critical: true,
        order: 1,
        photoRequiredOnFail: true,
      },
      {
        id: 'item-013',
        question: 'Test overhead guard',
        type: 'PassFail',
        required: true,
        critical: true,
        order: 2,
        photoRequiredOnFail: false,
      },
    ],
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    createdBy: 'user-1',
    createdByName: 'John Smith',
    updatedAt: '2025-01-01T00:00:00Z',
    updatedBy: 'user-1',
    updatedByName: 'John Smith',
  },
  {
    id: 'checklist-007',
    name: 'Pump Monthly Checks',
    description: 'Monthly maintenance checks for pumps',
    category: 'Pump',
    items: [
      {
        id: 'item-014',
        question: 'Check pump pressure',
        type: 'Number',
        required: true,
        critical: false,
        order: 1,
        unit: 'psi',
        minValue: 50,
        maxValue: 100,
        photoRequiredOnFail: false,
      },
      {
        id: 'item-015',
        question: 'Inspect seals for leaks',
        type: 'PassFail',
        required: true,
        critical: true,
        order: 2,
        photoRequiredOnFail: true,
      },
    ],
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    createdBy: 'user-1',
    createdByName: 'John Smith',
    updatedAt: '2025-01-01T00:00:00Z',
    updatedBy: 'user-1',
    updatedByName: 'John Smith',
  },
  {
    id: 'checklist-008',
    name: 'LOLER Inspection Items',
    description: 'Standard LOLER inspection checklist items',
    category: 'LOLER',
    items: [
      {
        id: 'item-016',
        question: 'Load test certificate valid',
        type: 'PassFail',
        required: true,
        critical: true,
        order: 1,
        photoRequiredOnFail: false,
        complianceTag: 'LOLER',
      },
      {
        id: 'item-017',
        question: 'Safety devices functional',
        type: 'PassFail',
        required: true,
        critical: true,
        order: 2,
        photoRequiredOnFail: false,
        complianceTag: 'LOLER',
      },
    ],
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    createdBy: 'user-1',
    createdByName: 'John Smith',
    updatedAt: '2025-01-01T00:00:00Z',
    updatedBy: 'user-1',
    updatedByName: 'John Smith',
  },
  {
    id: 'checklist-009',
    name: 'PUWER Inspection Items',
    description: 'Standard PUWER inspection checklist items',
    category: 'PUWER',
    items: [
      {
        id: 'item-018',
        question: 'Guards and safety devices in place',
        type: 'PassFail',
        required: true,
        critical: true,
        order: 1,
        photoRequiredOnFail: true,
        complianceTag: 'PUWER',
      },
      {
        id: 'item-019',
        question: 'Emergency stop functional',
        type: 'PassFail',
        required: true,
        critical: true,
        order: 2,
        photoRequiredOnFail: false,
        complianceTag: 'PUWER',
      },
    ],
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    createdBy: 'user-1',
    createdByName: 'John Smith',
    updatedAt: '2025-01-01T00:00:00Z',
    updatedBy: 'user-1',
    updatedByName: 'John Smith',
  },
  {
    id: 'checklist-010',
    name: 'General Safety Checks',
    description: 'General safety inspection items applicable to all equipment',
    category: 'General',
    items: [
      {
        id: 'item-020',
        question: 'Fire extinguisher present and in date',
        type: 'PassFail',
        required: true,
        critical: false,
        order: 1,
        photoRequiredOnFail: false,
      },
      {
        id: 'item-021',
        question: 'First aid kit accessible',
        type: 'PassFail',
        required: true,
        critical: false,
        order: 2,
        photoRequiredOnFail: false,
      },
    ],
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    createdBy: 'user-1',
    createdByName: 'John Smith',
    updatedAt: '2025-01-01T00:00:00Z',
    updatedBy: 'user-1',
    updatedByName: 'John Smith',
  },
];

export function getChecklists(): Checklist[] {
  return [...mockChecklists];
}

export function getChecklistById(id: string): Checklist | undefined {
  return mockChecklists.find((c) => c.id === id);
}

// ============================================================================
// CHECK SHEET TEMPLATES
// ============================================================================

const mockCheckSheetTemplates: CheckSheetTemplate[] = [
  {
    id: 'template-001',
    name: 'MEWP – Weekly Inspection',
    description: 'Weekly safety and maintenance inspection for Mobile Elevating Work Platforms',
    category: 'MEWP Weekly',
    assetTypeCodes: ['MEWP'],
    version: 'v1',
    versions: [
      {
        version: 'v1',
        createdAt: '2025-01-01T00:00:00Z',
        createdBy: 'user-1',
        createdByName: 'John Smith',
      },
    ],
    sections: [
      { id: 'section-mewp-001', title: 'General Condition', order: 1 },
      { id: 'section-mewp-002', title: 'Platform & Guardrails', order: 2 },
      { id: 'section-mewp-003', title: 'Controls & Safety Devices', order: 3 },
      { id: 'section-mewp-004', title: 'Hydraulics & Power', order: 4 },
      { id: 'section-mewp-005', title: 'Wheels & Stability', order: 5 },
      { id: 'section-mewp-006', title: 'Final Checks', order: 6 },
    ],
    items: [
      {
        id: 'item-mewp-001',
        sectionId: 'section-mewp-001',
        question: 'Machine clean and free from debris',
        type: 'PassFail',
        required: true,
        safetyCritical: false,
        critical: false,
        order: 1,
        photoRequiredOnFail: false,
      },
      {
        id: 'item-mewp-002',
        sectionId: 'section-mewp-001',
        question: 'No visible structural damage',
        type: 'PassFail',
        required: true,
        safetyCritical: true,
        critical: true,
        order: 2,
        photoRequiredOnFail: true,
      },
      {
        id: 'item-mewp-003',
        sectionId: 'section-mewp-001',
        question: 'Warning decals present and legible',
        type: 'PassFail',
        required: true,
        safetyCritical: false,
        critical: false,
        order: 3,
        photoRequiredOnFail: false,
      },
      {
        id: 'item-mewp-004',
        sectionId: 'section-mewp-001',
        question: 'Operator manual available in holder',
        type: 'PassFail',
        required: true,
        safetyCritical: false,
        critical: false,
        order: 4,
        photoRequiredOnFail: false,
      },
      {
        id: 'item-mewp-005',
        sectionId: 'section-mewp-002',
        question: 'Guardrails secure and undamaged',
        type: 'PassFail',
        required: true,
        safetyCritical: true,
        critical: true,
        order: 5,
        photoRequiredOnFail: true,
      },
      {
        id: 'item-mewp-006',
        sectionId: 'section-mewp-002',
        question: 'Toe boards fitted and secure',
        type: 'PassFail',
        required: true,
        safetyCritical: true,
        critical: true,
        order: 6,
        photoRequiredOnFail: true,
      },
      {
        id: 'item-mewp-007',
        sectionId: 'section-mewp-002',
        question: 'Platform floor condition acceptable',
        type: 'PassFail',
        required: true,
        safetyCritical: false,
        critical: false,
        order: 7,
        photoRequiredOnFail: false,
      },
      {
        id: 'item-mewp-008',
        sectionId: 'section-mewp-002',
        question: 'Entry gate self-closing and latching',
        type: 'PassFail',
        required: true,
        safetyCritical: true,
        critical: true,
        order: 8,
        photoRequiredOnFail: true,
      },
      {
        id: 'item-mewp-009',
        sectionId: 'section-mewp-003',
        question: 'Ground controls operational',
        type: 'PassFail',
        required: true,
        safetyCritical: true,
        critical: true,
        order: 9,
        photoRequiredOnFail: true,
      },
      {
        id: 'item-mewp-010',
        sectionId: 'section-mewp-003',
        question: 'Platform controls operational',
        type: 'PassFail',
        required: true,
        safetyCritical: true,
        critical: true,
        order: 10,
        photoRequiredOnFail: true,
      },
      {
        id: 'item-mewp-011',
        sectionId: 'section-mewp-003',
        question: 'Emergency stop buttons working',
        type: 'PassFail',
        required: true,
        safetyCritical: true,
        critical: true,
        order: 11,
        photoRequiredOnFail: true,
      },
      {
        id: 'item-mewp-012',
        sectionId: 'section-mewp-003',
        question: 'Tilt alarm functioning',
        type: 'PassFail',
        required: true,
        safetyCritical: true,
        critical: true,
        order: 12,
        photoRequiredOnFail: true,
      },
      {
        id: 'item-mewp-013',
        sectionId: 'section-mewp-003',
        question: 'Load sensor functioning',
        type: 'PassFail',
        required: true,
        safetyCritical: true,
        critical: true,
        order: 13,
        photoRequiredOnFail: true,
      },
      {
        id: 'item-mewp-014',
        sectionId: 'section-mewp-004',
        question: 'Hydraulic hoses free from leaks',
        type: 'PassFail',
        required: true,
        safetyCritical: false,
        critical: false,
        order: 14,
        photoRequiredOnFail: true,
      },
      {
        id: 'item-mewp-015',
        sectionId: 'section-mewp-004',
        question: 'Battery / fuel level',
        type: 'Number',
        required: true,
        safetyCritical: false,
        critical: false,
        order: 15,
        unit: '%',
        minValue: 0,
        maxValue: 100,
        photoRequiredOnFail: false,
      },
      {
        id: 'item-mewp-016',
        sectionId: 'section-mewp-004',
        question: 'Charging cable / fuel cap intact',
        type: 'PassFail',
        required: true,
        safetyCritical: false,
        critical: false,
        order: 16,
        photoRequiredOnFail: false,
      },
      {
        id: 'item-mewp-017',
        sectionId: 'section-mewp-005',
        question: 'Tyres or wheels in good condition',
        type: 'PassFail',
        required: true,
        safetyCritical: false,
        critical: false,
        order: 17,
        photoRequiredOnFail: false,
      },
      {
        id: 'item-mewp-018',
        sectionId: 'section-mewp-005',
        question: 'Wheel nuts secure',
        type: 'PassFail',
        required: true,
        safetyCritical: true,
        critical: true,
        order: 18,
        photoRequiredOnFail: true,
      },
      {
        id: 'item-mewp-019',
        sectionId: 'section-mewp-005',
        question: 'Outriggers functioning correctly',
        type: 'PassFailNA',
        required: true,
        safetyCritical: true,
        critical: true,
        order: 19,
        photoRequiredOnFail: true,
      },
      {
        id: 'item-mewp-020',
        sectionId: 'section-mewp-006',
        question: 'Raise/lower test completed successfully',
        type: 'PassFail',
        required: true,
        safetyCritical: true,
        critical: true,
        order: 20,
        photoRequiredOnFail: true,
      },
      {
        id: 'item-mewp-021',
        sectionId: 'section-mewp-006',
        question: 'No abnormal noise during operation',
        type: 'PassFail',
        required: true,
        safetyCritical: false,
        critical: false,
        order: 21,
        photoRequiredOnFail: false,
      },
      {
        id: 'item-mewp-022',
        sectionId: 'section-mewp-007',
        question: 'Photo: condition of platform/guardrails',
        type: 'Photo',
        required: true,
        safetyCritical: false,
        critical: false,
        order: 22,
        photoRequiredOnFail: false,
      },
      {
        id: 'item-mewp-023',
        sectionId: 'section-mewp-007',
        question: 'Inspector comments',
        type: 'Text',
        required: false,
        safetyCritical: false,
        critical: false,
        order: 23,
        photoRequiredOnFail: false,
      },
    ],
    checklistIds: ['checklist-001', 'checklist-010'],
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    createdBy: 'user-1',
    createdByName: 'John Smith',
    updatedAt: '2025-01-01T00:00:00Z',
    updatedBy: 'user-1',
    updatedByName: 'John Smith',
  },
  {
    id: 'template-002',
    name: 'Compressor – Daily Inspection',
    description: 'Daily pre-start inspection for air compressors',
    category: 'Compressor Daily',
    assetTypeCodes: ['COM'],
    version: 'v1',
    versions: [
      {
        version: 'v1',
        createdAt: '2025-01-01T00:00:00Z',
        createdBy: 'user-1',
        createdByName: 'John Smith',
      },
    ],
    sections: [
      { id: 'section-comp-001', title: 'Visual Checks', order: 1 },
      { id: 'section-comp-002', title: 'Fluids & Filters', order: 2 },
      { id: 'section-comp-003', title: 'Operation', order: 3 },
      { id: 'section-comp-004', title: 'Safety', order: 4 },
      { id: 'section-comp-005', title: 'Shutdown', order: 5 },
    ],
    items: [
      {
        id: 'item-comp-001',
        sectionId: 'section-comp-001',
        question: 'No visible oil leaks',
        type: 'PassFail',
        required: true,
        safetyCritical: false,
        critical: false,
        order: 1,
        photoRequiredOnFail: true,
      },
      {
        id: 'item-comp-002',
        sectionId: 'section-comp-001',
        question: 'No visible air leaks',
        type: 'PassFail',
        required: true,
        safetyCritical: false,
        critical: false,
        order: 2,
        photoRequiredOnFail: true,
      },
      {
        id: 'item-comp-003',
        sectionId: 'section-comp-001',
        question: 'Guards fitted and secure',
        type: 'PassFail',
        required: true,
        safetyCritical: true,
        critical: true,
        order: 3,
        photoRequiredOnFail: true,
      },
      {
        id: 'item-comp-004',
        sectionId: 'section-comp-002',
        question: 'Engine oil level acceptable',
        type: 'PassFail',
        required: true,
        safetyCritical: false,
        critical: false,
        order: 4,
        photoRequiredOnFail: false,
      },
      {
        id: 'item-comp-005',
        sectionId: 'section-comp-002',
        question: 'Coolant level acceptable',
        type: 'PassFail',
        required: true,
        safetyCritical: false,
        critical: false,
        order: 5,
        photoRequiredOnFail: false,
      },
      {
        id: 'item-comp-006',
        sectionId: 'section-comp-002',
        question: 'Air filter condition acceptable',
        type: 'PassFail',
        required: true,
        safetyCritical: false,
        critical: false,
        order: 6,
        photoRequiredOnFail: false,
      },
      {
        id: 'item-comp-007',
        sectionId: 'section-comp-003',
        question: 'Unit starts without issue',
        type: 'PassFail',
        required: true,
        safetyCritical: false,
        critical: false,
        order: 7,
        photoRequiredOnFail: false,
      },
      {
        id: 'item-comp-008',
        sectionId: 'section-comp-003',
        question: 'Builds pressure correctly',
        type: 'PassFail',
        required: true,
        safetyCritical: false,
        critical: false,
        order: 8,
        photoRequiredOnFail: false,
      },
      {
        id: 'item-comp-009',
        sectionId: 'section-comp-003',
        question: 'Operating pressure',
        type: 'Number',
        required: true,
        safetyCritical: false,
        critical: false,
        order: 9,
        unit: 'bar',
        minValue: 0,
        maxValue: 200,
        photoRequiredOnFail: false,
      },
      {
        id: 'item-comp-010',
        sectionId: 'section-comp-003',
        question: 'No excessive vibration',
        type: 'PassFail',
        required: true,
        safetyCritical: false,
        critical: false,
        order: 10,
        photoRequiredOnFail: false,
      },
      {
        id: 'item-comp-011',
        sectionId: 'section-comp-004',
        question: 'Emergency stop operational',
        type: 'PassFail',
        required: true,
        safetyCritical: true,
        critical: true,
        order: 11,
        photoRequiredOnFail: true,
      },
      {
        id: 'item-comp-012',
        sectionId: 'section-comp-004',
        question: 'Noise level acceptable',
        type: 'PassFail',
        required: true,
        safetyCritical: false,
        critical: false,
        order: 12,
        photoRequiredOnFail: false,
      },
      {
        id: 'item-comp-013',
        sectionId: 'section-comp-004',
        question: 'Fire extinguisher present',
        type: 'PassFailNA',
        required: false,
        safetyCritical: false,
        critical: false,
        order: 13,
        photoRequiredOnFail: false,
      },
      {
        id: 'item-comp-014',
        sectionId: 'section-comp-005',
        question: 'Unit shuts down correctly',
        type: 'PassFail',
        required: true,
        safetyCritical: false,
        critical: false,
        order: 14,
        photoRequiredOnFail: false,
      },
      {
        id: 'item-comp-015',
        sectionId: 'section-comp-005',
        question: 'No leaks after shutdown',
        type: 'PassFail',
        required: true,
        safetyCritical: false,
        critical: false,
        order: 15,
        photoRequiredOnFail: true,
      },
      {
        id: 'item-comp-016',
        sectionId: 'section-comp-005',
        question: 'Inspector notes',
        type: 'Text',
        required: false,
        safetyCritical: false,
        critical: false,
        order: 16,
        photoRequiredOnFail: false,
      },
    ],
    checklistIds: ['checklist-002'],
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    createdBy: 'user-1',
    createdByName: 'John Smith',
    updatedAt: '2025-01-01T00:00:00Z',
    updatedBy: 'user-1',
    updatedByName: 'John Smith',
  },
  {
    id: 'template-003',
    name: 'Crane Pre-Start Inspection',
    description: 'Pre-use safety inspection for cranes',
    category: 'Crane Pre-Start',
    assetTypeCodes: ['CR'],
    version: 'v1',
    versions: [
      {
        version: 'v1',
        createdAt: '2025-01-01T00:00:00Z',
        createdBy: 'user-1',
        createdByName: 'John Smith',
      },
    ],
    sections: [
      { id: 'section-006', title: 'Wire Rope', order: 1 },
      { id: 'section-007', title: 'Safety Systems', order: 2 },
    ],
    items: [
      {
        id: 'item-007',
        sectionId: 'section-006',
        question: 'Check wire rope condition',
        type: 'PassFail',
        required: true,
        critical: true,
        order: 1,
        photoRequiredOnFail: true,
      },
      {
        id: 'item-008',
        sectionId: 'section-007',
        question: 'Test load limit indicator',
        type: 'PassFail',
        required: true,
        critical: true,
        order: 2,
        photoRequiredOnFail: false,
      },
    ],
    checklistIds: ['checklist-003'],
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    createdBy: 'user-1',
    createdByName: 'John Smith',
    updatedAt: '2025-01-01T00:00:00Z',
    updatedBy: 'user-1',
    updatedByName: 'John Smith',
  },
  {
    id: 'template-004',
    name: 'Generator Weekly Inspection',
    description: 'Weekly maintenance inspection for generators',
    category: 'Generator Weekly',
    assetTypeCodes: ['GEN'],
    version: 'v1',
    versions: [
      {
        version: 'v1',
        createdAt: '2025-01-01T00:00:00Z',
        createdBy: 'user-1',
        createdByName: 'John Smith',
      },
    ],
    sections: [
      { id: 'section-gen-001', title: 'General', order: 1 },
      { id: 'section-gen-002', title: 'Fluids', order: 2 },
      { id: 'section-gen-003', title: 'Electrical', order: 3 },
      { id: 'section-gen-004', title: 'Operation', order: 4 },
      { id: 'section-gen-005', title: 'Notes', order: 5 },
    ],
    items: [
      {
        id: 'item-gen-001',
        sectionId: 'section-gen-001',
        question: 'Unit clean and secure',
        type: 'PassFail',
        required: true,
        safetyCritical: false,
        critical: false,
        order: 1,
        photoRequiredOnFail: false,
      },
      {
        id: 'item-gen-002',
        sectionId: 'section-gen-001',
        question: 'Enclosure panels secure',
        type: 'PassFail',
        required: true,
        safetyCritical: false,
        critical: false,
        order: 2,
        photoRequiredOnFail: false,
      },
      {
        id: 'item-gen-003',
        sectionId: 'section-gen-002',
        question: 'Engine oil level OK',
        type: 'PassFail',
        required: true,
        safetyCritical: false,
        critical: false,
        order: 3,
        photoRequiredOnFail: false,
      },
      {
        id: 'item-gen-004',
        sectionId: 'section-gen-002',
        question: 'Coolant level OK',
        type: 'PassFail',
        required: true,
        safetyCritical: false,
        critical: false,
        order: 4,
        photoRequiredOnFail: false,
      },
      {
        id: 'item-gen-005',
        sectionId: 'section-gen-002',
        question: 'Fuel level',
        type: 'Number',
        required: true,
        safetyCritical: false,
        critical: false,
        order: 5,
        unit: '%',
        minValue: 0,
        maxValue: 100,
        photoRequiredOnFail: false,
      },
      {
        id: 'item-gen-006',
        sectionId: 'section-gen-003',
        question: 'Cables and sockets undamaged',
        type: 'PassFail',
        required: true,
        safetyCritical: true,
        critical: true,
        order: 6,
        photoRequiredOnFail: true,
      },
      {
        id: 'item-gen-007',
        sectionId: 'section-gen-003',
        question: 'Earthing connection intact',
        type: 'PassFail',
        required: true,
        safetyCritical: true,
        critical: true,
        order: 7,
        photoRequiredOnFail: true,
      },
      {
        id: 'item-gen-008',
        sectionId: 'section-gen-004',
        question: 'Generator starts successfully',
        type: 'PassFail',
        required: true,
        safetyCritical: false,
        critical: false,
        order: 8,
        photoRequiredOnFail: false,
      },
      {
        id: 'item-gen-009',
        sectionId: 'section-gen-004',
        question: 'Voltage output within limits',
        type: 'Number',
        required: true,
        safetyCritical: false,
        critical: false,
        order: 9,
        unit: 'V',
        minValue: 220,
        maxValue: 250,
        photoRequiredOnFail: false,
      },
      {
        id: 'item-gen-010',
        sectionId: 'section-gen-004',
        question: 'No abnormal noise or vibration',
        type: 'PassFail',
        required: true,
        safetyCritical: false,
        critical: false,
        order: 10,
        photoRequiredOnFail: false,
      },
      {
        id: 'item-gen-011',
        sectionId: 'section-gen-005',
        question: 'Inspector comments',
        type: 'Text',
        required: false,
        safetyCritical: false,
        critical: false,
        order: 11,
        photoRequiredOnFail: false,
      },
    ],
    checklistIds: ['checklist-004'],
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    createdBy: 'user-1',
    createdByName: 'John Smith',
    updatedAt: '2025-01-01T00:00:00Z',
    updatedBy: 'user-1',
    updatedByName: 'John Smith',
  },
  {
    id: 'template-005',
    name: 'Excavator Daily Inspection',
    description: 'Daily pre-start inspection for excavators',
    category: 'Excavator Daily',
    assetTypeCodes: ['EX'],
    version: 'v1',
    versions: [
      {
        version: 'v1',
        createdAt: '2025-01-01T00:00:00Z',
        createdBy: 'user-1',
        createdByName: 'John Smith',
      },
    ],
    sections: [
      { id: 'section-ex-001', title: 'Walkaround', order: 1 },
      { id: 'section-ex-002', title: 'Undercarriage', order: 2 },
      { id: 'section-ex-003', title: 'Fluids', order: 3 },
      { id: 'section-ex-004', title: 'Cab & Controls', order: 4 },
      { id: 'section-ex-005', title: 'Operation', order: 5 },
      { id: 'section-ex-006', title: 'Notes', order: 6 },
    ],
    items: [
      {
        id: 'item-ex-001',
        sectionId: 'section-ex-001',
        question: 'No visible damage to body or boom',
        type: 'PassFail',
        required: true,
        safetyCritical: true,
        critical: true,
        order: 1,
        photoRequiredOnFail: true,
      },
      {
        id: 'item-ex-002',
        sectionId: 'section-ex-001',
        question: 'No fluid leaks visible',
        type: 'PassFail',
        required: true,
        safetyCritical: false,
        critical: false,
        order: 2,
        photoRequiredOnFail: true,
      },
      {
        id: 'item-ex-003',
        sectionId: 'section-ex-001',
        question: 'Mirrors and windows intact',
        type: 'PassFail',
        required: true,
        safetyCritical: false,
        critical: false,
        order: 3,
        photoRequiredOnFail: false,
      },
      {
        id: 'item-ex-004',
        sectionId: 'section-ex-002',
        question: 'Tracks in good condition',
        type: 'PassFail',
        required: true,
        safetyCritical: true,
        critical: true,
        order: 4,
        photoRequiredOnFail: true,
      },
      {
        id: 'item-ex-005',
        sectionId: 'section-ex-002',
        question: 'Track tension acceptable',
        type: 'PassFail',
        required: true,
        safetyCritical: false,
        critical: false,
        order: 5,
        photoRequiredOnFail: false,
      },
      {
        id: 'item-ex-006',
        sectionId: 'section-ex-002',
        question: 'Rollers and idlers OK',
        type: 'PassFail',
        required: true,
        safetyCritical: false,
        critical: false,
        order: 6,
        photoRequiredOnFail: false,
      },
      {
        id: 'item-ex-007',
        sectionId: 'section-ex-003',
        question: 'Engine oil level OK',
        type: 'PassFail',
        required: true,
        safetyCritical: false,
        critical: false,
        order: 7,
        photoRequiredOnFail: false,
      },
      {
        id: 'item-ex-008',
        sectionId: 'section-ex-003',
        question: 'Hydraulic oil level OK',
        type: 'PassFail',
        required: true,
        safetyCritical: false,
        critical: false,
        order: 8,
        photoRequiredOnFail: false,
      },
      {
        id: 'item-ex-009',
        sectionId: 'section-ex-003',
        question: 'Coolant level OK',
        type: 'PassFail',
        required: true,
        safetyCritical: false,
        critical: false,
        order: 9,
        photoRequiredOnFail: false,
      },
      {
        id: 'item-ex-010',
        sectionId: 'section-ex-004',
        question: 'Horn working',
        type: 'PassFail',
        required: true,
        safetyCritical: false,
        critical: false,
        order: 10,
        photoRequiredOnFail: false,
      },
      {
        id: 'item-ex-011',
        sectionId: 'section-ex-004',
        question: 'Seatbelt present and functional',
        type: 'PassFail',
        required: true,
        safetyCritical: true,
        critical: true,
        order: 11,
        photoRequiredOnFail: false,
      },
      {
        id: 'item-ex-012',
        sectionId: 'section-ex-004',
        question: 'Joysticks responsive',
        type: 'PassFail',
        required: true,
        safetyCritical: true,
        critical: true,
        order: 12,
        photoRequiredOnFail: false,
      },
      {
        id: 'item-ex-013',
        sectionId: 'section-ex-005',
        question: 'Slew, boom, dipper functions smooth',
        type: 'PassFail',
        required: true,
        safetyCritical: false,
        critical: false,
        order: 13,
        photoRequiredOnFail: false,
      },
      {
        id: 'item-ex-014',
        sectionId: 'section-ex-005',
        question: 'Bucket pins secure',
        type: 'PassFail',
        required: true,
        safetyCritical: true,
        critical: true,
        order: 14,
        photoRequiredOnFail: true,
      },
      {
        id: 'item-ex-015',
        sectionId: 'section-ex-005',
        question: 'Engine hours',
        type: 'Number',
        required: true,
        safetyCritical: false,
        critical: false,
        order: 15,
        unit: 'hrs',
        minValue: 0,
        maxValue: 10000,
        photoRequiredOnFail: false,
      },
      {
        id: 'item-ex-016',
        sectionId: 'section-ex-006',
        question: 'Operator comments',
        type: 'Text',
        required: false,
        safetyCritical: false,
        critical: false,
        order: 16,
        photoRequiredOnFail: false,
      },
    ],
    checklistIds: ['checklist-005'],
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    createdBy: 'user-1',
    createdByName: 'John Smith',
    updatedAt: '2025-01-01T00:00:00Z',
    updatedBy: 'user-1',
    updatedByName: 'John Smith',
  },
  {
    id: 'template-006',
    name: 'Forklift Weekly Inspection',
    description: 'Weekly safety inspection for forklifts',
    category: 'Forklift Weekly',
    assetTypeCodes: ['FL'],
    version: 'v1',
    versions: [
      {
        version: 'v1',
        createdAt: '2025-01-01T00:00:00Z',
        createdBy: 'user-1',
        createdByName: 'John Smith',
      },
    ],
    sections: [
      { id: 'section-fl-001', title: 'General', order: 1 },
      { id: 'section-fl-002', title: 'Forks & Mast', order: 2 },
      { id: 'section-fl-003', title: 'Controls & Safety', order: 3 },
      { id: 'section-fl-004', title: 'Tyres', order: 4 },
      { id: 'section-fl-005', title: 'Operation', order: 5 },
    ],
    items: [
      {
        id: 'item-fl-001',
        sectionId: 'section-fl-001',
        question: 'No visible damage',
        type: 'PassFail',
        required: true,
        safetyCritical: false,
        critical: false,
        order: 1,
        photoRequiredOnFail: false,
      },
      {
        id: 'item-fl-002',
        sectionId: 'section-fl-001',
        question: 'Data plate legible',
        type: 'PassFail',
        required: true,
        safetyCritical: false,
        critical: false,
        order: 2,
        photoRequiredOnFail: false,
      },
      {
        id: 'item-fl-003',
        sectionId: 'section-fl-002',
        question: 'Forks free from cracks or bends',
        type: 'PassFail',
        required: true,
        safetyCritical: true,
        critical: true,
        order: 3,
        photoRequiredOnFail: true,
      },
      {
        id: 'item-fl-004',
        sectionId: 'section-fl-002',
        question: 'Mast chains in good condition',
        type: 'PassFail',
        required: true,
        safetyCritical: true,
        critical: true,
        order: 4,
        photoRequiredOnFail: true,
      },
      {
        id: 'item-fl-005',
        sectionId: 'section-fl-003',
        question: 'Brakes operational',
        type: 'PassFail',
        required: true,
        safetyCritical: true,
        critical: true,
        order: 5,
        photoRequiredOnFail: false,
      },
      {
        id: 'item-fl-006',
        sectionId: 'section-fl-003',
        question: 'Steering responsive',
        type: 'PassFail',
        required: true,
        safetyCritical: true,
        critical: true,
        order: 6,
        photoRequiredOnFail: false,
      },
      {
        id: 'item-fl-007',
        sectionId: 'section-fl-003',
        question: 'Horn working',
        type: 'PassFail',
        required: true,
        safetyCritical: false,
        critical: false,
        order: 7,
        photoRequiredOnFail: false,
      },
      {
        id: 'item-fl-008',
        sectionId: 'section-fl-003',
        question: 'Seatbelt functional',
        type: 'PassFail',
        required: true,
        safetyCritical: true,
        critical: true,
        order: 8,
        photoRequiredOnFail: false,
      },
      {
        id: 'item-fl-009',
        sectionId: 'section-fl-004',
        question: 'Tyres in good condition',
        type: 'PassFail',
        required: true,
        safetyCritical: false,
        critical: false,
        order: 9,
        photoRequiredOnFail: false,
      },
      {
        id: 'item-fl-010',
        sectionId: 'section-fl-004',
        question: 'Wheel nuts secure',
        type: 'PassFail',
        required: true,
        safetyCritical: true,
        critical: true,
        order: 10,
        photoRequiredOnFail: true,
      },
      {
        id: 'item-fl-011',
        sectionId: 'section-fl-005',
        question: 'Lifts and lowers smoothly',
        type: 'PassFail',
        required: true,
        safetyCritical: false,
        critical: false,
        order: 11,
        photoRequiredOnFail: false,
      },
      {
        id: 'item-fl-012',
        sectionId: 'section-fl-005',
        question: 'No hydraulic leaks',
        type: 'PassFail',
        required: true,
        safetyCritical: false,
        critical: false,
        order: 12,
        photoRequiredOnFail: true,
      },
      {
        id: 'item-fl-013',
        sectionId: 'section-fl-005',
        question: 'Operator notes',
        type: 'Text',
        required: false,
        safetyCritical: false,
        critical: false,
        order: 13,
        photoRequiredOnFail: false,
      },
    ],
    checklistIds: ['checklist-006'],
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    createdBy: 'user-1',
    createdByName: 'John Smith',
    updatedAt: '2025-01-01T00:00:00Z',
    updatedBy: 'user-1',
    updatedByName: 'John Smith',
  },
  {
    id: 'template-007',
    name: 'Pump Monthly Inspection',
    description: 'Monthly maintenance inspection for pumps',
    category: 'Pump Monthly',
    assetTypeCodes: ['PU'],
    version: 'v1',
    versions: [
      {
        version: 'v1',
        createdAt: '2025-01-01T00:00:00Z',
        createdBy: 'user-1',
        createdByName: 'John Smith',
      },
    ],
    sections: [
      { id: 'section-014', title: 'Performance', order: 1 },
      { id: 'section-015', title: 'Seals', order: 2 },
    ],
    items: [
      {
        id: 'item-015',
        sectionId: 'section-014',
        question: 'Check pump pressure',
        type: 'Number',
        required: true,
        critical: false,
        order: 1,
        unit: 'psi',
        minValue: 50,
        maxValue: 100,
        photoRequiredOnFail: false,
      },
      {
        id: 'item-016',
        sectionId: 'section-015',
        question: 'Inspect seals for leaks',
        type: 'PassFail',
        required: true,
        critical: true,
        order: 2,
        photoRequiredOnFail: true,
      },
    ],
    checklistIds: ['checklist-007'],
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    createdBy: 'user-1',
    createdByName: 'John Smith',
    updatedAt: '2025-01-01T00:00:00Z',
    updatedBy: 'user-1',
    updatedByName: 'John Smith',
  },
  {
    id: 'template-008',
    name: 'LOLER Inspection',
    description: 'LOLER compliance inspection template',
    category: 'LOLER',
    assetTypeCodes: ['CR', 'MEWP'],
    version: 'v1',
    versions: [
      {
        version: 'v1',
        createdAt: '2025-01-01T00:00:00Z',
        createdBy: 'user-1',
        createdByName: 'John Smith',
      },
    ],
    sections: [
      { id: 'section-016', title: 'LOLER Compliance', order: 1 },
    ],
    items: [
      {
        id: 'item-017',
        sectionId: 'section-016',
        question: 'Load test certificate valid',
        type: 'PassFail',
        required: true,
        critical: true,
        order: 1,
        photoRequiredOnFail: false,
        complianceTag: 'LOLER',
      },
      {
        id: 'item-018',
        sectionId: 'section-016',
        question: 'Safety devices functional',
        type: 'PassFail',
        required: true,
        critical: true,
        order: 2,
        photoRequiredOnFail: false,
        complianceTag: 'LOLER',
      },
    ],
    checklistIds: ['checklist-008'],
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    createdBy: 'user-1',
    createdByName: 'John Smith',
    updatedAt: '2025-01-01T00:00:00Z',
    updatedBy: 'user-1',
    updatedByName: 'John Smith',
  },
  {
    id: 'template-009',
    name: 'PUWER Inspection',
    description: 'PUWER compliance inspection template',
    category: 'PUWER',
    assetTypeCodes: ['EX', 'FL', 'MEWP'],
    version: 'v1',
    versions: [
      {
        version: 'v1',
        createdAt: '2025-01-01T00:00:00Z',
        createdBy: 'user-1',
        createdByName: 'John Smith',
      },
    ],
    sections: [
      { id: 'section-017', title: 'PUWER Compliance', order: 1 },
    ],
    items: [
      {
        id: 'item-019',
        sectionId: 'section-017',
        question: 'Guards and safety devices in place',
        type: 'PassFail',
        required: true,
        critical: true,
        order: 1,
        photoRequiredOnFail: true,
        complianceTag: 'PUWER',
      },
      {
        id: 'item-020',
        sectionId: 'section-017',
        question: 'Emergency stop functional',
        type: 'PassFail',
        required: true,
        critical: true,
        order: 2,
        photoRequiredOnFail: false,
        complianceTag: 'PUWER',
      },
    ],
    checklistIds: ['checklist-009'],
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    createdBy: 'user-1',
    createdByName: 'John Smith',
    updatedAt: '2025-01-01T00:00:00Z',
    updatedBy: 'user-1',
    updatedByName: 'John Smith',
  },
  {
    id: 'template-010',
    name: 'Plant Acceptance Check',
    description: 'Initial acceptance inspection for new plant',
    category: 'Plant Acceptance',
    version: 'v1',
    versions: [
      {
        version: 'v1',
        createdAt: '2025-01-01T00:00:00Z',
        createdBy: 'user-1',
        createdByName: 'John Smith',
      },
    ],
    sections: [
      { id: 'section-018', title: 'Documentation', order: 1 },
      { id: 'section-019', title: 'Physical Inspection', order: 2 },
    ],
    items: [
      {
        id: 'item-021',
        sectionId: 'section-018',
        question: 'Manufacturer documentation received',
        type: 'PassFail',
        required: true,
        critical: false,
        order: 1,
        photoRequiredOnFail: false,
      },
      {
        id: 'item-022',
        sectionId: 'section-019',
        question: 'Visual inspection of equipment',
        type: 'PassFail',
        required: true,
        critical: true,
        order: 2,
        photoRequiredOnFail: true,
      },
    ],
    checklistIds: ['checklist-010'],
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    createdBy: 'user-1',
    createdByName: 'John Smith',
    updatedAt: '2025-01-01T00:00:00Z',
    updatedBy: 'user-1',
    updatedByName: 'John Smith',
  },
];

export function getCheckSheetTemplates(): CheckSheetTemplate[] {
  return [...mockCheckSheetTemplates];
}

export function getCheckSheetTemplateById(id: string): CheckSheetTemplate | undefined {
  return mockCheckSheetTemplates.find((t) => t.id === id);
}

// ============================================================================
// INSPECTION RECORDS (30+ records)
// ============================================================================

// Helper function to generate inspection code
function generateInspectionCode(index: number): string {
  return `INSP-${String(index).padStart(6, '0')}`;
}

// Helper function to create a basic history entry
function createHistoryEntry(
  type: InspectionHistoryEntry['type'],
  by: string,
  byName: string,
  summary: string,
  at?: string
): InspectionHistoryEntry {
  return {
    id: crypto.randomUUID(),
    type,
    by,
    byName,
    summary,
    at: at || new Date().toISOString(),
  };
}

// Helper to create answers for an inspection based on template
function createAnswersForInspection(
  template: CheckSheetTemplate,
  result: 'Pass' | 'Fail' | 'Pending',
  hasFailures: boolean = false,
  partialCompletion: number = 0 // 0-100, percentage of items to complete
): ChecklistItemAnswer[] {
  const totalItems = template.items.length;
  const itemsToComplete = partialCompletion > 0 
    ? Math.max(1, Math.floor((partialCompletion / 100) * totalItems))
    : totalItems;
  
  return template.items.map((item, index) => {
    let itemResult: 'Pass' | 'Fail' | 'NA' | null = null;
    
    // For Pending status with partial completion, only complete some items
    if (result === 'Pending') {
      if (index < itemsToComplete) {
        // Complete this item (randomly Pass or NA for variety)
        itemResult = Math.random() > 0.1 ? 'Pass' : 'NA';
        
        // For Number type items, add a value
        if (item.type === 'Number') {
          const min = item.minValue || 0;
          const max = item.maxValue || 100;
          const value = min + Math.random() * (max - min);
          return {
            id: crypto.randomUUID(),
            checklistItemId: item.id,
            result: null,
            numericValue: Math.round(value * 10) / 10,
          };
        }
        
        return {
          id: crypto.randomUUID(),
          checklistItemId: item.id,
          result: itemResult,
        };
      } else {
        // Leave this item incomplete
        return {
          id: crypto.randomUUID(),
          checklistItemId: item.id,
          result: null,
        };
      }
    }
    
    // For completed inspections
    if (hasFailures && index === template.items.length - 1) {
      // Make the last item fail if we want failures
      itemResult = 'Fail';
    } else {
      itemResult = 'Pass';
    }
    
    return {
      id: crypto.randomUUID(),
      checklistItemId: item.id,
      result: itemResult,
      comment: itemResult === 'Fail' ? `Issue found: ${item.question}` : undefined,
      photoUri: itemResult === 'Fail' && item.photoRequiredOnFail ? '/placeholder-photo.jpg' : undefined,
    };
  });
}

// Create 30+ inspection records
const mockInspections: Inspection[] = [];

// Helper to get a template by category
function getTemplateByCategory(category: string): CheckSheetTemplate {
  return mockCheckSheetTemplates.find(t => t.category.includes(category)) || mockCheckSheetTemplates[0];
}

// Generate 30+ diverse inspection records
const inspectionData = [
  // Completed - Pass
  { template: 'MEWP Weekly', asset: 'AST-000002', site: '1', location: 'Yard 2', inspector: 0, status: 'Completed', result: 'Pass', date: '2025-12-14', completed: '2025-12-14T10:30:00Z' },
  { template: 'Compressor Daily', asset: 'AST-000006', site: '1', location: 'Workshop', inspector: 1, status: 'Completed', result: 'Pass', date: '2025-12-15', completed: '2025-12-15T08:30:00Z' },
  { template: 'Crane Pre-Start', asset: 'AST-000003', site: '2', location: 'Crane Pad', inspector: 6, status: 'Completed', result: 'Pass', date: '2025-12-10', completed: '2025-12-10T11:00:00Z' },
  { template: 'Generator Weekly', asset: 'AST-000005', site: '1', location: 'Power Station', inspector: 0, status: 'Completed', result: 'Pass', date: '2025-12-12', completed: '2025-12-12T09:15:00Z' },
  { template: 'Excavator Daily', asset: 'AST-000001', site: '1', location: 'Yard 1', inspector: 2, status: 'Completed', result: 'Pass', date: '2025-12-15', completed: '2025-12-15T07:00:00Z' },
  { template: 'Forklift Weekly', asset: 'AST-000004', site: '3', location: 'Warehouse', inspector: 3, status: 'Completed', result: 'Pass', date: '2025-12-13', completed: '2025-12-13T14:20:00Z' },
  { template: 'Pump Monthly', asset: 'AST-000008', site: '2', location: 'Tunnel', inspector: 5, status: 'Completed', result: 'Pass', date: '2025-12-11', completed: '2025-12-11T10:45:00Z' },
  { template: 'LOLER', asset: 'AST-000003', site: '2', location: 'Crane Pad', inspector: 6, status: 'Completed', result: 'Pass', date: '2025-12-08', completed: '2025-12-08T13:00:00Z' },
  
  // Completed - Fail
  { template: 'MEWP Weekly', asset: 'AST-000002', site: '1', location: 'Yard 2', inspector: 1, status: 'Completed', result: 'Fail', date: '2025-12-13', completed: '2025-12-13T15:20:00Z', hasFailures: true },
  { template: 'Generator Weekly', asset: 'AST-000005', site: '1', location: 'Power Station', inspector: 2, status: 'Completed', result: 'Fail', date: '2025-12-12', completed: '2025-12-12T12:15:00Z', hasFailures: true },
  { template: 'Forklift Weekly', asset: 'AST-000004', site: '3', location: 'Warehouse', inspector: 3, status: 'Completed', result: 'Fail', date: '2025-12-11', completed: '2025-12-11T16:30:00Z', hasFailures: true },
  { template: 'Excavator Daily', asset: 'AST-000001', site: '1', location: 'Yard 1', inspector: 0, status: 'Completed', result: 'Fail', date: '2025-12-10', completed: '2025-12-10T11:45:00Z', hasFailures: true },
  { template: 'Crane Pre-Start', asset: 'AST-000003', site: '2', location: 'Crane Pad', inspector: 6, status: 'Completed', result: 'Fail', date: '2025-12-09', completed: '2025-12-09T09:20:00Z', hasFailures: true },
  
  // Draft
  { template: 'MEWP Weekly', asset: 'AST-000002', site: '1', location: 'Yard 2', inspector: 0, status: 'Draft', result: 'Pending', date: '2025-12-16' },
  { template: 'Compressor Daily', asset: 'AST-000006', site: '1', location: 'Workshop', inspector: 1, status: 'Draft', result: 'Pending', date: '2025-12-16' },
  { template: 'Excavator Daily', asset: 'AST-000001', site: '1', location: 'Yard 1', inspector: 2, status: 'Draft', result: 'Pending', date: '2025-12-17' },
  { template: 'Generator Weekly', asset: 'AST-000005', site: '1', location: 'Power Station', inspector: 0, status: 'Draft', result: 'Pending', date: '2025-12-18' },
  { template: 'Forklift Weekly', asset: 'AST-000004', site: '3', location: 'Warehouse', inspector: 3, status: 'Draft', result: 'Pending', date: '2025-12-17' },
  
  // InProgress (with partial completion 30-60%)
  { template: 'MEWP Weekly', asset: 'AST-000002', site: '1', location: 'Yard 2', inspector: 0, status: 'InProgress', result: 'Pending', date: '2025-12-15', started: '2025-12-15T09:00:00Z', partialCompletion: 45 },
  { template: 'Compressor Daily', asset: 'AST-000006', site: '1', location: 'Workshop', inspector: 1, status: 'InProgress', result: 'Pending', date: '2025-12-15', started: '2025-12-15T08:00:00Z', partialCompletion: 60 },
  { template: 'Excavator Daily', asset: 'AST-000001', site: '1', location: 'Yard 1', inspector: 2, status: 'InProgress', result: 'Pending', date: '2025-12-15', started: '2025-12-15T10:00:00Z', partialCompletion: 35 },
  
  // Submitted
  { template: 'Generator Weekly', asset: 'AST-000005', site: '1', location: 'Power Station', inspector: 0, status: 'Submitted', result: 'Pass', date: '2025-12-14', submitted: '2025-12-14T10:30:00Z' },
  { template: 'Pump Monthly', asset: 'AST-000008', site: '2', location: 'Tunnel', inspector: 5, status: 'Submitted', result: 'Pass', date: '2025-12-13', submitted: '2025-12-13T11:20:00Z' },
  { template: 'LOLER', asset: 'AST-000003', site: '2', location: 'Crane Pad', inspector: 6, status: 'Submitted', result: 'Pass', date: '2025-12-12', submitted: '2025-12-12T14:00:00Z' },
  { template: 'PUWER', asset: 'AST-000001', site: '1', location: 'Yard 1', inspector: 0, status: 'Submitted', result: 'Pass', date: '2025-12-11', submitted: '2025-12-11T15:30:00Z' },
  
  // Approved
  { template: 'MEWP Weekly', asset: 'AST-000002', site: '1', location: 'Yard 2', inspector: 0, status: 'Approved', result: 'Pass', date: '2025-12-10', submitted: '2025-12-10T11:30:00Z', approved: '2025-12-10T14:00:00Z' },
  { template: 'Generator Weekly', asset: 'AST-000005', site: '1', location: 'Power Station', inspector: 1, status: 'Approved', result: 'Pass', date: '2025-12-09', submitted: '2025-12-09T10:30:00Z', approved: '2025-12-09T13:00:00Z' },
  
  // Closed
  { template: 'Crane Pre-Start', asset: 'AST-000003', site: '2', location: 'Crane Pad', inspector: 6, status: 'Closed', result: 'Pass', date: '2025-12-08', submitted: '2025-12-08T11:00:00Z', approved: '2025-12-08T14:00:00Z', closed: '2025-12-08T15:00:00Z' },
  { template: 'Pump Monthly', asset: 'AST-000008', site: '2', location: 'Tunnel', inspector: 5, status: 'Closed', result: 'Pass', date: '2025-12-07', submitted: '2025-12-07T10:00:00Z', approved: '2025-12-07T13:00:00Z', closed: '2025-12-07T15:00:00Z' },
  
  // Overdue (draft with past due date)
  { template: 'MEWP Weekly', asset: 'AST-000002', site: '1', location: 'Yard 2', inspector: 0, status: 'Draft', result: 'Pending', date: '2025-12-10', dueDate: '2025-12-10T17:00:00Z' },
  { template: 'Compressor Daily', asset: 'AST-000006', site: '1', location: 'Workshop', inspector: 1, status: 'Draft', result: 'Pending', date: '2025-12-11', dueDate: '2025-12-11T17:00:00Z' },
  { template: 'Excavator Daily', asset: 'AST-000001', site: '1', location: 'Yard 1', inspector: 2, status: 'Draft', result: 'Pending', date: '2025-12-12', dueDate: '2025-12-12T17:00:00Z' },
];

// Generate inspection records from the data
inspectionData.forEach((data, index) => {
  const template = (data as any).templateId 
    ? mockCheckSheetTemplates.find(t => t.id === (data as any).templateId)
    : getTemplateByCategory(data.template);
  if (!template) {
    console.warn(`Template not found for inspection ${index + 1}`);
    return;
  }
  const inspector = mockUsers[data.inspector];
  const site = mockSites.find(s => s.id === data.site);
  const inspectionDate = new Date(`${data.date}T09:00:00Z`);
  
  const hasFailures = (data as any).hasFailures || false;
  const partialCompletion = (data as any).partialCompletion || 0;
  const answers = createAnswersForInspection(template, data.result as 'Pass' | 'Fail' | 'Pending', hasFailures, partialCompletion);
  
  // Determine final result
  let finalResult: 'Pass' | 'Fail' | 'Pending' = data.result as 'Pass' | 'Fail' | 'Pending';
  if (data.result === 'Pending') {
    finalResult = 'Pending';
  } else if (hasFailures || answers.some(a => a.result === 'Fail')) {
    finalResult = 'Fail';
  } else {
    finalResult = 'Pass';
  }
  
  // Count defects (failures that would create defects)
  const defectsCount = answers.filter(a => a.result === 'Fail' && template.items.find(i => i.id === a.checklistItemId)?.critical).length;
  const linkedDefectIds = defectsCount > 0 ? Array.from({ length: defectsCount }, (_, i) => `DEF-${String(100000 + index * 10 + i).padStart(6, '0')}`) : [];
  
  const inspection: Inspection = {
    id: crypto.randomUUID(),
    inspectionCode: generateInspectionCode(index + 1),
    templateId: template.id,
    templateName: template.name,
    templateVersion: template.version,
    inspectionType: template.category.includes('Daily') ? 'Daily' : 
                     template.category.includes('Weekly') ? 'Weekly' :
                     template.category.includes('Monthly') ? 'Monthly' :
                     template.category.includes('Pre-Start') ? 'PreUse' :
                     template.category.includes('LOLER') ? 'TimeBased' :
                     template.category.includes('PUWER') ? 'TimeBased' :
                     'PlantAcceptance',
    result: finalResult,
    status: (data.status === 'Completed' ? 'Closed' : data.status) as Inspection['status'],
    assetId: data.asset,
    assetTypeCode: template.assetTypeCodes?.[0] || 'GEN',
    assetMake: 'Unknown',
    assetModel: 'Unknown',
    siteId: data.site,
    siteName: site?.name || 'Unknown Site',
    locationName: data.location,
    sections: template.sections,
    items: template.items,
    answers: answers,
    attachments: [],
    signatures: data.status === 'Completed' || data.status === 'Approved' || data.status === 'Closed' ? [{
      id: crypto.randomUUID(),
      role: 'inspector',
      method: 'typed',
      signature: inspector.name,
      signedAt: (data as any).completed || (data as any).submitted || inspectionDate.toISOString(),
      signedBy: inspector.id,
      signedByName: inspector.name,
    }] : [],
    inspectionDate: inspectionDate.toISOString(),
    startedAt: (data as any).started,
    completedAt: (data as any).completed,
    submittedAt: (data as any).submitted,
    approvedAt: (data as any).approved,
    closedAt: (data as any).closed,
    dueDate: (data as any).dueDate,
    inspectorId: inspector.id,
    inspectorName: inspector.name,
    linkedDefectIds: linkedDefectIds,
    createdAt: new Date(inspectionDate.getTime() - 3600000).toISOString(), // 1 hour before inspection
    createdBy: inspector.id,
    createdByName: inspector.name,
    updatedAt: (data as any).completed || (data as any).submitted || inspectionDate.toISOString(),
    updatedBy: inspector.id,
    updatedByName: inspector.name,
    history: [
      createHistoryEntry('status_change', inspector.id, inspector.name, `Inspection created`, new Date(inspectionDate.getTime() - 3600000).toISOString()),
      ...(data.status !== 'Draft' ? [createHistoryEntry('status_change', inspector.id, inspector.name, `Status changed to ${data.status}`, (data as any).completed || (data as any).submitted || inspectionDate.toISOString())] : []),
    ],
    revisionNumber: 1,
  };
  
  mockInspections.push(inspection);
});

export function getInspections(filter?: InspectionFilter): Inspection[] {
  let filtered = [...mockInspections];

  if (!filter) {
    return filtered;
  }

  // Search filter
  if (filter.search) {
    const searchLower = filter.search.toLowerCase();
    filtered = filtered.filter(
      (ins) =>
        ins.inspectionCode.toLowerCase().includes(searchLower) ||
        ins.assetId.toLowerCase().includes(searchLower) ||
        ins.assetTypeCode?.toLowerCase().includes(searchLower) ||
        ins.templateName.toLowerCase().includes(searchLower) ||
        ins.inspectorName.toLowerCase().includes(searchLower) ||
        ins.siteName?.toLowerCase().includes(searchLower) ||
        ins.locationName?.toLowerCase().includes(searchLower)
    );
  }

  // Result filter
  if (filter.result) {
    filtered = filtered.filter((ins) => ins.result === filter.result);
  }

  // Status filter
  if (filter.status) {
    filtered = filtered.filter((ins) => ins.status === filter.status);
  }

  // Site filter
  if (filter.siteId) {
    filtered = filtered.filter((ins) => ins.siteId === filter.siteId);
  }

  // Asset filter
  if (filter.assetId) {
    filtered = filtered.filter((ins) => ins.assetId === filter.assetId);
  }

  // Inspector filter
  if (filter.inspectorId) {
    filtered = filtered.filter((ins) => ins.inspectorId === filter.inspectorId);
  }

  // Type filter
  if (filter.inspectionType) {
    filtered = filtered.filter((ins) => ins.inspectionType === filter.inspectionType);
  }

  // Quick filters
  if (filter.showMyInspections) {
    // In real app, this would filter by current user
    filtered = filtered.filter((ins) => ins.inspectorId === 'user-1');
  }

  if (filter.showDrafts) {
    filtered = filtered.filter((ins) => ins.status === 'Draft');
  }

  if (filter.showFailed) {
    filtered = filtered.filter((ins) => ins.result === 'Fail');
  }

  if (filter.showDueSoon) {
    const today = new Date();
    const in7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    filtered = filtered.filter((ins) => {
      if (!ins.dueDate) return false;
      const dueDate = new Date(ins.dueDate);
      return dueDate >= today && dueDate <= in7Days && (ins.status === 'Draft' || ins.status === 'InProgress');
    });
  }

  if (filter.showOverdue) {
    const today = new Date();
    filtered = filtered.filter((ins) => {
      if (!ins.dueDate) return false;
      return new Date(ins.dueDate) < today && (ins.status === 'Draft' || ins.status === 'InProgress');
    });
  }

  // Date range filter
  if (filter.dateFrom) {
    const fromDate = new Date(filter.dateFrom);
    filtered = filtered.filter((ins) => new Date(ins.inspectionDate) >= fromDate);
  }

  if (filter.dateTo) {
    const toDate = new Date(filter.dateTo);
    filtered = filtered.filter((ins) => new Date(ins.inspectionDate) <= toDate);
  }

  return filtered;
}

export function getInspectionById(id: string): Inspection | undefined {
  // Try by inspectionCode first, then by id
  return mockInspections.find((ins) => ins.inspectionCode === id || ins.id === id);
}

export function getInspectionAlerts(): Inspection[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return mockInspections.filter((ins) => {
    const isOverdue = ins.dueDate && 
      new Date(ins.dueDate) < today && 
      (ins.status === 'Draft' || ins.status === 'InProgress');
    const isFailed = ins.result === 'Fail' && 
      (ins.status !== 'Closed' && ins.status !== 'Approved');
    return isOverdue || isFailed;
  });
}

/**
 * Check if a template is currently available for use
 * Template is available when:
 * - isActive === true
 * - today >= startDate (if startDate is provided)
 * - today <= endDate (if endDate is provided)
 */
export function isTemplateAvailable(template: { isActive: boolean; startDate?: string; endDate?: string }): boolean {
  if (!template.isActive) {
    return false;
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Check start date
  if (template.startDate) {
    const start = new Date(template.startDate);
    start.setHours(0, 0, 0, 0);
    if (today < start) {
      return false;
    }
  }
  
  // Check end date
  if (template.endDate) {
    const end = new Date(template.endDate);
    end.setHours(23, 59, 59, 999);
    if (today > end) {
      return false;
    }
  }
  
  return true;
}
