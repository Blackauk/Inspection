import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useGlobalSearch } from '../../../contexts/GlobalSearchContext';
import { Card } from '../../../components/common/Card';
import { Textarea } from '../../../components/common/Textarea';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { Select } from '../../../components/common/Select';
import { Input } from '../../../components/common/Input';
import { SortableTable } from '../../../components/common/SortableTable';
import { ListPageTable } from '../../../components/common/ListPageTable';
import { FilterPanel } from '../../../components/common/FilterPanel';
import { FilterSection } from '../../../components/common/FilterSection';
import { MultiSelectFilter } from '../../../components/common/MultiSelectFilter';
import { FilterButton } from '../../../components/common/FilterButton';
import { FilterOptionList } from '../../../components/common/FilterOptionList';
import { FilterFooter } from '../../../components/common/FilterFooter';
import { CreateWorkOrderModal } from '../components/CreateWorkOrderModal';
import { StatCard } from '../../../components/common/StatCard';
import { WildcardGrid } from '../../../components/common/WildcardGrid';
import { ClipboardList, Clock, AlertTriangle, Package, AlertCircle } from 'lucide-react';
import { getWorkOrders, bulkUpdateWorkOrders, updateWorkOrder, type WorkOrderFilter } from '../services';
import { mockSites } from '../../assets/services';
import { showToast } from '../../../components/common/Toast';
import { useTableSelection } from '../../../hooks/useTableSelection';
import { ExportButton } from '../../../components/common/ExportButton';
import { exportTableToExcel, exportTableToPDF } from '../../reports/utils/exportUtils';
import type { WorkOrderPriority, WorkOrder } from '../types';
import type { WorkOrderStatus, WorkOrderType } from '@ppm/shared';

// Mock users for assignment dropdown
const mockUsers = [
  { id: 'user-1', name: 'John Smith' },
  { id: 'user-2', name: 'Sarah Johnson' },
  { id: 'user-3', name: 'Mike Davis' },
  { id: 'user-4', name: 'Emma Wilson' },
  { id: 'user-5', name: 'Tom Brown' },
  { id: 'user-6', name: 'Lisa Anderson' },
  { id: 'user-7', name: 'David Lee' },
  { id: 'user-8', name: 'Rachel Green' },
];

export function WorkOrdersListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { searchQuery } = useGlobalSearch();
  const filterButtonRef = useRef<HTMLDivElement>(null);
  const [tableSearch, setTableSearch] = useState('');
  const [filters, setFilters] = useState<WorkOrderFilter>({});
  const [tempFilters, setTempFilters] = useState<WorkOrderFilter>({});
  const [expandedFilterSection, setExpandedFilterSection] = useState<string | null>(null);
  const [activeWildcards, setActiveWildcards] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('wo-active-wildcards');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  // Handle deep-linking from Dashboard alerts
  useEffect(() => {
    const state = location.state as { activeWildcard?: string } | null;
    if (state?.activeWildcard) {
      setActiveWildcards(new Set([state.activeWildcard]));
      localStorage.setItem('wo-active-wildcards', JSON.stringify([state.activeWildcard]));
      // Clear the state to prevent re-applying on re-render
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isCreateWOModalOpen, setIsCreateWOModalOpen] = useState(false);
  
  // Bulk update state
  const [bulkStatus, setBulkStatus] = useState<WorkOrderStatus | ''>('');
  const [bulkPriority, setBulkPriority] = useState<WorkOrderPriority | ''>('');
  const [bulkAssignedTo, setBulkAssignedTo] = useState<string>('');
  
  // Inline edit state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedWorkOrders, setEditedWorkOrders] = useState<Record<string, Partial<WorkOrder>>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  

  // Compute wildcard counts (based on global search + current filters, but not wildcard filters)
  const wildcardCounts = useMemo(() => {
    const baseFilter: WorkOrderFilter = {
      ...filters,
      search: searchQuery || undefined,
      // Don't include wildcard filters in counts
    };
    const allWOs = getWorkOrders(baseFilter);
    const today = new Date();
    
    return {
      open: allWOs.filter((wo) => wo.status === 'Open').length,
      myWOs: allWOs.filter((wo) => wo.assignedToId === user?.id).length,
      overdue: allWOs.filter((wo) => {
        if (!wo.dueDate) return false;
        return new Date(wo.dueDate) < today && 
               wo.status !== 'Completed' && 
               wo.status !== 'ApprovedClosed' && 
               wo.status !== 'Cancelled';
      }).length,
      waitingParts: allWOs.filter((wo) => wo.status === 'WaitingParts').length,
      critical: allWOs.filter((wo) => wo.priority === 'Critical').length,
    };
  }, [searchQuery, filters, user?.id]);

  const workOrders = useMemo(() => {
    // Combine global search and table search
    const combinedSearch = [searchQuery, tableSearch].filter(Boolean).join(' ');
    
    const filter: WorkOrderFilter = {
      ...filters,
      search: combinedSearch || undefined,
      showMyWOs: activeWildcards.has('my-wos'),
      showOverdue: activeWildcards.has('overdue'),
      showWaitingParts: activeWildcards.has('waiting-parts'),
      showCritical: activeWildcards.has('critical'),
      assignedToId: activeWildcards.has('my-wos') ? user?.id : filters.assignedToId,
    };
    
    // If "open" wildcard is active, filter by status (but don't override if status filter already set)
    if (activeWildcards.has('open') && !filters.status) {
      filter.status = 'Open';
    }
    
    return getWorkOrders(filter);
  }, [searchQuery, tableSearch, filters, activeWildcards, user?.id]);

  // Table selection
  const tableSelection = useTableSelection({
    data: workOrders,
    getRowId: (row) => row.id,
    persistKey: 'work-orders-selection',
  });

  // Export handlers
  const exportColumns = useMemo(() => [
    {
      key: 'id',
      label: 'WO ID',
      sortable: true,
      render: (_: any, row: WorkOrder) => row.id,
    },
    {
      key: 'title',
      label: 'Title',
      sortable: true,
      render: (_: any, row: WorkOrder) => row.title || '—',
    },
    {
      key: 'assetId',
      label: 'Asset',
      sortable: true,
      render: (_: any, row: WorkOrder) => row.assetId || '—',
    },
    {
      key: 'assetTypeCode',
      label: 'Asset Type',
      sortable: true,
      render: (_: any, row: WorkOrder) => row.assetTypeCode || '—',
    },
    {
      key: 'siteName',
      label: 'Site',
      sortable: true,
      render: (_: any, row: WorkOrder) => row.siteName || '—',
    },
    {
      key: 'priority',
      label: 'Priority',
      sortable: true,
      render: (_: any, row: WorkOrder) => row.priority || '—',
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (_: any, row: WorkOrder) => row.status || '—',
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      sortable: true,
      render: (_: any, row: WorkOrder) => row.dueDate ? new Date(row.dueDate).toLocaleDateString() : '—',
    },
    {
      key: 'assignedToName',
      label: 'Assigned To',
      sortable: true,
      render: (_: any, row: WorkOrder) => row.assignedToName || 'Unassigned',
    },
    {
      key: 'createdAt',
      label: 'Created Date',
      sortable: true,
      render: (_: any, row: WorkOrder) => new Date(row.createdAt).toLocaleDateString(),
    },
  ], []);

  const handleExportExcel = () => {
    const dataToExport = tableSelection.selectedCount > 0
      ? tableSelection.getSelectedRows()
      : workOrders;
    
    if (dataToExport.length === 0) {
      showToast('No data to export', 'error');
      return;
    }

    const date = new Date().toISOString().split('T')[0];
    const count = dataToExport.length;
    const filename = `WorkOrders_${date}_${count}`;
    
    exportTableToExcel(dataToExport, exportColumns, filename, 'Work Orders');
    showToast(`Exported ${count} work order${count !== 1 ? 's' : ''} to Excel`, 'success');
  };

  const handleExportPDF = () => {
    const dataToExport = tableSelection.selectedCount > 0
      ? tableSelection.getSelectedRows()
      : workOrders;
    
    if (dataToExport.length === 0) {
      showToast('No data to export', 'error');
      return;
    }

    const date = new Date().toISOString().split('T')[0];
    const count = dataToExport.length;
    const filename = `WorkOrders_${date}_${count}`;
    const title = `Work Orders Export - ${date} (${count} ${count !== 1 ? 'items' : 'item'})`;
    
    exportTableToPDF(dataToExport, exportColumns, filename, title);
  };

  // Get active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.siteId) count++;
    if (filters.status) count++;
    if (filters.priority) count++;
    return count;
  }, [filters]);

  const handleWildcardClick = (wildcard: string) => {
    const newSet = new Set(activeWildcards);
    if (newSet.has(wildcard)) {
      newSet.delete(wildcard);
    } else {
      newSet.add(wildcard);
    }
    setActiveWildcards(newSet);
    localStorage.setItem('wo-active-wildcards', JSON.stringify(Array.from(newSet)));
  };

  const handleClearWildcards = () => {
    setActiveWildcards(new Set());
    localStorage.removeItem('wo-active-wildcards');
  };

  const getPriorityBadge = (priority: WorkOrderPriority) => {
    const variants: Record<WorkOrderPriority, 'default' | 'warning' | 'error'> = {
      Low: 'default',
      Medium: 'warning',
      High: 'warning',
      Critical: 'error',
    };
    return <Badge variant={variants[priority]}>{priority}</Badge>;
  };

  const getStatusBadge = (status: WorkOrderStatus) => {
    const variants: Record<WorkOrderStatus, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
      Open: 'info',
      Assigned: 'info',
      InProgress: 'warning',
      WaitingParts: 'error',
      WaitingVendor: 'warning',
      Completed: 'success',
      ApprovedClosed: 'success',
      Cancelled: 'default',
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const handleBulkUpdate = () => {
    if (tableSelection.selectedCount === 0) return;

    const updates: Partial<WorkOrder> = {};
    if (bulkStatus) updates.status = bulkStatus;
    if (bulkPriority) updates.priority = bulkPriority;
    if (bulkAssignedTo) {
      updates.assignedToId = bulkAssignedTo;
      updates.assignedToName = mockUsers.find(u => u.id === bulkAssignedTo)?.name;
    }

    if (Object.keys(updates).length === 0) {
      showToast('Please select a field to update', 'error');
      return;
    }

    try {
      const result = bulkUpdateWorkOrders(tableSelection.selectedIds, updates);
      if (result.errors.length > 0) {
        showToast(`Updated ${result.updated} work orders. ${result.errors.length} failed.`, 'warning');
      } else {
        showToast(`Updated ${result.updated} work orders`, 'success');
      }
      
      // Clear selection and reset form
      tableSelection.clearSelection();
      setBulkStatus('');
      setBulkPriority('');
      setBulkAssignedTo('');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to update work orders', 'error');
    }
  };

  const handleEditFieldChange = (workOrderId: string, field: keyof WorkOrder, value: any) => {
    setEditedWorkOrders((prev) => ({
      ...prev,
      [workOrderId]: {
        ...prev[workOrderId],
        [field]: value,
      },
    }));
    setHasUnsavedChanges(true);
  };

  const handleSaveEditMode = () => {
    const errors: string[] = [];
    let saved = 0;

    for (const [workOrderId, updates] of Object.entries(editedWorkOrders)) {
      try {
        // Validate required fields
        if (updates.title !== undefined && !updates.title?.trim()) {
          errors.push(`${workOrderId}: Title is required`);
          continue;
        }
        
        updateWorkOrder(workOrderId, updates);
        saved++;
      } catch (error) {
        errors.push(`${workOrderId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    if (errors.length > 0) {
      showToast(`Saved ${saved} work orders. ${errors.length} failed.`, 'warning');
    } else {
      showToast(`Saved ${saved} work orders`, 'success');
    }

    // Exit edit mode
    setIsEditMode(false);
    setEditedWorkOrders({});
    setHasUnsavedChanges(false);
    
  };

  const handleCancelEditMode = () => {
    if (hasUnsavedChanges) {
      if (!confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        return;
      }
    }
    setIsEditMode(false);
    setEditedWorkOrders({});
    setHasUnsavedChanges(false);
  };

  // Table columns - different for edit mode
  const columns = useMemo(() => {
    if (isEditMode) {
      // Edit mode columns with inline inputs
      return [
        {
          key: 'id',
          label: 'WO ID',
          sortable: false,
          render: (value: string) => <span className="font-mono font-medium">{value}</span>,
        },
        {
          key: 'title',
          label: 'Title',
          sortable: false,
          render: (_: any, row: WorkOrder) => {
            const edited = editedWorkOrders[row.id];
            return (
              <Input
                value={edited?.title ?? row.title}
                onChange={(e) => handleEditFieldChange(row.id, 'title', e.target.value)}
                className="min-w-[200px]"
              />
            );
          },
        },
        {
          key: 'status',
          label: 'Status',
          sortable: false,
          render: (_: any, row: WorkOrder) => {
            const edited = editedWorkOrders[row.id];
            const statusOptions: { value: WorkOrderStatus; label: string }[] = [
              { value: 'Open', label: 'Open' },
              { value: 'Assigned', label: 'Assigned' },
              { value: 'InProgress', label: 'In Progress' },
              { value: 'WaitingParts', label: 'Waiting Parts' },
              { value: 'WaitingVendor', label: 'Waiting Vendor' },
              { value: 'Completed', label: 'Completed' },
              { value: 'ApprovedClosed', label: 'Approved/Closed' },
              { value: 'Cancelled', label: 'Cancelled' },
            ];
            return (
              <Select
                options={statusOptions}
                value={(edited?.status ?? row.status) as string}
                onChange={(e) => handleEditFieldChange(row.id, 'status', e.target.value as WorkOrderStatus)}
                className="min-w-[140px]"
              />
            );
          },
        },
        {
          key: 'priority',
          label: 'Priority',
          sortable: false,
          render: (_: any, row: WorkOrder) => {
            const edited = editedWorkOrders[row.id];
            const priorityOptions: { value: WorkOrderPriority; label: string }[] = [
              { value: 'Low', label: 'Low' },
              { value: 'Medium', label: 'Medium' },
              { value: 'High', label: 'High' },
              { value: 'Critical', label: 'Critical' },
            ];
            return (
              <Select
                options={priorityOptions}
                value={(edited?.priority ?? row.priority) as string}
                onChange={(e) => handleEditFieldChange(row.id, 'priority', e.target.value as WorkOrderPriority)}
                className="min-w-[120px]"
              />
            );
          },
        },
        {
          key: 'assignedToName',
          label: 'Assigned To',
          sortable: false,
          render: (_: any, row: WorkOrder) => {
            const edited = editedWorkOrders[row.id];
            const userOptions = [
              { value: '', label: 'Unassigned' },
              ...mockUsers.map(u => ({ value: u.id, label: u.name })),
            ];
            return (
              <Select
                options={userOptions}
                value={edited?.assignedToId ?? row.assignedToId ?? ''}
                onChange={(e) => {
                  const userId = e.target.value;
                  const userName = userId ? mockUsers.find(u => u.id === userId)?.name : undefined;
                  handleEditFieldChange(row.id, 'assignedToId', userId || undefined);
                  handleEditFieldChange(row.id, 'assignedToName', userName);
                }}
                className="min-w-[140px]"
              />
            );
          },
        },
        {
          key: 'dueDate',
          label: 'Due Date',
          sortable: false,
          render: (_: any, row: WorkOrder) => {
            const edited = editedWorkOrders[row.id];
            const currentDate = edited?.dueDate ?? row.dueDate ?? '';
            const dateValue = currentDate ? new Date(currentDate).toISOString().split('T')[0] : '';
            return (
              <Input
                type="date"
                value={dateValue}
                onChange={(e) => handleEditFieldChange(row.id, 'dueDate', e.target.value || undefined)}
                className="min-w-[140px]"
              />
            );
          },
        },
        {
          key: 'notes',
          label: 'Notes/Update',
          sortable: false,
          render: (_: any, row: WorkOrder) => {
            const edited = editedWorkOrders[row.id];
            return (
              <Textarea
                placeholder="Add update note... (drag corner to resize)"
                value={edited?.description ?? row.description ?? ''}
                onChange={(e) => handleEditFieldChange(row.id, 'description', e.target.value)}
                className="min-w-[200px] min-h-[60px]"
                rows={3}
                title="Drag the corner to resize"
              />
            );
          },
        },
      ];
    } else {
      // Normal view columns
      return [
        {
          key: 'id',
          label: 'WO ID',
          sortable: true,
          render: (value: string) => <span className="font-mono font-medium">{value}</span>,
        },
        {
          key: 'title',
          label: 'Title',
          sortable: true,
          render: (_: any, row: WorkOrder) => (
            <div className="min-w-0">
              <div className="font-medium truncate" title={row.title}>{row.title}</div>
              {row.description && (
                <div className="text-xs text-gray-500 mt-1 line-clamp-1" title={row.description}>{row.description}</div>
              )}
            </div>
          ),
        },
        {
          key: 'assetId',
          label: 'Asset',
          sortable: true,
          render: (_: any, row: WorkOrder) => (
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="info" size="sm">{row.assetTypeCode}</Badge>
                <span className="font-mono text-xs">{row.assetId}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {row.assetMake} {row.assetModel}
              </div>
            </div>
          ),
        },
        {
          key: 'siteName',
          label: 'Site',
          sortable: true,
        },
        {
          key: 'priority',
          label: 'Priority',
          sortable: true,
          render: (_: any, row: WorkOrder) => getPriorityBadge(row.priority),
        },
        {
          key: 'status',
          label: 'Status',
          sortable: true,
          render: (_: any, row: WorkOrder) => getStatusBadge(row.status),
        },
        {
          key: 'dueDate',
          label: 'Due Date',
          sortable: true,
          render: (value: string) => value ? new Date(value).toLocaleDateString() : 'N/A',
        },
        {
          key: 'assignedToName',
          label: 'Assigned To',
          sortable: true,
          render: (_: any, row: WorkOrder) => row.assignedToName || <span className="text-gray-400">Unassigned</span>,
        },
        {
          key: 'createdAt',
          label: 'Created Date',
          sortable: true,
          render: (value: string) => new Date(value).toLocaleDateString(),
        },
      ];
    }
  }, [isEditMode, editedWorkOrders]);

  return (
    <div className="p-6 space-y-6 bg-white">
      <div className="space-y-6">
        {/* Wildcard Filter Cards - 5 cards filling width evenly */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              title="Open"
              value={wildcardCounts.open}
              icon={ClipboardList}
              onClick={() => handleWildcardClick('open')}
              accentColor="blue"
              className={activeWildcards.has('open') ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
            />
            <StatCard
              title="My WOs"
              value={wildcardCounts.myWOs}
              icon={Clock}
              onClick={() => handleWildcardClick('my-wos')}
              accentColor="blue"
              className={activeWildcards.has('my-wos') ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
            />
            <StatCard
              title="Overdue"
              value={wildcardCounts.overdue}
              icon={AlertCircle}
              onClick={() => handleWildcardClick('overdue')}
              accentColor="red"
              className={activeWildcards.has('overdue') ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
            />
            <StatCard
              title="Waiting Parts"
              value={wildcardCounts.waitingParts}
              icon={Package}
              onClick={() => handleWildcardClick('waiting-parts')}
              accentColor="amber"
              className={activeWildcards.has('waiting-parts') ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
            />
            <StatCard
              title="Critical"
              value={wildcardCounts.critical}
              icon={AlertTriangle}
              onClick={() => handleWildcardClick('critical')}
              accentColor="red"
              className={activeWildcards.has('critical') ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
            />
          </div>
          
          {/* Clear Filters Button (if any active) */}
          {activeWildcards.size > 0 && (
            <div className="flex justify-end -mt-2 mb-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleClearWildcards}
              >
                Clear Filters
              </Button>
            </div>
          )}


          {/* Bulk Actions Bar */}
          {!isEditMode && tableSelection.selectedCount > 0 && (
            <Card className="bg-blue-50 border-blue-200">
              <div className="p-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="text-sm font-medium text-gray-700">
                    Selected: {tableSelection.selectedCount}
                  </span>
                  
                  <Select
                    options={[
                      { value: '', label: 'Change Status' },
                      { value: 'Open', label: 'Open' },
                      { value: 'Assigned', label: 'Assigned' },
                      { value: 'InProgress', label: 'In Progress' },
                      { value: 'WaitingParts', label: 'Waiting Parts' },
                      { value: 'WaitingVendor', label: 'Waiting Vendor' },
                      { value: 'Completed', label: 'Completed' },
                      { value: 'ApprovedClosed', label: 'Approved/Closed' },
                      { value: 'Cancelled', label: 'Cancelled' },
                    ]}
                    value={bulkStatus}
                    onChange={(e) => setBulkStatus(e.target.value as WorkOrderStatus | '')}
                    className="min-w-[140px] bg-white"
                  />
                  
                  <Select
                    options={[
                      { value: '', label: 'Change Priority' },
                      { value: 'Low', label: 'Low' },
                      { value: 'Medium', label: 'Medium' },
                      { value: 'High', label: 'High' },
                      { value: 'Critical', label: 'Critical' },
                    ]}
                    value={bulkPriority}
                    onChange={(e) => setBulkPriority(e.target.value as WorkOrderPriority | '')}
                    className="min-w-[140px] bg-white"
                  />
                  
                  <Select
                    options={[
                      { value: '', label: 'Assign To' },
                      ...mockUsers.map(u => ({ value: u.id, label: u.name })),
                    ]}
                    value={bulkAssignedTo}
                    onChange={(e) => setBulkAssignedTo(e.target.value)}
                    className="min-w-[140px] bg-white"
                  />
                  
                  <Button
                    size="sm"
                    onClick={handleBulkUpdate}
                  >
                    Apply
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedWorkOrderIds([]);
                      setBulkStatus('');
                      setBulkPriority('');
                      setBulkAssignedTo('');
                    }}
                  >
                    Clear Selection
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Work Orders Table */}
          <ListPageTable
            searchValue={tableSearch}
            onSearchChange={setTableSearch}
            searchPlaceholder="Search by WO ID, title, asset, site, assigned to…"
            onFilterClick={() => setIsFilterOpen(!isFilterOpen)}
            activeFilterCount={activeFilterCount}
            filterButtonRef={filterButtonRef}
            columns={columns}
            data={workOrders}
            onRowClick={isEditMode ? undefined : (row) => navigate(`/work-orders/${row.id}`)}
            selectable={!isEditMode}
            selectedIds={tableSelection.selectedIds}
            onSelectionChange={tableSelection.setSelectedIds}
            getRowId={(row) => row.id}
            showingText={`Showing ${workOrders.length} work order${workOrders.length !== 1 ? 's' : ''}`}
            headerActions={
              !isEditMode ? (
                <>
                  <ExportButton
                    onExportExcel={handleExportExcel}
                    onExportPDF={handleExportPDF}
                    selectedCount={tableSelection.selectedCount}
                    totalCount={workOrders.length}
                    tableName="Work Orders"
                  />
                  <Button
                    variant="outline"
                    onClick={() => setIsEditMode(true)}
                    size="sm"
                  >
                    Edit Table
                  </Button>
                  <Button onClick={() => setIsCreateWOModalOpen(true)} size="sm">
                    + New Work Order
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="primary"
                    onClick={handleSaveEditMode}
                    disabled={!hasUnsavedChanges}
                    size="sm"
                  >
                    Save Changes
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancelEditMode}
                    size="sm"
                  >
                    Cancel
                  </Button>
                </>
              )
            }
            emptyMessage="No work orders found matching your criteria"
          />
      </div>

      {/* Filter Panel */}
      <FilterPanel
        isOpen={isFilterOpen}
        onClose={() => {
          setIsFilterOpen(false);
          setTempFilters(filters); // Reset temp filters on close
          setExpandedFilterSection(null);
        }}
        onApply={() => {
          setFilters(tempFilters);
          setIsFilterOpen(false);
        }}
        onReset={() => {
          const emptyFilters: WorkOrderFilter = {};
          setTempFilters(emptyFilters);
          setFilters(emptyFilters);
          setExpandedFilterSection(null);
          localStorage.removeItem('work-orders-filters');
        }}
        title="Work Order Filters"
      >
        <div className="space-y-1">
          <FilterSection 
            title="Site"
            isExpanded={expandedFilterSection === 'site'}
            onToggle={() => setExpandedFilterSection(expandedFilterSection === 'site' ? null : 'site')}
          >
            <MultiSelectFilter
              options={mockSites.map((site) => ({ value: site.id, label: site.name }))}
              selected={Array.isArray(tempFilters.siteId) ? tempFilters.siteId : tempFilters.siteId ? [tempFilters.siteId] : []}
              onChange={(selected) => setTempFilters(prev => ({ ...prev, siteId: selected.length === 1 ? selected[0] : selected.length > 0 ? selected : undefined }))}
              placeholder="Search sites..."
              searchable={true}
            />
          </FilterSection>

          <FilterSection 
            title="Status"
            isExpanded={expandedFilterSection === 'status'}
            onToggle={() => setExpandedFilterSection(expandedFilterSection === 'status' ? null : 'status')}
          >
            <FilterOptionList
              options={[
                { value: 'Open', label: 'Open' },
                { value: 'Assigned', label: 'Assigned' },
                { value: 'InProgress', label: 'In Progress' },
                { value: 'WaitingParts', label: 'Waiting Parts' },
                { value: 'WaitingVendor', label: 'Waiting Vendor' },
                { value: 'Completed', label: 'Completed' },
                { value: 'ApprovedClosed', label: 'Approved / Closed' },
                { value: 'Cancelled', label: 'Cancelled' },
              ]}
              selected={tempFilters.status ? [tempFilters.status] : []}
              onChange={(selected) => setTempFilters(prev => ({ ...prev, status: selected.length > 0 ? selected[0] as WorkOrderStatus : undefined }))}
              twoColumn={true}
            />
          </FilterSection>

          <FilterSection 
            title="Priority"
            isExpanded={expandedFilterSection === 'priority'}
            onToggle={() => setExpandedFilterSection(expandedFilterSection === 'priority' ? null : 'priority')}
          >
            <FilterOptionList
              options={[
                { value: 'Low', label: 'Low' },
                { value: 'Medium', label: 'Medium' },
                { value: 'High', label: 'High' },
                { value: 'Critical', label: 'Critical' },
              ]}
              selected={tempFilters.priority ? [tempFilters.priority] : []}
              onChange={(selected) => setTempFilters(prev => ({ ...prev, priority: selected.length > 0 ? selected[0] as WorkOrderPriority : undefined }))}
              twoColumn={true}
            />
          </FilterSection>

          <FilterSection 
            title="Type"
            isExpanded={expandedFilterSection === 'type'}
            onToggle={() => setExpandedFilterSection(expandedFilterSection === 'type' ? null : 'type')}
          >
            <FilterOptionList
              options={[
                { value: 'PPM', label: 'PPM' },
                { value: 'Inspection', label: 'Inspection' },
                { value: 'Breakdown', label: 'Breakdown' },
                { value: 'Defect', label: 'Defect' },
                { value: 'Calibration', label: 'Calibration' },
                { value: 'FireSuppression', label: 'Fire Suppression' },
                { value: 'LOLER', label: 'LOLER' },
                { value: 'PUWER', label: 'PUWER' },
              ]}
              selected={tempFilters.type ? [tempFilters.type] : []}
              onChange={(selected) => setTempFilters(prev => ({ ...prev, type: selected.length > 0 ? selected[0] as WorkOrderType : undefined }))}
              twoColumn={true}
            />
          </FilterSection>
        </div>
      </FilterPanel>

      {/* Create Work Order Modal */}
      <CreateWorkOrderModal
        isOpen={isCreateWOModalOpen}
        onClose={() => setIsCreateWOModalOpen(false)}
        onSuccess={(workOrderId) => {
          showToast(`Work order ${workOrderId} created`, 'success');
        }}
      />
    </div>
  );
}
