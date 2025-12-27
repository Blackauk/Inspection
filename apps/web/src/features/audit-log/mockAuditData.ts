// Mock audit log data
export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: 'Create' | 'Update' | 'Delete' | 'Login' | 'Logout' | 'Export' | 'Import' | 'Approve' | 'Submit' | 'Complete';
  entityType: 'WorkOrder' | 'Inspection' | 'Defect' | 'Asset' | 'Settings' | 'User' | 'Category' | 'Tag' | 'Document' | 'Photo';
  entityId: string;
  entityName?: string;
  summary: string;
  module: 'Work Orders' | 'Inspections' | 'Defects' | 'Assets' | 'Settings' | 'Users' | 'Reports';
  siteId?: string;
  siteName?: string;
  ipAddress?: string;
  device?: string;
  severity: 'Info' | 'Warning' | 'Critical';
  before?: Record<string, any>;
  after?: Record<string, any>;
  metadata?: Record<string, any>;
}

const users = [
  { id: '1', name: 'Dev User' },
  { id: '2', name: 'John Supervisor' },
  { id: '3', name: 'Jane Manager' },
  { id: '4', name: 'Bob Fitter' },
];

const sites = [
  { id: '1', name: 'Site A' },
  { id: '2', name: 'Site B' },
  { id: '3', name: 'Site C' },
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  date.setHours(Math.floor(Math.random() * 24));
  date.setMinutes(Math.floor(Math.random() * 60));
  return date.toISOString();
}

export function generateMockAuditLog(count: number = 60): AuditLogEntry[] {
  const entries: AuditLogEntry[] = [];
  const actions: AuditLogEntry['action'][] = ['Create', 'Update', 'Delete', 'Login', 'Logout', 'Export', 'Import', 'Approve', 'Submit', 'Complete'];
  const entityTypes: AuditLogEntry['entityType'][] = ['WorkOrder', 'Inspection', 'Defect', 'Asset', 'Settings', 'User', 'Category', 'Tag', 'Document', 'Photo'];
  const modules: AuditLogEntry['module'][] = ['Work Orders', 'Inspections', 'Defects', 'Assets', 'Settings', 'Users', 'Reports'];
  const severities: AuditLogEntry['severity'][] = ['Info', 'Warning', 'Critical'];

  // Generate login/logout entries
  for (let i = 0; i < 10; i++) {
    const user = randomItem(users);
    entries.push({
      id: `audit-${entries.length + 1}`,
      timestamp: randomDate(30),
      userId: user.id,
      userName: user.name,
      action: i % 2 === 0 ? 'Login' : 'Logout',
      entityType: 'User',
      entityId: user.id,
      entityName: user.name,
      summary: `${user.name} ${i % 2 === 0 ? 'logged in' : 'logged out'}`,
      module: 'Users',
      ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
      device: randomItem(['Chrome', 'Firefox', 'Safari', 'Mobile']),
      severity: 'Info',
    });
  }

  // Generate work order entries
  for (let i = 0; i < 15; i++) {
    const user = randomItem(users);
    const site = randomItem(sites);
    const action = randomItem(['Create', 'Update', 'Complete', 'Approve']);
    const woId = `WO-${String(Math.floor(Math.random() * 10000)).padStart(6, '0')}`;
    
    entries.push({
      id: `audit-${entries.length + 1}`,
      timestamp: randomDate(30),
      userId: user.id,
      userName: user.name,
      action: action as any,
      entityType: 'WorkOrder',
      entityId: woId,
      entityName: `Work Order ${woId}`,
      summary: `${user.name} ${action.toLowerCase()}d work order ${woId}`,
      module: 'Work Orders',
      siteId: site.id,
      siteName: site.name,
      severity: action === 'Delete' ? 'Warning' : 'Info',
      before: action === 'Update' ? { status: 'Open' } : undefined,
      after: action === 'Update' ? { status: 'In Progress' } : undefined,
    });
  }

  // Generate inspection entries
  for (let i = 0; i < 12; i++) {
    const user = randomItem(users);
    const site = randomItem(sites);
    const action = randomItem(['Create', 'Submit', 'Complete', 'Approve']);
    const inspId = `INS-${String(Math.floor(Math.random() * 10000)).padStart(6, '0')}`;
    
    entries.push({
      id: `audit-${entries.length + 1}`,
      timestamp: randomDate(30),
      userId: user.id,
      userName: user.name,
      action: action as any,
      entityType: 'Inspection',
      entityId: inspId,
      entityName: `Inspection ${inspId}`,
      summary: `${user.name} ${action.toLowerCase()}d inspection ${inspId}`,
      module: 'Inspections',
      siteId: site.id,
      siteName: site.name,
      severity: action === 'Complete' && Math.random() > 0.7 ? 'Warning' : 'Info',
      metadata: action === 'Complete' ? { passed: Math.random() > 0.3 } : undefined,
    });
  }

  // Generate defect entries
  for (let i = 0; i < 10; i++) {
    const user = randomItem(users);
    const site = randomItem(sites);
    const action = randomItem(['Create', 'Update', 'Resolve']);
    const defectId = `DEF-${String(Math.floor(Math.random() * 10000)).padStart(6, '0')}`;
    
    entries.push({
      id: `audit-${entries.length + 1}`,
      timestamp: randomDate(30),
      userId: user.id,
      userName: user.name,
      action: action as any,
      entityType: 'Defect',
      entityId: defectId,
      entityName: `Defect ${defectId}`,
      summary: `${user.name} ${action.toLowerCase()}d defect ${defectId}`,
      module: 'Defects',
      siteId: site.id,
      siteName: site.name,
      severity: randomItem(['Info', 'Warning', 'Critical']),
    });
  }

  // Generate settings entries
  for (let i = 0; i < 8; i++) {
    const user = randomItem(users);
    const action = randomItem(['Create', 'Update', 'Delete']);
    const entityType = randomItem(['Category', 'Tag', 'User']);
    const entityId = `${entityType.toLowerCase()}-${Math.floor(Math.random() * 100)}`;
    
    entries.push({
      id: `audit-${entries.length + 1}`,
      timestamp: randomDate(30),
      userId: user.id,
      userName: user.name,
      action: action as any,
      entityType: entityType as any,
      entityId,
      entityName: `${entityType} ${entityId}`,
      summary: `${user.name} ${action.toLowerCase()}d ${entityType.toLowerCase()} ${entityId}`,
      module: 'Settings',
      severity: action === 'Delete' ? 'Warning' : 'Info',
      before: action === 'Update' ? { name: 'Old Name' } : undefined,
      after: action === 'Update' ? { name: 'New Name' } : undefined,
    });
  }

  // Generate document/photo upload entries
  for (let i = 0; i < 5; i++) {
    const user = randomItem(users);
    const site = randomItem(sites);
    const entityType = randomItem(['Document', 'Photo']);
    
    entries.push({
      id: `audit-${entries.length + 1}`,
      timestamp: randomDate(30),
      userId: user.id,
      userName: user.name,
      action: 'Import',
      entityType: entityType as any,
      entityId: `${entityType.toLowerCase()}-${Math.floor(Math.random() * 1000)}`,
      summary: `${user.name} uploaded ${entityType.toLowerCase()}`,
      module: entityType === 'Photo' ? 'Inspections' : 'Work Orders',
      siteId: site.id,
      siteName: site.name,
      severity: 'Info',
      metadata: { fileName: `file-${i + 1}.${entityType === 'Photo' ? 'jpg' : 'pdf'}`, size: Math.floor(Math.random() * 5000) + 100 },
    });
  }

  // Sort by timestamp (newest first)
  return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function loadAuditLog(): AuditLogEntry[] {
  const stored = localStorage.getItem('ppma.auditLog');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse audit log:', e);
    }
  }
  
  // Generate and store mock data
  const data = generateMockAuditLog(60);
  localStorage.setItem('ppma.auditLog', JSON.stringify(data));
  return data;
}

export function saveAuditLog(entries: AuditLogEntry[]) {
  localStorage.setItem('ppma.auditLog', JSON.stringify(entries));
}




