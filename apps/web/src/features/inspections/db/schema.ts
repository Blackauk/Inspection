import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { Inspection, InspectionTemplate, InspectionSettings } from '../types';

export interface InspectionsDB extends DBSchema {
  inspections: {
    key: string; // id (UUID)
    value: Inspection;
    indexes: {
      'by-inspectionCode': string;
      'by-status': string;
      'by-result': string;
      'by-assetId': string;
      'by-siteId': string;
      'by-inspectorId': string;
      'by-inspectionDate': string;
      'by-dueDate': string;
    };
  };
  templates: {
    key: string; // id (UUID)
    value: InspectionTemplate;
    indexes: {
      'by-inspectionType': string;
      'by-assetTypeId': string;
      'by-siteId': string;
      'by-name': string;
    };
  };
  counters: {
    key: string; // 'inspection'
    value: {
      key: string;
      counter: number;
    };
  };
  settings: {
    key: string; // 'inspection'
    value: {
      key: string;
      settings: InspectionSettings;
    };
  };
  syncQueue: {
    key: string;
    value: {
      id: string;
      type: 'createInspection' | 'updateInspection' | 'submitInspection' | 'approveInspection' | 'closeInspection';
      inspectionId: string;
      data: unknown;
      retries: number;
      createdAt: number;
    };
  };
}

let db: IDBPDatabase<InspectionsDB> | null = null;

export async function initInspectionsDB(): Promise<IDBPDatabase<InspectionsDB>> {
  if (db) return db;

  db = await openDB<InspectionsDB>('ppm-inspections', 1, {
    upgrade(database) {
      // Inspections store
      if (!database.objectStoreNames.contains('inspections')) {
        const inspectionStore = database.createObjectStore('inspections', { keyPath: 'id' });
        inspectionStore.createIndex('by-inspectionCode', 'inspectionCode', { unique: true });
        inspectionStore.createIndex('by-status', 'status');
        inspectionStore.createIndex('by-result', 'result');
        inspectionStore.createIndex('by-assetId', 'assetId');
        inspectionStore.createIndex('by-siteId', 'siteId');
        inspectionStore.createIndex('by-inspectorId', 'inspectorId');
        inspectionStore.createIndex('by-inspectionDate', 'inspectionDate');
        inspectionStore.createIndex('by-dueDate', 'dueDate');
      }

      // Templates store
      if (!database.objectStoreNames.contains('templates')) {
        const templateStore = database.createObjectStore('templates', { keyPath: 'id' });
        templateStore.createIndex('by-inspectionType', 'inspectionType');
        templateStore.createIndex('by-assetTypeId', 'assetTypeId');
        templateStore.createIndex('by-siteId', 'siteId');
        templateStore.createIndex('by-name', 'name');
      }

      // Counters store
      if (!database.objectStoreNames.contains('counters')) {
        database.createObjectStore('counters', { keyPath: 'key' });
      }

      // Settings store
      if (!database.objectStoreNames.contains('settings')) {
        database.createObjectStore('settings', { keyPath: 'key' });
      }

      // Sync queue store
      if (!database.objectStoreNames.contains('syncQueue')) {
        database.createObjectStore('syncQueue', { keyPath: 'id' });
      }
    },
  });

  // Initialize default settings if not exists
  const settings = await db.get('settings', 'inspection');
  if (!settings) {
    await db.put('settings', 'inspection', {
      key: 'inspection',
      settings: {
        requireCommentOnFail: true,
        requirePhotoOnFail: true,
        requireDefectOnFail: true,
        enableApprovals: true,
        enableSignatures: true,
        checklistItemSeverityDefaults: true,
        conflictResolution: 'last-write-wins',
      },
    });
  }

  // Initialize counter if not exists
  const counter = await db.get('counters', 'inspection');
  if (!counter) {
    await db.put('counters', 'inspection', {
      key: 'inspection',
      counter: 0,
    });
  }

  return db;
}

export async function getInspectionsDB(): Promise<IDBPDatabase<InspectionsDB>> {
  if (!db) {
    return await initInspectionsDB();
  }
  return db;
}
