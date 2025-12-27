import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from 'react';
import { initDefectsDB } from '../db/schema';
import { seedDefects } from '../lib/seed';
import {
  getAllDefects,
  queryDefects,
  getDefectById,
  createDefect,
  updateDefect,
  deleteDefect,
  getDefectSummary,
  addComment,
  addHistoryEntry,
  getDefectSettings,
  updateDefectSettings,
} from '../db/repository';
import { addToSyncQueue, getSyncQueueItems, flushSyncQueue } from '../db/syncQueue';
import type { Defect, DefectFilter, DefectSettings, DefectComment } from '../types';

interface DefectsState {
  defects: Defect[];
  currentDefect: Defect | null;
  summary: {
    total: number;
    open: number;
    overdue: number;
    unsafe: number;
  };
  settings: DefectSettings | null;
  syncQueueCount: number;
  loading: boolean;
  error: string | null;
}

type DefectsAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_DEFECTS'; payload: Defect[] }
  | { type: 'SET_CURRENT_DEFECT'; payload: Defect | null }
  | { type: 'SET_SUMMARY'; payload: DefectsState['summary'] }
  | { type: 'SET_SETTINGS'; payload: DefectSettings }
  | { type: 'SET_SYNC_QUEUE_COUNT'; payload: number }
  | { type: 'ADD_DEFECT'; payload: Defect }
  | { type: 'UPDATE_DEFECT'; payload: Defect }
  | { type: 'REMOVE_DEFECT'; payload: string };

function defectsReducer(state: DefectsState, action: DefectsAction): DefectsState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_DEFECTS':
      return { ...state, defects: action.payload };
    case 'SET_CURRENT_DEFECT':
      return { ...state, currentDefect: action.payload };
    case 'SET_SUMMARY':
      return { ...state, summary: action.payload };
    case 'SET_SETTINGS':
      return { ...state, settings: action.payload };
    case 'SET_SYNC_QUEUE_COUNT':
      return { ...state, syncQueueCount: action.payload };
    case 'ADD_DEFECT':
      return { ...state, defects: [...state.defects, action.payload] };
    case 'UPDATE_DEFECT':
      return {
        ...state,
        defects: state.defects.map((d) => (d.id === action.payload.id ? action.payload : d)),
        currentDefect: state.currentDefect?.id === action.payload.id ? action.payload : state.currentDefect,
      };
    case 'REMOVE_DEFECT':
      return {
        ...state,
        defects: state.defects.filter((d) => d.id !== action.payload),
        currentDefect: state.currentDefect?.id === action.payload ? null : state.currentDefect,
      };
    default:
      return state;
  }
}

interface DefectsContextType extends DefectsState {
  loadDefects: (filter?: DefectFilter) => Promise<void>;
  loadDefect: (id: string) => Promise<void>;
  createNewDefect: (defect: Omit<Defect, 'id' | 'defectCode' | 'unsafeDoNotUse' | 'history'>) => Promise<Defect>;
  updateDefectData: (id: string, updates: Partial<Defect>) => Promise<Defect>;
  deleteDefectData: (id: string) => Promise<void>;
  addDefectComment: (defectId: string, comment: Omit<DefectComment, 'id'>) => Promise<void>;
  closeDefect: (defectId: string, data: {
    actionTaken: string;
    notes: string;
    attachments: any[];
    returnToService?: boolean;
  }, userId: string, userName: string) => Promise<void>;
  reopenDefect: (defectId: string, data: {
    isNewOccurrence: boolean;
    reason: string;
    attachments?: any[];
  }, userId: string, userName: string) => Promise<string | void>;
  sync: () => Promise<void>;
  refreshSyncQueue: () => Promise<void>;
  loadSettings: () => Promise<void>;
  updateSettings: (settings: Partial<DefectSettings>) => Promise<void>;
}

const DefectsContext = createContext<DefectsContextType | undefined>(undefined);

export function DefectsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(defectsReducer, {
    defects: [],
    currentDefect: null,
    summary: { total: 0, open: 0, overdue: 0, unsafe: 0 },
    settings: null,
    syncQueueCount: 0,
    loading: false,
    error: null,
  });

  // Initialize database and seed
  useEffect(() => {
    async function init() {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        await initDefectsDB();
        
        // Seed in dev mode only
        if (import.meta.env.DEV) {
          await seedDefects();
        }
        
        await loadDefects();
        await loadSummary();
        await loadSettings();
        await refreshSyncQueue();
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }
    init();
  }, []);

  const loadDefects = useCallback(async (filter?: DefectFilter) => {
    try {
      const defects = await queryDefects(filter);
      dispatch({ type: 'SET_DEFECTS', payload: defects });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, []);

  const loadDefect = useCallback(async (id: string) => {
    try {
      // Try to load by ID first
      let defect = await getDefectById(id);
      
      // If not found and it looks like a defect code (DEF-000001), try by code
      if (!defect && id.startsWith('DEF-')) {
        const { getDefectByCode } = await import('../db/repository');
        defect = await getDefectByCode(id);
      }
      
      if (defect) {
        dispatch({ type: 'SET_CURRENT_DEFECT', payload: defect });
      } else {
        dispatch({ type: 'SET_CURRENT_DEFECT', payload: null });
      }
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      dispatch({ type: 'SET_CURRENT_DEFECT', payload: null });
    }
  }, []);

  const loadSummary = useCallback(async () => {
    try {
      const summary = await getDefectSummary();
      dispatch({ type: 'SET_SUMMARY', payload: summary });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const settings = await getDefectSettings();
      dispatch({ type: 'SET_SETTINGS', payload: settings });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, []);

  const refreshSyncQueue = useCallback(async () => {
    try {
      const items = await getSyncQueueItems();
      dispatch({ type: 'SET_SYNC_QUEUE_COUNT', payload: items.length });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, []);

  const createNewDefect = useCallback(
    async (defect: Omit<Defect, 'id' | 'defectCode' | 'unsafeDoNotUse' | 'history'>) => {
      try {
        const newDefect = await createDefect(defect);
        dispatch({ type: 'ADD_DEFECT', payload: newDefect });
        await addToSyncQueue('createDefect', newDefect.id, newDefect);
        await refreshSyncQueue();
        await loadSummary();
        return newDefect;
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        throw error;
      }
    },
    [refreshSyncQueue, loadSummary]
  );

  const updateDefectData = useCallback(
    async (id: string, updates: Partial<Defect>) => {
      try {
        const updated = await updateDefect(id, updates);
        dispatch({ type: 'UPDATE_DEFECT', payload: updated });
        await addToSyncQueue('updateDefect', id, updates);
        await refreshSyncQueue();
        await loadSummary();
        return updated;
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        throw error;
      }
    },
    [refreshSyncQueue, loadSummary]
  );

  const deleteDefectData = useCallback(
    async (id: string) => {
      try {
        await deleteDefect(id);
        dispatch({ type: 'REMOVE_DEFECT', payload: id });
        await addToSyncQueue('deleteDefect', id, { id });
        await refreshSyncQueue();
        await loadSummary();
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        throw error;
      }
    },
    [refreshSyncQueue, loadSummary]
  );

  const addDefectComment = useCallback(
    async (defectId: string, comment: Omit<DefectComment, 'id'>) => {
      try {
        await addComment(defectId, comment);
        await loadDefect(defectId);
        await loadDefects();
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        throw error;
      }
    },
    [loadDefect, loadDefects]
  );

  const closeDefect = useCallback(
    async (defectId: string, data: {
      actionTaken: string;
      notes: string;
      attachments: any[];
      returnToService?: boolean;
    }, userId: string, userName: string) => {
      try {
        const defect = await getDefectById(defectId);
        if (!defect) throw new Error('Defect not found');

        const now = new Date().toISOString();
        const closeSummary = `Action: ${data.actionTaken}. ${data.notes}`;

        await updateDefectData(defectId, {
          status: 'Closed',
          closedAt: now,
          closedBy: userId,
          closedByName: userName,
          actionTaken: data.actionTaken as any,
          comments: [
            ...defect.comments,
            {
              id: crypto.randomUUID(),
              at: now,
              by: userId,
              byName: userName,
              text: closeSummary,
            },
          ],
          attachments: [...defect.attachments, ...data.attachments],
          unsafeDoNotUse: data.returnToService === true ? false : defect.unsafeDoNotUse,
          updatedBy: userId,
          updatedByName: userName,
        });

        await addHistoryEntry(defectId, {
          at: now,
          by: userId,
          byName: userName,
          type: 'close',
          summary: closeSummary,
          data: {
            actionTaken: data.actionTaken,
            returnToService: data.returnToService,
          },
        });

        if (data.returnToService && defect.unsafeDoNotUse) {
          await addHistoryEntry(defectId, {
            at: now,
            by: userId,
            byName: userName,
            type: 'status_change',
            summary: 'Asset returned to service - Unsafe flag cleared',
          });
        }

        await addToSyncQueue('closeDefect', defectId, data);
        await refreshSyncQueue();
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        throw error;
      }
    },
    [updateDefectData, refreshSyncQueue]
  );

  const reopenDefect = useCallback(
    async (defectId: string, data: {
      isNewOccurrence: boolean;
      reason: string;
      attachments?: any[];
    }, userId: string, userName: string) => {
      try {
        const defect = await getDefectById(defectId);
        if (!defect) throw new Error('Defect not found');

        if (data.isNewOccurrence) {
          // Create new defect linked to this one
          const { createDefect } = await import('../db/repository');
          const newDefect = await createDefect({
            title: defect.title,
            description: `Recurrence of ${defect.defectCode}: ${data.reason}`,
            severity: defect.severity,
            severityModel: defect.severityModel,
            status: 'Open',
            assetId: defect.assetId,
            siteId: defect.siteId,
            locationId: defect.locationId,
            assignedToId: defect.assignedToId,
            assignedToName: defect.assignedToName,
            targetRectificationDate: defect.targetRectificationDate,
            complianceTags: defect.complianceTags,
            actions: defect.actions,
            attachments: data.attachments || [],
            beforeAfterRequired: defect.beforeAfterRequired,
            history: [],
            comments: [],
            createdAt: new Date().toISOString(),
            createdBy: userId,
            createdByName: userName,
            updatedAt: new Date().toISOString(),
            updatedBy: userId,
            updatedByName: userName,
          });

          // Link the new defect to the parent
          await updateDefectData(newDefect.id, {
            parentDefectId: defect.id,
            recurrenceCount: 0,
          });

          // Update parent defect's recurrence count
          await updateDefectData(defect.id, {
            recurrenceCount: (defect.recurrenceCount || 0) + 1,
          });

          // Return the new defect ID so caller can navigate
          return newDefect.id;
        } else {
          // Reopen same defect
          await updateDefectData(defectId, {
            status: 'Open',
            reopenedCount: defect.reopenedCount + 1,
            closedAt: undefined,
            closedBy: undefined,
            closedByName: undefined,
            attachments: data.attachments ? [...defect.attachments, ...data.attachments] : defect.attachments,
            updatedBy: userId,
            updatedByName: userName,
          });

          await addHistoryEntry(defectId, {
            at: new Date().toISOString(),
            by: userId,
            byName: userName,
            type: 'reopen',
            summary: `Defect reopened: ${data.reason}`,
          });

          await addDefectComment(defectId, {
            at: new Date().toISOString(),
            by: userId,
            byName: userName,
            text: `Reopened: ${data.reason}`,
          });

          await addToSyncQueue('reopenDefect', defectId, data);
          await refreshSyncQueue();
          return defectId;
        }
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        throw error;
      }
    },
    [updateDefectData, refreshSyncQueue, addDefectComment]
  );

  const sync = useCallback(async () => {
    try {
      await flushSyncQueue();
      await refreshSyncQueue();
      await loadDefects();
      await loadSummary();
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, [loadDefects, loadSummary, refreshSyncQueue]);

  const updateSettings = useCallback(
    async (settings: Partial<DefectSettings>) => {
      try {
        await updateDefectSettings(settings);
        await loadSettings();
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        throw error;
      }
    },
    [loadSettings]
  );

  return (
    <DefectsContext.Provider
      value={{
        ...state,
        loadDefects,
        loadDefect,
        createNewDefect,
        updateDefectData,
        deleteDefectData,
        addDefectComment,
        closeDefect,
        reopenDefect,
        sync,
        refreshSyncQueue,
        loadSettings,
        updateSettings,
      }}
    >
      {children}
    </DefectsContext.Provider>
  );
}

export function useDefects() {
  const context = useContext(DefectsContext);
  if (!context) {
    throw new Error('useDefects must be used within DefectsProvider');
  }
  return context;
}
