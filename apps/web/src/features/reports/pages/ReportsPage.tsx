import { useState, useEffect, useMemo, useRef } from 'react';
import { Card } from '../../../components/common/Card';
import { Input } from '../../../components/common/Input';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { Checkbox } from '../../../components/common/Checkbox';
import { Select } from '../../../components/common/Select';
import { Modal } from '../../../components/common/Modal';
import { Tabs } from '../../../components/common/Tabs';
import { SortableTable } from '../../../components/common/SortableTable';
import { CollapsibleCard } from '../../../components/common/CollapsibleCard';
import { FilterPanel } from '../../../components/common/FilterPanel';
import { FilterChip } from '../../../components/common/FilterChip';
import { FilterButton } from '../../../components/common/FilterButton';
import { LineChart as RechartsLineChart, BarChart as RechartsBarChart, PieChart as RechartsPieChart, Line, Bar, Pie, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartCard } from '../../../components/charts/ChartCard';
import { ChartFocusModal } from '../../../components/charts/ChartFocusModal';
import { createChartTooltip } from '../../../components/charts/ChartTooltip';
import type { DataPoint } from '../../../components/common/LineChart';
import type { BarChartData } from '../components/BarChart';
import type { PieChartData } from '../components/PieChart';
import { exportToCSV, exportToExcel, exportPageAsPDF } from '../utils/exportUtils';
import { getInspections } from '../../inspections/services';
import { getDefects } from '../../defects/services';
import { getWorkOrders } from '../../work-orders/services';
import { getAssets, getAssetTypes, mockSites } from '../../assets/services';
import { getPMSchedules } from '../../pm-schedules/services';
import { GenerateReportModal } from '../components/GenerateReportModal';
import { ScheduledReportsList } from '../components/ScheduledReportsList';
import { ScheduleModal } from '../components/ScheduleModal';
import { Download, FileText, X, CheckCircle, XCircle, AlertTriangle, ClipboardCheck, Clock, AlertCircle, ClipboardList, Maximize } from 'lucide-react';
import { StatCard } from '../../../components/common/StatCard';
import { WildcardGrid } from '../../../components/common/WildcardGrid';
import { SavedReportsIndicator } from '../components/SavedReportsIndicator';
import type { Inspection } from '../../inspections/types';
import type { Defect } from '../../defects/types';
import type { WorkOrder } from '../../work-orders/types';
import type { Asset } from '../../assets/types';
import type { ReportFilters } from '../types';

interface SavedReport {
  id: string;
  name: string;
  type: string;
  format: 'PDF' | 'Excel';
  createdAt: string;
  data?: any; // Store report data for re-download
}

export function ReportsPage() {
  const [filters, setFilters] = useState<ReportFilters>(() => {
    const saved = localStorage.getItem('reports-filters');
    return saved ? JSON.parse(saved) : {};
  });
  const [reportsTab, setReportsTab] = useState<'overview' | 'saved' | 'scheduled'>('overview');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'inspections' | 'defects' | 'workOrders' | 'assets'>('inspections');
  const [tableSearch, setTableSearch] = useState('');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [savedReports, setSavedReports] = useState<SavedReport[]>(() => {
    const saved = localStorage.getItem('saved-reports');
    return saved ? JSON.parse(saved) : [];
  });
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  
  // Ensure modals are closed on mount (prevent auto-opening)
  useEffect(() => {
    setShowGenerateModal(false);
    setShowFilterPanel(false);
    setShowScheduleModal(false);
  }, []);
  const [expandedChart, setExpandedChart] = useState<string | null>(null);
  const [tempFilters, setTempFilters] = useState<ReportFilters>(filters);
  const filterButtonRef = useRef<HTMLDivElement>(null);
  const pageContentRef = useRef<HTMLDivElement>(null);
  
  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.dateFrom) count++;
    if (filters.dateTo) count++;
    if (filters.siteId) count++;
    if (filters.locationId) count++;
    if (filters.assetTypeId) count++;
    if (filters.assetId) count++;
    if (filters.assignedToId) count++;
    if (filters.status) count++;
    if (filters.severity) count++;
    return count;
  }, [filters]);

  // Load data
  const allInspections = useMemo(() => getInspections(), []);
  const allDefects = useMemo(() => getDefects(), []);
  const allWorkOrders = useMemo(() => getWorkOrders(), []);
  const allAssets = useMemo(() => getAssets(), []);
  const assetTypes = useMemo(() => getAssetTypes(), []);
  const allPMSchedules = useMemo(() => getPMSchedules(), []);

  // Apply filters to data
  const filteredInspections = useMemo(() => {
    let filtered = [...allInspections];

    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(ins => new Date(ins.inspectionDate) >= fromDate);
    }
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59);
      filtered = filtered.filter(ins => new Date(ins.inspectionDate) <= toDate);
    }
    if (filters.siteId) {
      filtered = filtered.filter(ins => ins.siteId === filters.siteId);
    }
    if (filters.assetId) {
      filtered = filtered.filter(ins => ins.assetId === filters.assetId);
    }
    if (filters.assignedToId) {
      filtered = filtered.filter(ins => ins.inspectorId === filters.assignedToId);
    }
    if (filters.status) {
      filtered = filtered.filter(ins => ins.status === filters.status);
    }

    return filtered;
  }, [allInspections, filters]);

  const filteredDefects = useMemo(() => {
    let filtered = [...allDefects];

    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(def => new Date(def.createdAt) >= fromDate);
    }
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59);
      filtered = filtered.filter(def => new Date(def.createdAt) <= toDate);
    }
    if (filters.siteId) {
      filtered = filtered.filter(def => def.siteId === filters.siteId);
    }
    if (filters.assetId) {
      filtered = filtered.filter(def => def.assetId === filters.assetId);
    }
    if (filters.assignedToId) {
      filtered = filtered.filter(def => def.assignedToId === filters.assignedToId);
    }
    if (filters.status) {
      filtered = filtered.filter(def => def.status === filters.status);
    }
    if (filters.severity) {
      filtered = filtered.filter(def => def.severity === filters.severity);
    }

    return filtered;
  }, [allDefects, filters]);

  const filteredWorkOrders = useMemo(() => {
    let filtered = [...allWorkOrders];

    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(wo => new Date(wo.createdAt) >= fromDate);
    }
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59);
      filtered = filtered.filter(wo => new Date(wo.createdAt) <= toDate);
    }
    if (filters.siteId) {
      filtered = filtered.filter(wo => wo.siteId === filters.siteId);
    }
    if (filters.assetId) {
      filtered = filtered.filter(wo => wo.assetId === filters.assetId);
    }
    if (filters.assignedToId) {
      filtered = filtered.filter(wo => wo.assignedToId === filters.assignedToId);
    }
    if (filters.status) {
      filtered = filtered.filter(wo => wo.status === filters.status);
    }

    return filtered;
  }, [allWorkOrders, filters]);

  const filteredAssets = useMemo(() => {
    let filtered = [...allAssets];

    if (filters.siteId) {
      filtered = filtered.filter(asset => asset.siteId === filters.siteId);
    }
    if (filters.assetTypeId) {
      filtered = filtered.filter(asset => asset.assetTypeId === filters.assetTypeId);
    }

    return filtered;
  }, [allAssets, filters]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const now = new Date();
    const inspectionsCompleted = filteredInspections.filter(ins => ins.status === 'Closed' || ins.status === 'Approved').length;
    const inspectionsOverdue = filteredInspections.filter(ins => {
      if (ins.status === 'Closed' || ins.status === 'Approved') return false;
      // Check if inspection is overdue based on due date or target date
      return false; // Simplified for now
    }).length;
    const defectsOpen = filteredDefects.filter(def => def.status === 'Open' || def.status === 'InProgress').length;
    const defectsOverdue = filteredDefects.filter(def => {
      if (def.status === 'Closed') return false;
      if (def.targetRectificationDate) {
        return new Date(def.targetRectificationDate) < now;
      }
      return false;
    }).length;
    const unsafeDoNotUse = filteredDefects.filter(def => def.unsafeDoNotUse && def.status !== 'Closed').length;
    const workOrdersOpen = filteredWorkOrders.filter(wo => 
      wo.status === 'Open' || wo.status === 'Assigned' || wo.status === 'InProgress'
    ).length;

    return {
      inspectionsCompleted,
      inspectionsOverdue,
      defectsOpen,
      defectsOverdue,
      unsafeDoNotUse,
      workOrdersOpen,
    };
  }, [filteredInspections, filteredDefects, filteredWorkOrders]);

  // Chart data
  const inspectionsChartData = useMemo<DataPoint[]>(() => {
    const dataMap = new Map<string, number>();
    filteredInspections.forEach(ins => {
      const date = new Date(ins.inspectionDate).toISOString().split('T')[0];
      dataMap.set(date, (dataMap.get(date) || 0) + 1);
    });
    return Array.from(dataMap.entries())
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredInspections]);

  const defectsChartData = useMemo<DataPoint[]>(() => {
    const dataMap = new Map<string, number>();
    filteredDefects.forEach(def => {
      const date = new Date(def.createdAt).toISOString().split('T')[0];
      dataMap.set(date, (dataMap.get(date) || 0) + 1);
    });
    return Array.from(dataMap.entries())
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredDefects]);

  const workOrdersChartData = useMemo<DataPoint[]>(() => {
    const dataMap = new Map<string, number>();
    filteredWorkOrders.forEach(wo => {
      const date = new Date(wo.createdAt).toISOString().split('T')[0];
      dataMap.set(date, (dataMap.get(date) || 0) + 1);
    });
    return Array.from(dataMap.entries())
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredWorkOrders]);

  const inspectionsByStatusData = useMemo<BarChartData[]>(() => {
    const statusCounts = new Map<string, number>();
    filteredInspections.forEach(ins => {
      statusCounts.set(ins.status, (statusCounts.get(ins.status) || 0) + 1);
    });
    return Array.from(statusCounts.entries()).map(([label, value]) => ({
      label,
      value,
      color: label === 'Closed' || label === 'Approved' ? '#10b981' : 
             label === 'InProgress' ? '#f59e0b' : '#3b82f6',
    }));
  }, [filteredInspections]);

  const defectsBySeverityData = useMemo<PieChartData[]>(() => {
    const severityCounts = new Map<string, number>();
    filteredDefects.forEach(def => {
      severityCounts.set(def.severity, (severityCounts.get(def.severity) || 0) + 1);
    });
    return Array.from(severityCounts.entries()).map(([label, value]) => ({
      label,
      value,
      color: label === 'High' || label === 'Critical' ? '#ef4444' :
             label === 'Medium' || label === 'Major' ? '#f59e0b' : '#10b981',
    }));
  }, [filteredDefects]);

  // Table data based on active tab
  const tableData = useMemo(() => {
    const searchLower = tableSearch.toLowerCase();
    
    if (activeTab === 'inspections') {
      return filteredInspections.filter(ins =>
        ins.inspectionCode.toLowerCase().includes(searchLower) ||
        (ins.templateName || '').toLowerCase().includes(searchLower) ||
        (ins.assetId || '').toLowerCase().includes(searchLower)
      );
    } else if (activeTab === 'defects') {
      return filteredDefects.filter(def =>
        def.defectCode.toLowerCase().includes(searchLower) ||
        (def.title || '').toLowerCase().includes(searchLower) ||
        (def.assetId || '').toLowerCase().includes(searchLower)
      );
    } else if (activeTab === 'workOrders') {
      return filteredWorkOrders.filter(wo =>
        wo.id.toLowerCase().includes(searchLower) ||
        (wo.title || '').toLowerCase().includes(searchLower) ||
        (wo.assetId || '').toLowerCase().includes(searchLower)
      );
    } else {
      return filteredAssets.filter(asset =>
        asset.id.toLowerCase().includes(searchLower) ||
        (asset.name || '').toLowerCase().includes(searchLower)
      );
    }
  }, [activeTab, filteredInspections, filteredDefects, filteredWorkOrders, filteredAssets, tableSearch]);

  // Table columns
  const tableColumns = useMemo(() => {
    if (activeTab === 'inspections') {
      return [
        {
          key: 'inspectionCode',
          label: 'Inspection ID',
          sortable: true,
          render: (_: any, row: Inspection) => (
            <span className="font-mono font-medium">{row.inspectionCode}</span>
          ),
        },
        {
          key: 'templateName',
          label: 'Template',
          sortable: true,
          render: (_: any, row: Inspection) => row.templateName || '—',
        },
        {
          key: 'assetId',
          label: 'Asset',
          sortable: true,
          render: (_: any, row: Inspection) => row.assetId || '—',
        },
        {
          key: 'status',
          label: 'Status',
          sortable: true,
          render: (_: any, row: Inspection) => (
            <Badge variant={row.status === 'Closed' ? 'success' : row.status === 'InProgress' ? 'warning' : 'info'}>
              {row.status}
            </Badge>
          ),
        },
        {
          key: 'result',
          label: 'Result',
          sortable: true,
          render: (_: any, row: Inspection) => row.result || '—',
        },
        {
          key: 'inspectionDate',
          label: 'Date',
          sortable: true,
          render: (_: any, row: Inspection) => new Date(row.inspectionDate).toLocaleDateString(),
        },
      ];
    } else if (activeTab === 'defects') {
      return [
        {
          key: 'defectCode',
          label: 'Defect Code',
          sortable: true,
          render: (_: any, row: Defect) => (
            <span className="font-mono font-medium">{row.defectCode}</span>
          ),
        },
        {
          key: 'title',
          label: 'Title',
          sortable: true,
          render: (_: any, row: Defect) => row.title || '—',
        },
        {
          key: 'assetId',
          label: 'Asset',
          sortable: true,
          render: (_: any, row: Defect) => row.assetId || '—',
        },
        {
          key: 'status',
          label: 'Status',
          sortable: true,
          render: (_: any, row: Defect) => (
            <Badge variant={row.status === 'Closed' ? 'success' : row.status === 'Overdue' ? 'error' : 'info'}>
              {row.status}
            </Badge>
          ),
        },
        {
          key: 'severity',
          label: 'Severity',
          sortable: true,
          render: (_: any, row: Defect) => (
            <Badge variant={row.severity === 'High' || row.severity === 'Critical' ? 'error' : row.severity === 'Medium' ? 'warning' : 'default'}>
              {row.severity}
            </Badge>
          ),
        },
        {
          key: 'createdAt',
          label: 'Created',
          sortable: true,
          render: (_: any, row: Defect) => new Date(row.createdAt).toLocaleDateString(),
        },
      ];
    } else if (activeTab === 'workOrders') {
      return [
        {
          key: 'id',
          label: 'Work Order',
          sortable: true,
          render: (_: any, row: WorkOrder) => (
            <span className="font-mono font-medium">{row.id}</span>
          ),
        },
        {
          key: 'title',
          label: 'Title',
          sortable: true,
          render: (_: any, row: WorkOrder) => row.title,
        },
        {
          key: 'assetId',
          label: 'Asset',
          sortable: true,
          render: (_: any, row: WorkOrder) => row.assetId,
        },
        {
          key: 'status',
          label: 'Status',
          sortable: true,
          render: (_: any, row: WorkOrder) => (
            <Badge variant={row.status === 'Completed' ? 'success' : row.status === 'InProgress' ? 'warning' : 'info'}>
              {row.status}
            </Badge>
          ),
        },
        {
          key: 'priority',
          label: 'Priority',
          sortable: true,
          render: (_: any, row: WorkOrder) => (
            <Badge variant={row.priority === 'Critical' ? 'error' : row.priority === 'High' ? 'warning' : 'default'}>
              {row.priority}
            </Badge>
          ),
        },
        {
          key: 'createdAt',
          label: 'Created',
          sortable: true,
          render: (_: any, row: WorkOrder) => new Date(row.createdAt).toLocaleDateString(),
        },
      ];
    } else {
      return [
        {
          key: 'id',
          label: 'Asset ID',
          sortable: true,
          render: (_: any, row: Asset) => (
            <span className="font-mono font-medium">{row.id}</span>
          ),
        },
        {
          key: 'name',
          label: 'Name',
          sortable: true,
          render: (_: any, row: Asset) => row.make && row.model ? `${row.make} ${row.model}` : '—',
        },
        {
          key: 'assetTypeId',
          label: 'Type',
          sortable: true,
          render: (_: any, row: Asset) => row.assetTypeName || '—',
        },
        {
          key: 'siteId',
          label: 'Site',
          sortable: true,
          render: (_: any, row: Asset) => row.siteName || '—',
        },
        {
          key: 'status',
          label: 'Status',
          sortable: true,
          render: (_: any, row: Asset) => (
            <Badge variant={row.operationalStatus === 'InUse' ? 'success' : row.operationalStatus === 'Quarantined' ? 'error' : 'default'}>
              {row.operationalStatus}
            </Badge>
          ),
        },
      ];
    }
  }, [activeTab]);


  // Get site name for report
  const selectedSiteName = useMemo(() => {
    if (filters.siteId) {
      const site = mockSites.find(s => s.id === filters.siteId);
      return site?.name;
    }
    return undefined;
  }, [filters.siteId]);

  const handleDownloadSavedReport = (report: SavedReport) => {
    if (report.format === 'Excel') {
      exportToExcel(report.data?.tableData || [], report.name, report.type);
    } else {
      exportPageAsPDF(report.name);
    }
  };


  // Save filters
  useEffect(() => {
    localStorage.setItem('reports-filters', JSON.stringify(filters));
  }, [filters]);

  // Update temp filters when filters change
  useEffect(() => {
    setTempFilters(filters);
  }, [filters]);

  // Active filter chips
  const activeFilterChips = useMemo(() => {
    const chips: Array<{ label: string; value: string; onRemove: () => void }> = [];
    
    if (filters.dateFrom || filters.dateTo) {
      const dateRange = filters.dateFrom && filters.dateTo
        ? `${new Date(filters.dateFrom).toLocaleDateString()} - ${new Date(filters.dateTo).toLocaleDateString()}`
        : filters.dateFrom
        ? `From ${new Date(filters.dateFrom).toLocaleDateString()}`
        : `Until ${new Date(filters.dateTo!).toLocaleDateString()}`;
      chips.push({
        label: 'Date',
        value: dateRange,
        onRemove: () => setFilters(prev => ({ ...prev, dateFrom: undefined, dateTo: undefined })),
      });
    }
    
    if (filters.siteId) {
      const site = mockSites.find(s => s.id === filters.siteId);
      chips.push({
        label: 'Site',
        value: site?.name || filters.siteId,
        onRemove: () => setFilters(prev => ({ ...prev, siteId: undefined })),
      });
    }
    
    if (filters.assetTypeId) {
      const type = assetTypes.find(t => t.id === filters.assetTypeId);
      chips.push({
        label: 'Asset Type',
        value: type?.name || filters.assetTypeId,
        onRemove: () => setFilters(prev => ({ ...prev, assetTypeId: undefined })),
      });
    }
    
    if (filters.assetId) {
      const asset = allAssets.find(a => a.id === filters.assetId);
      chips.push({
        label: 'Asset',
        value: asset ? `${asset.id} - ${asset.make} ${asset.model}` : filters.assetId,
        onRemove: () => setFilters(prev => ({ ...prev, assetId: undefined })),
      });
    }
    
    if (filters.assignedToId) {
      const users: Record<string, string> = {
        'user-1': 'John Smith',
        'user-2': 'Sarah Johnson',
        'user-3': 'David Lee',
        'user-4': 'Mike Davis',
        'user-5': 'Emma Wilson',
        'user-6': 'Lisa Anderson',
      };
      chips.push({
        label: 'Assigned To',
        value: users[filters.assignedToId] || filters.assignedToId,
        onRemove: () => setFilters(prev => ({ ...prev, assignedToId: undefined })),
      });
    }
    
    if (filters.status) {
      chips.push({
        label: 'Status',
        value: filters.status,
        onRemove: () => setFilters(prev => ({ ...prev, status: undefined })),
      });
    }
    
    if (filters.severity) {
      chips.push({
        label: 'Severity',
        value: filters.severity,
        onRemove: () => setFilters(prev => ({ ...prev, severity: undefined })),
      });
    }
    
    return chips;
  }, [filters, assetTypes, allAssets]);

  const handleApplyFilters = () => {
    setFilters(tempFilters);
    setShowFilterPanel(false);
  };

  const handleResetFilters = () => {
    const emptyFilters: ReportFilters = {};
    setTempFilters(emptyFilters);
    setFilters(emptyFilters);
    localStorage.removeItem('reports-filters');
  };

  return (
    <div className="p-6 space-y-6" id="reports-page-content" ref={pageContentRef}>
      {/* Active Filter Chips */}
      {activeFilterChips.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {activeFilterChips.map((chip, index) => (
            <FilterChip
              key={index}
              label={chip.label}
              value={chip.value}
              onRemove={chip.onRemove}
            />
          ))}
        </div>
      )}

      {/* Tabs */}
      <Tabs
        value={reportsTab}
        tabs={[
          {
            id: 'overview',
            label: 'Overview',
            content: (
              <div className="space-y-6">
                {/* KPI Cards */}
                <WildcardGrid>
                  <StatCard
                    title="Inspections Completed"
                    value={kpis.inspectionsCompleted}
                    icon={ClipboardCheck}
                  />
                  <StatCard
                    title="Inspections Overdue"
                    value={kpis.inspectionsOverdue}
                    icon={AlertCircle}
                  />
                  <StatCard
                    title="Defects Open"
                    value={kpis.defectsOpen}
                    icon={AlertTriangle}
                  />
                  <StatCard
                    title="Defects Overdue"
                    value={kpis.defectsOverdue}
                    icon={Clock}
                  />
                  <StatCard
                    title="Unsafe / Do Not Use"
                    value={kpis.unsafeDoNotUse}
                    icon={XCircle}
                  />
                  <StatCard
                    title="Work Orders Open"
                    value={kpis.workOrdersOpen}
                    icon={ClipboardList}
                  />
                </WildcardGrid>

                {/* Charts */}
                <CollapsibleCard
                  title="Charts & Analytics"
                  defaultExpanded={true}
                  storageKey="reports-charts"
                  actions={
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <div ref={filterButtonRef}>
                        <FilterButton
                          onClick={() => setShowFilterPanel(true)}
                          activeFilterCount={activeFilterCount}
                          size="sm"
                        />
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setShowGenerateModal(true)}
                      >
                        Generate Report
                      </Button>
                    </div>
                  }
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Inspections Chart */}
                    <ChartCard
                      title="Inspections Trend"
                      actions={
                        <button
                          onClick={() => setExpandedChart('inspections-trend')}
                          className="p-1.5 rounded-md border border-gray-300 hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-colors"
                          title="Expand chart"
                          aria-label="Expand chart"
                        >
                          <Maximize className="w-4 h-4" />
                        </button>
                      }
                    >
                      <div style={{ height: '260px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height={260}>
                          <RechartsLineChart
                            data={inspectionsChartData}
                            margin={{ top: 10, right: 12, bottom: 10, left: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis
                              dataKey="date"
                              tickFormatter={(value) => {
                                const date = new Date(value);
                                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                              }}
                              stroke="#6b7280"
                              style={{ fontSize: '12px' }}
                              tick={{ fill: '#6b7280' }}
                              axisLine={false}
                              tickLine={false}
                              tickMargin={8}
                              minTickGap={16}
                            />
                            <YAxis
                              stroke="#6b7280"
                              style={{ fontSize: '12px' }}
                              tick={{ fill: '#6b7280' }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <Tooltip content={createChartTooltip(
                              (label) => {
                                const date = new Date(label);
                                return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                              },
                              (value) => [value, 'Inspections']
                            )} />
                            <Line
                              type="monotone"
                              dataKey="value"
                              stroke="#3b82f6"
                              strokeWidth={2.5}
                              dot={false}
                              activeDot={{ r: 4 }}
                            />
                          </RechartsLineChart>
                        </ResponsiveContainer>
                      </div>
                    </ChartCard>

                    {/* Defects Chart */}
                    <ChartCard
                      title="Defects Trend"
                      actions={
                        <button
                          onClick={() => setExpandedChart('defects-trend')}
                          className="p-1.5 rounded-md border border-gray-300 hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-colors"
                          title="Expand chart"
                          aria-label="Expand chart"
                        >
                          <Maximize className="w-4 h-4" />
                        </button>
                      }
                    >
                      <div style={{ height: '260px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height={260}>
                          <RechartsLineChart
                            data={defectsChartData}
                            margin={{ top: 10, right: 12, bottom: 10, left: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis
                              dataKey="date"
                              tickFormatter={(value) => {
                                const date = new Date(value);
                                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                              }}
                              stroke="#6b7280"
                              style={{ fontSize: '12px' }}
                              tick={{ fill: '#6b7280' }}
                              axisLine={false}
                              tickLine={false}
                              tickMargin={8}
                              minTickGap={16}
                            />
                            <YAxis
                              stroke="#6b7280"
                              style={{ fontSize: '12px' }}
                              tick={{ fill: '#6b7280' }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <Tooltip content={createChartTooltip(
                              (label) => {
                                const date = new Date(label);
                                return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                              },
                              (value) => [value, 'Defects']
                            )} />
                            <Line
                              type="monotone"
                              dataKey="value"
                              stroke="#ef4444"
                              strokeWidth={2.5}
                              dot={false}
                              activeDot={{ r: 4 }}
                            />
                          </RechartsLineChart>
                        </ResponsiveContainer>
                      </div>
                    </ChartCard>

                    {/* Work Orders Chart */}
                    {filteredWorkOrders.length > 0 && (
                      <ChartCard
                        title="Work Orders Trend"
                        actions={
                          <button
                            onClick={() => setExpandedChart('work-orders-trend')}
                            className="p-1.5 rounded-md border border-gray-300 hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-colors"
                            title="Expand chart"
                            aria-label="Expand chart"
                          >
                            <Maximize className="w-4 h-4" />
                          </button>
                        }
                      >
                        <div style={{ height: '260px', width: '100%' }}>
                          <ResponsiveContainer width="100%" height={260}>
                            <RechartsLineChart
                              data={workOrdersChartData}
                              margin={{ top: 10, right: 12, bottom: 10, left: 0 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                              <XAxis
                                dataKey="date"
                                tickFormatter={(value) => {
                                  const date = new Date(value);
                                  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                }}
                                stroke="#6b7280"
                                style={{ fontSize: '12px' }}
                                tick={{ fill: '#6b7280' }}
                                axisLine={false}
                                tickLine={false}
                                tickMargin={8}
                                minTickGap={16}
                              />
                              <YAxis
                                stroke="#6b7280"
                                style={{ fontSize: '12px' }}
                                tick={{ fill: '#6b7280' }}
                                axisLine={false}
                                tickLine={false}
                              />
                              <Tooltip content={createChartTooltip(
                                (label) => {
                                  const date = new Date(label);
                                  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                                },
                                (value) => [value, 'Work Orders']
                              )} />
                              <Line
                                type="monotone"
                                dataKey="value"
                                stroke="#10b981"
                                strokeWidth={2.5}
                                dot={false}
                                activeDot={{ r: 4 }}
                              />
                            </RechartsLineChart>
                          </ResponsiveContainer>
                        </div>
                      </ChartCard>
                    )}

                    {/* Inspections by Status */}
                    <ChartCard
                      title="Inspections by Status"
                      actions={
                        <button
                          onClick={() => setExpandedChart('inspections-status')}
                          className="p-1.5 rounded-md border border-gray-300 hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-colors"
                          title="Expand chart"
                          aria-label="Expand chart"
                        >
                          <Maximize className="w-4 h-4" />
                        </button>
                      }
                    >
                      <div style={{ height: '260px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height={260}>
                          <RechartsBarChart
                            data={inspectionsByStatusData}
                            margin={{ top: 10, right: 12, bottom: 10, left: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis
                              dataKey="label"
                              stroke="#6b7280"
                              style={{ fontSize: '12px' }}
                              tick={{ fill: '#6b7280' }}
                              axisLine={false}
                              tickLine={false}
                              tickMargin={8}
                            />
                            <YAxis
                              stroke="#6b7280"
                              style={{ fontSize: '12px' }}
                              tick={{ fill: '#6b7280' }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <Tooltip content={createChartTooltip(undefined, (value) => [value, 'Inspections'])} />
                            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                              {inspectionsByStatusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color || '#3b82f6'} />
                              ))}
                            </Bar>
                          </RechartsBarChart>
                        </ResponsiveContainer>
                      </div>
                    </ChartCard>

                    {/* Defects by Severity */}
                    <ChartCard
                      title="Defects by Severity"
                      actions={
                        <button
                          onClick={() => setExpandedChart('defects-severity')}
                          className="p-1.5 rounded-md border border-gray-300 hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-colors"
                          title="Expand chart"
                          aria-label="Expand chart"
                        >
                          <Maximize className="w-4 h-4" />
                        </button>
                      }
                    >
                      <div className="flex items-center justify-center" style={{ height: '260px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height={260}>
                          <RechartsPieChart>
                            <Pie
                              data={defectsBySeverityData.map(item => ({ name: item.label, value: item.value }))}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {defectsBySeverityData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color || '#3b82f6'} />
                              ))}
                            </Pie>
                            <Tooltip content={createChartTooltip(undefined, (value) => [value, 'Defects'])} />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      </div>
                    </ChartCard>
                  </div>
                </CollapsibleCard>

                {/* Data Tables */}
                <CollapsibleCard
                  title="Data Tables"
                  defaultExpanded={true}
                  storageKey="reports-tables"
                  actions={
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <div className="flex-1 max-w-[260px] sm:max-w-[320px] md:max-w-[420px]">
                        <Input
                          placeholder="Search..."
                          value={tableSearch}
                          onChange={(e) => setTableSearch(e.target.value)}
                        />
                      </div>
                      <div ref={filterButtonRef}>
                        <FilterButton
                          onClick={() => setShowFilterPanel(true)}
                          activeFilterCount={activeFilterCount}
                          size="sm"
                        />
                      </div>
                    </div>
                  }
                >
                  <div className="p-6 pt-2">
                    <Tabs
                      tabs={[
                        {
                          id: 'inspections',
                          label: `Inspections (${filteredInspections.length})`,
                          content: (
                            <div className="mt-2">
                              <SortableTable
                                columns={tableColumns}
                                data={tableData}
                              />
                            </div>
                          ),
                        },
                        {
                          id: 'defects',
                          label: `Defects (${filteredDefects.length})`,
                          content: (
                            <div className="mt-4">
                              <SortableTable
                                columns={tableColumns}
                                data={tableData}
                              />
                            </div>
                          ),
                        },
                        {
                          id: 'workOrders',
                          label: `Work Orders (${filteredWorkOrders.length})`,
                          content: (
                            <div className="mt-4">
                              <SortableTable
                                columns={tableColumns}
                                data={tableData}
                              />
                            </div>
                          ),
                        },
                        {
                          id: 'assets',
                          label: `Assets Summary (${filteredAssets.length})`,
                          content: (
                            <div className="mt-4">
                              <SortableTable
                                columns={tableColumns}
                                data={tableData}
                              />
                            </div>
                          ),
                        },
                      ]}
                      defaultTab={activeTab}
                      onTabChange={(tabId) => setActiveTab(tabId as typeof activeTab)}
                    />
                  </div>
                </CollapsibleCard>
              </div>
            ),
          },
          {
            id: 'scheduled',
            label: 'Scheduled Reports',
            content: (
              <div className="mt-4">
                <ScheduledReportsList
                  onCreateClick={() => {
                    setEditingSchedule(null);
                    setShowScheduleModal(true);
                  }}
                  onEditClick={(schedule) => {
                    setEditingSchedule(schedule);
                    setShowScheduleModal(true);
                  }}
                  reportData={{
                    kpis,
                    inspectionsChartData,
                    defectsChartData,
                    defectsBySeverityData,
                    tableData,
                    filteredDefects,
                    filteredWorkOrders,
                    filteredInspections,
                    allPMSchedules,
                  }}
                  filters={filters}
                  siteNames={Object.fromEntries(mockSites.map(s => [s.id, s.name]))}
                />
              </div>
            ),
          },
          {
            id: 'saved',
            label: 'Saved Reports',
            content: (
              <div className="mt-4">
                {savedReports.length === 0 ? (
                  <Card>
                    <div className="p-12 text-center">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No saved reports yet</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        Generate a report and save it to access it here.
                      </p>
                      <Button
                        variant="primary"
                        onClick={() => {
                          setReportsTab('overview');
                          setShowGenerateModal(true);
                        }}
                      >
                        Generate Report
                      </Button>
                    </div>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {savedReports.map(report => (
                      <Card key={report.id}>
                        <div className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{report.name}</div>
                              <div className="text-sm text-gray-500 mt-1">
                                {report.type} • {report.format} • {new Date(report.createdAt).toLocaleString()}
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadSavedReport(report)}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Download
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ),
          },
        ]}
        defaultTab={reportsTab}
        onTabChange={(tabId) => setReportsTab(tabId as typeof reportsTab)}
      />

      {/* Filter Panel */}
      <FilterPanel
        isOpen={showFilterPanel}
        onClose={() => {
          setShowFilterPanel(false);
          setTempFilters(filters); // Reset temp filters on close
        }}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        title="Report Filters"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="date"
                label="Date From"
                value={tempFilters.dateFrom || ''}
                onChange={(e) => setTempFilters(prev => ({ ...prev, dateFrom: e.target.value || undefined }))}
              />
              <Input
                type="date"
                label="Date To"
                value={tempFilters.dateTo || ''}
                onChange={(e) => setTempFilters(prev => ({ ...prev, dateTo: e.target.value || undefined }))}
              />
            </div>
            <Select
              label="Site"
              value={tempFilters.siteId || ''}
              onChange={(e) => setTempFilters(prev => ({ ...prev, siteId: e.target.value || undefined }))}
              options={[
                { value: '', label: 'All Sites' },
                ...mockSites.map(site => ({ value: site.id, label: site.name })),
              ]}
            />
            <Select
              label="Asset Type"
              value={tempFilters.assetTypeId || ''}
              onChange={(e) => setTempFilters(prev => ({ ...prev, assetTypeId: e.target.value || undefined }))}
              options={[
                { value: '', label: 'All Types' },
                ...assetTypes.map(type => ({ value: type.id, label: type.name })),
              ]}
            />
            <Select
              label="Asset"
              value={tempFilters.assetId || ''}
              onChange={(e) => setTempFilters(prev => ({ ...prev, assetId: e.target.value || undefined }))}
              options={[
                { value: '', label: 'All Assets' },
                ...allAssets.slice(0, 50).map(asset => ({ value: asset.id, label: `${asset.id} - ${asset.make} ${asset.model}` })),
              ]}
            />
            <Select
              label="Assigned To"
              value={tempFilters.assignedToId || ''}
              onChange={(e) => setTempFilters(prev => ({ ...prev, assignedToId: e.target.value || undefined }))}
              options={[
                { value: '', label: 'All Users' },
                { value: 'user-1', label: 'John Smith' },
                { value: 'user-2', label: 'Sarah Johnson' },
                { value: 'user-3', label: 'David Lee' },
                { value: 'user-4', label: 'Mike Davis' },
                { value: 'user-5', label: 'Emma Wilson' },
                { value: 'user-6', label: 'Lisa Anderson' },
              ]}
            />
            <Select
              label="Status"
              value={tempFilters.status || ''}
              onChange={(e) => setTempFilters(prev => ({ ...prev, status: e.target.value || undefined }))}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'Open', label: 'Open' },
                { value: 'Closed', label: 'Closed' },
                { value: 'InProgress', label: 'In Progress' },
                { value: 'Overdue', label: 'Overdue' },
              ]}
            />
            <Select
              label="Severity"
              value={tempFilters.severity || ''}
              onChange={(e) => setTempFilters(prev => ({ ...prev, severity: e.target.value || undefined }))}
              options={[
                { value: '', label: 'All Severities' },
                { value: 'Low', label: 'Low' },
                { value: 'Medium', label: 'Medium' },
                { value: 'High', label: 'High' },
                { value: 'Critical', label: 'Critical' },
              ]}
            />
          </div>
        </div>
      </FilterPanel>


      {/* Generate Report Modal */}
      <GenerateReportModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        filters={filters}
        reportData={{
          kpis,
          inspectionsChartData,
          defectsChartData,
          defectsBySeverityData,
          tableData,
          filteredDefects,
          filteredWorkOrders,
          filteredInspections,
          allPMSchedules,
        }}
        siteName={selectedSiteName}
      />

      {/* Chart Focus Modals */}
      <ChartFocusModal
        open={expandedChart === 'inspections-trend'}
        onOpenChange={(open) => setExpandedChart(open ? 'inspections-trend' : null)}
        title="Inspections Trend"
        showFilter={true}
        onFilterClick={() => setShowFilterPanel(true)}
        activeFilterCount={activeFilterCount}
      >
        <ResponsiveContainer width="100%" height={600}>
          <RechartsLineChart
            data={inspectionsChartData}
            margin={{ top: 20, right: 30, bottom: 40, left: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              }}
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              tick={{ fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
              tickMargin={8}
              minTickGap={16}
              label={{ value: 'Date', position: 'insideBottom', offset: -5, style: { textAnchor: 'middle', fill: '#6b7280', fontSize: '12px', fontWeight: 500 } }}
            />
            <YAxis
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              tick={{ fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
              label={{ value: 'Number of Inspections', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6b7280', fontSize: '12px', fontWeight: 500 } }}
            />
            <Tooltip content={createChartTooltip(
              (label) => {
                const date = new Date(label);
                return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
              },
              (value) => [value, 'Inspections']
            )} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </RechartsLineChart>
        </ResponsiveContainer>
      </ChartFocusModal>

      <ChartFocusModal
        open={expandedChart === 'defects-trend'}
        onOpenChange={(open) => setExpandedChart(open ? 'defects-trend' : null)}
        title="Defects Trend"
        showFilter={true}
        onFilterClick={() => setShowFilterPanel(true)}
        activeFilterCount={activeFilterCount}
      >
        <ResponsiveContainer width="100%" height={600}>
          <RechartsLineChart
            data={defectsChartData}
            margin={{ top: 20, right: 30, bottom: 20, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              }}
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              tick={{ fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
              tickMargin={8}
              minTickGap={16}
            />
            <YAxis
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              tick={{ fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={createChartTooltip(
              (label) => {
                const date = new Date(label);
                return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
              },
              (value) => [value, 'Defects']
            )} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#ef4444"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </RechartsLineChart>
        </ResponsiveContainer>
      </ChartFocusModal>

      <ChartFocusModal
        open={expandedChart === 'work-orders-trend'}
        onOpenChange={(open) => setExpandedChart(open ? 'work-orders-trend' : null)}
        title="Work Orders Trend"
        showFilter={true}
        onFilterClick={() => setShowFilterPanel(true)}
        activeFilterCount={activeFilterCount}
      >
        <ResponsiveContainer width="100%" height={600}>
          <RechartsLineChart
            data={workOrdersChartData}
            margin={{ top: 20, right: 30, bottom: 40, left: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              }}
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              tick={{ fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
              tickMargin={8}
              minTickGap={16}
              label={{ value: 'Date', position: 'insideBottom', offset: -5, style: { textAnchor: 'middle', fill: '#6b7280', fontSize: '12px', fontWeight: 500 } }}
            />
            <YAxis
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              tick={{ fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
              label={{ value: 'Number of Work Orders', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6b7280', fontSize: '12px', fontWeight: 500 } }}
            />
            <Tooltip content={createChartTooltip(
              (label) => {
                const date = new Date(label);
                return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
              },
              (value) => [value, 'Work Orders']
            )} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#10b981"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </RechartsLineChart>
        </ResponsiveContainer>
      </ChartFocusModal>

      <ChartFocusModal
        open={expandedChart === 'inspections-status'}
        onOpenChange={(open) => setExpandedChart(open ? 'inspections-status' : null)}
        title="Inspections by Status"
        showFilter={true}
        onFilterClick={() => setShowFilterPanel(true)}
        activeFilterCount={activeFilterCount}
      >
        <ResponsiveContainer width="100%" height={600}>
          <RechartsBarChart
            data={inspectionsByStatusData}
            margin={{ top: 20, right: 30, bottom: 40, left: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis
              dataKey="label"
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              tick={{ fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
              tickMargin={8}
              label={{ value: 'Inspection Status', position: 'insideBottom', offset: -5, style: { textAnchor: 'middle', fill: '#6b7280', fontSize: '12px', fontWeight: 500 } }}
            />
            <YAxis
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              tick={{ fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
              label={{ value: 'Number of Inspections', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6b7280', fontSize: '12px', fontWeight: 500 } }}
            />
            <Tooltip content={createChartTooltip(undefined, (value) => [value, 'Inspections'])} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {inspectionsByStatusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || '#3b82f6'} />
              ))}
            </Bar>
          </RechartsBarChart>
        </ResponsiveContainer>
      </ChartFocusModal>

      <ChartFocusModal
        open={expandedChart === 'defects-severity'}
        onOpenChange={(open) => setExpandedChart(open ? 'defects-severity' : null)}
        title="Defects by Severity"
        showFilter={true}
        onFilterClick={() => setShowFilterPanel(true)}
        activeFilterCount={activeFilterCount}
      >
        <div className="flex items-center justify-center w-full h-full">
          <ResponsiveContainer width="100%" height={600}>
            <RechartsPieChart>
              <Pie
                data={defectsBySeverityData.map(item => ({ name: item.label, value: item.value }))}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={150}
                fill="#8884d8"
                dataKey="value"
              >
                {defectsBySeverityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || '#3b82f6'} />
                ))}
              </Pie>
              <Tooltip content={createChartTooltip(undefined, (value) => [value, 'Defects'])} />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </ChartFocusModal>

      {/* Saved Reports Indicator */}
      <SavedReportsIndicator
        count={savedReports.length}
        onClick={() => {
          setReportsTab('saved');
          // Scroll to top of saved reports tab
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Schedule Modal */}
      <ScheduleModal
        isOpen={showScheduleModal}
        onClose={() => {
          setShowScheduleModal(false);
          setEditingSchedule(null);
        }}
        onSuccess={() => {
          // Refresh will be handled by ScheduledReportsList
        }}
        schedule={editingSchedule}
      />
    </div>
  );
}
