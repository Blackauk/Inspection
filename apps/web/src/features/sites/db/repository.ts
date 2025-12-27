import { getSitesDB } from './schema';
import type { Site, Location, SiteFilter, LocationFilter, SiteWithLocations } from '../types';

// Site CRUD
export async function createSite(site: Omit<Site, 'id' | 'history'>): Promise<Site> {
  const db = await getSitesDB();

  // Check code uniqueness if provided
  if (site.code) {
    const existing = await db.getFromIndex('sites', 'by-code', site.code);
    if (existing) {
      throw new Error(`Site code "${site.code}" already exists`);
    }
  }

  const newSite: Site = {
    ...site,
    id: crypto.randomUUID(),
    history: [
      {
        id: crypto.randomUUID(),
        at: new Date().toISOString(),
        by: site.createdBy,
        byName: site.createdByName,
        type: 'status_change',
        summary: `Site created with status: ${site.status}`,
      },
    ],
  };

  await db.add('sites', newSite);
  return newSite;
}

export async function getSiteById(id: string): Promise<Site | undefined> {
  const db = await getSitesDB();
  return db.get('sites', id);
}

export async function getAllSites(): Promise<Site[]> {
  const db = await getSitesDB();
  return db.getAll('sites');
}

export async function updateSite(id: string, updates: Partial<Site>): Promise<Site> {
  const db = await getSitesDB();
  const existing = await db.get('sites', id);
  if (!existing) {
    throw new Error(`Site ${id} not found`);
  }

  // Check code uniqueness if changed
  if (updates.code && updates.code !== existing.code) {
    const existingWithCode = await db.getFromIndex('sites', 'by-code', updates.code);
    if (existingWithCode && existingWithCode.id !== id) {
      throw new Error(`Site code "${updates.code}" already exists`);
    }
  }

  const updated: Site = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
    updatedBy: updates.updatedBy || existing.updatedBy,
    updatedByName: updates.updatedByName || existing.updatedByName,
  };

  await db.put('sites', updated);
  return updated;
}

export async function archiveSite(id: string, userId: string, userName: string): Promise<Site> {
  const site = await getSiteById(id);
  if (!site) {
    throw new Error('Site not found');
  }

  return updateSite(id, {
    status: 'Archived',
    history: [
      ...site.history,
      {
        id: crypto.randomUUID(),
        at: new Date().toISOString(),
        by: userId,
        byName: userName,
        type: 'archive',
        summary: 'Site archived',
      },
    ],
    updatedBy: userId,
    updatedByName: userName,
  });
}

export async function reactivateSite(id: string, userId: string, userName: string): Promise<Site> {
  const site = await getSiteById(id);
  if (!site) {
    throw new Error('Site not found');
  }

  if (site.status !== 'Archived') {
    throw new Error('Only archived sites can be reactivated');
  }

  return updateSite(id, {
    status: 'Active',
    history: [
      ...site.history,
      {
        id: crypto.randomUUID(),
        at: new Date().toISOString(),
        by: userId,
        byName: userName,
        type: 'reactivate',
        summary: 'Site reactivated',
      },
    ],
    updatedBy: userId,
    updatedByName: userName,
  });
}

// Location CRUD
export async function createLocation(location: Omit<Location, 'id' | 'history'>): Promise<Location> {
  const db = await getSitesDB();

  // Validate hierarchy
  if (location.type === 'Area' && !location.parentLocationId) {
    // Area can be directly under Site (no Zone), but if parentLocationId is provided, validate it
    if (location.parentLocationId) {
      const parent = await db.get('locations', location.parentLocationId);
      if (!parent || parent.type !== 'Zone') {
        throw new Error('Area must be under a Zone if parent is specified');
      }
      if (parent.siteId !== location.siteId) {
        throw new Error('Area must be in the same site as its parent Zone');
      }
    }
  }

  const newLocation: Location = {
    ...location,
    id: crypto.randomUUID(),
    history: [
      {
        id: crypto.randomUUID(),
        at: new Date().toISOString(),
        by: location.createdBy,
        byName: location.createdByName,
        type: 'status_change',
        summary: `Location created with status: ${location.status}`,
      },
    ],
  };

  await db.add('locations', newLocation);
  return newLocation;
}

export async function getLocationById(id: string): Promise<Location | undefined> {
  const db = await getSitesDB();
  return db.get('locations', id);
}

export async function getAllLocations(): Promise<Location[]> {
  const db = await getSitesDB();
  return db.getAll('locations');
}

export async function getLocationsBySiteId(siteId: string): Promise<Location[]> {
  const db = await getSitesDB();
  const index = db.transaction('locations').store.index('by-siteId');
  return index.getAll(siteId);
}

export async function updateLocation(id: string, updates: Partial<Location>): Promise<Location> {
  const db = await getSitesDB();
  const existing = await db.get('locations', id);
  if (!existing) {
    throw new Error(`Location ${id} not found`);
  }

  // Validate hierarchy if parent changed
  if (updates.parentLocationId !== undefined && updates.parentLocationId !== existing.parentLocationId) {
    if (updates.parentLocationId) {
      const parent = await db.get('locations', updates.parentLocationId);
      if (!parent) {
        throw new Error('Parent location not found');
      }
      if (existing.type === 'Area' && parent.type !== 'Zone') {
        throw new Error('Area must be under a Zone');
      }
      if (parent.siteId !== (updates.siteId || existing.siteId)) {
        throw new Error('Location must be in the same site as its parent');
      }
    }
  }

  const updated: Location = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
    updatedBy: updates.updatedBy || existing.updatedBy,
    updatedByName: updates.updatedByName || existing.updatedByName,
  };

  await db.put('locations', updated);
  return updated;
}

export async function archiveLocation(id: string, userId: string, userName: string): Promise<Location> {
  const location = await getLocationById(id);
  if (!location) {
    throw new Error('Location not found');
  }

  return updateLocation(id, {
    status: 'Closed', // Locations use 'Closed' instead of 'Archived'
    history: [
      ...location.history,
      {
        id: crypto.randomUUID(),
        at: new Date().toISOString(),
        by: userId,
        byName: userName,
        type: 'archive',
        summary: 'Location archived',
      },
    ],
    updatedBy: userId,
    updatedByName: userName,
  });
}

// Query & Filter
export async function querySites(filter?: SiteFilter, userSiteIds?: string[]): Promise<Site[]> {
  const db = await getSitesDB();
  let sites = await db.getAll('sites');

  // Filter by user site assignments (if not admin/manager)
  if (userSiteIds && userSiteIds.length > 0) {
    sites = sites.filter((s) => userSiteIds.includes(s.id));
  }

  if (!filter) {
    return sites;
  }

  // Status filter
  if (filter.status) {
    sites = sites.filter((s) => s.status === filter.status);
  }

  // Code filter
  if (filter.code) {
    sites = sites.filter((s) => s.code?.toLowerCase().includes(filter.code!.toLowerCase()));
  }

  // Site manager filter
  if (filter.siteManagerId) {
    sites = sites.filter((s) => s.siteManagerId === filter.siteManagerId);
  }

  // Search filter
  if (filter.search) {
    const searchLower = filter.search.toLowerCase();
    sites = sites.filter(
      (s) =>
        s.name.toLowerCase().includes(searchLower) ||
        s.code?.toLowerCase().includes(searchLower) ||
        s.address?.toLowerCase().includes(searchLower)
    );
  }

  return sites;
}

export async function queryLocations(filter?: LocationFilter): Promise<Location[]> {
  const db = await getSitesDB();
  let locations = await db.getAll('locations');

  if (!filter) {
    return locations;
  }

  // Site filter
  if (filter.siteId) {
    locations = locations.filter((l) => l.siteId === filter.siteId);
  }

  // Type filter
  if (filter.type) {
    locations = locations.filter((l) => l.type === filter.type);
  }

  // Status filter
  if (filter.status) {
    locations = locations.filter((l) => l.status === filter.status);
  }

  // Parent filter
  if (filter.parentLocationId !== undefined) {
    if (filter.parentLocationId === null) {
      locations = locations.filter((l) => !l.parentLocationId);
    } else {
      locations = locations.filter((l) => l.parentLocationId === filter.parentLocationId);
    }
  }

  // Search filter
  if (filter.search) {
    const searchLower = filter.search.toLowerCase();
    locations = locations.filter((l) => l.name.toLowerCase().includes(searchLower));
  }

  return locations;
}

// Get site with locations (for tree view)
export async function getSiteWithLocations(siteId: string): Promise<SiteWithLocations | undefined> {
  const site = await getSiteById(siteId);
  if (!site) {
    return undefined;
  }

  const allLocations = await getLocationsBySiteId(siteId);
  const zones = allLocations.filter((l) => l.type === 'Zone');
  const areas = allLocations.filter((l) => l.type === 'Area');

  return {
    ...site,
    zones,
    areas,
  };
}

// Get all sites with locations (for tree view)
export async function getAllSitesWithLocations(userSiteIds?: string[]): Promise<SiteWithLocations[]> {
  const sites = await querySites(undefined, userSiteIds);
  const allLocations = await getAllLocations();

  return sites.map((site) => {
    const siteLocations = allLocations.filter((l) => l.siteId === site.id);
    return {
      ...site,
      zones: siteLocations.filter((l) => l.type === 'Zone'),
      areas: siteLocations.filter((l) => l.type === 'Area'),
    };
  });
}

// Summary stats
export async function getSiteSummary(userSiteIds?: string[]): Promise<{
  total: number;
  active: number;
  locationsWithOpenDefects: number;
  locationsWithOverdueWorkOrders: number;
}> {
  const sites = await querySites(undefined, userSiteIds);
  const locations = await getAllLocations();

  // Get defects from defects module
  const { getAllDefects } = await import('../../defects/db/repository');
  const allDefects = await getAllDefects();
  
  // Get work orders from work orders module (using mock data for now)
  // In Phase 2, this would use a proper repository
  const { getWorkOrders } = await import('../../work-orders/services');
  const allWorkOrders = getWorkOrders();

  const now = new Date();
  const locationsWithOpenDefects = new Set(
    allDefects
      .filter((d) => d.status !== 'Closed' && d.status !== 'Resolved' && d.locationId)
      .map((d) => d.locationId!)
  );

  // Work orders don't have locationId in Phase 1, so we'll use siteId
  const sitesWithOverdueWOs = new Set(
    allWorkOrders
      .filter((wo) => {
        if (wo.status === 'Completed' || wo.status === 'ApprovedClosed') return false;
        if (!wo.dueDate) return false;
        return new Date(wo.dueDate) < now;
      })
      .map((wo) => wo.siteId)
      .filter((id): id is string => !!id)
  );
  
  // For now, count locations in sites with overdue WOs
  const locationsWithOverdueWorkOrders = locations.filter((l) => 
    sitesWithOverdueWOs.has(l.siteId)
  ).length;

  return {
    total: sites.length,
    active: sites.filter((s) => s.status === 'Active').length,
    locationsWithOpenDefects: locationsWithOpenDefects.size,
    locationsWithOverdueWorkOrders,
  };
}

// Bulk operations
export async function bulkUpdateSites(
  siteIds: string[],
  updates: Partial<Site>,
  userId: string,
  userName: string
): Promise<Site[]> {
  const updated: Site[] = [];
  for (const id of siteIds) {
    const site = await updateSite(id, {
      ...updates,
      updatedBy: userId,
      updatedByName: userName,
    });
    updated.push(site);
  }
  return updated;
}

export async function bulkArchiveSites(
  siteIds: string[],
  userId: string,
  userName: string
): Promise<Site[]> {
  const archived: Site[] = [];
  for (const id of siteIds) {
    const site = await archiveSite(id, userId, userName);
    archived.push(site);
  }
  return archived;
}

export async function bulkCreateLocations(
  locations: Omit<Location, 'id' | 'history'>[],
  userId: string,
  userName: string
): Promise<Location[]> {
  const created: Location[] = [];
  for (const location of locations) {
    const newLocation = await createLocation({
      ...location,
      createdBy: userId,
      createdByName: userName,
      updatedBy: userId,
      updatedByName: userName,
    });
    created.push(newLocation);
  }
  return created;
}

export async function bulkUpdateLocations(
  locationIds: string[],
  updates: Partial<Location>,
  userId: string,
  userName: string
): Promise<Location[]> {
  const updated: Location[] = [];
  for (const id of locationIds) {
    const location = await updateLocation(id, {
      ...updates,
      updatedBy: userId,
      updatedByName: userName,
    });
    updated.push(location);
  }
  return updated;
}

export async function bulkArchiveLocations(
  locationIds: string[],
  userId: string,
  userName: string
): Promise<Location[]> {
  const archived: Location[] = [];
  for (const id of locationIds) {
    const location = await archiveLocation(id, userId, userName);
    archived.push(location);
  }
  return archived;
}
