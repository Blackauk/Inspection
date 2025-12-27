import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { initSitesDB } from '../db/schema';
import { seedSitesAndLocations } from '../lib/seed';
import {
  getAllSites,
  querySites,
  getSiteById,
  createSite,
  updateSite,
  archiveSite,
  reactivateSite,
  getAllLocations,
  queryLocations,
  getLocationById,
  createLocation,
  updateLocation,
  archiveLocation,
  getAllSitesWithLocations,
  getSiteSummary,
  bulkUpdateSites,
  bulkArchiveSites,
  bulkCreateLocations,
  bulkUpdateLocations,
  bulkArchiveLocations,
} from '../db/repository';
import type { Site, Location, SiteFilter, LocationFilter, SiteWithLocations } from '../types';

interface SitesState {
  sites: Site[];
  locations: Location[];
  sitesWithLocations: SiteWithLocations[];
  currentSite: Site | null;
  currentLocation: Location | null;
  summary: {
    total: number;
    active: number;
    locationsWithOpenDefects: number;
    locationsWithOverdueWorkOrders: number;
  };
  loading: boolean;
  error: string | null;
  viewMode: 'tree' | 'table';
}

type SitesAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SITES'; payload: Site[] }
  | { type: 'SET_LOCATIONS'; payload: Location[] }
  | { type: 'SET_SITES_WITH_LOCATIONS'; payload: SiteWithLocations[] }
  | { type: 'SET_CURRENT_SITE'; payload: Site | null }
  | { type: 'SET_CURRENT_LOCATION'; payload: Location | null }
  | { type: 'SET_SUMMARY'; payload: SitesState['summary'] }
  | { type: 'SET_VIEW_MODE'; payload: 'tree' | 'table' }
  | { type: 'ADD_SITE'; payload: Site }
  | { type: 'UPDATE_SITE'; payload: Site }
  | { type: 'ADD_LOCATION'; payload: Location }
  | { type: 'UPDATE_LOCATION'; payload: Location };

function sitesReducer(state: SitesState, action: SitesAction): SitesState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_SITES':
      return { ...state, sites: action.payload };
    case 'SET_LOCATIONS':
      return { ...state, locations: action.payload };
    case 'SET_SITES_WITH_LOCATIONS':
      return { ...state, sitesWithLocations: action.payload };
    case 'SET_CURRENT_SITE':
      return { ...state, currentSite: action.payload };
    case 'SET_CURRENT_LOCATION':
      return { ...state, currentLocation: action.payload };
    case 'SET_SUMMARY':
      return { ...state, summary: action.payload };
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload };
    case 'ADD_SITE':
      return { ...state, sites: [...state.sites, action.payload] };
    case 'UPDATE_SITE':
      return {
        ...state,
        sites: state.sites.map((s) => (s.id === action.payload.id ? action.payload : s)),
        currentSite: state.currentSite?.id === action.payload.id ? action.payload : state.currentSite,
      };
    case 'ADD_LOCATION':
      return { ...state, locations: [...state.locations, action.payload] };
    case 'UPDATE_LOCATION':
      return {
        ...state,
        locations: state.locations.map((l) => (l.id === action.payload.id ? action.payload : l)),
        currentLocation: state.currentLocation?.id === action.payload.id ? action.payload : state.currentLocation,
      };
    default:
      return state;
  }
}

interface SitesContextType extends SitesState {
  loadSites: (filter?: SiteFilter) => Promise<void>;
  loadLocations: (filter?: LocationFilter) => Promise<void>;
  loadSitesWithLocations: () => Promise<void>;
  loadSite: (id: string) => Promise<void>;
  loadLocation: (id: string) => Promise<void>;
  createNewSite: (site: Omit<Site, 'id' | 'history'>) => Promise<Site>;
  updateSiteData: (id: string, updates: Partial<Site>) => Promise<Site>;
  archiveSiteData: (id: string) => Promise<Site>;
  reactivateSiteData: (id: string) => Promise<Site>;
  createNewLocation: (location: Omit<Location, 'id' | 'history'>) => Promise<Location>;
  updateLocationData: (id: string, updates: Partial<Location>) => Promise<Location>;
  archiveLocationData: (id: string) => Promise<Location>;
  bulkUpdateSitesData: (siteIds: string[], updates: Partial<Site>) => Promise<Site[]>;
  bulkArchiveSitesData: (siteIds: string[]) => Promise<Site[]>;
  bulkCreateLocationsData: (locations: Omit<Location, 'id' | 'history'>[]) => Promise<Location[]>;
  bulkUpdateLocationsData: (locationIds: string[], updates: Partial<Location>) => Promise<Location[]>;
  bulkArchiveLocationsData: (locationIds: string[]) => Promise<Location[]>;
  loadSummary: () => Promise<void>;
  setViewMode: (mode: 'tree' | 'table') => void;
}

const SitesContext = createContext<SitesContextType | undefined>(undefined);

export function SitesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(sitesReducer, {
    sites: [],
    locations: [],
    sitesWithLocations: [],
    currentSite: null,
    currentLocation: null,
    summary: { total: 0, active: 0, locationsWithOpenDefects: 0, locationsWithOverdueWorkOrders: 0 },
    loading: false,
    error: null,
    viewMode: 'tree',
  });

  // Initialize database and seed
  useEffect(() => {
    async function init() {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        await initSitesDB();
        
        // Seed in dev mode only
        if (import.meta.env.DEV) {
          await seedSitesAndLocations();
        }
        
        await loadSites();
        await loadLocations();
        await loadSitesWithLocations();
        await loadSummary();
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }
    init();
  }, []);

  const loadSites = useCallback(async (filter?: SiteFilter) => {
    try {
      const userSiteIds = user?.role === 'Admin' || user?.role === 'Manager' 
        ? undefined 
        : user?.siteIds || [];
      const sites = await querySites(filter, userSiteIds);
      dispatch({ type: 'SET_SITES', payload: sites });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, [user]);

  const loadLocations = useCallback(async (filter?: LocationFilter) => {
    try {
      const locations = await queryLocations(filter);
      dispatch({ type: 'SET_LOCATIONS', payload: locations });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, []);

  const loadSitesWithLocations = useCallback(async () => {
    try {
      const userSiteIds = user?.role === 'Admin' || user?.role === 'Manager' 
        ? undefined 
        : user?.siteIds || [];
      const sitesWithLocations = await getAllSitesWithLocations(userSiteIds);
      dispatch({ type: 'SET_SITES_WITH_LOCATIONS', payload: sitesWithLocations });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, [user]);

  const loadSite = useCallback(async (id: string) => {
    try {
      const site = await getSiteById(id);
      if (site) {
        dispatch({ type: 'SET_CURRENT_SITE', payload: site });
      }
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, []);

  const loadLocation = useCallback(async (id: string) => {
    try {
      const location = await getLocationById(id);
      if (location) {
        dispatch({ type: 'SET_CURRENT_LOCATION', payload: location });
      }
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, []);

  const loadSummary = useCallback(async () => {
    try {
      const userSiteIds = user?.role === 'Admin' || user?.role === 'Manager' 
        ? undefined 
        : user?.siteIds || [];
      const summary = await getSiteSummary(userSiteIds);
      dispatch({ type: 'SET_SUMMARY', payload: summary });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, [user]);

  const createNewSite = useCallback(
    async (site: Omit<Site, 'id' | 'history'>) => {
      try {
        const newSite = await createSite(site);
        dispatch({ type: 'ADD_SITE', payload: newSite });
        await loadSites();
        await loadSitesWithLocations();
        await loadSummary();
        return newSite;
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        throw error;
      }
    },
    [loadSites, loadSitesWithLocations, loadSummary]
  );

  const updateSiteData = useCallback(
    async (id: string, updates: Partial<Site>) => {
      try {
        const updated = await updateSite(id, updates);
        dispatch({ type: 'UPDATE_SITE', payload: updated });
        await loadSites();
        await loadSitesWithLocations();
        await loadSummary();
        return updated;
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        throw error;
      }
    },
    [loadSites, loadSitesWithLocations, loadSummary]
  );

  const archiveSiteData = useCallback(
    async (id: string) => {
      try {
        const archived = await archiveSite(id, user!.id, `${user!.firstName} ${user!.lastName}`);
        dispatch({ type: 'UPDATE_SITE', payload: archived });
        await loadSites();
        await loadSitesWithLocations();
        await loadSummary();
        return archived;
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        throw error;
      }
    },
    [user, loadSites, loadSitesWithLocations, loadSummary]
  );

  const reactivateSiteData = useCallback(
    async (id: string) => {
      try {
        const reactivated = await reactivateSite(id, user!.id, `${user!.firstName} ${user!.lastName}`);
        dispatch({ type: 'UPDATE_SITE', payload: reactivated });
        await loadSites();
        await loadSitesWithLocations();
        await loadSummary();
        return reactivated;
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        throw error;
      }
    },
    [user, loadSites, loadSitesWithLocations, loadSummary]
  );

  const createNewLocation = useCallback(
    async (location: Omit<Location, 'id' | 'history'>) => {
      try {
        const newLocation = await createLocation(location);
        dispatch({ type: 'ADD_LOCATION', payload: newLocation });
        await loadLocations();
        await loadSitesWithLocations();
        return newLocation;
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        throw error;
      }
    },
    [loadLocations, loadSitesWithLocations]
  );

  const updateLocationData = useCallback(
    async (id: string, updates: Partial<Location>) => {
      try {
        const updated = await updateLocation(id, updates);
        dispatch({ type: 'UPDATE_LOCATION', payload: updated });
        await loadLocations();
        await loadSitesWithLocations();
        return updated;
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        throw error;
      }
    },
    [loadLocations, loadSitesWithLocations]
  );

  const archiveLocationData = useCallback(
    async (id: string) => {
      try {
        const archived = await archiveLocation(id, user!.id, `${user!.firstName} ${user!.lastName}`);
        dispatch({ type: 'UPDATE_LOCATION', payload: archived });
        await loadLocations();
        await loadSitesWithLocations();
        return archived;
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        throw error;
      }
    },
    [user, loadLocations, loadSitesWithLocations]
  );

  const bulkUpdateSitesData = useCallback(
    async (siteIds: string[], updates: Partial<Site>) => {
      try {
        const updated = await bulkUpdateSites(siteIds, updates, user!.id, `${user!.firstName} ${user!.lastName}`);
        await loadSites();
        await loadSitesWithLocations();
        await loadSummary();
        return updated;
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        throw error;
      }
    },
    [user, loadSites, loadSitesWithLocations, loadSummary]
  );

  const bulkArchiveSitesData = useCallback(
    async (siteIds: string[]) => {
      try {
        const archived = await bulkArchiveSites(siteIds, user!.id, `${user!.firstName} ${user!.lastName}`);
        await loadSites();
        await loadSitesWithLocations();
        await loadSummary();
        return archived;
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        throw error;
      }
    },
    [user, loadSites, loadSitesWithLocations, loadSummary]
  );

  const bulkCreateLocationsData = useCallback(
    async (locations: Omit<Location, 'id' | 'history'>[]) => {
      try {
        const created = await bulkCreateLocations(locations, user!.id, `${user!.firstName} ${user!.lastName}`);
        await loadLocations();
        await loadSitesWithLocations();
        return created;
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        throw error;
      }
    },
    [user, loadLocations, loadSitesWithLocations]
  );

  const bulkUpdateLocationsData = useCallback(
    async (locationIds: string[], updates: Partial<Location>) => {
      try {
        const updated = await bulkUpdateLocations(locationIds, updates, user!.id, `${user!.firstName} ${user!.lastName}`);
        await loadLocations();
        await loadSitesWithLocations();
        return updated;
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        throw error;
      }
    },
    [user, loadLocations, loadSitesWithLocations]
  );

  const bulkArchiveLocationsData = useCallback(
    async (locationIds: string[]) => {
      try {
        const archived = await bulkArchiveLocations(locationIds, user!.id, `${user!.firstName} ${user!.lastName}`);
        await loadLocations();
        await loadSitesWithLocations();
        return archived;
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        throw error;
      }
    },
    [user, loadLocations, loadSitesWithLocations]
  );

  const setViewMode = useCallback((mode: 'tree' | 'table') => {
    dispatch({ type: 'SET_VIEW_MODE', payload: mode });
  }, []);

  return (
    <SitesContext.Provider
      value={{
        ...state,
        loadSites,
        loadLocations,
        loadSitesWithLocations,
        loadSite,
        loadLocation,
        createNewSite,
        updateSiteData,
        archiveSiteData,
        reactivateSiteData,
        createNewLocation,
        updateLocationData,
        archiveLocationData,
        bulkUpdateSitesData,
        bulkArchiveSitesData,
        bulkCreateLocationsData,
        bulkUpdateLocationsData,
        bulkArchiveLocationsData,
        loadSummary,
        setViewMode,
      }}
    >
      {children}
    </SitesContext.Provider>
  );
}

export function useSites() {
  const context = useContext(SitesContext);
  if (!context) {
    throw new Error('useSites must be used within SitesProvider');
  }
  return context;
}
