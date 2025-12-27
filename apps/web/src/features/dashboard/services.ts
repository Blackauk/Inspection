import type { Alert, MyTask, ComplianceSnapshot, DueSoonItem, RecentActivity } from './types';

// Mock data - will be replaced with real API calls later
export function getAlerts(): Alert[] {
  return [
    {
      id: '1',
      type: 'overdue-pm',
      title: 'Overdue PM Tasks',
      count: 12,
      severity: 'critical',
      filterPath: '/pm-schedules?filter=overdue',
    },
    {
      id: '2',
      type: 'compliance-expiring',
      title: 'Compliance Expiring Soon',
      count: 8,
      severity: 'high',
      filterPath: '/inspections?filter=expiring',
    },
    {
      id: '3',
      type: 'high-priority-wo',
      title: 'Open High-Priority Work Orders',
      count: 5,
      severity: 'high',
      filterPath: '/work-orders?priority=High&status=Open',
    },
    {
      id: '4',
      type: 'failed-inspection',
      title: 'Failed Inspections',
      count: 3,
      severity: 'critical',
      filterPath: '/inspections?status=Failed',
    },
    {
      id: '5',
      type: 'high-risk-asset',
      title: 'High-Risk Assets',
      count: 7,
      severity: 'high',
      filterPath: '/assets?filter=high-risk',
    },
  ];
}

export function getMyTasks(): MyTask[] {
  return [
    {
      id: '1',
      type: 'work-order',
      title: 'Replace hydraulic filter - Excavator EX-001',
      status: 'Assigned',
      dueDate: '2025-12-16',
      assetId: 'EX-001',
      assetName: 'Excavator EX-001',
      site: 'Site A',
    },
    {
      id: '2',
      type: 'inspection',
      title: 'Weekly safety inspection - Crane CR-005',
      status: 'Due Today',
      dueDate: '2025-12-15',
      assetId: 'CR-005',
      assetName: 'Crane CR-005',
      site: 'Site B',
    },
    {
      id: '3',
      type: 'pm',
      title: 'Monthly PM - Generator GEN-012',
      status: 'Scheduled',
      dueDate: '2025-12-17',
      assetId: 'GEN-012',
      assetName: 'Generator GEN-012',
      site: 'Site A',
    },
    {
      id: '4',
      type: 'work-order',
      title: 'Repair brake system - Forklift FL-023',
      status: 'In Progress',
      dueDate: '2025-12-18',
      assetId: 'FL-023',
      assetName: 'Forklift FL-023',
      site: 'Site C',
    },
    {
      id: '5',
      type: 'inspection',
      title: 'LOLER inspection - Hoist HO-008',
      status: 'Due Soon',
      dueDate: '2025-12-19',
      assetId: 'HO-008',
      assetName: 'Hoist HO-008',
      site: 'Site B',
    },
    {
      id: '6',
      type: 'pm',
      title: 'Quarterly service - Compressor COM-015',
      status: 'Scheduled',
      dueDate: '2025-12-20',
      assetId: 'COM-015',
      assetName: 'Compressor COM-015',
      site: 'Site A',
    },
    {
      id: '7',
      type: 'work-order',
      title: 'Calibrate pressure gauge - Pump PU-042',
      status: 'Assigned',
      dueDate: '2025-12-21',
      assetId: 'PU-042',
      assetName: 'Pump PU-042',
      site: 'Site C',
    },
    {
      id: '8',
      type: 'inspection',
      title: 'Daily check - Welder WEL-003',
      status: 'Due Today',
      dueDate: '2025-12-15',
      assetId: 'WEL-003',
      assetName: 'Welder WEL-003',
      site: 'Site A',
    },
  ];
}

export function getComplianceSnapshot(): ComplianceSnapshot[] {
  return [
    {
      siteId: '1',
      siteName: 'Site A',
      green: 45,
      amber: 8,
      red: 3,
      totalAssets: 87,
      overduePM: 3,
      openWorkOrders: 12,
      complianceRed: 3,
    },
    {
      siteId: '2',
      siteName: 'Site B',
      green: 52,
      amber: 5,
      red: 1,
      totalAssets: 95,
      overduePM: 1,
      openWorkOrders: 8,
      complianceRed: 1,
    },
    {
      siteId: '3',
      siteName: 'Site C',
      green: 38,
      amber: 12,
      red: 6,
      totalAssets: 65,
      overduePM: 6,
      openWorkOrders: 14,
      complianceRed: 6,
    },
  ];
}

export function getDueSoonItems(days: 7 | 14 | 30): DueSoonItem[] {
  const baseItems: DueSoonItem[] = [
    {
      id: '1',
      type: 'pm',
      title: 'Monthly PM - Excavator EX-001',
      dueDate: '2025-12-18',
      assetId: 'EX-001',
      assetName: 'Excavator EX-001',
      site: 'Site A',
      daysUntil: 3,
    },
    {
      id: '2',
      type: 'compliance',
      title: 'LOLER Certificate - Crane CR-005',
      dueDate: '2025-12-20',
      assetId: 'CR-005',
      assetName: 'Crane CR-005',
      site: 'Site B',
      daysUntil: 5,
    },
    {
      id: '3',
      type: 'pm',
      title: 'Quarterly Service - Generator GEN-012',
      dueDate: '2025-12-22',
      assetId: 'GEN-012',
      assetName: 'Generator GEN-012',
      site: 'Site A',
      daysUntil: 7,
    },
    {
      id: '4',
      type: 'compliance',
      title: 'PUWER Assessment - Forklift FL-023',
      dueDate: '2025-12-25',
      assetId: 'FL-023',
      assetName: 'Forklift FL-023',
      site: 'Site C',
      daysUntil: 10,
    },
    {
      id: '5',
      type: 'pm',
      title: 'Weekly Check - Compressor COM-015',
      dueDate: '2025-12-16',
      assetId: 'COM-015',
      assetName: 'Compressor COM-015',
      site: 'Site A',
      daysUntil: 1,
    },
    {
      id: '6',
      type: 'compliance',
      title: 'Fire Suppression Test - Pump PU-042',
      dueDate: '2025-12-28',
      assetId: 'PU-042',
      assetName: 'Pump PU-042',
      site: 'Site C',
      daysUntil: 13,
    },
  ];

  return baseItems.filter((item) => item.daysUntil <= days);
}

export function getRecentActivity(): RecentActivity[] {
  return [
    {
      id: '1',
      user: 'John Smith',
      action: 'completed',
      entity: 'Work Order WO-1234',
      timestamp: '2 minutes ago',
    },
    {
      id: '2',
      user: 'Sarah Johnson',
      action: 'submitted',
      entity: 'Inspection for CR-005',
      timestamp: '15 minutes ago',
    },
    {
      id: '3',
      user: 'Mike Davis',
      action: 'created',
      entity: 'Work Order WO-1235',
      timestamp: '1 hour ago',
    },
    {
      id: '4',
      user: 'Emma Wilson',
      action: 'updated',
      entity: 'Asset EX-001 status',
      timestamp: '2 hours ago',
    },
    {
      id: '5',
      user: 'Tom Brown',
      action: 'assigned',
      entity: 'Work Order WO-1236',
      timestamp: '3 hours ago',
    },
    {
      id: '6',
      user: 'Lisa Anderson',
      action: 'approved',
      entity: 'PM Schedule for GEN-012',
      timestamp: '4 hours ago',
    },
    {
      id: '7',
      user: 'David Lee',
      action: 'completed',
      entity: 'Inspection for FL-023',
      timestamp: '5 hours ago',
    },
    {
      id: '8',
      user: 'Rachel Green',
      action: 'created',
      entity: 'Defect Report DEF-045',
      timestamp: '6 hours ago',
    },
    {
      id: '9',
      user: 'Chris Taylor',
      action: 'updated',
      entity: 'Asset COM-015 location',
      timestamp: '7 hours ago',
    },
    {
      id: '10',
      user: 'Amy White',
      action: 'submitted',
      entity: 'Check submission for HO-008',
      timestamp: '8 hours ago',
    },
  ];
}

export interface KPIStat {
  id: string;
  title: string;
  value: number;
  subtitle: string;
  badge?: string;
  badgeVariant?: 'success' | 'warning' | 'error' | 'info';
}

export function getKPIStats(): KPIStat[] {
  return [
    {
      id: '1',
      title: 'Total Assets',
      value: 247,
      subtitle: 'Across all sites',
      badge: '+12',
      badgeVariant: 'success',
    },
    {
      id: '2',
      title: 'Overdue PMs',
      value: 12,
      subtitle: 'Require attention',
      badge: '-3',
      badgeVariant: 'success',
    },
    {
      id: '3',
      title: 'Open Work Orders',
      value: 34,
      subtitle: 'High Priority: 5',
      badge: '+8',
      badgeVariant: 'warning',
    },
    {
      id: '4',
      title: 'Compliance Expiring',
      value: 8,
      subtitle: 'Next 30 days',
      badge: '2 new',
      badgeVariant: 'error',
    },
    {
      id: '5',
      title: 'Failed Inspections',
      value: 3,
      subtitle: 'Action required',
      badge: '0',
      badgeVariant: 'info',
    },
    {
      id: '6',
      title: 'High-Risk Assets',
      value: 7,
      subtitle: 'Repeated failures or overdue checks',
      badge: '+2',
      badgeVariant: 'error',
    },
  ];
}

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  date: string;
}

export function getNotifications(): Notification[] {
  return [
    {
      id: '1',
      type: 'error',
      message: 'PM task overdue: Excavator EX-001',
      date: '2 hours ago',
    },
    {
      id: '2',
      type: 'warning',
      message: 'Compliance expiring: Crane CR-005 LOLER certificate',
      date: '5 hours ago',
    },
    {
      id: '3',
      type: 'info',
      message: 'New work order assigned: WO-1237',
      date: '1 day ago',
    },
    {
      id: '4',
      type: 'error',
      message: 'Inspection failed: Forklift FL-023',
      date: '1 day ago',
    },
    {
      id: '5',
      type: 'warning',
      message: 'Inspection overdue: Daily check for Excavator EX-001',
      date: '2 days ago',
    },
    {
      id: '6',
      type: 'success',
      message: 'PM completed: Generator GEN-012',
      date: '2 days ago',
    },
    {
      id: '7',
      type: 'info',
      message: 'New asset added: Pump PU-043',
      date: '3 days ago',
    },
    {
      id: '8',
      type: 'warning',
      message: 'Defect reported: Compressor COM-015',
      date: '3 days ago',
    },
  ];
}

export interface ProblemAsset {
  id: string;
  assetCode: string;
  assetName: string;
  issues: number;
  lastIssue: string;
}

export function getTopProblemAssets(): ProblemAsset[] {
  return [
    {
      id: '1',
      assetCode: 'EX-001',
      assetName: 'Excavator EX-001',
      issues: 5,
      lastIssue: '2 days ago',
    },
    {
      id: '2',
      assetCode: 'FL-023',
      assetName: 'Forklift FL-023',
      issues: 4,
      lastIssue: '1 week ago',
    },
    {
      id: '3',
      assetCode: 'CR-005',
      assetName: 'Crane CR-005',
      issues: 3,
      lastIssue: '3 days ago',
    },
    {
      id: '4',
      assetCode: 'COM-015',
      assetName: 'Compressor COM-015',
      issues: 3,
      lastIssue: '5 days ago',
    },
    {
      id: '5',
      assetCode: 'PU-042',
      assetName: 'Pump PU-042',
      issues: 2,
      lastIssue: '1 week ago',
    },
  ];
}

export interface CategoryBreakdown {
  category: string;
  count: number;
  percentage: number;
}

export function getCategoryBreakdown(): CategoryBreakdown[] {
  return [
    { category: 'Electrical', count: 28, percentage: 35 },
    { category: 'Mechanical', count: 32, percentage: 40 },
    { category: 'Hydraulic', count: 15, percentage: 19 },
    { category: 'Other', count: 5, percentage: 6 },
  ];
}

export interface WorkOrderByStatus {
  status: string;
  count: number;
  percentage: number;
}

import type { DateRange } from './utils/dateRange';
import { getDateRangeForPreset } from './utils/dateRange';

export function getWorkOrdersByStatus(range?: DateRange | 7 | 14 | 30 | 'all'): WorkOrderByStatus[] {
  // Handle legacy format for backward compatibility
  let dateRange: DateRange;
  if (typeof range === 'number' || range === 'all' || !range) {
    if (range === 'all' || !range) {
      dateRange = { preset: 'mtd' }; // Default to all-time for legacy 'all'
    } else {
      const preset = range === 7 ? '7d' : range === 14 ? '14d' : '30d';
      dateRange = { preset };
    }
  } else {
    dateRange = range;
  }
  // Default data for "All time" (month-to-date or all-time)
  const allTimeData: WorkOrderByStatus[] = [
    { status: 'Open', count: 12, percentage: 35 },
    { status: 'In Progress', count: 8, percentage: 24 },
    { status: 'Completed', count: 10, percentage: 29 },
    { status: 'Waiting Parts', count: 4, percentage: 12 },
  ];

  // Mock data variants for different time ranges
  // In production, this would filter real work orders by created date within the range
  const rangeData: Record<string, WorkOrderByStatus[]> = {
    '7d': [
      { status: 'Open', count: 8, percentage: 40 },
      { status: 'In Progress', count: 5, percentage: 25 },
      { status: 'Completed', count: 6, percentage: 30 },
      { status: 'Waiting Parts', count: 1, percentage: 5 },
    ],
    '14d': [
      { status: 'Open', count: 10, percentage: 38 },
      { status: 'In Progress', count: 6, percentage: 23 },
      { status: 'Completed', count: 8, percentage: 31 },
      { status: 'Waiting Parts', count: 2, percentage: 8 },
    ],
    '30d': [
      { status: 'Open', count: 11, percentage: 37 },
      { status: 'In Progress', count: 7, percentage: 23 },
      { status: 'Completed', count: 9, percentage: 30 },
      { status: 'Waiting Parts', count: 3, percentage: 10 },
    ],
    '90d': [
      { status: 'Open', count: 12, percentage: 35 },
      { status: 'In Progress', count: 8, percentage: 24 },
      { status: 'Completed', count: 10, percentage: 29 },
      { status: 'Waiting Parts', count: 4, percentage: 12 },
    ],
    'mtd': [
      { status: 'Open', count: 12, percentage: 35 },
      { status: 'In Progress', count: 8, percentage: 24 },
      { status: 'Completed', count: 10, percentage: 29 },
      { status: 'Waiting Parts', count: 4, percentage: 12 },
    ],
    'custom': [
      { status: 'Open', count: 10, percentage: 36 },
      { status: 'In Progress', count: 7, percentage: 25 },
      { status: 'Completed', count: 8, percentage: 29 },
      { status: 'Waiting Parts', count: 3, percentage: 11 },
    ],
  };

  const data = rangeData[dateRange.preset] || allTimeData;
  const total = data.reduce((sum, item) => sum + item.count, 0);
  
  // Recalculate percentages based on actual totals
  return data.map((item) => ({
    ...item,
    percentage: Math.round((item.count / total) * 100),
  }));
}

export interface TrendDataPoint {
  date: string;
  value: number;
}

export function getWorkOrderTrends(days: 7 | 14 | 30): TrendDataPoint[] {
  // Reference data matching the specification
  const baseData: TrendDataPoint[] = [
    { date: '2025-12-10', value: 5 },
    { date: '2025-12-11', value: 8 },
    { date: '2025-12-12', value: 12 },
    { date: '2025-12-13', value: 11 },
    { date: '2025-12-14', value: 17 },
    { date: '2025-12-15', value: 14 },
  ];

  if (days === 14) {
    return [
      ...baseData,
      { date: '2025-12-02', value: 6 },
      { date: '2025-12-03', value: 9 },
      { date: '2025-12-04', value: 11 },
      { date: '2025-12-05', value: 13 },
      { date: '2025-12-06', value: 7 },
      { date: '2025-12-07', value: 10 },
      { date: '2025-12-08', value: 12 },
    ];
  }

  if (days === 30) {
    return Array.from({ length: 30 }, (_, i) => ({
      date: new Date(2025, 11, 15 - (29 - i)).toISOString().split('T')[0],
      value: Math.floor(Math.random() * 20) + 5,
    }));
  }

  return baseData;
}
