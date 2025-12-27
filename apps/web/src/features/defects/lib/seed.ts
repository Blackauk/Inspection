import { createDefect, getDefectSettings } from '../db/repository';
import type { Defect } from '../types';

// Seed data for development
export async function seedDefects(): Promise<void> {
  const settings = await getDefectSettings();
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const seedData: Omit<Defect, 'id' | 'defectCode' | 'unsafeDoNotUse' | 'history'>[] = [
    // Defect #1: Hydraulic leak at lift ram (minor seep)
    {
      title: 'Hydraulic leak at lift ram (minor seep)',
      description: 'Light oil seep visible at the rod seal on the lift ram. Drips observed after operating for ~15 minutes. No pooling on ground. Cleaned area and rechecked; seep returned. Recommend seal inspection and monitor daily until repaired.',
      severityModel: 'LMH',
      severity: 'Medium',
      status: 'Open',
      reopenedCount: 0,
      targetRectificationDate: '2026-01-10',
      actions: [],
      attachments: [],
      beforeAfterRequired: false,
      complianceTags: [],
      assetId: 'AST-000001',
      siteId: '1',
      siteName: 'Atlas Road – Gate B',
      createdAt: '2025-12-27T14:12:00.000Z',
      createdBy: 'user-1',
      createdByName: 'M. Jones',
      updatedAt: '2025-12-27T14:12:00.000Z',
      updatedBy: 'user-1',
      updatedByName: 'M. Jones',
      comments: [],
    },

    // Defect #2: Safety-critical: E-Stop not latching on control panel
    {
      title: 'Safety-critical: E-Stop not latching on control panel',
      description: 'E-Stop button on operator panel does not latch when pressed. Machine can be restarted without reset sequence. Isolated equipment and placed "Do Not Use" tag. Requires immediate electrical inspection and functional test before returning to service.',
      severityModel: 'LMH',
      severity: 'High',
      status: 'Open',
      reopenedCount: 0,
      unsafeDoNotUse: true,
      targetRectificationDate: '2025-12-28',
      actions: [],
      attachments: [],
      beforeAfterRequired: true,
      complianceTags: [],
      assetId: 'AST-000147',
      siteId: '2',
      siteName: 'West Ruislip – TBM Launch',
      createdAt: '2025-12-27T09:40:00.000Z',
      createdBy: 'user-2',
      createdByName: 'Supervisor (Shift A)',
      updatedAt: '2025-12-27T09:40:00.000Z',
      updatedBy: 'user-2',
      updatedByName: 'Supervisor (Shift A)',
      comments: [],
    },

    // Defect #3: Excessive vibration on conveyor drive (bearing suspected)
    {
      title: 'Excessive vibration on conveyor drive (bearing suspected)',
      description: 'Noticed increased vibration and abnormal noise from conveyor drive-end. Thermal spot check shows drive-end housing hotter than normal. Vibration trending recommended; likely bearing wear. Plan replacement at next available shutdown window.',
      severityModel: 'LMH',
      severity: 'Medium',
      status: 'Open',
      reopenedCount: 0,
      targetRectificationDate: '2026-01-05',
      actions: [],
      attachments: [],
      beforeAfterRequired: false,
      complianceTags: [],
      assetId: 'AST-000322',
      siteId: '3',
      siteName: 'Segment Yard',
      createdAt: '2025-12-26T23:10:00.000Z',
      createdBy: 'user-3',
      createdByName: 'Technician – Nights',
      updatedAt: '2025-12-26T23:10:00.000Z',
      updatedBy: 'user-3',
      updatedByName: 'Technician – Nights',
      comments: [],
    },

    // Defect #4: Missing guarding on rotating coupling (temporary removed)
    {
      title: 'Missing guarding on rotating coupling (temporary removed)',
      description: 'Coupling guard has been removed for access and not refitted. Rotating component exposed. Area cordoned and guard requested from stores. Do not operate until guard is refitted and inspection completed.',
      severityModel: 'LMH',
      severity: 'High',
      status: 'Open',
      reopenedCount: 0,
      targetRectificationDate: '2025-12-29',
      actions: [],
      attachments: [],
      beforeAfterRequired: true,
      complianceTags: [],
      assetId: 'AST-000088',
      siteId: '4',
      siteName: 'Grout Plant',
      createdAt: '2025-12-27T07:55:00.000Z',
      createdBy: 'user-4',
      createdByName: 'Engineer – Mechanical',
      updatedAt: '2025-12-27T07:55:00.000Z',
      updatedBy: 'user-4',
      updatedByName: 'Engineer – Mechanical',
      comments: [],
    },

    // Defect #5: Low severity: Work light intermittent in service bay
    {
      title: 'Low severity: Work light intermittent in service bay',
      description: 'Overhead LED work light flickers intermittently. No impact to plant operation but affects visibility. Suspect loose connection or failing driver. Replace/repair when convenient.',
      severityModel: 'LMH',
      severity: 'Low',
      status: 'Open',
      reopenedCount: 0,
      targetRectificationDate: '2026-01-12',
      actions: [],
      attachments: [],
      beforeAfterRequired: false,
      complianceTags: [],
      assetId: 'AST-000009',
      siteId: '5',
      siteName: 'Workshop – Bay 2',
      createdAt: '2025-12-27T11:05:00.000Z',
      createdBy: 'user-5',
      createdByName: 'Store/Workshop',
      updatedAt: '2025-12-27T11:05:00.000Z',
      updatedBy: 'user-5',
      updatedByName: 'Store/Workshop',
      comments: [],
    },

  ];

  // Only seed if database is empty
  const existing = await getAllDefects();
  if (existing.length > 0) {
    console.log('Defects already seeded, skipping...');
    return;
  }

  for (const data of seedData) {
    await createDefect(data);
  }

  console.log(`Seeded ${seedData.length} defects`);
}

// Helper to get all defects (for seed check)
async function getAllDefects(): Promise<Defect[]> {
  const { getAllDefects } = await import('../db/repository');
  return getAllDefects();
}
