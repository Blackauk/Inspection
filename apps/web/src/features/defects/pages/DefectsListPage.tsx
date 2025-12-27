import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useOffline } from '../../../contexts/OfflineContext';
import { useTestMode } from '../../../contexts/TestModeContext';
import { useDefects } from '../context/DefectsContext';
import { Card } from '../../../components/common/Card';
import { Input } from '../../../components/common/Input';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { Checkbox } from '../../../components/common/Checkbox';
import { SortableTable } from '../../../components/common/SortableTable';
import { ListPageTable } from '../../../components/common/ListPageTable';
import { FloatingFilterPanel, FilterSection } from '../../../components/common/FloatingFilterPanel';
import { MultiSelectFilter } from '../../../components/common/MultiSelectFilter';
import { FilterButton } from '../../../components/common/FilterButton';
import { SeverityBadge } from '../components/SeverityBadge';
import { StatusBadge } from '../components/StatusBadge';
import { CollapsibleCard } from '../../../components/common/CollapsibleCard';
import { FilterPanel } from '../../../components/common/FilterPanel';
import { FilterChip } from '../../../components/common/FilterChip';
import { Modal } from '../../../components/common/Modal';
import { Select } from '../../../components/common/Select';
import { FilterOptionList } from '../../../components/common/FilterOptionList';
import { FilterFooter } from '../../../components/common/FilterFooter';
import { DatePicker } from '../../../components/common/DatePicker';
import { ChevronLeft, ChevronRight, ChevronDown, AlertTriangle, X, CheckCircle, XCircle, TestTube, MoreVertical, ClipboardList, Clock, AlertCircle, Eye, Shield, ArrowUp, ArrowDown, ArrowLeftRight } from 'lucide-react';
import { StatCard } from '../../../components/common/StatCard';
import { WildcardGrid } from '../../../components/common/WildcardGrid';
import { DropdownMenu } from '../../../components/common/DropdownMenu';
import { formatDateUK } from '../../../lib/formatters';
import { canRaiseDefect } from '../lib/permissions';
import { mockSites } from '../../assets/services';
import { initialSeedDefects, getNextDefectCode, getRandomAsset, getRandomUser, getRandomSeverity } from '../lib/mockDefects';
import { useTableSelection } from '../../../hooks/useTableSelection';
import { ExportButton } from '../../../components/common/ExportButton';
import { exportTableToExcel, exportTableToPDF } from '../../reports/utils/exportUtils';
import { showToast } from '../../../components/common/Toast';
import type { DefectFilter, DefectStatus, DefectSeverity, SeverityModel } from '../types';
import type { Defect } from '../types';

interface TestEvent {
  id: string;
  timestamp: string;
  message: string;
}

export function DefectsListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isOnline, syncStatus } = useOffline();
  const { testModeEnabled } = useTestMode();
  const {
    defects: contextDefects,
    summary: contextSummary,
    syncQueueCount,
    loading: contextLoading,
    loadDefects,
    sync,
    updateDefectData,
  } = useDefects();

  // Local state for defects (for testing)
  const [localDefects, setLocalDefects] = useState<Defect[]>(() => {
    const saved = localStorage.getItem('defects-local-state');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [...initialSeedDefects];
      }
    }
    return [...initialSeedDefects];
  });

  // Use local defects if available, otherwise fall back to context
  const defects = localDefects.length > 0 ? localDefects : contextDefects;
  const loading = contextLoading && localDefects.length === 0;

  // Save local defects to localStorage
  useEffect(() => {
    if (localDefects.length > 0) {
      localStorage.setItem('defects-local-state', JSON.stringify(localDefects));
    }
  }, [localDefects]);

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<DefectFilter>(() => {
    // Check URL params first, then localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const urlStatus = urlParams.get('status');
    const urlOverdue = urlParams.get('overdue') === 'true';
    const urlFromInspection = urlParams.get('fromInspection') === 'true';
    const urlSeverities = urlParams.getAll('severity');
    
    const urlFilters: DefectFilter = {};
    if (urlStatus) {
      urlFilters.status = urlStatus as DefectStatus;
    }
    if (urlOverdue) {
      urlFilters.showOverdue = true;
    }
    if (urlFromInspection) {
      urlFilters.showFromInspection = true;
    }
    if (urlSeverities.length > 0) {
      urlFilters.severity = urlSeverities.length === 1 ? urlSeverities[0] as DefectSeverity : urlSeverities as DefectSeverity[];
    }
    
    // If URL params exist, use them; otherwise use localStorage
    if (Object.keys(urlFilters).length > 0) {
      return urlFilters;
    }
    
    const saved = localStorage.getItem('defects-filters');
    return saved ? JSON.parse(saved) : {};
  });
  const [activeWildcard, setActiveWildcard] = useState<string | null>(() => {
    // Check URL params first
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('overdue') === 'true') {
      return 'overdue';
    }
    
    const saved = localStorage.getItem('defects-active-wildcard');
    return saved || null;
  });
  const filterButtonRef = useRef<HTMLDivElement>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [tempFilters, setTempFilters] = useState<DefectFilter>(filters);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRefs = useRef<Record<string, React.RefObject<HTMLButtonElement | null>>>({});
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const [expandedFilterSection, setExpandedFilterSection] = useState<string | null>('status');
  const [titleColumnWidth, setTitleColumnWidth] = useState(() => {
    const saved = localStorage.getItem('defects-title-column-width');
    return saved ? Number(saved) : 300;
  });
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartX = useRef<number>(0);
  const resizeStartWidth = useRef<number>(300);
  
  // Test panel state
  const [isTestPanelOpen, setIsTestPanelOpen] = useState(false);
  const [testEvents, setTestEvents] = useState<TestEvent[]>([]);

  useEffect(() => {
    if (localDefects.length === 0) {
      loadDefects();
    }
  }, [loadDefects, localDefects.length]);

  // Calculate dynamic summary from local defects
  const summary = useMemo(() => {
    const now = new Date();
    const openDefects = defects.filter(d => d.status !== 'Closed');
    
    // Count assets with 2+ open defects
    const assetDefectCounts = new Map<string, number>();
    openDefects.forEach(d => {
      if (d.assetId) {
        const count = assetDefectCounts.get(d.assetId) || 0;
        assetDefectCounts.set(d.assetId, count + 1);
      }
    });
    const multiDefectAssets = Array.from(assetDefectCounts.values()).filter(count => count >= 2).length;
    
    // High severity open defects
    const highSeverityOpen = openDefects.filter(d => 
      d.severity === 'High' || d.severity === 'Critical' || d.severity === 'Major'
    ).length;
    
    return {
      total: defects.length,
      open: defects.filter(d => d.status === 'Open' || d.status === 'InProgress' || d.status === 'Acknowledged').length,
      overdue: defects.filter(d => {
        if (d.status === 'Closed') return false;
        if (d.status === 'Overdue') return true;
        if (d.targetRectificationDate) {
          return new Date(d.targetRectificationDate) < now;
        }
        return false;
      }).length,
      unsafe: defects.filter(d => d.unsafeDoNotUse && d.status !== 'Closed').length,
      highSeverityOpen,
      multiDefectAssets,
    };
  }, [defects]);

  const filteredDefects = useMemo(() => {
    let filtered = [...defects];

    // Apply wildcard filters first
    if (activeWildcard === 'total') {
      // Clear status filters - show all
    } else if (activeWildcard === 'open') {
      filtered = filtered.filter((d) => d.status === 'Open' || d.status === 'InProgress' || d.status === 'Acknowledged');
    } else if (activeWildcard === 'overdue') {
      const now = new Date();
      filtered = filtered.filter((d) => {
        if (d.status === 'Closed') return false;
        if (d.status === 'Overdue') return true;
        if (d.targetRectificationDate) {
          return new Date(d.targetRectificationDate) < now;
        }
        return false;
      });
    } else if (activeWildcard === 'unsafe') {
      filtered = filtered.filter((d) => d.unsafeDoNotUse && d.status !== 'Closed');
    }

    // Apply regular filters
    if (filters.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
      filtered = filtered.filter((d) => statuses.includes(d.status));
    }
    if (filters.severity) {
      const severities = Array.isArray(filters.severity) ? filters.severity : [filters.severity];
      filtered = filtered.filter((d) => severities.includes(d.severity));
    }
    if (filters.siteId) {
      const sites = Array.isArray(filters.siteId) ? filters.siteId : [filters.siteId];
      filtered = filtered.filter((d) => sites.includes(d.siteId || ''));
    }
    if (filters.unsafe !== undefined) {
      filtered = filtered.filter((d) => d.unsafeDoNotUse === filters.unsafe);
    }
    if (filters.assignedToId) {
      const assignees = Array.isArray(filters.assignedToId) ? filters.assignedToId : [filters.assignedToId];
      filtered = filtered.filter((d) => d.assignedToId && assignees.includes(d.assignedToId));
    }
    if (filters.assetId) {
      const assets = Array.isArray(filters.assetId) ? filters.assetId : [filters.assetId];
      filtered = filtered.filter((d) => d.assetId && assets.includes(d.assetId));
    }
    if (filters.dateFrom) {
      filtered = filtered.filter((d) => {
        const date = d.targetRectificationDate ? new Date(d.targetRectificationDate) : null;
        return date && date >= new Date(filters.dateFrom!);
      });
    }
    if (filters.dateTo) {
      filtered = filtered.filter((d) => {
        const date = d.targetRectificationDate ? new Date(d.targetRectificationDate) : null;
        return date && date <= new Date(filters.dateTo!);
      });
    }
    if (filters.showFromInspection) {
      filtered = filtered.filter((d) => !!d.inspectionId);
    }

    // Search
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.defectCode.toLowerCase().includes(searchLower) ||
          (d.title || '').toLowerCase().includes(searchLower) ||
          (d.description || '').toLowerCase().includes(searchLower) ||
          (d.assetId || '').toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [defects, search, filters, activeWildcard]);

  // Table selection
  const tableSelection = useTableSelection({
    data: filteredDefects,
    getRowId: (row) => row.id,
    persistKey: 'defects-selection',
  });

  // Export handlers
  const exportColumns = useMemo(() => [
    {
      key: 'defectCode',
      label: 'Defect Code',
      sortable: true,
      render: (_: any, row: Defect) => row.defectCode,
    },
    {
      key: 'title',
      label: 'Title',
      sortable: true,
      render: (_: any, row: Defect) => row.title || '—',
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (_: any, row: Defect) => row.status || '—',
    },
    {
      key: 'severity',
      label: 'Severity',
      sortable: true,
      render: (_: any, row: Defect) => row.severity || '—',
    },
    {
      key: 'unsafeDoNotUse',
      label: 'Unsafe / Do Not Use',
      sortable: true,
      render: (_: any, row: Defect) => row.unsafeDoNotUse ? 'Yes' : 'No',
    },
    {
      key: 'assetId',
      label: 'Asset',
      sortable: true,
      render: (_: any, row: Defect) => row.assetId || '—',
    },
    {
      key: 'assignedToName',
      label: 'Assigned To',
      sortable: true,
      render: (_: any, row: Defect) => row.assignedToName || 'Unassigned',
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (_: any, row: Defect) => formatDateUK(row.createdAt),
    },
    {
      key: 'targetRectificationDate',
      label: 'Target Date',
      sortable: true,
      render: (_: any, row: Defect) => row.targetRectificationDate ? formatDateUK(row.targetRectificationDate) : '—',
    },
  ], []);

  const handleExportExcel = () => {
    const dataToExport = tableSelection.selectedCount > 0
      ? tableSelection.getSelectedRows()
      : filteredDefects;
    
    if (dataToExport.length === 0) {
      showToast('No data to export', 'error');
      return;
    }

    const date = new Date().toISOString().split('T')[0];
    const count = dataToExport.length;
    const filename = `Defects_${date}_${count}`;
    
    exportTableToExcel(dataToExport, exportColumns, filename, 'Defects');
    showToast(`Exported ${count} defect${count !== 1 ? 's' : ''} to Excel`, 'success');
  };

  const handleExportPDF = () => {
    const dataToExport = tableSelection.selectedCount > 0
      ? tableSelection.getSelectedRows()
      : filteredDefects;
    
    if (dataToExport.length === 0) {
      showToast('No data to export', 'error');
      return;
    }

    const date = new Date().toISOString().split('T')[0];
    const count = dataToExport.length;
    const filename = `Defects_${date}_${count}`;
    const title = `Defects Export - ${date} (${count} ${count !== 1 ? 'items' : 'item'})`;
    
    exportTableToPDF(dataToExport, exportColumns, filename, title);
  };

  const handleFilterChange = (key: keyof DefectFilter, value: string | string[] | boolean | undefined) => {
    setFilters((prev) => {
      const updated = {
        ...prev,
        [key]: value,
      };
      localStorage.setItem('defects-filters', JSON.stringify(updated));
      return updated;
    });
  };

  const handleWildcardClick = (wildcard: string) => {
    if (activeWildcard === wildcard) {
      setActiveWildcard(null);
      localStorage.removeItem('defects-active-wildcard');
    } else {
      setActiveWildcard(wildcard);
      localStorage.setItem('defects-active-wildcard', wildcard);
    }
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        count += filters.status.length > 0 ? 1 : 0;
      } else {
        count++;
      }
    }
    if (filters.severity) {
      if (Array.isArray(filters.severity)) {
        count += filters.severity.length > 0 ? 1 : 0;
      } else {
        count++;
      }
    }
    if (filters.siteId) {
      if (Array.isArray(filters.siteId)) {
        count += filters.siteId.length > 0 ? 1 : 0;
      } else {
        count++;
      }
    }
    if (filters.unsafe !== undefined) count++;
    if (filters.assignedToId) {
      if (Array.isArray(filters.assignedToId)) {
        count += filters.assignedToId.length > 0 ? 1 : 0;
      } else {
        count++;
      }
    }
    if (filters.assetId) {
      if (Array.isArray(filters.assetId)) {
        count += filters.assetId.length > 0 ? 1 : 0;
      } else {
        count++;
      }
    }
    if (filters.dateFrom || filters.dateTo) count++;
    return count;
  }, [filters]);


  // Test Panel Functions
  const addTestEvent = (message: string) => {
    const event: TestEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date().toLocaleTimeString(),
      message,
    };
    setTestEvents(prev => [event, ...prev].slice(0, 10));
  };

  const handleResetData = () => {
    setLocalDefects([...initialSeedDefects]);
    addTestEvent('Reset data to original 10 seeded defects');
  };

  const handleCreateRandomDefect = () => {
    const newCode = getNextDefectCode(localDefects);
    const randomAsset = getRandomAsset();
    const randomUser = getRandomUser();
    const randomSeverity = getRandomSeverity();
    const now = new Date();
    const targetDate = new Date(now.getTime() + (Math.random() * 14 + 1) * 24 * 60 * 60 * 1000);

    const newDefect: Defect = {
      id: crypto.randomUUID(),
      defectCode: newCode,
      title: `Random defect ${newCode}`,
      description: `Auto-generated test defect with ${randomSeverity} severity`,
      status: 'Open',
      severityModel: 'LMH',
      severity: randomSeverity,
      unsafeDoNotUse: randomSeverity === 'High',
      assetId: randomAsset,
      assignedToId: randomUser.id,
      assignedToName: randomUser.name,
      createdAt: now.toISOString(),
      targetRectificationDate: targetDate.toISOString().split('T')[0],
      updatedAt: now.toISOString(),
      createdBy: 'user-1',
      createdByName: 'Test User',
      updatedBy: 'user-1',
      updatedByName: 'Test User',
      siteId: '1',
      siteName: 'Site A',
      reopenedCount: 0,
      actions: [],
      attachments: [],
      beforeAfterRequired: false,
      complianceTags: [],
      history: [],
      comments: [],
    };

    setLocalDefects(prev => [...prev, newDefect]);
    addTestEvent(`Created ${newCode}`);
  };

  const handleMarkRandomOverdue = () => {
    const openDefects = localDefects.filter(d => d.status === 'Open' || d.status === 'InProgress');
    if (openDefects.length === 0) {
      addTestEvent('No open defects to mark overdue');
      return;
    }
    const randomDefect = openDefects[Math.floor(Math.random() * openDefects.length)];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    setLocalDefects(prev => prev.map(d => 
      d.id === randomDefect.id 
        ? { ...d, status: 'Overdue' as DefectStatus, targetRectificationDate: yesterday.toISOString().split('T')[0], updatedAt: new Date().toISOString() }
        : d
    ));
    addTestEvent(`Marked ${randomDefect.defectCode} as overdue`);
  };

  const handleToggleUnsafe = () => {
    const openDefects = localDefects.filter(d => (d.status === 'Open' || d.status === 'InProgress') && !d.unsafeDoNotUse);
    if (openDefects.length === 0) {
      addTestEvent('No safe open defects to toggle');
      return;
    }
    const randomDefect = openDefects[Math.floor(Math.random() * openDefects.length)];

    setLocalDefects(prev => prev.map(d => 
      d.id === randomDefect.id 
        ? { ...d, unsafeDoNotUse: !d.unsafeDoNotUse, updatedAt: new Date().toISOString() }
        : d
    ));
    addTestEvent(`${randomDefect.unsafeDoNotUse ? 'Removed unsafe flag from' : 'Marked'} ${randomDefect.defectCode}`);
  };

  const handleCloseRandomDefect = () => {
    const openDefects = localDefects.filter(d => d.status === 'Open' || d.status === 'InProgress');
    if (openDefects.length === 0) {
      addTestEvent('No open defects to close');
      return;
    }
    const randomDefect = openDefects[Math.floor(Math.random() * openDefects.length)];
    const now = new Date();

    setLocalDefects(prev => prev.map(d => 
      d.id === randomDefect.id 
        ? { ...d, status: 'Closed' as DefectStatus, updatedAt: now.toISOString() }
        : d
    ));
    addTestEvent(`Closed ${randomDefect.defectCode}`);
  };

  const handleSimulateUnsafe = () => {
    const openDefects = localDefects.filter(d => d.status === 'Open' || d.status === 'InProgress' && !d.unsafeDoNotUse);
    if (openDefects.length === 0) {
      addTestEvent('No open defects to mark unsafe');
      return;
    }
    const randomDefect = openDefects[Math.floor(Math.random() * openDefects.length)];

    setLocalDefects(prev => prev.map(d => 
      d.id === randomDefect.id 
        ? { ...d, unsafeDoNotUse: true, updatedAt: new Date().toISOString() }
        : d
    ));
    addTestEvent(`Marked ${randomDefect.defectCode} as UNSAFE / DO NOT USE`);
  };

  const handleCloseDefect = async (defectId: string) => {
    const defect = localDefects.find(d => d.id === defectId);
    if (!defect || defect.status === 'Closed') return;

    setLocalDefects(prev => prev.map(d => 
      d.id === defectId 
        ? { ...d, status: 'Closed' as DefectStatus, updatedAt: new Date().toISOString() }
        : d
    ));
    addTestEvent(`Closed ${defect.defectCode}`);
  };

  const handleToggleUnsafeDefect = (defectId: string) => {
    const defect = localDefects.find(d => d.id === defectId);
    if (!defect) return;

    setLocalDefects(prev => prev.map(d => 
      d.id === defectId 
        ? { ...d, unsafeDoNotUse: !d.unsafeDoNotUse, updatedAt: new Date().toISOString() }
        : d
    ));
    addTestEvent(`${defect.unsafeDoNotUse ? 'Removed unsafe flag from' : 'Marked'} ${defect.defectCode}`);
  };

  const canCreate = canRaiseDefect(user?.role);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = titleColumnWidth;
    let currentWidth = titleColumnWidth;
    
    const handleMove = (moveEvent: MouseEvent) => {
      const diff = moveEvent.clientX - resizeStartX.current;
      const newWidth = Math.max(180, Math.min(600, resizeStartWidth.current + diff));
      currentWidth = newWidth;
      setTitleColumnWidth(newWidth);
    };
    
    const handleEnd = () => {
      setIsResizing(false);
      // Save final width
      localStorage.setItem('defects-title-column-width', String(currentWidth));
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
    };
    
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
  }, [titleColumnWidth]);
  
  // Save width when it changes (debounced)
  useEffect(() => {
    if (!isResizing && titleColumnWidth > 0) {
      const timeoutId = setTimeout(() => {
        localStorage.setItem('defects-title-column-width', String(titleColumnWidth));
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [titleColumnWidth, isResizing]);

  const handleToggleExpand = useCallback((rowId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedRowId(expandedRowId === rowId ? null : rowId);
  }, [expandedRowId]);

  const columns = useMemo(() => [
    {
      key: 'expand',
      label: '',
      sortable: false,
      width: 40,
      render: (_: any, row: Defect) => (
        <button
          onClick={(e) => handleToggleExpand(row.id, e)}
          className="flex items-center justify-center w-6 h-6 text-gray-400 hover:text-gray-600 transition-colors"
          title={expandedRowId === row.id ? 'Collapse description' : 'Expand description'}
        >
          {expandedRowId === row.id ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      ),
    },
    {
      key: 'defectCode',
      label: 'Defect Code',
      sortable: true,
      render: (_: any, row: Defect) => (
        <span className="font-mono font-medium">{row.defectCode || row.id}</span>
      ),
    },
    {
      key: 'title',
      label: 'Title',
      sortable: true,
      width: titleColumnWidth,
      renderHeader: (sortKey: string | null, sortDirection: 'asc' | 'desc' | null) => (
          <div className="flex items-center gap-2 group relative">
            <span>Title</span>
            <div
              className="absolute right-0 top-0 bottom-0 w-1 bg-gray-300 hover:bg-blue-500 cursor-col-resize opacity-0 group-hover:opacity-100 transition-opacity z-10"
              onMouseDown={handleResizeStart}
              title="Drag to resize"
              style={{ userSelect: 'none' }}
            />
            <span className="text-gray-400">
              {sortKey === 'title' && sortDirection === 'asc' ? (
                <ArrowUp className="w-4 h-4" />
              ) : sortKey === 'title' && sortDirection === 'desc' ? (
                <ArrowDown className="w-4 h-4" />
              ) : (
                <ArrowLeftRight className="w-3 h-3 opacity-30" />
              )}
            </span>
          </div>
        ),
      render: (_: any, row: Defect) => (
        <div className="truncate" title={row.title || 'Untitled'}>
          <div className="font-medium text-gray-900 truncate">{row.title || 'Untitled'}</div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (_: any, row: Defect) => <StatusBadge status={row.status} />,
    },
    {
      key: 'severity',
      label: 'Severity',
      sortable: true,
      render: (_: any, row: Defect) => (
        <SeverityBadge severity={row.severity} severityModel={row.severityModel} />
      ),
    },
    {
      key: 'unsafe',
      label: 'Unsafe',
      sortable: true,
      render: (_: any, row: Defect) => (
        row.unsafeDoNotUse ? (
          <Badge variant="error" size="sm" className="font-bold">DO NOT USE</Badge>
        ) : (
          <span className="text-gray-400 text-sm">—</span>
        )
      ),
    },
    {
      key: 'assetId',
      label: 'Asset',
      sortable: true,
      render: (_: any, row: Defect) => (
        row.assetId ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/assets/${row.assetId}`);
            }}
            className="text-blue-600 hover:text-blue-700 hover:underline text-sm font-mono"
          >
            {row.assetId}
          </button>
        ) : (
          <span className="text-gray-400 text-sm">—</span>
        )
      ),
    },
    {
      key: 'assignedToName',
      label: 'Assigned To',
      sortable: true,
      render: (_: any, row: Defect) => (
        row.assignedToName || <span className="text-gray-400 text-sm">Unassigned</span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (_: any, row: Defect) => (
        <div className="text-sm">{formatDateUK(row.createdAt)}</div>
      ),
    },
    {
      key: 'targetRectificationDate',
      label: 'Target Date',
      sortable: true,
      render: (_: any, row: Defect) => {
        const isOverdue = row.targetRectificationDate && 
          new Date(row.targetRectificationDate) < new Date() && 
          row.status !== 'Closed';
        return row.targetRectificationDate ? (
          <div className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
            {formatDateUK(row.targetRectificationDate)}
          </div>
        ) : (
          <span className="text-gray-400 text-sm">—</span>
        );
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_: any, row: Defect) => {
        // Get or create ref for this row's menu button
        if (!menuRefs.current[row.id]) {
          menuRefs.current[row.id] = { current: null };
        }
        const menuRef = menuRefs.current[row.id];
        
        const menuItems = [
          {
            label: 'View',
            icon: Eye,
            onClick: () => {
              navigate(`/defects/${row.id}`);
            },
          },
        ];
        
        if (row.status !== 'Closed') {
          menuItems.push({
            label: 'Close',
            icon: CheckCircle,
            onClick: () => {
              handleCloseDefect(row.id);
            },
          });
        }
        
        menuItems.push({
          label: row.unsafeDoNotUse ? 'Mark Safe' : 'Mark Unsafe',
          icon: row.unsafeDoNotUse ? Shield : AlertTriangle,
          onClick: () => {
            handleToggleUnsafeDefect(row.id);
          },
        });
        
        return (
          <div className="relative flex items-center gap-2">
            {/* Hover View Action */}
            {hoveredRowId === row.id && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/defects/${row.id}`);
                }}
                className="flex items-center gap-1 px-2 py-1 text-sm text-blue-600 hover:text-blue-700 hover:underline transition-opacity"
                title="View defect"
              >
                <Eye className="w-4 h-4" />
                <span>View</span>
              </button>
            )}
            <button
              ref={(el) => {
                if (menuRef) {
                  menuRef.current = el;
                }
              }}
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenuId(openMenuId === row.id ? null : row.id);
              }}
              className="p-1 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Actions menu"
            >
              <MoreVertical className="w-5 h-5 text-gray-600" />
            </button>
            {menuRef && (
              <DropdownMenu
                isOpen={openMenuId === row.id}
                onClose={() => setOpenMenuId(null)}
                anchorRef={menuRef as React.RefObject<HTMLElement>}
                items={menuItems}
                width="w-48"
              />
            )}
          </div>
        );
      },
    },
  ], [navigate, titleColumnWidth, handleResizeStart, openMenuId, expandedRowId, hoveredRowId, handleToggleExpand]);

  const hasActiveFilters = activeFilterCount > 0 || activeWildcard !== null;

  return (
    <div className="p-6 space-y-4">
      {/* Command Bar - Status badges only */}
      <div className="flex items-center justify-end gap-2">
        {!isOnline && (
          <Badge variant="warning" size="sm">
            Offline ({syncQueueCount} pending)
          </Badge>
        )}
        {isOnline && syncQueueCount > 0 && (
          <Badge variant="info" size="sm" onClick={sync} className="cursor-pointer">
            {syncQueueCount} pending sync
          </Badge>
        )}
      </div>

      {/* Summary Cards (Wildcards) - Full Width */}
      <WildcardGrid columns={6}>
        <StatCard
          title="Total Defects"
          value={summary.total}
          icon={ClipboardList}
          onClick={() => handleWildcardClick('total')}
          accentColor="blue"
          className={activeWildcard === 'total' ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
        />
        <StatCard
          title="Open"
          value={summary.open}
          icon={Clock}
          onClick={() => handleWildcardClick('open')}
          accentColor="blue"
          className={activeWildcard === 'open' ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
        />
        <StatCard
          title="Overdue"
          value={summary.overdue}
          icon={AlertCircle}
          onClick={() => handleWildcardClick('overdue')}
          accentColor="red"
          className={activeWildcard === 'overdue' ? 'ring-2 ring-red-500 bg-red-50' : ''}
        />
        <StatCard
          title="Unsafe Assets"
          value={summary.unsafe}
          icon={AlertTriangle}
          onClick={() => handleWildcardClick('unsafe')}
          accentColor="red"
          className={activeWildcard === 'unsafe' ? 'ring-2 ring-red-500 bg-red-50' : ''}
        />
        <StatCard
          title="High Severity Open"
          value={summary.highSeverityOpen}
          icon={Shield}
          onClick={() => {
            handleFilterChange('severity', ['High', 'Critical', 'Major']);
            setActiveWildcard(null);
          }}
          accentColor="amber"
          className={filters.severity && (Array.isArray(filters.severity) ? filters.severity.some(s => ['High', 'Critical', 'Major'].includes(s)) : ['High', 'Critical', 'Major'].includes(filters.severity)) ? 'ring-2 ring-amber-500 bg-amber-50' : ''}
        />
        <StatCard
          title="Assets with 2+ Defects"
          value={summary.multiDefectAssets}
          icon={AlertTriangle}
          onClick={() => {
            // Filter by assets with multiple defects
            const assetDefectCounts = new Map<string, number>();
            defects.filter(d => d.status !== 'Closed' && d.assetId).forEach(d => {
              const count = assetDefectCounts.get(d.assetId!) || 0;
              assetDefectCounts.set(d.assetId!, count + 1);
            });
            const multiDefectAssetIds = Array.from(assetDefectCounts.entries())
              .filter(([_, count]) => count >= 2)
              .map(([assetId]) => assetId);
            // Note: This is a simplified filter - in a real app you'd need a better way to filter by multiple asset IDs
            if (multiDefectAssetIds.length > 0) {
              // For now, just show a message or filter by first asset
              // In a real implementation, you'd need to support multi-asset filtering
            }
          }}
          accentColor="amber"
        />
      </WildcardGrid>

      {/* Logic Flow Test Panel */}
      {testModeEnabled && (
        <CollapsibleCard
          title={
            <div className="flex items-center gap-2">
              <TestTube className="w-4 h-4" />
              <span>Logic Flow Test Panel</span>
            </div>
          }
          defaultExpanded={false}
        >
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            <Button size="sm" variant="outline" onClick={handleResetData}>
              Reset Data
            </Button>
            <Button size="sm" variant="outline" onClick={handleCreateRandomDefect}>
              Create Random
            </Button>
            <Button size="sm" variant="outline" onClick={handleMarkRandomOverdue}>
              Mark Overdue
            </Button>
            <Button size="sm" variant="outline" onClick={handleToggleUnsafe}>
              Toggle Unsafe
            </Button>
            <Button size="sm" variant="outline" onClick={handleCloseRandomDefect}>
              Close Random
            </Button>
            <Button size="sm" variant="outline" onClick={handleSimulateUnsafe}>
              Simulate Unsafe
            </Button>
          </div>
          <div className="border-t pt-2">
            <div className="text-xs font-medium text-gray-700 mb-2">Event Log (Last 10):</div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {testEvents.length === 0 ? (
                <div className="text-xs text-gray-500">No events yet</div>
              ) : (
                testEvents.map(event => (
                  <div key={event.id} className="text-xs text-gray-600 flex items-center gap-2">
                    <span className="text-gray-400">{event.timestamp}</span>
                    <span>{event.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </CollapsibleCard>
      )}


      {/* Filter Panel */}
      <FilterPanel
        isOpen={showFilterPanel}
        onClose={() => {
          setShowFilterPanel(false);
          setTempFilters(filters); // Reset temp filters on close
          setExpandedFilterSection('status'); // Reset to default expanded section
        }}
        onApply={() => {
          setFilters(tempFilters);
          setShowFilterPanel(false);
        }}
        onReset={() => {
          const emptyFilters: DefectFilter = {};
          setTempFilters(emptyFilters);
          setFilters(emptyFilters);
          setActiveWildcard(null);
          setExpandedFilterSection('status'); // Reset to show Status section expanded
          localStorage.removeItem('defects-filters');
          localStorage.removeItem('defects-active-wildcard');
        }}
        title="Defect Filters"
      >
        <div className="space-y-1">
          {/* Status - Reference Pattern */}
          <FilterSection 
            title="Status"
            isExpanded={expandedFilterSection === 'status'}
            onToggle={() => setExpandedFilterSection(expandedFilterSection === 'status' ? null : 'status')}
          >
            <FilterOptionList
              options={[
                { value: 'Open', label: 'Open' },
                { value: 'Acknowledged', label: 'Acknowledged' },
                { value: 'InProgress', label: 'In Progress' },
                { value: 'Overdue', label: 'Overdue' },
                { value: 'Deferred', label: 'Deferred' },
                { value: 'Closed', label: 'Closed' },
              ]}
              selected={Array.isArray(tempFilters.status) ? tempFilters.status : tempFilters.status ? [tempFilters.status] : []}
              onChange={(selected) => setTempFilters(prev => ({ ...prev, status: selected.length === 1 ? selected[0] : selected.length > 0 ? selected : undefined }))}
              twoColumn={true}
            />
          </FilterSection>
          
          {/* Severity - Match Status Pattern */}
          <FilterSection 
            title="Severity"
            isExpanded={expandedFilterSection === 'severity'}
            onToggle={() => setExpandedFilterSection(expandedFilterSection === 'severity' ? null : 'severity')}
          >
            <FilterOptionList
              options={[
                { value: 'Low', label: 'Low' },
                { value: 'Medium', label: 'Medium' },
                { value: 'High', label: 'High' },
                { value: 'Critical', label: 'Critical' },
                { value: 'Minor', label: 'Minor' },
                { value: 'Major', label: 'Major' },
              ]}
              selected={Array.isArray(tempFilters.severity) ? tempFilters.severity : tempFilters.severity ? [tempFilters.severity] : []}
              onChange={(selected) => setTempFilters(prev => ({ ...prev, severity: selected.length === 1 ? selected[0] : selected.length > 0 ? selected : undefined }))}
              twoColumn={true}
            />
          </FilterSection>
          
          {/* Site - Searchable Multi-Select */}
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
          
          {/* Asset - Searchable Multi-Select */}
          <FilterSection 
            title="Asset"
            isExpanded={expandedFilterSection === 'asset'}
            onToggle={() => setExpandedFilterSection(expandedFilterSection === 'asset' ? null : 'asset')}
          >
            <MultiSelectFilter
              options={Array.from(new Set(defects.map(d => d.assetId).filter(Boolean))).map(assetId => ({
                value: assetId!,
                label: assetId!,
              }))}
              selected={Array.isArray(tempFilters.assetId) ? tempFilters.assetId : tempFilters.assetId ? [tempFilters.assetId] : []}
              onChange={(selected) => setTempFilters(prev => ({ ...prev, assetId: selected.length === 1 ? selected[0] : selected.length > 0 ? selected : undefined }))}
              placeholder="Search assets..."
              searchable={true}
            />
          </FilterSection>
          
          {/* Unsafe / Do Not Use - Match Status Pattern */}
          <FilterSection 
            title="Unsafe / Do Not Use"
            isExpanded={expandedFilterSection === 'unsafe'}
            onToggle={() => setExpandedFilterSection(expandedFilterSection === 'unsafe' ? null : 'unsafe')}
          >
            <FilterOptionList
              options={[
                { value: 'unsafe', label: 'Show unsafe defects only' },
              ]}
              selected={tempFilters.unsafe === true ? ['unsafe'] : []}
              onChange={(selected) => setTempFilters(prev => ({ ...prev, unsafe: selected.includes('unsafe') ? true : undefined }))}
              twoColumn={true}
            />
          </FilterSection>
          
          {/* Assigned To - Searchable Multi-Select */}
          <FilterSection 
            title="Assigned To"
            isExpanded={expandedFilterSection === 'assignedTo'}
            onToggle={() => setExpandedFilterSection(expandedFilterSection === 'assignedTo' ? null : 'assignedTo')}
          >
            <MultiSelectFilter
              options={[
                { value: 'user-1', label: 'John Smith' },
                { value: 'user-2', label: 'Sarah Johnson' },
                { value: 'user-3', label: 'David Lee' },
                { value: 'user-4', label: 'Mike Davis' },
                { value: 'user-5', label: 'Emma Wilson' },
                { value: 'user-6', label: 'Lisa Anderson' },
              ]}
              selected={Array.isArray(tempFilters.assignedToId) ? tempFilters.assignedToId : tempFilters.assignedToId ? [tempFilters.assignedToId] : []}
              onChange={(selected) => setTempFilters(prev => ({ ...prev, assignedToId: selected.length === 1 ? selected[0] : selected.length > 0 ? selected : undefined }))}
              placeholder="Search inspectors..."
              searchable={true}
            />
          </FilterSection>
          
          {/* Date Range */}
          <FilterSection 
            title="Date Range"
            isExpanded={expandedFilterSection === 'date'}
            onToggle={() => setExpandedFilterSection(expandedFilterSection === 'date' ? null : 'date')}
          >
            <div className="space-y-3">
              <div>
                <div className="text-xs font-medium text-gray-700 mb-2">Scheduled Date</div>
                <div className="grid grid-cols-2 gap-2">
                  <DatePicker
                    label="From"
                    value={tempFilters.dateFrom || ''}
                    onChange={(value) => setTempFilters(prev => ({ ...prev, dateFrom: value || undefined }))}
                    placeholder="From"
                  />
                  <DatePicker
                    label="To"
                    value={tempFilters.dateTo || ''}
                    onChange={(value) => setTempFilters(prev => ({ ...prev, dateTo: value || undefined }))}
                    placeholder="To"
                    minDate={tempFilters.dateFrom ? new Date(tempFilters.dateFrom) : undefined}
                  />
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-700 mb-2">Completed Date</div>
                <div className="grid grid-cols-2 gap-2">
                  <DatePicker
                    label="From"
                    value={tempFilters.completedDateFrom || ''}
                    onChange={(value) => setTempFilters(prev => ({ ...prev, completedDateFrom: value || undefined }))}
                    placeholder="From"
                  />
                  <DatePicker
                    label="To"
                    value={tempFilters.completedDateTo || ''}
                    onChange={(value) => setTempFilters(prev => ({ ...prev, completedDateTo: value || undefined }))}
                    placeholder="To"
                    minDate={tempFilters.completedDateFrom ? new Date(tempFilters.completedDateFrom) : undefined}
                  />
                </div>
              </div>
            </div>
          </FilterSection>
        </div>
      </FilterPanel>

      {/* Main Content - Full Width Table */}
      <div className="space-y-6">
        {loading ? (
          <Card>
            <div className="p-6 text-center py-8 text-gray-500">Loading defects...</div>
          </Card>
        ) : (
          <ListPageTable
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by defect code, title, asset, assigned to…"
            onFilterClick={() => setShowFilterPanel(true)}
            activeFilterCount={activeFilterCount}
            filterButtonRef={filterButtonRef}
            columns={columns}
            data={filteredDefects}
            onRowClick={(row) => navigate(`/defects/${row.id}`)}
            expandedRowId={expandedRowId}
            renderExpandedRow={(row: Defect) => (
              <div className="text-sm text-gray-600">
                <div className="font-medium text-gray-700 mb-1">Description:</div>
                <div className="whitespace-pre-wrap">{row.description || 'No description provided'}</div>
              </div>
            )}
            onRowHover={setHoveredRowId}
            showingText={`Showing ${filteredDefects.length} defect${filteredDefects.length !== 1 ? 's' : ''}`}
            emptyMessage="No defects found matching your criteria"
            selectable={true}
            selectedIds={tableSelection.selectedIds}
            onSelectionChange={tableSelection.setSelectedIds}
            getRowId={(row) => row.id}
            headerActions={
              <ExportButton
                onExportExcel={handleExportExcel}
                onExportPDF={handleExportPDF}
                selectedCount={tableSelection.selectedCount}
                totalCount={filteredDefects.length}
                tableName="Defects"
              />
            }
          />
        )}
      </div>
      
      {/* Floating Filter Panel (for Sort) */}
      <FloatingFilterPanel
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        anchorRef={filterButtonRef}
      >
        <div className="space-y-4">
          <FilterSection title="Status">
            <MultiSelectFilter
              options={[
                { value: 'Open', label: 'Open' },
                { value: 'Acknowledged', label: 'Acknowledged' },
                { value: 'InProgress', label: 'In Progress' },
                { value: 'Overdue', label: 'Overdue' },
                { value: 'Deferred', label: 'Deferred' },
                { value: 'Closed', label: 'Closed' },
              ]}
              selected={Array.isArray(filters.status) ? filters.status : filters.status ? [filters.status] : []}
              onChange={(selected) => handleFilterChange('status', selected.length === 1 ? selected[0] : selected)}
              placeholder="Select statuses..."
            />
          </FilterSection>
          
          <FilterSection title="Severity">
            <MultiSelectFilter
              options={[
                { value: 'Low', label: 'Low' },
                { value: 'Medium', label: 'Medium' },
                { value: 'High', label: 'High' },
                { value: 'Critical', label: 'Critical' },
                { value: 'Minor', label: 'Minor' },
                { value: 'Major', label: 'Major' },
              ]}
              selected={Array.isArray(filters.severity) ? filters.severity : filters.severity ? [filters.severity] : []}
              onChange={(selected) => handleFilterChange('severity', selected.length === 1 ? selected[0] : selected)}
              placeholder="Select severities..."
            />
          </FilterSection>
          
          <FilterSection title="Site">
            <MultiSelectFilter
              options={mockSites.map((site) => ({ value: site.id, label: site.name }))}
              selected={Array.isArray(filters.siteId) ? filters.siteId : filters.siteId ? [filters.siteId] : []}
              onChange={(selected) => handleFilterChange('siteId', selected.length === 1 ? selected[0] : selected)}
              placeholder="Select sites..."
            />
          </FilterSection>
          
          <FilterSection title="Unsafe / Do Not Use">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.unsafe === true}
                onChange={(e) => handleFilterChange('unsafe', e.target.checked ? true : undefined)}
                className="rounded"
              />
              <span className="text-sm">Show unsafe defects only</span>
            </label>
          </FilterSection>
          
          <FilterSection title="Assigned To">
            <MultiSelectFilter
              options={[
                { value: 'user-1', label: 'John Smith' },
                { value: 'user-2', label: 'Sarah Johnson' },
                { value: 'user-3', label: 'David Lee' },
                { value: 'user-4', label: 'Mike Davis' },
                { value: 'user-5', label: 'Emma Wilson' },
                { value: 'user-6', label: 'Lisa Anderson' },
              ]}
              selected={filters.assignedToId ? [filters.assignedToId] : []}
              onChange={(selected) => handleFilterChange('assignedToId', selected.length === 1 ? selected[0] : undefined)}
              placeholder="Select assignee..."
            />
          </FilterSection>
          
          <FilterSection title="Date Range">
            <div className="space-y-2">
              <Input
                type="date"
                label="From"
                value={filters.dateFrom || ''}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value || undefined)}
              />
              <Input
                type="date"
                label="To"
                value={filters.dateTo || ''}
                onChange={(e) => handleFilterChange('dateTo', e.target.value || undefined)}
              />
            </div>
          </FilterSection>
          
          <div className="flex gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFilters({});
                setActiveWildcard(null);
                localStorage.removeItem('defects-filters');
                localStorage.removeItem('defects-active-wildcard');
              }}
            >
              Clear All
            </Button>
          </div>
        </div>
      </FloatingFilterPanel>
    </div>
  );
}
