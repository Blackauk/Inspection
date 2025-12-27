// Mock data for Settings page
// All data persisted to localStorage

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Supervisor' | 'Fitter' | 'Viewer';
  status: 'Active' | 'Disabled';
  siteIds: string[];
  lastLogin?: string;
}

export interface Role {
  id: string;
  name: string;
  permissions: Record<string, Record<string, boolean>>; // module -> action -> allowed
}

export interface Site {
  id: string;
  name: string;
  address: string;
  status: 'Active' | 'Archived';
  managerId?: string;
  managerName?: string;
  assetCount?: number;
}

export interface Location {
  id: string;
  name: string;
  siteId: string;
  parentLocationId?: string;
  type: 'Zone' | 'Area' | 'Bin' | 'Other';
  status: 'Active' | 'Archived';
}

export interface Category {
  id: string;
  name: string;
  appliesTo: ('Assets' | 'Defects' | 'Inspections' | 'WorkOrders')[];
  color: string;
  status: 'Active' | 'Inactive';
  usageCount?: number;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  status: 'Active' | 'Inactive';
  usageCount?: number;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  before?: Record<string, any>;
  after?: Record<string, any>;
}

export interface AppSettings {
  appName: string;
  defaultTimezone: string;
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY';
  defaultSiteId?: string;
  modules: {
    workOrders: boolean;
    pmSchedules: boolean;
    reports: boolean;
  };
  defects: {
    autoCreateOnInspectionFail: boolean;
  };
  inspections: {
    autoCloseOnAllPass: boolean;
  };
}

export interface NotificationSettings {
  defectAlerts: {
    unsafeCreated: boolean;
    overdueDefects: boolean;
    highSeverityCreated: boolean;
  };
  inspectionAlerts: {
    overdueInspections: boolean;
    failedInspections: boolean;
  };
  deliveryMethods: {
    inApp: boolean;
    email: boolean; // Coming soon
  };
}

// Initial mock data
export const initialUsers: User[] = [
  {
    id: 'user-1',
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@example.com',
    role: 'Admin',
    status: 'Active',
    siteIds: ['site-1', 'site-2'],
    lastLogin: '2025-12-20T10:30:00Z',
  },
  {
    id: 'user-2',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@example.com',
    role: 'Manager',
    status: 'Active',
    siteIds: ['site-1'],
    lastLogin: '2025-12-20T09:15:00Z',
  },
  {
    id: 'user-3',
    firstName: 'David',
    lastName: 'Lee',
    email: 'david.lee@example.com',
    role: 'Supervisor',
    status: 'Active',
    siteIds: ['site-2'],
    lastLogin: '2025-12-19T16:45:00Z',
  },
  {
    id: 'user-4',
    firstName: 'Mike',
    lastName: 'Davis',
    email: 'mike.davis@example.com',
    role: 'Fitter',
    status: 'Active',
    siteIds: ['site-1'],
    lastLogin: '2025-12-20T08:00:00Z',
  },
];

export const initialRoles: Role[] = [
  {
    id: 'admin',
    name: 'Admin',
    permissions: {
      Assets: { View: true, Create: true, Edit: true, Delete: true, Export: true },
      Inspections: { View: true, Create: true, Edit: true, Close: true, Export: true },
      Defects: { View: true, Create: true, Edit: true, Close: true, Export: true },
      WorkOrders: { View: true, Create: true, Edit: true, Complete: true, Export: true },
      PMSchedules: { View: true, Create: true, Edit: true, Delete: true, Export: true },
      Reports: { View: true, Create: true, Edit: true, Export: true },
      Settings: { View: true, Create: true, Edit: true, Delete: true },
    },
  },
  {
    id: 'manager',
    name: 'Manager',
    permissions: {
      Assets: { View: true, Create: true, Edit: true, Delete: false, Export: true },
      Inspections: { View: true, Create: true, Edit: true, Close: true, Export: true },
      Defects: { View: true, Create: true, Edit: true, Close: true, Export: true },
      WorkOrders: { View: true, Create: true, Edit: true, Complete: true, Export: true },
      PMSchedules: { View: true, Create: true, Edit: true, Delete: false, Export: true },
      Reports: { View: true, Create: true, Edit: false, Export: true },
      Settings: { View: true, Create: false, Edit: false, Delete: false },
    },
  },
  {
    id: 'supervisor',
    name: 'Supervisor',
    permissions: {
      Assets: { View: true, Create: false, Edit: false, Delete: false, Export: false },
      Inspections: { View: true, Create: true, Edit: true, Close: true, Export: false },
      Defects: { View: true, Create: true, Edit: true, Close: false, Export: false },
      WorkOrders: { View: true, Create: false, Edit: true, Complete: true, Export: false },
      PMSchedules: { View: true, Create: false, Edit: false, Delete: false, Export: false },
      Reports: { View: true, Create: false, Edit: false, Export: false },
      Settings: { View: false, Create: false, Edit: false, Delete: false },
    },
  },
  {
    id: 'fitter',
    name: 'Fitter',
    permissions: {
      Assets: { View: true, Create: false, Edit: false, Delete: false, Export: false },
      Inspections: { View: true, Create: true, Edit: true, Close: false, Export: false },
      Defects: { View: true, Create: true, Edit: false, Close: false, Export: false },
      WorkOrders: { View: true, Create: false, Edit: true, Complete: true, Export: false },
      PMSchedules: { View: true, Create: false, Edit: false, Delete: false, Export: false },
      Reports: { View: false, Create: false, Edit: false, Export: false },
      Settings: { View: false, Create: false, Edit: false, Delete: false },
    },
  },
];

export const initialSites: Site[] = [
  {
    id: 'site-1',
    name: 'Site A',
    address: '123 Industrial Way, City A',
    status: 'Active',
    managerId: 'user-2',
    managerName: 'Sarah Johnson',
    assetCount: 45,
  },
  {
    id: 'site-2',
    name: 'Site B',
    address: '456 Factory Road, City B',
    status: 'Active',
    managerId: 'user-3',
    managerName: 'David Lee',
    assetCount: 32,
  },
  {
    id: 'site-3',
    name: 'Site C',
    address: '789 Warehouse Street, City C',
    status: 'Active',
    assetCount: 28,
  },
];

export const initialLocations: Location[] = [
  { id: 'loc-1', name: 'Main Yard', siteId: 'site-1', type: 'Zone', status: 'Active' },
  { id: 'loc-2', name: 'Workshop', siteId: 'site-1', parentLocationId: 'loc-1', type: 'Area', status: 'Active' },
  { id: 'loc-3', name: 'Storage Bay 1', siteId: 'site-1', parentLocationId: 'loc-2', type: 'Bin', status: 'Active' },
  { id: 'loc-4', name: 'Yard 2', siteId: 'site-2', type: 'Zone', status: 'Active' },
  { id: 'loc-5', name: 'Loading Dock', siteId: 'site-2', parentLocationId: 'loc-4', type: 'Area', status: 'Active' },
];

export const initialCategories: Category[] = [
  {
    id: 'cat-1',
    name: 'Hydraulic',
    appliesTo: ['Assets', 'Defects'],
    color: '#ef4444',
    status: 'Active',
    usageCount: 12,
  },
  {
    id: 'cat-2',
    name: 'Electrical',
    appliesTo: ['Assets', 'Defects', 'WorkOrders'],
    color: '#f59e0b',
    status: 'Active',
    usageCount: 8,
  },
  {
    id: 'cat-3',
    name: 'Safety',
    appliesTo: ['Defects', 'Inspections'],
    color: '#10b981',
    status: 'Active',
    usageCount: 15,
  },
  {
    id: 'cat-4',
    name: 'Mechanical',
    appliesTo: ['Assets', 'Defects', 'WorkOrders'],
    color: '#3b82f6',
    status: 'Active',
    usageCount: 22,
  },
];

export const initialTags: Tag[] = [
  { id: 'tag-1', name: 'Critical', color: '#ef4444', status: 'Active', usageCount: 5 },
  { id: 'tag-2', name: 'Urgent', color: '#f59e0b', status: 'Active', usageCount: 8 },
  { id: 'tag-3', name: 'Routine', color: '#10b981', status: 'Active', usageCount: 12 },
  { id: 'tag-4', name: 'PUWER', color: '#8b5cf6', status: 'Active', usageCount: 3 },
  { id: 'tag-5', name: 'LOLER', color: '#ec4899', status: 'Active', usageCount: 2 },
];

export const initialAppSettings: AppSettings = {
  appName: 'CoreCheck PPM',
  defaultTimezone: 'Europe/London',
  dateFormat: 'DD/MM/YYYY',
  defaultSiteId: 'site-1',
  modules: {
    workOrders: true,
    pmSchedules: true,
    reports: true,
  },
  defects: {
    autoCreateOnInspectionFail: true,
  },
  inspections: {
    autoCloseOnAllPass: false,
  },
};

export const initialNotificationSettings: NotificationSettings = {
  defectAlerts: {
    unsafeCreated: true,
    overdueDefects: true,
    highSeverityCreated: true,
  },
  inspectionAlerts: {
    overdueInspections: true,
    failedInspections: true,
  },
  deliveryMethods: {
    inApp: true,
    email: false,
  },
};

// Helper functions to load/save from localStorage
export function loadUsers(): User[] {
  const saved = localStorage.getItem('settings-users');
  return saved ? JSON.parse(saved) : initialUsers;
}

export function saveUsers(users: User[]): void {
  localStorage.setItem('settings-users', JSON.stringify(users));
}

export function loadRoles(): Role[] {
  const saved = localStorage.getItem('settings-roles');
  return saved ? JSON.parse(saved) : initialRoles;
}

export function saveRoles(roles: Role[]): void {
  localStorage.setItem('settings-roles', JSON.stringify(roles));
}

export function loadSites(): Site[] {
  const saved = localStorage.getItem('settings-sites');
  return saved ? JSON.parse(saved) : initialSites;
}

export function saveSites(sites: Site[]): void {
  localStorage.setItem('settings-sites', JSON.stringify(sites));
}

export function loadLocations(): Location[] {
  const saved = localStorage.getItem('settings-locations');
  return saved ? JSON.parse(saved) : initialLocations;
}

export function saveLocations(locations: Location[]): void {
  localStorage.setItem('settings-locations', JSON.stringify(locations));
}

export function loadCategories(): Category[] {
  const saved = localStorage.getItem('settings-categories');
  return saved ? JSON.parse(saved) : initialCategories;
}

export function saveCategories(categories: Category[]): void {
  localStorage.setItem('settings-categories', JSON.stringify(categories));
}

export function loadTags(): Tag[] {
  const saved = localStorage.getItem('settings-tags');
  return saved ? JSON.parse(saved) : initialTags;
}

export function saveTags(tags: Tag[]): void {
  localStorage.setItem('settings-tags', JSON.stringify(tags));
}

export function loadAppSettings(): AppSettings {
  const saved = localStorage.getItem('settings-app');
  return saved ? JSON.parse(saved) : initialAppSettings;
}

export function saveAppSettings(settings: AppSettings): void {
  localStorage.setItem('settings-app', JSON.stringify(settings));
}

export function loadNotificationSettings(): NotificationSettings {
  const saved = localStorage.getItem('settings-notifications');
  return saved ? JSON.parse(saved) : initialNotificationSettings;
}

export function saveNotificationSettings(settings: NotificationSettings): void {
  localStorage.setItem('settings-notifications', JSON.stringify(settings));
}

// Generate mock audit log entries
export function generateAuditLogEntries(count: number = 50): AuditLogEntry[] {
  const actions = ['CREATE', 'UPDATE', 'DELETE', 'CLOSE', 'ASSIGN', 'APPROVE'];
  const entityTypes = ['Asset', 'WorkOrder', 'Defect', 'Inspection', 'User', 'Site'];
  const users = loadUsers();
  
  const entries: AuditLogEntry[] = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const timestamp = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const user = users[Math.floor(Math.random() * users.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];
    const entityType = entityTypes[Math.floor(Math.random() * entityTypes.length)];
    
    entries.push({
      id: `audit-${i + 1}`,
      timestamp: timestamp.toISOString(),
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      action,
      entityType,
      entityId: `${entityType}-${Math.floor(Math.random() * 1000)}`,
      summary: `${action} ${entityType} ${entityType}-${Math.floor(Math.random() * 1000)}`,
    });
  }
  
  return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function loadAuditLog(): AuditLogEntry[] {
  const saved = localStorage.getItem('settings-audit-log');
  if (saved) {
    return JSON.parse(saved);
  }
  const entries = generateAuditLogEntries(50);
  localStorage.setItem('settings-audit-log', JSON.stringify(entries));
  return entries;
}


