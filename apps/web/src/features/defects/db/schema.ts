import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { Defect, DefectSettings } from '../types';

export interface DefectsDB extends DBSchema {
  defects: {
    key: string; // id (UUID)
    value: Defect;
    indexes: {
      'by-defectCode': string;
      'by-status': string;
      'by-severity': string;
      'by-assetId': string;
      'by-siteId': string;
      'by-createdAt': string;
    };
  };
  counters: {
    key: string; // 'defect'
    value: {
      key: string;
      counter: number;
    };
  };
  settings: {
    key: string; // 'defect'
    value: {
      key: string;
      settings: DefectSettings;
    };
  };
  syncQueue: {
    key: string;
    value: {
      id: string;
      type: 'createDefect' | 'updateDefect' | 'deleteDefect' | 'closeDefect' | 'reopenDefect';
      defectId: string;
      data: unknown;
      retries: number;
      createdAt: number;
    };
  };
}

let db: IDBPDatabase<DefectsDB> | null = null;

export async function initDefectsDB(): Promise<IDBPDatabase<DefectsDB>> {
  if (db) return db;

  db = await openDB<DefectsDB>('ppm-defects', 1, {
    upgrade(database) {
      // Defects store
      if (!database.objectStoreNames.contains('defects')) {
        const defectStore = database.createObjectStore('defects', { keyPath: 'id' });
        defectStore.createIndex('by-defectCode', 'defectCode', { unique: true });
        defectStore.createIndex('by-status', 'status');
        defectStore.createIndex('by-severity', 'severity');
        defectStore.createIndex('by-assetId', 'assetId');
        defectStore.createIndex('by-siteId', 'siteId');
        defectStore.createIndex('by-createdAt', 'createdAt');
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
  const settings = await db.get('settings', 'defect');
  if (!settings) {
    await db.put('settings', 'defect', {
      key: 'defect',
      settings: {
        severityModelDefault: 'LMH',
        unsafeThresholds: {
          LMH: ['High'],
          MMC: ['Critical'],
        },
        beforeAfterRequired: false,
      },
    });
  }

  // Initialize counter if not exists
  const counter = await db.get('counters', 'defect');
  if (!counter) {
    await db.put('counters', 'defect', {
      key: 'defect',
      counter: 0,
    });
  }

  return db;
}

export async function getDefectsDB(): Promise<IDBPDatabase<DefectsDB>> {
  if (!db) {
    return await initDefectsDB();
  }
  return db;
}
