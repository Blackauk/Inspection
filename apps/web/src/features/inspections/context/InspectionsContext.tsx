import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { initInspectionsDB } from '../db/schema';
import { seedTemplates } from '../lib/seed';
import {
  getAllInspections,
  queryInspections,
  getInspectionById,
  createInspection,
  updateInspection,
  deleteInspection,
  submitInspection,
  approveInspection,
  getInspectionSummary,
  getInspectionSettings,
  updateInspectionSettings,
  getAllTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from '../db/repository';
import { addToSyncQueue, getSyncQueueItems, flushSyncQueue } from '../db/syncQueue';
import type { Inspection, InspectionTemplate, InspectionFilter, InspectionSettings } from '../types';

interface InspectionsState {
  inspections: Inspection[];
  templates: InspectionTemplate[];
  currentInspection: Inspection | null;
  currentTemplate: InspectionTemplate | null;
  summary: {
    total: number;
    completedThisWeek: number;
    overdue: number;
    failed: number;
    openDefectsFromInspections: number;
    complianceInspections: number;
  };
  settings: InspectionSettings | null;
  syncQueueCount: number;
  loading: boolean;
  error: string | null;
}

type InspectionsAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_INSPECTIONS'; payload: Inspection[] }
  | { type: 'SET_TEMPLATES'; payload: InspectionTemplate[] }
  | { type: 'SET_CURRENT_INSPECTION'; payload: Inspection | null }
  | { type: 'SET_CURRENT_TEMPLATE'; payload: InspectionTemplate | null }
  | { type: 'SET_SUMMARY'; payload: InspectionsState['summary'] }
  | { type: 'SET_SETTINGS'; payload: InspectionSettings }
  | { type: 'SET_SYNC_QUEUE_COUNT'; payload: number }
  | { type: 'ADD_INSPECTION'; payload: Inspection }
  | { type: 'UPDATE_INSPECTION'; payload: Inspection }
  | { type: 'REMOVE_INSPECTION'; payload: string }
  | { type: 'ADD_TEMPLATE'; payload: InspectionTemplate }
  | { type: 'UPDATE_TEMPLATE'; payload: InspectionTemplate }
  | { type: 'REMOVE_TEMPLATE'; payload: string };

function inspectionsReducer(state: InspectionsState, action: InspectionsAction): InspectionsState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_INSPECTIONS':
      return { ...state, inspections: action.payload };
    case 'SET_TEMPLATES':
      return { ...state, templates: action.payload };
    case 'SET_CURRENT_INSPECTION':
      return { ...state, currentInspection: action.payload };
    case 'SET_CURRENT_TEMPLATE':
      return { ...state, currentTemplate: action.payload };
    case 'SET_SUMMARY':
      return { ...state, summary: action.payload };
    case 'SET_SETTINGS':
      return { ...state, settings: action.payload };
    case 'SET_SYNC_QUEUE_COUNT':
      return { ...state, syncQueueCount: action.payload };
    case 'ADD_INSPECTION':
      return { ...state, inspections: [...state.inspections, action.payload] };
    case 'UPDATE_INSPECTION':
      return {
        ...state,
        inspections: state.inspections.map((i) => (i.id === action.payload.id ? action.payload : i)),
        currentInspection: state.currentInspection?.id === action.payload.id ? action.payload : state.currentInspection,
      };
    case 'REMOVE_INSPECTION':
      return {
        ...state,
        inspections: state.inspections.filter((i) => i.id !== action.payload),
        currentInspection: state.currentInspection?.id === action.payload ? null : state.currentInspection,
      };
    case 'ADD_TEMPLATE':
      return { ...state, templates: [...state.templates, action.payload] };
    case 'UPDATE_TEMPLATE':
      return {
        ...state,
        templates: state.templates.map((t) => (t.id === action.payload.id ? action.payload : t)),
        currentTemplate: state.currentTemplate?.id === action.payload.id ? action.payload : state.currentTemplate,
      };
    case 'REMOVE_TEMPLATE':
      return {
        ...state,
        templates: state.templates.filter((t) => t.id !== action.payload),
        currentTemplate: state.currentTemplate?.id === action.payload ? null : state.currentTemplate,
      };
    default:
      return state;
  }
}

interface InspectionsContextType extends InspectionsState {
  loadInspections: (filter?: InspectionFilter) => Promise<void>;
  loadInspection: (id: string) => Promise<void>;
  createNewInspection: (inspection: Omit<Inspection, 'id' | 'inspectionCode' | 'history' | 'revisionNumber'>) => Promise<Inspection>;
  updateInspectionData: (id: string, updates: Partial<Inspection>) => Promise<Inspection>;
  deleteInspectionData: (id: string) => Promise<void>;
  submitInspectionData: (id: string, userId: string, userName: string) => Promise<Inspection>;
  approveInspectionData: (id: string, supervisorId: string, supervisorName: string) => Promise<Inspection>;
  loadTemplates: () => Promise<void>;
  loadTemplate: (id: string) => Promise<void>;
  createNewTemplate: (template: Omit<InspectionTemplate, 'id'>) => Promise<InspectionTemplate>;
  updateTemplateData: (id: string, updates: Partial<InspectionTemplate>) => Promise<InspectionTemplate>;
  deleteTemplateData: (id: string) => Promise<void>;
  sync: () => Promise<void>;
  refreshSyncQueue: () => Promise<void>;
  loadSettings: () => Promise<void>;
  updateSettings: (settings: Partial<InspectionSettings>) => Promise<void>;
}

const InspectionsContext = createContext<InspectionsContextType | undefined>(undefined);

export function InspectionsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(inspectionsReducer, {
    inspections: [],
    templates: [],
    currentInspection: null,
    currentTemplate: null,
    summary: { total: 0, completedThisWeek: 0, overdue: 0, failed: 0, openDefectsFromInspections: 0, complianceInspections: 0 },
    settings: null,
    syncQueueCount: 0,
    loading: false,
    error: null,
  });

  // Define load functions first (before useEffect that uses them)
  const loadInspections = useCallback(async (filter?: InspectionFilter) => {
    try {
      const inspections = await queryInspections(filter);
      dispatch({ type: 'SET_INSPECTIONS', payload: inspections });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, []);

  const loadTemplates = useCallback(async () => {
    try {
      const templates = await getAllTemplates();
      dispatch({ type: 'SET_TEMPLATES', payload: templates });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, []);

  const loadSummary = useCallback(async () => {
    try {
      const summary = await getInspectionSummary();
      dispatch({ type: 'SET_SUMMARY', payload: summary });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const settings = await getInspectionSettings();
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

  // Initialize database
  useEffect(() => {
    async function init() {
      try {
        console.log('[InspectionsProvider] Initializing...');
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
          await initInspectionsDB();
          console.log('[InspectionsProvider] Database initialized');
        } catch (dbError: any) {
          const errorMessage = dbError?.message || dbError?.toString() || 'Unknown error';
          console.warn('[InspectionsProvider] Database initialization failed:', errorMessage, dbError);
          // Continue even if DB init fails - app should still work
        }
        
        // Seed templates in dev mode only
        if (import.meta.env.DEV) {
          try {
            await seedTemplates();
            console.log('[InspectionsProvider] Templates seeded');
          } catch (seedError: any) {
            console.warn('[InspectionsProvider] Failed to seed templates:', seedError);
          }
        }
        
        // Load data - don't fail if these fail
        try {
          await loadInspections();
        } catch (e: any) {
          console.warn('[InspectionsProvider] Failed to load inspections:', e);
        }
        
        try {
          await loadTemplates();
        } catch (e: any) {
          console.warn('[InspectionsProvider] Failed to load templates:', e);
        }
        
        try {
          await loadSummary();
        } catch (e: any) {
          console.warn('[InspectionsProvider] Failed to load summary:', e);
        }
        
        try {
          await loadSettings();
        } catch (e: any) {
          console.warn('[InspectionsProvider] Failed to load settings:', e);
        }
        
        try {
          await refreshSyncQueue();
        } catch (e: any) {
          console.warn('[InspectionsProvider] Failed to refresh sync queue:', e);
        }
        
        console.log('[InspectionsProvider] Initialization complete');
      } catch (error: any) {
        console.error('[InspectionsProvider] Initialization error:', error);
        dispatch({ type: 'SET_ERROR', payload: error.message });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const loadInspection = useCallback(async (id: string) => {
    try {
      console.log('[Context] loadInspection called with id:', id);
      let inspection = await getInspectionById(id);
      
      // Fallback to services.ts if IndexedDB doesn't have it
      if (!inspection) {
        console.log('[Context] Inspection not found in IndexedDB, trying services fallback');
        const { getInspectionById: getInspectionByIdService } = await import('../services');
        inspection = getInspectionByIdService(id);
        if (inspection) {
          console.log('[Context] Found inspection in services fallback:', inspection.inspectionCode);
        }
      }
      
      if (inspection) {
        console.log('[Context] Inspection loaded:', {
          id: inspection.id,
          code: inspection.inspectionCode,
          templateId: inspection.templateId,
          templateName: inspection.templateName,
          status: inspection.status,
          itemsCount: inspection.items.length,
        });
        dispatch({ type: 'SET_CURRENT_INSPECTION', payload: inspection });
      } else {
        console.error('[Context] Inspection not found:', id);
        dispatch({ type: 'SET_ERROR', payload: `Inspection not found: ${id}` });
      }
    } catch (error: any) {
      console.error('[Context] Error loading inspection:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, []);

  const loadTemplate = useCallback(async (id: string) => {
    try {
      const template = await getTemplateById(id);
      if (template) {
        dispatch({ type: 'SET_CURRENT_TEMPLATE', payload: template });
      }
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, []);

  const createNewInspection = useCallback(
    async (inspection: Omit<Inspection, 'id' | 'inspectionCode' | 'history' | 'revisionNumber'>) => {
      try {
        const newInspection = await createInspection(inspection);
        dispatch({ type: 'ADD_INSPECTION', payload: newInspection });
        await addToSyncQueue('createInspection', newInspection.id, newInspection);
        await refreshSyncQueue();
        await loadSummary();
        return newInspection;
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        throw error;
      }
    },
    [refreshSyncQueue, loadSummary]
  );

  const updateInspectionData = useCallback(
    async (id: string, updates: Partial<Inspection>) => {
      try {
        const updated = await updateInspection(id, updates);
        dispatch({ type: 'UPDATE_INSPECTION', payload: updated });
        await addToSyncQueue('updateInspection', id, updates);
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

  const deleteInspectionData = useCallback(
    async (id: string) => {
      try {
        await deleteInspection(id);
        dispatch({ type: 'REMOVE_INSPECTION', payload: id });
        await refreshSyncQueue();
        await loadSummary();
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        throw error;
      }
    },
    [refreshSyncQueue, loadSummary]
  );

  const submitInspectionData = useCallback(
    async (id: string, userId: string, userName: string) => {
      try {
        const submitted = await submitInspection(id, userId, userName);
        dispatch({ type: 'UPDATE_INSPECTION', payload: submitted });
        await addToSyncQueue('submitInspection', id, {});
        await refreshSyncQueue();
        await loadSummary();
        return submitted;
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        throw error;
      }
    },
    [refreshSyncQueue, loadSummary]
  );

  const approveInspectionData = useCallback(
    async (id: string, supervisorId: string, supervisorName: string) => {
      try {
        const approved = await approveInspection(id, supervisorId, supervisorName);
        dispatch({ type: 'UPDATE_INSPECTION', payload: approved });
        await addToSyncQueue('approveInspection', id, {});
        await refreshSyncQueue();
        await loadSummary();
        return approved;
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        throw error;
      }
    },
    [refreshSyncQueue, loadSummary]
  );

  const createNewTemplate = useCallback(
    async (template: Omit<InspectionTemplate, 'id'>) => {
      try {
        const newTemplate = await createTemplate(template);
        dispatch({ type: 'ADD_TEMPLATE', payload: newTemplate });
        await loadTemplates();
        return newTemplate;
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        throw error;
      }
    },
    [loadTemplates]
  );

  const updateTemplateData = useCallback(
    async (id: string, updates: Partial<InspectionTemplate>) => {
      try {
        const updated = await updateTemplate(id, updates);
        dispatch({ type: 'UPDATE_TEMPLATE', payload: updated });
        await loadTemplates();
        return updated;
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        throw error;
      }
    },
    [loadTemplates]
  );

  const deleteTemplateData = useCallback(
    async (id: string) => {
      try {
        await deleteTemplate(id);
        dispatch({ type: 'REMOVE_TEMPLATE', payload: id });
        await loadTemplates();
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        throw error;
      }
    },
    [loadTemplates]
  );

  const sync = useCallback(async () => {
    try {
      await flushSyncQueue();
      await refreshSyncQueue();
      await loadInspections();
      await loadSummary();
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, [loadInspections, loadSummary, refreshSyncQueue]);

  const updateSettings = useCallback(
    async (settings: Partial<InspectionSettings>) => {
      try {
        await updateInspectionSettings(settings);
        await loadSettings();
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        throw error;
      }
    },
    [loadSettings]
  );

  return (
    <InspectionsContext.Provider
      value={{
        ...state,
        loadInspections,
        loadInspection,
        createNewInspection,
        updateInspectionData,
        deleteInspectionData,
        submitInspectionData,
        approveInspectionData,
        loadTemplates,
        loadTemplate,
        createNewTemplate,
        updateTemplateData,
        deleteTemplateData,
        sync,
        refreshSyncQueue,
        loadSettings,
        updateSettings,
      }}
    >
      {children}
    </InspectionsContext.Provider>
  );
}

export function useInspections() {
  const context = useContext(InspectionsContext);
  if (!context) {
    throw new Error('useInspections must be used within InspectionsProvider');
  }
  return context;
}
