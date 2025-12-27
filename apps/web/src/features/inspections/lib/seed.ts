import { createTemplate, createInspection } from '../db/repository';
import type { InspectionTemplate, Inspection } from '../types';

// Seed templates for development
export async function seedTemplates(): Promise<void> {
  const { getAllTemplates } = await import('../db/repository');
  const existing = await getAllTemplates();
  if (existing.length > 0) {
    console.log('Templates already seeded, skipping...');
    return;
  }

  const templates: Omit<InspectionTemplate, 'id'>[] = [
    {
      name: 'Daily Pre-Start Inspection - Excavator',
      description: 'Daily pre-start safety and operational check for excavators',
      inspectionType: 'Daily',
      assetTypeId: '2', // Excavator
      assetTypeCode: 'EX',
      version: 'v1',
      versions: [
        {
          version: 'v1',
          createdAt: new Date().toISOString(),
          createdBy: 'system',
          createdByName: 'System',
        },
      ],
      sections: [
        { id: '1', title: 'Engine & Hydraulics', order: 1 },
        { id: '2', title: 'Safety Systems', order: 2 },
        { id: '3', title: 'General Condition', order: 3 },
      ],
      items: [
        {
          id: '1',
          sectionId: '1',
          question: 'Check engine oil level',
          type: 'PassFail',
          required: true,
          critical: false,
          order: 1,
          photoRequiredOnFail: true,
          defaultSeverity: 'Medium',
        },
        {
          id: '2',
          sectionId: '1',
          question: 'Check hydraulic fluid level',
          type: 'PassFail',
          required: true,
          critical: false,
          order: 2,
          photoRequiredOnFail: true,
          defaultSeverity: 'High',
        },
        {
          id: '3',
          sectionId: '1',
          question: 'Check for hydraulic leaks',
          type: 'PassFailNA',
          required: true,
          critical: true,
          order: 3,
          photoRequiredOnFail: true,
          defaultSeverity: 'High',
        },
        {
          id: '4',
          sectionId: '2',
          question: 'Test emergency stop function',
          type: 'PassFail',
          required: true,
          critical: true,
          order: 4,
          photoRequiredOnFail: false,
          defaultSeverity: 'Critical',
          complianceTag: 'PUWER',
        },
        {
          id: '5',
          sectionId: '2',
          question: 'Check safety guards in place',
          type: 'PassFail',
          required: true,
          critical: true,
          order: 5,
          photoRequiredOnFail: true,
          defaultSeverity: 'Critical',
          complianceTag: 'PUWER',
        },
        {
          id: '6',
          sectionId: '3',
          question: 'Visual inspection of tracks/chassis',
          type: 'PassFail',
          required: false,
          critical: false,
          order: 6,
          photoRequiredOnFail: false,
        },
        {
          id: '7',
          sectionId: '3',
          question: 'Check tire pressure (PSI)',
          type: 'Number',
          required: false,
          critical: false,
          order: 7,
          unit: 'PSI',
          minValue: 30,
          maxValue: 50,
          photoRequiredOnFail: false,
        },
        {
          id: '8',
          sectionId: '3',
          question: 'Additional notes or observations',
          type: 'Text',
          required: false,
          critical: false,
          order: 8,
          photoRequiredOnFail: false,
        },
      ],
      isActive: true,
      createdAt: new Date().toISOString(),
      createdBy: 'system',
      createdByName: 'System',
      updatedAt: new Date().toISOString(),
      updatedBy: 'system',
      updatedByName: 'System',
    },
    {
      name: 'Weekly Safety Inspection - MEWP',
      description: 'Weekly safety inspection for Mobile Elevating Work Platforms',
      inspectionType: 'Weekly',
      assetTypeId: '1', // MEWP
      assetTypeCode: 'MEWP',
      version: 'v1',
      versions: [
        {
          version: 'v1',
          createdAt: new Date().toISOString(),
          createdBy: 'system',
          createdByName: 'System',
        },
      ],
      sections: [
        { id: '1', title: 'Platform & Controls', order: 1 },
        { id: '2', title: 'Lifting Mechanism', order: 2 },
        { id: '3', title: 'Safety Equipment', order: 3 },
      ],
      items: [
        {
          id: '1',
          sectionId: '1',
          question: 'Platform guardrails secure and undamaged',
          type: 'PassFail',
          required: true,
          critical: true,
          order: 1,
          photoRequiredOnFail: true,
          defaultSeverity: 'Critical',
          complianceTag: 'LOLER',
        },
        {
          id: '2',
          sectionId: '1',
          question: 'Emergency controls functional',
          type: 'PassFail',
          required: true,
          critical: true,
          order: 2,
          photoRequiredOnFail: false,
          defaultSeverity: 'Critical',
        },
        {
          id: '3',
          sectionId: '2',
          question: 'Hydraulic system pressure (PSI)',
          type: 'Number',
          required: true,
          critical: false,
          order: 3,
          unit: 'PSI',
          minValue: 2000,
          maxValue: 3000,
          photoRequiredOnFail: false,
          defaultSeverity: 'High',
        },
        {
          id: '4',
          sectionId: '2',
          question: 'No visible hydraulic leaks',
          type: 'PassFailNA',
          required: true,
          critical: true,
          order: 4,
          photoRequiredOnFail: true,
          defaultSeverity: 'High',
        },
        {
          id: '5',
          sectionId: '3',
          question: 'Safety harness anchor points secure',
          type: 'PassFail',
          required: true,
          critical: true,
          order: 5,
          photoRequiredOnFail: true,
          defaultSeverity: 'Critical',
          complianceTag: 'LOLER',
        },
      ],
      isActive: true,
      createdAt: new Date().toISOString(),
      createdBy: 'system',
      createdByName: 'System',
      updatedAt: new Date().toISOString(),
      updatedBy: 'system',
      updatedByName: 'System',
    },
    {
      name: 'Monthly PM Inspection - Generator',
      description: 'Monthly preventive maintenance inspection for generators',
      inspectionType: 'Monthly',
      assetTypeId: '6', // Generator
      assetTypeCode: 'GEN',
      version: 'v1',
      versions: [
        {
          version: 'v1',
          createdAt: new Date().toISOString(),
          createdBy: 'system',
          createdByName: 'System',
        },
      ],
      sections: [
        { id: '1', title: 'Engine', order: 1 },
        { id: '2', title: 'Electrical', order: 2 },
        { id: '3', title: 'Cooling System', order: 3 },
      ],
      items: [
        {
          id: '1',
          sectionId: '1',
          question: 'Engine oil level within range',
          type: 'PassFail',
          required: true,
          critical: false,
          order: 1,
          photoRequiredOnFail: true,
          defaultSeverity: 'Medium',
        },
        {
          id: '2',
          sectionId: '1',
          question: 'Air filter condition',
          type: 'PassFail',
          required: true,
          critical: false,
          order: 2,
          photoRequiredOnFail: true,
          defaultSeverity: 'Low',
        },
        {
          id: '3',
          sectionId: '2',
          question: 'Output voltage (V)',
          type: 'Number',
          required: true,
          critical: false,
          order: 3,
          unit: 'V',
          minValue: 220,
          maxValue: 240,
          photoRequiredOnFail: false,
          defaultSeverity: 'High',
        },
        {
          id: '4',
          sectionId: '2',
          question: 'Electrical connections secure',
          type: 'PassFail',
          required: true,
          critical: true,
          order: 4,
          photoRequiredOnFail: true,
          defaultSeverity: 'High',
        },
        {
          id: '5',
          sectionId: '3',
          question: 'Coolant level',
          type: 'PassFail',
          required: true,
          critical: false,
          order: 5,
          photoRequiredOnFail: true,
          defaultSeverity: 'Medium',
        },
        {
          id: '6',
          sectionId: '3',
          question: 'Radiator condition',
          type: 'PassFail',
          required: false,
          critical: false,
          order: 6,
          photoRequiredOnFail: false,
        },
      ],
      isActive: true,
      createdAt: new Date().toISOString(),
      createdBy: 'system',
      createdByName: 'System',
      updatedAt: new Date().toISOString(),
      updatedBy: 'system',
      updatedByName: 'System',
    },
  ];

  for (const template of templates) {
    await createTemplate(template);
  }

  console.log(`Seeded ${templates.length} inspection templates`);
}

// Seed sample inspections (optional, for dev)
export async function seedInspections(): Promise<void> {
  const { getAllInspections } = await import('../db/repository');
  const existing = await getAllInspections();
  if (existing.length > 0) {
    console.log('Inspections already seeded, skipping...');
    return;
  }

  // This would create sample inspections from templates
  // For now, we'll let users create inspections manually
  console.log('Inspection seeding skipped - create inspections manually');
}
