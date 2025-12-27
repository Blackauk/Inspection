export interface Alert {
  id: string;
  type: 'overdue-pm' | 'compliance-expiring' | 'high-priority-wo' | 'failed-inspection' | 'high-risk-asset';
  title: string;
  count: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  filterPath: string;
}

export interface MyTask {
  id: string;
  type: 'work-order' | 'inspection' | 'pm';
  title: string;
  status: string;
  dueDate: string;
  assetId: string;
  assetName: string;
  site: string;
}

export interface ComplianceSnapshot {
  siteId: string;
  siteName: string;
  green: number;
  amber: number;
  red: number;
  totalAssets: number;
  overduePM: number;
  openWorkOrders: number;
  complianceRed: number;
}

export interface DueSoonItem {
  id: string;
  type: 'pm' | 'compliance';
  title: string;
  dueDate: string;
  assetId: string;
  assetName: string;
  site: string;
  daysUntil: number;
}

export interface RecentActivity {
  id: string;
  user: string;
  action: string;
  entity: string;
  timestamp: string;
}
