import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { Site, Location } from '../types';

export interface SitesDB extends DBSchema {
  sites: {
    key: string; // id (UUID)
    value: Site;
    indexes: {
      'by-code': string; // Unique if provided
      'by-status': string;
      'by-name': string;
    };
  };
  locations: {
    key: string; // id (UUID)
    value: Location;
    indexes: {
      'by-siteId': string;
      'by-parentLocationId': string;
      'by-type': string;
      'by-status': string;
      'by-name': string;
    };
  };
}

let db: IDBPDatabase<SitesDB> | null = null;

export async function initSitesDB(): Promise<IDBPDatabase<SitesDB>> {
  if (db) return db;

  db = await openDB<SitesDB>('ppm-sites', 1, {
    upgrade(database) {
      // Sites store
      if (!database.objectStoreNames.contains('sites')) {
        const siteStore = database.createObjectStore('sites', { keyPath: 'id' });
        siteStore.createIndex('by-code', 'code', { unique: false }); // Not unique since code is optional
        siteStore.createIndex('by-status', 'status');
        siteStore.createIndex('by-name', 'name');
      }

      // Locations store
      if (!database.objectStoreNames.contains('locations')) {
        const locationStore = database.createObjectStore('locations', { keyPath: 'id' });
        locationStore.createIndex('by-siteId', 'siteId');
        locationStore.createIndex('by-parentLocationId', 'parentLocationId');
        locationStore.createIndex('by-type', 'type');
        locationStore.createIndex('by-status', 'status');
        locationStore.createIndex('by-name', 'name');
      }
    },
  });

  return db;
}

export async function getSitesDB(): Promise<IDBPDatabase<SitesDB>> {
  if (!db) {
    return await initSitesDB();
  }
  return db;
}
