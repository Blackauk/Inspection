import { createSite, createLocation } from '../db/repository';
import type { Site, Location } from '../types';

// Seed data for development
export async function seedSitesAndLocations(): Promise<void> {
  const { getAllSites } = await import('../db/repository');
  const existing = await getAllSites();
  if (existing.length > 0) {
    console.log('Sites already seeded, skipping...');
    return;
  }

  const now = new Date().toISOString();
  const systemUser = { id: 'system', name: 'System' };

  // Create Sites
  const site1 = await createSite({
    name: 'Site A',
    status: 'Active',
    code: 'SITE-A',
    address: '123 Industrial Way, City A, AB12 3CD',
    siteManagerName: 'John Manager',
    notes: 'Main operational site',
    createdAt: now,
    createdBy: systemUser.id,
    createdByName: systemUser.name,
    updatedAt: now,
    updatedBy: systemUser.id,
    updatedByName: systemUser.name,
  });

  const site2 = await createSite({
    name: 'Site B',
    status: 'Active',
    code: 'SITE-B',
    address: '456 Construction Road, City B, XY34 5EF',
    siteManagerName: 'Sarah Manager',
    notes: 'Secondary operational site',
    createdAt: now,
    createdBy: systemUser.id,
    createdByName: systemUser.name,
    updatedAt: now,
    updatedBy: systemUser.id,
    updatedByName: systemUser.name,
  });

  const site3 = await createSite({
    name: 'Site C',
    status: 'Active',
    code: 'SITE-C',
    address: '789 Works Lane, City C, GH67 8IJ',
    siteManagerName: 'Mike Manager',
    createdAt: now,
    createdBy: systemUser.id,
    createdByName: systemUser.name,
    updatedAt: now,
    updatedBy: systemUser.id,
    updatedByName: systemUser.name,
  });

  // Create Zones for Site A
  const zone1 = await createLocation({
    name: 'Surface Works',
    type: 'Zone',
    siteId: site1.id,
    status: 'Active',
    order: 1,
    createdAt: now,
    createdBy: systemUser.id,
    createdByName: systemUser.name,
    updatedAt: now,
    updatedBy: systemUser.id,
    updatedByName: systemUser.name,
  });

  const zone2 = await createLocation({
    name: 'Tunnel Works',
    type: 'Zone',
    siteId: site1.id,
    status: 'Active',
    order: 2,
    createdAt: now,
    createdBy: systemUser.id,
    createdByName: systemUser.name,
    updatedAt: now,
    updatedBy: systemUser.id,
    updatedByName: systemUser.name,
  });

  // Create Areas for Site A
  await createLocation({
    name: 'Yard 1',
    type: 'Area',
    siteId: site1.id,
    parentLocationId: zone1.id,
    status: 'Active',
    order: 1,
    createdAt: now,
    createdBy: systemUser.id,
    createdByName: systemUser.name,
    updatedAt: now,
    updatedBy: systemUser.id,
    updatedByName: systemUser.name,
  });

  await createLocation({
    name: 'Workshop',
    type: 'Area',
    siteId: site1.id,
    parentLocationId: zone1.id,
    status: 'Active',
    order: 2,
    createdAt: now,
    createdBy: systemUser.id,
    createdByName: systemUser.name,
    updatedAt: now,
    updatedBy: systemUser.id,
    updatedByName: systemUser.name,
  });

  await createLocation({
    name: 'Tunnel North',
    type: 'Area',
    siteId: site1.id,
    parentLocationId: zone2.id,
    status: 'Active',
    order: 1,
    createdAt: now,
    createdBy: systemUser.id,
    createdByName: systemUser.name,
    updatedAt: now,
    updatedBy: systemUser.id,
    updatedByName: systemUser.name,
  });

  // Create Zones for Site B
  const zone3 = await createLocation({
    name: 'Main Compound',
    type: 'Zone',
    siteId: site2.id,
    status: 'Active',
    order: 1,
    createdAt: now,
    createdBy: systemUser.id,
    createdByName: systemUser.name,
    updatedAt: now,
    updatedBy: systemUser.id,
    updatedByName: systemUser.name,
  });

  await createLocation({
    name: 'Warehouse',
    type: 'Area',
    siteId: site2.id,
    parentLocationId: zone3.id,
    status: 'Active',
    order: 1,
    createdAt: now,
    createdBy: systemUser.id,
    createdByName: systemUser.name,
    updatedAt: now,
    updatedBy: systemUser.id,
    updatedByName: systemUser.name,
  });

  // Create Zones for Site C
  await createLocation({
    name: 'Pump House',
    type: 'Area',
    siteId: site3.id,
    status: 'Active',
    order: 1,
    createdAt: now,
    createdBy: systemUser.id,
    createdByName: systemUser.name,
    updatedAt: now,
    updatedBy: systemUser.id,
    updatedByName: systemUser.name,
  });

  console.log('Seeded sites and locations');
}
