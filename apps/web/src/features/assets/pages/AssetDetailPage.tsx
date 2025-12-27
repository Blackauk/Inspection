import { useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { Card } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Tabs } from '../../../components/common/Tabs';
import { Table, TableHeader, TableRow, TableHeaderCell, TableCell } from '../../../components/common/Table';
import { formatDateUK } from '../../../lib/formatters';
import { CreateWorkOrderModal } from '../../work-orders/components/CreateWorkOrderModal';
import { AssetSummaryHeader } from '../components/AssetSummaryHeader';
import { OverviewCards } from '../components/OverviewCards';
import { StartInspectionModal } from '../components/StartInspectionModal';
import { UploadDocumentModal } from '../components/UploadDocumentModal';
import { AddRelationshipModal } from '../components/AddRelationshipModal';
import { ChangeStatusModal } from '../components/ChangeStatusModal';
import { EditAssetModal } from '../components/EditAssetModal';
import { AddComplianceItemModal } from '../components/AddComplianceItemModal';
import { MarkComplianceDoneModal } from '../components/MarkComplianceDoneModal';
import { UpdateHoursModal } from '../components/UpdateHoursModal';
import {
  getAssetById,
  getComplianceItemsByAssetId,
  updateAsset,
  getChildAssets,
  getParentAssets,
  getAssetRelationships,
  deleteAssetRelationshipByIds,
  deleteComplianceItem,
} from '../services';
import {
  getWorkOrdersForAsset,
  getPMScheduleForAsset,
  getChecksForAsset,
  getDefectsForAsset,
  getInspectionsForAsset,
  getDocumentsForAsset,
  getActivityLogForAsset,
  type AssetDocument,
} from '../services/assetDemoData';
import { formatOperationalStatus } from '../../../lib/formatters';
import { showToast } from '../../../components/common/Toast';
import type { OperationalStatus, LifecycleStatus, ComplianceRAG, Asset } from '../types';
import { Download, Eye, Plus, AlertTriangle, Edit as EditIcon, Trash2, CheckCircle, Info } from 'lucide-react';

export function AssetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [isCreateWOModalOpen, setIsCreateWOModalOpen] = useState(false);
  const [isStartInspectionModalOpen, setIsStartInspectionModalOpen] = useState(false);
  const [isUploadDocModalOpen, setIsUploadDocModalOpen] = useState(false);
  const [isAddRelationshipModalOpen, setIsAddRelationshipModalOpen] = useState(false);
  const [isChangeStatusModalOpen, setIsChangeStatusModalOpen] = useState(false);
  const [isEditAssetModalOpen, setIsEditAssetModalOpen] = useState(false);
  const [isAddComplianceModalOpen, setIsAddComplianceModalOpen] = useState(false);
  const [isMarkComplianceDoneModalOpen, setIsMarkComplianceDoneModalOpen] = useState(false);
  const [isUpdateHoursModalOpen, setIsUpdateHoursModalOpen] = useState(false);
  const [selectedComplianceItem, setSelectedComplianceItem] = useState<any>(null);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [documents, setDocuments] = useState<AssetDocument[]>([]);
  const [assetState, setAssetState] = useState<Asset | undefined>(undefined);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activitySearch, setActivitySearch] = useState('');
  const [activityTypeFilter, setActivityTypeFilter] = useState<'all' | 'inspections' | 'work-orders' | 'defects'>('all');

  const asset = useMemo(() => {
    const a = id ? getAssetById(id) : undefined;
    if (a && !assetState) {
      setAssetState(a);
    }
    return a || assetState;
  }, [id, assetState]);

  // Load demo data
  const workOrders = useMemo(() => (asset ? getWorkOrdersForAsset(asset.id) : []), [asset]);
  const pmSchedule = useMemo(() => (asset ? getPMScheduleForAsset(asset.id) : []), [asset]);
  const checks = useMemo(() => (asset ? getChecksForAsset(asset.id) : []), [asset]);
  const defects = useMemo(() => (asset ? getDefectsForAsset(asset.id) : []), [asset]);
  const inspections = useMemo(() => (asset ? getInspectionsForAsset(asset.id) : []), [asset]);
  const activityLog = useMemo(() => (asset ? getActivityLogForAsset(asset.id) : []), [asset]);
  
  // Load documents (with seeded data)
  const allDocuments = useMemo(() => {
    if (!asset) return [];
    const seeded = getDocumentsForAsset(asset.id);
    return [...seeded, ...documents];
  }, [asset, documents]);

  const complianceItems = useMemo(() => (asset ? getComplianceItemsByAssetId(asset.id) : []), [asset, refreshKey]);
  
  // Get parent and child relationships
  const parentAssets = useMemo(() => (asset ? getParentAssets(asset.id) : []), [asset, refreshKey]);
  const childAssets = useMemo(() => (asset ? getChildAssets(asset.id) : []), [asset, refreshKey]);
  const relationships = useMemo(() => (asset ? getAssetRelationships(asset.id) : []), [asset, refreshKey]);
  
  // Extract filter parameter from URL
  const filterParam = searchParams.get('filter') || '';

  if (!asset) {
    return (
      <div className="p-6">
        <Card>
          <div className="p-8 text-center text-gray-500">
            Asset not found
          </div>
        </Card>
      </div>
    );
  }

  const getRAGBadge = (rag: ComplianceRAG) => {
    const variants = {
      Red: 'error' as const,
      Amber: 'warning' as const,
      Green: 'success' as const,
    };
    return <Badge variant={variants[rag]}>{rag}</Badge>;
  };

  const getStatusBadge = (status: OperationalStatus) => {
    const variants: Record<OperationalStatus, 'default' | 'success' | 'warning' | 'error'> = {
      InUse: 'success',
      OutOfUse: 'warning',
      OffHirePending: 'warning',
      OffHired: 'default',
      Quarantined: 'error',
      Archived: 'default',
    };
    return <Badge variant={variants[status]}>{formatOperationalStatus(status)}</Badge>;
  };

  const getLifecycleBadge = (status: LifecycleStatus) => {
    const variants: Record<LifecycleStatus, 'default' | 'success' | 'warning'> = {
      Active: 'success',
      Expected: 'warning',
      Decommissioned: 'warning',
      Disposed: 'default',
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const getWorkOrderStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'error'> = {
      Open: 'default',
      Assigned: 'default',
      InProgress: 'warning',
      WaitingParts: 'warning',
      WaitingVendor: 'warning',
      Completed: 'success',
      ApprovedClosed: 'success',
      Overdue: 'error',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, 'default' | 'warning' | 'error'> = {
      Low: 'default',
      Medium: 'default',
      High: 'warning',
      Critical: 'error',
    };
    return <Badge variant={variants[priority] || 'default'}>{priority}</Badge>;
  };

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, 'default' | 'warning' | 'error'> = {
      Low: 'default',
      Medium: 'warning',
      High: 'warning',
      Critical: 'error',
    };
    return <Badge variant={variants[severity] || 'default'}>{severity}</Badge>;
  };

  const getInspectionResultBadge = (result: string) => {
    const variants: Record<string, 'success' | 'error' | 'default'> = {
      Pass: 'success',
      Fail: 'error',
      Pending: 'default',
    };
    return <Badge variant={variants[result] || 'default'}>{result}</Badge>;
  };

  const getInspectionStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'warning' | 'success'> = {
      Draft: 'default',
      InProgress: 'warning',
      Submitted: 'default',
      Approved: 'success',
      Closed: 'success',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const getPMStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'warning' | 'error' | 'success'> = {
      Overdue: 'error',
      'Due Today': 'warning',
      Upcoming: 'default',
      Completed: 'success',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const getCheckResultBadge = (result: string) => {
    const variants: Record<string, 'success' | 'error' | 'default'> = {
      Pass: 'success',
      Fail: 'error',
      Pending: 'default',
    };
    return <Badge variant={variants[result] || 'default'}>{result}</Badge>;
  };

  const getCheckStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'warning' | 'error' | 'success'> = {
      Due: 'warning',
      Overdue: 'error',
      Completed: 'success',
      Pending: 'default',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const getDefectStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'warning' | 'success'> = {
      Open: 'default',
      'In Progress': 'warning',
      Resolved: 'success',
      Closed: 'success',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  // Role-based permissions
  const canEdit = ['Manager', 'Admin'].includes(user?.role || '');
  const canAssignWO = ['Supervisor', 'Manager', 'Admin'].includes(user?.role || '');
  const canChangeLocation = ['Supervisor', 'Manager', 'Admin'].includes(user?.role || '');
  const canOverrideRAG = ['Manager', 'Admin'].includes(user?.role || '');
  const canApproveDecommission = ['Manager', 'Admin'].includes(user?.role || '');

  const handleUploadDocument = (document: AssetDocument) => {
    setDocuments((prev) => [...prev, document]);
  };

  const handleRelationshipAdded = () => {
    setRefreshKey((prev) => prev + 1);
    const updatedAsset = getAssetById(asset?.id || '');
    if (updatedAsset) {
      setAssetState(updatedAsset);
    }
  };

  const handleStatusChanged = () => {
    setRefreshKey((prev) => prev + 1);
    const updatedAsset = getAssetById(asset?.id || '');
    if (updatedAsset) {
      setAssetState(updatedAsset);
    }
  };

  const handleAssetSaved = (updatedAsset: Asset) => {
    setAssetState(updatedAsset);
    setRefreshKey((prev) => prev + 1);
  };

  const handleComplianceAdded = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleComplianceDone = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleDeleteCompliance = (itemId: string) => {
    if (window.confirm('Are you sure you want to delete this compliance item?')) {
      deleteComplianceItem(itemId);
      showToast('Compliance item deleted', 'success');
      handleComplianceAdded();
    }
  };

  const handleDeleteRelationship = (parentId: string, childId: string) => {
    if (window.confirm('Are you sure you want to remove this relationship?')) {
      deleteAssetRelationshipByIds(parentId, childId);
      showToast('Relationship removed', 'success');
      handleRelationshipAdded();
    }
  };

  // Normalize activity log entries for table display
  interface ActivityTableRow {
    id: string;
    date: string;
    time: string;
    event: string;
    refLabel: string | null;
    refId: string | null;
    summary: string;
    userName: string;
    kind: 'inspection' | 'work-order' | 'defect' | 'meter-reading' | 'other';
    timestamp: string;
    meterReading?: string; // Formatted meter reading (e.g., "2520 hours" or "18,450 mi")
  }

  const normalizeActivityLog = (entries: typeof activityLog): ActivityTableRow[] => {
    return entries.map((entry) => {
      const date = new Date(entry.timestamp);
      const dateStr = formatDateUK(date);
      const timeStr = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      
      // Extract reference from details (INS-*, WO-*, DEF-*)
      const insMatch = entry.details?.match(/INS-[\w-]+/i);
      const woMatch = entry.details?.match(/WO-[\w-]+/i);
      const defMatch = entry.details?.match(/DEF-[\w-]+/i);
      
      let refLabel: string | null = null;
      let refId: string | null = null;
      let kind: 'inspection' | 'work-order' | 'defect' | 'meter-reading' | 'other' = 'other';
      
      if (insMatch) {
        refLabel = insMatch[0];
        refId = insMatch[0];
        kind = 'inspection';
      } else if (woMatch) {
        refLabel = woMatch[0];
        refId = woMatch[0];
        kind = 'work-order';
      } else if (defMatch) {
        refLabel = defMatch[0];
        refId = defMatch[0];
        kind = 'defect';
      }
      
      // Determine kind from action if no reference found
      if (kind === 'other') {
        if (entry.action.toLowerCase().includes('meter reading')) {
          kind = 'meter-reading';
        } else if (entry.action.toLowerCase().includes('inspection')) {
          kind = 'inspection';
        } else if (entry.action.toLowerCase().includes('work order')) {
          kind = 'work-order';
        } else if (entry.action.toLowerCase().includes('defect')) {
          kind = 'defect';
        }
      }
      
      // Format meter reading
      let meterReading: string | undefined;
      if (entry.meterReadingAtEvent !== undefined && entry.meterReadingUnit) {
        const unit = entry.meterReadingUnit === 'hours' ? 'hours' : entry.meterReadingUnit === 'miles' ? 'mi' : 'km';
        meterReading = `${entry.meterReadingAtEvent.toLocaleString()} ${unit}`;
      } else if (entry.previousReading !== undefined && entry.newReading !== undefined && entry.meterReadingUnit) {
        // For meter reading updated entries, show the new reading
        const unit = entry.meterReadingUnit === 'hours' ? 'hours' : entry.meterReadingUnit === 'miles' ? 'mi' : 'km';
        meterReading = `${entry.newReading.toLocaleString()} ${unit}`;
      }
      
      return {
        id: entry.id,
        date: dateStr,
        time: timeStr,
        event: entry.action,
        refLabel,
        refId,
        summary: entry.details || entry.action,
        userName: entry.user,
        kind,
        timestamp: entry.timestamp,
        meterReading,
      };
    });
  };

  // Filter and sort activity log
  const filteredActivityLog = useMemo(() => {
    const normalized = normalizeActivityLog(activityLog);
    
    // Apply type filter
    let filtered = normalized;
    if (activityTypeFilter !== 'all') {
      const typeMap: Record<string, ActivityTableRow['kind']> = {
        'inspections': 'inspection',
        'work-orders': 'work-order',
        'defects': 'defect',
      };
      filtered = normalized.filter(row => row.kind === typeMap[activityTypeFilter]);
    }
    
    // Apply search
    if (activitySearch) {
      const searchLower = activitySearch.toLowerCase();
      filtered = filtered.filter(row =>
        row.summary.toLowerCase().includes(searchLower) ||
        (row.refLabel && row.refLabel.toLowerCase().includes(searchLower)) ||
        row.userName.toLowerCase().includes(searchLower) ||
        row.event.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort by timestamp (newest first)
    return filtered.sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [activityLog, activityTypeFilter, activitySearch]);

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      content: (
        <OverviewCards
          asset={asset}
          onChangeLocation={() => showToast('Change location functionality coming soon', 'info')}
          onChangeStatus={() => setIsChangeStatusModalOpen(true)}
          onUpdateHours={() => setIsUpdateHoursModalOpen(true)}
        />
      ),
    },
    {
      id: 'compliance',
      label: 'Compliance',
      content: (
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Compliance Items</h3>
              {canEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsAddComplianceModalOpen(true)}
                  className="inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Compliance Item
                </Button>
              )}
            </div>
            {complianceItems.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>Type</TableHeaderCell>
                    <TableHeaderCell>Item Name</TableHeaderCell>
                    <TableHeaderCell>Frequency</TableHeaderCell>
                    <TableHeaderCell>Last Done</TableHeaderCell>
                    <TableHeaderCell>Next Due</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell>Evidence</TableHeaderCell>
                    {canEdit && <TableHeaderCell>Actions</TableHeaderCell>}
                  </TableRow>
                </TableHeader>
                <tbody>
                  {complianceItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Badge variant="info">{item.complianceType}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{item.itemName}</TableCell>
                      <TableCell>
                        Every {item.frequencyValue} {item.frequencyUnit}
                      </TableCell>
                      <TableCell>
                        {item.lastDoneDate ? new Date(item.lastDoneDate).toLocaleDateString() : 'Never'}
                      </TableCell>
                      <TableCell>{new Date(item.nextDueDate).toLocaleDateString()}</TableCell>
                      <TableCell>{getRAGBadge(item.ragStatus)}</TableCell>
                      <TableCell>
                        {item.evidenceDocumentName ? (
                          <button
                            onClick={() => showToast(`Viewing ${item.evidenceDocumentName}`, 'info')}
                            className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            View
                          </button>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </TableCell>
                      {canEdit && (
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedComplianceItem(item);
                                setIsMarkComplianceDoneModalOpen(true);
                              }}
                              className="text-green-600 hover:text-green-700 text-sm flex items-center gap-1"
                              title="Mark as Done"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCompliance(item.id)}
                              className="text-red-600 hover:text-red-700 text-sm flex items-center gap-1"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </tbody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No compliance items. Click "Add Compliance Item" to create one.
              </div>
            )}
          </div>
        </Card>
      ),
    },
    {
      id: 'work-orders',
      label: 'Work Orders',
      content: (
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Work Orders</h3>
              <Button onClick={() => setIsCreateWOModalOpen(true)}>
                + Create Work Order
              </Button>
            </div>
            {workOrders.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>WO ID</TableHeaderCell>
                    <TableHeaderCell>Title</TableHeaderCell>
                    <TableHeaderCell>Priority</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell>Created</TableHeaderCell>
                    <TableHeaderCell>Due Date</TableHeaderCell>
                    <TableHeaderCell>Assigned To</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <tbody>
                  {workOrders.map((wo) => (
                    <TableRow
                      key={wo.id}
                      onClick={() => navigate(`/work-orders/${wo.id}`)}
                      className="cursor-pointer"
                    >
                      <TableCell className="font-mono font-medium">{wo.id}</TableCell>
                      <TableCell className="font-medium">{wo.title}</TableCell>
                      <TableCell>{getPriorityBadge(wo.priority)}</TableCell>
                      <TableCell>{getWorkOrderStatusBadge(wo.status)}</TableCell>
                      <TableCell>{new Date(wo.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {wo.dueDate ? new Date(wo.dueDate).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>{wo.assignedToName || 'Unassigned'}</TableCell>
                    </TableRow>
                  ))}
                </tbody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">No work orders</div>
            )}
          </div>
        </Card>
      ),
    },
    {
      id: 'pm-schedule',
      label: (
        <div className="flex items-center gap-2">
          <span>PM Schedule</span>
          <div className="group relative">
            <Info className="w-4 h-4 text-gray-400 cursor-help" />
            <div className="absolute left-0 bottom-full mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              PM Schedules are planned maintenance routines that generate Work Orders (e.g., "Monthly PM", "250-hour service")
            </div>
          </div>
        </div>
      ),
      content: (
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">PM Schedule</h3>
              {canEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => showToast('Add PM Schedule functionality coming soon', 'info')}
                  className="inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add PM Schedule
                </Button>
              )}
            </div>
            {pmSchedule.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>PM Name</TableHeaderCell>
                    <TableHeaderCell>Frequency</TableHeaderCell>
                    <TableHeaderCell>Last Done</TableHeaderCell>
                    <TableHeaderCell>Next Due</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell>Assigned Team</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <tbody>
                  {pmSchedule.map((pm) => (
                    <TableRow key={pm.id}>
                      <TableCell className="font-medium">{pm.name}</TableCell>
                      <TableCell>{pm.frequency}</TableCell>
                      <TableCell>
                        {pm.lastDone ? new Date(pm.lastDone).toLocaleDateString() : 'Never'}
                      </TableCell>
                      <TableCell>{new Date(pm.nextDue).toLocaleDateString()}</TableCell>
                      <TableCell>{getPMStatusBadge(pm.status)}</TableCell>
                      <TableCell>{pm.assignedTeam}</TableCell>
                    </TableRow>
                  ))}
                </tbody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">No PM schedule items</div>
            )}
          </div>
        </Card>
      ),
    },
    {
      id: 'checks',
      label: (
        <div className="flex items-center gap-2">
          <span>Checks</span>
          <div className="group relative">
            <Info className="w-4 h-4 text-gray-400 cursor-help" />
            <div className="absolute left-0 bottom-full mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              Checks are operational/safety checklists completed as inspections/check-sheets (e.g., daily pre-start, weekly checks) that may not generate work orders unless failed
            </div>
          </div>
        </div>
      ),
      content: (
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Checks {filterParam && filterParam.includes('due') && '(Due/Overdue)'}
              </h3>
              {canEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => showToast('Add Check functionality coming soon', 'info')}
                  className="inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Check
                </Button>
              )}
            </div>
            {checks.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>Check ID</TableHeaderCell>
                    <TableHeaderCell>Check Type</TableHeaderCell>
                    <TableHeaderCell>Frequency</TableHeaderCell>
                    <TableHeaderCell>Last Completed</TableHeaderCell>
                    <TableHeaderCell>Result</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <tbody>
                  {checks.map((check) => (
                    <TableRow key={check.id}>
                      <TableCell className="font-mono font-medium">{check.checkId}</TableCell>
                      <TableCell className="font-medium">{check.checkType}</TableCell>
                      <TableCell>{check.frequency}</TableCell>
                      <TableCell>
                        {check.lastCompleted ? new Date(check.lastCompleted).toLocaleDateString() : 'Never'}
                      </TableCell>
                      <TableCell>{getCheckResultBadge(check.result)}</TableCell>
                      <TableCell>{getCheckStatusBadge(check.status)}</TableCell>
                    </TableRow>
                  ))}
                </tbody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">No checks</div>
            )}
          </div>
        </Card>
      ),
    },
    {
      id: 'defects',
      label: 'Issues / Defects',
      content: (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Issues / Defects {filterParam === 'open' && '(Open)'}
            </h3>
            {defects.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>Defect ID</TableHeaderCell>
                    <TableHeaderCell>Title</TableHeaderCell>
                    <TableHeaderCell>Severity</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell>Reported Date</TableHeaderCell>
                    <TableHeaderCell>Linked WO</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <tbody>
                  {defects.map((defect) => (
                    <TableRow
                      key={defect.id}
                      onClick={() => defect.linkedWO && navigate(`/work-orders/${defect.linkedWO}`)}
                      className={defect.linkedWO ? 'cursor-pointer' : ''}
                    >
                      <TableCell className="font-mono font-medium">{defect.defectId}</TableCell>
                      <TableCell className="font-medium">{defect.title}</TableCell>
                      <TableCell>{getSeverityBadge(defect.severity)}</TableCell>
                      <TableCell>{getDefectStatusBadge(defect.status)}</TableCell>
                      <TableCell>{new Date(defect.reportedDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {defect.linkedWO ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/work-orders/${defect.linkedWO}`);
                            }}
                            className="text-blue-600 hover:text-blue-700 hover:underline font-mono text-sm"
                          >
                            {defect.linkedWO}
                          </button>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </tbody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">No defects</div>
            )}
          </div>
        </Card>
      ),
    },
    {
      id: 'inspections',
      label: 'Inspections',
      content: (
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Inspections</h3>
              {['Fitter', 'Supervisor', 'Manager', 'Admin'].includes(user?.role || '') && (
                <Button onClick={() => setIsStartInspectionModalOpen(true)}>
                  + Start Inspection
                </Button>
              )}
            </div>
            {inspections.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>Inspection ID</TableHeaderCell>
                    <TableHeaderCell>Template / Type</TableHeaderCell>
                    <TableHeaderCell>Scheduled Date</TableHeaderCell>
                    <TableHeaderCell>Result</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell>Assigned To</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <tbody>
                  {inspections.map((inspection) => (
                    <TableRow
                      key={inspection.id}
                      onClick={() => navigate(`/inspections/${inspection.id}/checklist`)}
                      className="cursor-pointer"
                    >
                      <TableCell className="font-mono font-medium">{inspection.inspectionCode}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{inspection.templateName}</div>
                          <div className="text-xs text-gray-500">{inspection.inspectionType}</div>
                        </div>
                      </TableCell>
                      <TableCell>{new Date(inspection.inspectionDate).toLocaleDateString()}</TableCell>
                      <TableCell>{getInspectionResultBadge(inspection.result)}</TableCell>
                      <TableCell>{getInspectionStatusBadge(inspection.status)}</TableCell>
                      <TableCell>{inspection.inspectorName}</TableCell>
                    </TableRow>
                  ))}
                </tbody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">No inspections</div>
            )}
          </div>
        </Card>
      ),
    },
    {
      id: 'documents',
      label: 'Documents',
      content: (
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
              {['Fitter', 'Supervisor', 'Manager', 'Admin'].includes(user?.role || '') && (
                <Button variant="outline" onClick={() => setIsUploadDocModalOpen(true)}>
                  + Upload Photo / Document
                </Button>
              )}
            </div>
            {allDocuments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>Filename</TableHeaderCell>
                    <TableHeaderCell>Type</TableHeaderCell>
                    <TableHeaderCell>Uploaded Date</TableHeaderCell>
                    <TableHeaderCell>Uploaded By</TableHeaderCell>
                    <TableHeaderCell>Actions</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <tbody>
                  {allDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">{doc.filename}</TableCell>
                      <TableCell>
                        <Badge variant={doc.type === 'photo' ? 'info' : 'default'}>
                          {doc.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(doc.uploadedAt).toLocaleDateString()}</TableCell>
                      <TableCell>{doc.uploadedBy}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => showToast(`Viewing ${doc.filename}`, 'info')}
                            className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                          <button
                            onClick={() => showToast(`Downloading ${doc.filename}`, 'info')}
                            className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </tbody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">No documents</div>
            )}
          </div>
        </Card>
      ),
    },
    {
      id: 'activity',
      label: 'Activity Log',
      content: (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Log</h3>
            
            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div className="w-full sm:w-auto sm:flex-1">
                <Input
                  type="text"
                  placeholder="Search by summary, reference, user..."
                  value={activitySearch}
                  onChange={(e) => setActivitySearch(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex gap-1 border border-gray-300 rounded-lg p-1">
                <button
                  onClick={() => setActivityTypeFilter('all')}
                  className={`px-3 py-1 text-sm rounded ${
                    activityTypeFilter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setActivityTypeFilter('inspections')}
                  className={`px-3 py-1 text-sm rounded ${
                    activityTypeFilter === 'inspections'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Inspections
                </button>
                <button
                  onClick={() => setActivityTypeFilter('work-orders')}
                  className={`px-3 py-1 text-sm rounded ${
                    activityTypeFilter === 'work-orders'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Work Orders
                </button>
                <button
                  onClick={() => setActivityTypeFilter('defects')}
                  className={`px-3 py-1 text-sm rounded ${
                    activityTypeFilter === 'defects'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Defects
                </button>
              </div>
            </div>

            {/* Activity Log Table */}
            {filteredActivityLog.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHeaderCell>Date</TableHeaderCell>
                      <TableHeaderCell className="hidden md:table-cell">Time</TableHeaderCell>
                      <TableHeaderCell>Event</TableHeaderCell>
                      <TableHeaderCell>Reference</TableHeaderCell>
                      <TableHeaderCell>Summary</TableHeaderCell>
                      <TableHeaderCell className="hidden lg:table-cell">Meter Reading</TableHeaderCell>
                      <TableHeaderCell className="hidden md:table-cell">User</TableHeaderCell>
                    </TableRow>
                  </TableHeader>
                  <tbody>
                    {filteredActivityLog.map((row) => {
                      const handleRowClick = () => {
                        if (!row.refId) return;
                        
                        if (row.kind === 'inspection') {
                          // Try to find inspection by code
                          const inspection = inspections.find(
                            (insp) => insp.inspectionCode === row.refId
                          );
                          if (inspection) {
                            navigate(`/inspections/${inspection.id}/checklist`);
                          } else {
                            // Fallback to list with search
                            navigate(`/inspections?search=${row.refId}`);
                          }
                        } else if (row.kind === 'work-order') {
                          // Try to find work order by ID (codes like WO-000123 might match id)
                          const workOrder = workOrders.find(
                            (wo) => wo.id === row.refId || (row.refId && wo.id?.includes(row.refId))
                          );
                          if (workOrder) {
                            navigate(`/work-orders/${workOrder.id}`);
                          } else {
                            // Fallback to list with search
                            navigate(`/work-orders?search=${row.refId}`);
                          }
                        } else if (row.kind === 'defect') {
                          // Try to find defect by defectId
                          const defect = defects.find(
                            (def) => def.defectId === row.refId
                          );
                          if (defect) {
                            navigate(`/defects/${defect.id}`);
                          } else {
                            // Fallback to list with search
                            navigate(`/defects?search=${row.refId}`);
                          }
                        }
                      };
                      
                      return (
                        <TableRow
                          key={row.id}
                          onClick={handleRowClick}
                          className={row.refId ? 'cursor-pointer hover:bg-gray-50' : ''}
                        >
                          <TableCell className="whitespace-nowrap">{row.date}</TableCell>
                          <TableCell className="hidden md:table-cell whitespace-nowrap">
                            {row.time}
                          </TableCell>
                          <TableCell className="font-medium">{row.event}</TableCell>
                          <TableCell>
                            {row.refLabel ? (
                              <span className="font-mono text-blue-600 hover:text-blue-700 hover:underline">
                                {row.refLabel}
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="truncate max-w-md" title={row.summary}>
                              {row.summary}
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {row.meterReading ? (
                              <span className="text-gray-700 font-mono text-sm">{row.meterReading}</span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">{row.userName}</TableCell>
                        </TableRow>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {activityLog.length === 0
                  ? 'No activity log entries'
                  : 'No entries match your filters'}
              </div>
            )}
          </div>
        </Card>
      ),
    },
    {
      id: 'related',
      label: 'Related Assets',
      content: (
        <div className="space-y-6">
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Related Assets</h3>
                {canEdit && (
                  <Button variant="outline" onClick={() => setIsAddRelationshipModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Relationship
                  </Button>
                )}
              </div>

              {/* Parent Assets Section */}
              {parentAssets.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    Parent Assets (this asset depends on)
                  </h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHeaderCell>Relationship</TableHeaderCell>
                        <TableHeaderCell>Type</TableHeaderCell>
                        <TableHeaderCell>Asset ID</TableHeaderCell>
                        <TableHeaderCell>Make / Model</TableHeaderCell>
                        <TableHeaderCell>Site</TableHeaderCell>
                        <TableHeaderCell>Status</TableHeaderCell>
                        {canEdit && <TableHeaderCell>Actions</TableHeaderCell>}
                      </TableRow>
                    </TableHeader>
                    <tbody>
                      {parentAssets.map((parentAsset) => {
                        const relationship = relationships.find(
                          (rel) => rel.parentAssetId === parentAsset.id && rel.childAssetId === asset.id
                        );
                        return (
                          <TableRow
                            key={parentAsset.id}
                            onClick={() => navigate(`/assets/${parentAsset.id}`)}
                            className="cursor-pointer"
                          >
                            <TableCell>
                              <Badge variant="warning">Parent</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="info">{parentAsset.assetTypeCode}</Badge>
                            </TableCell>
                            <TableCell>
                              <span className="font-mono font-medium">{parentAsset.id}</span>
                            </TableCell>
                            <TableCell>
                              {parentAsset.make} {parentAsset.model}
                            </TableCell>
                            <TableCell>{parentAsset.siteName}</TableCell>
                            <TableCell>{getStatusBadge(parentAsset.operationalStatus)}</TableCell>
                            {canEdit && (
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() =>
                                    handleDeleteRelationship(parentAsset.id, asset.id)
                                  }
                                  className="text-red-600 hover:text-red-700 text-sm"
                                >
                                  Remove
                                </button>
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
              )}

              {/* Child Assets Section */}
              {childAssets.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    Child Assets (depend on this asset) ({childAssets.length})
                  </h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHeaderCell>Relationship</TableHeaderCell>
                        <TableHeaderCell>Type</TableHeaderCell>
                        <TableHeaderCell>Asset ID</TableHeaderCell>
                        <TableHeaderCell>Make / Model</TableHeaderCell>
                        <TableHeaderCell>Site</TableHeaderCell>
                        <TableHeaderCell>Status</TableHeaderCell>
                        <TableHeaderCell>Impact</TableHeaderCell>
                        {canEdit && <TableHeaderCell>Actions</TableHeaderCell>}
                      </TableRow>
                    </TableHeader>
                    <tbody>
                      {childAssets.map((childAsset) => {
                        const relationship = relationships.find(
                          (rel) => rel.parentAssetId === asset.id && rel.childAssetId === childAsset.id
                        );
                        const isChildOutOfService =
                          (childAsset.operationalStatus === 'OutOfUse' ||
                            childAsset.operationalStatus === 'Quarantined') &&
                          asset.operationalStatus === 'InUse';
                        return (
                          <TableRow
                            key={childAsset.id}
                            onClick={() => navigate(`/assets/${childAsset.id}`)}
                            className="cursor-pointer"
                          >
                            <TableCell>
                              <Badge variant="info">Child</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="info">{childAsset.assetTypeCode}</Badge>
                            </TableCell>
                            <TableCell>
                              <span className="font-mono font-medium">{childAsset.id}</span>
                            </TableCell>
                            <TableCell>
                              {childAsset.make} {childAsset.model}
                            </TableCell>
                            <TableCell>{childAsset.siteName}</TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {getStatusBadge(childAsset.operationalStatus)}
                                {isChildOutOfService && (
                                  <div className="text-xs text-amber-600 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    Parent active
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-xs text-gray-500">
                                Turning off parent affects children
                              </div>
                            </TableCell>
                            {canEdit && (
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() =>
                                    handleDeleteRelationship(asset.id, childAsset.id)
                                  }
                                  className="text-red-600 hover:text-red-700 text-sm"
                                >
                                  Remove
                                </button>
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
              )}

              {parentAssets.length === 0 && childAssets.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No relationships defined. Click "Add Relationship" to create parent or child
                  dependencies.
                </div>
              )}
            </div>
          </Card>
        </div>
      ),
    },
  ];

  return (
    <div className="pb-6">
      {/* Asset Summary Header */}
      <AssetSummaryHeader
        asset={asset}
        onStartInspection={() => setIsStartInspectionModalOpen(true)}
        onCreateWorkOrder={() => setIsCreateWOModalOpen(true)}
        onEditAsset={() => setIsEditAssetModalOpen(true)}
        onChangeStatus={() => setIsChangeStatusModalOpen(true)}
        onUploadDocs={() => setIsUploadDocModalOpen(true)}
        onUpdateHours={() => setIsUpdateHoursModalOpen(true)}
      />

      {/* Tabs Content */}
      <div className="p-6">
        <Tabs
          tabs={tabs}
          defaultTab={activeTab}
          onTabChange={(tabId) => {
            setActiveTab(tabId);
            setSearchParams((prev) => {
              const newParams = new URLSearchParams(prev);
              newParams.set('tab', tabId);
              return newParams;
            });
          }}
        />
      </div>

      {/* Modals */}
      <CreateWorkOrderModal
        isOpen={isCreateWOModalOpen}
        onClose={() => setIsCreateWOModalOpen(false)}
        onSuccess={(workOrderId) => {
          showToast(`Work order ${workOrderId} created`, 'success');
        }}
        prefillAssetId={asset.id}
      />

      <StartInspectionModal
        isOpen={isStartInspectionModalOpen}
        onClose={() => setIsStartInspectionModalOpen(false)}
        assetId={asset.id}
        assetTypeCode={asset.assetTypeCode}
      />

      <UploadDocumentModal
        isOpen={isUploadDocModalOpen}
        onClose={() => setIsUploadDocModalOpen(false)}
        assetId={asset.id}
        onUpload={handleUploadDocument}
      />

      <AddRelationshipModal
        isOpen={isAddRelationshipModalOpen}
        onClose={() => setIsAddRelationshipModalOpen(false)}
        currentAssetId={asset.id}
        onAdd={handleRelationshipAdded}
      />

      <ChangeStatusModal
        isOpen={isChangeStatusModalOpen}
        onClose={() => setIsChangeStatusModalOpen(false)}
        asset={asset}
        onStatusChanged={handleStatusChanged}
      />

      <EditAssetModal
        isOpen={isEditAssetModalOpen}
        onClose={() => setIsEditAssetModalOpen(false)}
        asset={asset}
        onSave={handleAssetSaved}
      />

      <AddComplianceItemModal
        isOpen={isAddComplianceModalOpen}
        onClose={() => setIsAddComplianceModalOpen(false)}
        assetId={asset.id}
        onAdd={handleComplianceAdded}
      />

      {selectedComplianceItem && (
        <MarkComplianceDoneModal
          isOpen={isMarkComplianceDoneModalOpen}
          onClose={() => {
            setIsMarkComplianceDoneModalOpen(false);
            setSelectedComplianceItem(null);
          }}
          item={selectedComplianceItem}
          onDone={handleComplianceDone}
        />
      )}

      <UpdateHoursModal
        isOpen={isUpdateHoursModalOpen}
        onClose={() => setIsUpdateHoursModalOpen(false)}
        asset={asset}
        onHoursUpdated={() => {
          // Refresh asset data and activity log
          setRefreshKey((prev) => prev + 1);
          // Note: In a real implementation, this would update the asset's hours/mileage
          // and add an activity log entry
        }}
      />
    </div>
  );
}
