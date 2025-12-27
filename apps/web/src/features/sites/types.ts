import type { UserRole } from '@ppm/shared';

// Site Status
export type SiteStatus = 'Active' | 'Inactive' | 'Closed' | 'Archived';

// Location Status
export type LocationStatus = 'Active' | 'Restricted' | 'Closed';

// Location Type
export type LocationType = 'Zone' | 'Area';

// Site Entity
export interface Site {
  id: string; // Internal UUID
  name: string; // Mandatory
  status: SiteStatus; // Mandatory
  code?: string; // Optional, manually entered, unique if provided
  address?: string; // Optional
  siteManagerId?: string; // Optional
  siteManagerName?: string; // Optional
  notes?: string; // Optional
  createdAt: string;
  createdBy: string;
  createdByName: string;
  updatedAt: string;
  updatedBy: string;
  updatedByName: string;
  history: SiteHistoryEntry[];
}

// Location Entity (Zone or Area)
export interface Location {
  id: string; // Internal UUID
  name: string;
  type: LocationType; // 'Zone' or 'Area'
  siteId: string; // Parent site
  parentLocationId?: string; // For Areas under Zones
  status: LocationStatus;
  order: number; // For sorting within parent
  createdAt: string;
  createdBy: string;
  createdByName: string;
  updatedAt: string;
  updatedBy: string;
  updatedByName: string;
  history: LocationHistoryEntry[];
}

// History Entry Types
export type SiteHistoryType = 'status_change' | 'edit' | 'archive' | 'reactivate';
export type LocationHistoryType = 'status_change' | 'edit' | 'archive' | 'reactivate';

// Site History Entry
export interface SiteHistoryEntry {
  id: string;
  at: string;
  by: string;
  byName: string;
  type: SiteHistoryType;
  summary: string;
  data?: Record<string, unknown>;
}

// Location History Entry
export interface LocationHistoryEntry {
  id: string;
  at: string;
  by: string;
  byName: string;
  type: LocationHistoryType;
  summary: string;
  data?: Record<string, unknown>;
}

// Site Filter
export interface SiteFilter {
  search?: string;
  status?: SiteStatus;
  code?: string;
  siteManagerId?: string;
}

// Location Filter
export interface LocationFilter {
  search?: string;
  siteId?: string;
  type?: LocationType;
  status?: LocationStatus;
  parentLocationId?: string;
}

// Site with Locations (for tree view)
export interface SiteWithLocations extends Site {
  zones: Location[];
  areas: Location[]; // Flat list, parentLocationId indicates hierarchy
}

// Location with Children (for tree view)
export interface LocationWithChildren extends Location {
  children: Location[]; // Areas under a Zone
}

// Bulk Action
export interface BulkAction {
  type: 'create' | 'edit' | 'archive';
  siteIds?: string[];
  locationIds?: string[];
  updates?: Partial<Site> | Partial<Location>;
}

// Site Summary Stats
export interface SiteSummary {
  total: number;
  active: number;
  locationsWithOpenDefects: number;
  locationsWithOverdueWorkOrders: number;
}
