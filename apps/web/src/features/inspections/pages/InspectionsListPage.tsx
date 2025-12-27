import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useOffline } from '../../../contexts/OfflineContext';
import { useTestMode } from '../../../contexts/TestModeContext';
import { useInspections } from '../context/InspectionsContext';
import { Card } from '../../../components/common/Card';
import { Input } from '../../../components/common/Input';
import { DatePicker } from '../../../components/common/DatePicker';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { Checkbox } from '../../../components/common/Checkbox';
import { SortableTable } from '../../../components/common/SortableTable';
import { ListPageTable } from '../../../components/common/ListPageTable';
import { Select } from '../../../components/common/Select';
import { FilterPanel } from '../../../components/common/FilterPanel';
import { FilterSection } from '../../../components/common/FilterSection';
import { MultiSelectFilter } from '../../../components/common/MultiSelectFilter';
import { FilterOptionList } from '../../../components/common/FilterOptionList';
import { FilterSearch } from '../../../components/common/FilterSearch';
import { FilterButton } from '../../../components/common/FilterButton';
import { Tabs } from '../../../components/common/Tabs';
import { ClipboardCheck, CheckCircle, AlertCircle, XCircle, AlertTriangle, Shield, MoreVertical, Eye, Download, Play, Pause, PlayCircle, Calendar, X } from 'lucide-react';
import { StatCard } from '../../../components/common/StatCard';
import { WildcardGrid } from '../../../components/common/WildcardGrid';
import { DropdownMenu } from '../../../components/common/DropdownMenu';
import { ExportButton } from '../../../components/common/ExportButton';
import { canCreateInspection } from '../lib/permissions';
import { mockSites } from '../mockData';
import { getInspections, getInspectionAlerts, getInspectionById as getInspectionByIdService } from '../services';
import { CheckSheetsListPage } from './CheckSheetsListPage';
import { ChecklistsListPage } from './ChecklistsListPage';
import { showToast } from '../../../components/common/Toast';
import { CollapsibleCard } from '../../../components/common/CollapsibleCard';
import { formatDateUK } from '../../../lib/formatters';
import { getPDFBrandingSettings } from '../../settings/sections/PDFBrandingSection';
import { useTableSelection } from '../../../hooks/useTableSelection';
import { exportTableToExcel, exportTableToPDF } from '../../reports/utils/exportUtils';
import type { InspectionFilter, InspectionStatus, InspectionResult, InspectionType, Inspection } from '../types';

type WildcardFilter = 'ALL' | 'COMPLETED_WEEK' | 'OVERDUE' | 'FAILED' | 'OPEN_DEFECTS' | 'COMPLIANCE';

export function InspectionsListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { isOnline, syncStatus } = useOffline();
  const {
    inspections,
    summary: contextSummary,
    syncQueueCount,
    loading,
    loadInspections,
    sync,
  } = useInspections();
  const { testModeEnabled } = useTestMode();

  // Determine active tab from URL
  const activeTab = useMemo(() => {
    if (location.pathname.includes('/templates')) return 'check-sheets';
    if (location.pathname.includes('/checklists')) return 'checklists';
    return 'inspections';
  }, [location.pathname]);

  const [search, setSearch] = useState('');
  // Check navigation state for filter preferences
  const navState = location.state as { showDueSoon?: boolean; activeQuickFilter?: string } | null;
  const [filters, setFilters] = useState<InspectionFilter>(() => {
    const saved = localStorage.getItem('inspections-filters');
    const parsed = saved ? JSON.parse(saved) : {};
    // Check if navigation state has filter preferences
    if (navState?.showDueSoon) {
      parsed.showDueSoon = true;
    }
    return parsed;
  });
  const [activeQuickFilter, setActiveQuickFilter] = useState<string | null>(navState?.activeQuickFilter || null);
  const [wildcardFilter, setWildcardFilter] = useState<WildcardFilter>('ALL');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Sync tempFilters when filter panel opens
  useEffect(() => {
    if (isFilterOpen) {
      setTempFilters(filters);
    }
  }, [isFilterOpen, filters]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRefs = useRef<Record<string, React.RefObject<HTMLButtonElement | null>>>({});
  const [expandedFilterSection, setExpandedFilterSection] = useState<string | null>(null);
  const [defectsFilter, setDefectsFilter] = useState<'with' | 'without' | null>(null);
  const [isBulkMenuOpen, setIsBulkMenuOpen] = useState(false);
  const bulkMenuRef = useRef<HTMLDivElement>(null);

  // Testing Controls state
  const [showTestingControls, setShowTestingControls] = useState(false);
  const [selectedTestInspection, setSelectedTestInspection] = useState<string>('');

  // Start Inspection handler
  const handleStartInspection = async (inspectionId: string, inspectionCode?: string) => {
    console.log('[Start] Clicked - inspectionId:', inspectionId, 'inspectionCode:', inspectionCode);
    
    try {
      // Try to get inspection to verify it exists - try multiple ways
      let inspection = getInspectionByIdService(inspectionId);
      if (!inspection) {
        inspection = allInspections.find(ins => ins.id === inspectionId);
      }
      if (!inspection) {
        inspection = allInspections.find(ins => ins.inspectionCode === inspectionId);
      }
      if (!inspection && inspectionCode) {
        inspection = allInspections.find(ins => ins.inspectionCode === inspectionCode);
      }
      
      if (!inspection) {
        console.error('[Start] Inspection not found:', inspectionId);
        showToast(`Could not start inspection: inspection not found (${inspectionId})`, 'error');
        return;
      }

      if (inspection.status !== 'Draft') {
        console.warn('[Start] Inspection is not Draft:', inspection.status);
        showToast(`Inspection is not in Draft status (current: ${inspection.status})`, 'error');
        return;
      }

      if (!inspection.templateId || !inspection.items || inspection.items.length === 0) {
        console.error('[Start] Inspection missing template:', {
          templateId: inspection.templateId,
          itemsCount: inspection.items?.length || 0,
        });
        showToast(`Could not start inspection: template not linked or missing items`, 'error');
        return;
      }

      console.log('[Start] Inspection found:', {
        id: inspection.id,
        code: inspection.inspectionCode,
        templateId: inspection.templateId,
        templateName: inspection.templateName,
        itemsCount: inspection.items.length,
      });

      // Create session in localStorage
      const storageKey = `inspection-session-${inspection.id}`;
      const session = {
        inspectionId: inspection.id,
        templateId: inspection.templateId,
        answers: [],
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(storageKey, JSON.stringify(session));
      console.log('[Start] Session created:', storageKey, session);

      // Navigate to runner
      const runnerUrl = `/inspections/run/${inspection.id}`;
      console.log('[Start] Navigating to:', runnerUrl);
      navigate(runnerUrl);
    } catch (error: any) {
      console.error('[Start] Error:', error);
      showToast(`Could not start inspection: ${error.message}`, 'error');
    }
  };

  // Continue Inspection handler
  const handleContinueInspection = async (inspectionId: string, inspectionCode?: string) => {
    console.log('[Continue] Clicked - inspectionId:', inspectionId, 'inspectionCode:', inspectionCode);
    
    try {
      // Try to get inspection to verify it exists - try multiple ways
      let inspection = getInspectionByIdService(inspectionId);
      if (!inspection) {
        inspection = allInspections.find(ins => ins.id === inspectionId);
      }
      if (!inspection) {
        inspection = allInspections.find(ins => ins.inspectionCode === inspectionId);
      }
      if (!inspection && inspectionCode) {
        inspection = allInspections.find(ins => ins.inspectionCode === inspectionCode);
      }
      
      if (!inspection) {
        console.error('[Continue] Inspection not found:', inspectionId);
        showToast(`Could not continue inspection: inspection not found (${inspectionId})`, 'error');
        return;
      }

      if (inspection.status !== 'InProgress') {
        console.warn('[Continue] Inspection is not InProgress:', inspection.status);
        showToast(`Inspection is not in InProgress status (current: ${inspection.status})`, 'error');
        return;
      }

      if (!inspection.templateId || !inspection.items || inspection.items.length === 0) {
        console.error('[Continue] Inspection missing template:', {
          templateId: inspection.templateId,
          itemsCount: inspection.items?.length || 0,
        });
        showToast(`Could not continue inspection: template not linked or missing items`, 'error');
        return;
      }

      console.log('[Continue] Inspection found:', {
        id: inspection.id,
        code: inspection.inspectionCode,
        templateId: inspection.templateId,
        templateName: inspection.templateName,
        itemsCount: inspection.items.length,
      });

      // Check for existing session
      const storageKey = `inspection-session-${inspection.id}`;
      const savedSession = localStorage.getItem(storageKey);
      if (savedSession) {
        try {
          const session = JSON.parse(savedSession);
          console.log('[Continue] Session found in localStorage:', storageKey, {
            answersCount: session.answers?.length || 0,
            updatedAt: session.updatedAt,
          });
        } catch (e) {
          console.warn('[Continue] Failed to parse session:', e);
        }
      } else {
        console.log('[Continue] No session found, will create on runner load');
        // Create a session with existing answers if available
        if (inspection.answers && inspection.answers.length > 0) {
          const session = {
            inspectionId: inspection.id,
            templateId: inspection.templateId,
            answers: inspection.answers,
            startedAt: inspection.startedAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          localStorage.setItem(storageKey, JSON.stringify(session));
          console.log('[Continue] Created session from inspection answers:', storageKey);
        }
      }

      // Navigate to runner
      const runnerUrl = `/inspections/run/${inspection.id}`;
      console.log('[Continue] Navigating to:', runnerUrl);
      navigate(runnerUrl);
    } catch (error: any) {
      console.error('[Continue] Error:', error);
      showToast(`Could not continue inspection: ${error.message}`, 'error');
    }
  };

  useEffect(() => {
    loadInspections();
  }, [loadInspections]);

  // Get inspections from services (fallback if context is empty)
  const allInspections = useMemo(() => {
    if (inspections && inspections.length > 0) {
      return inspections;
    }
    // Fallback to services if context is empty
    return getInspections();
  }, [inspections]);

  // Compute inspection alerts (overdue, failed, due soon) - safely
  const inspectionAlerts = useMemo(() => {
    try {
      // Try to get from services directly for reliability
      const alerts = getInspectionAlerts();
      if (alerts && alerts.length > 0) {
        return alerts;
      }
      
      // Fallback: compute from allInspections
      if (!allInspections || allInspections.length === 0) return [];
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

      return allInspections.filter((ins): ins is Inspection => {
        if (!ins) return false;
        const isOverdue = ins.dueDate && 
          new Date(ins.dueDate) < today && 
          ins.status !== 'Closed' && ins.status !== 'Approved' &&
          !ins.isPaused; // Don't count paused inspections as overdue
        const isFailed = ins.result === 'Fail' && ins.status !== 'Closed' && ins.status !== 'Approved';
        const isDueSoon = ins.dueDate && 
          new Date(ins.dueDate) >= today &&
          new Date(ins.dueDate) <= nextWeek &&
          ins.status !== 'Closed' && ins.status !== 'Approved';
        
        return isOverdue || isFailed || isDueSoon;
      });
    } catch (error) {
      console.error('Error computing inspection alerts:', error);
      return [];
    }
  }, [allInspections]);

  const filteredInspections = useMemo(() => {
    if (!allInspections || allInspections.length === 0) return [];
    let filtered = [...allInspections];

    // Apply filters
    if (filters.status) {
      filtered = filtered.filter((i) => i.status === filters.status);
    }
    if (filters.result) {
      filtered = filtered.filter((i) => i.result === filters.result);
    }
    if (filters.inspectionType) {
      const types = Array.isArray(filters.inspectionType) ? filters.inspectionType : [filters.inspectionType];
      filtered = filtered.filter((i) => types.includes(i.inspectionType));
    }
    if (filters.siteId) {
      const sites = Array.isArray(filters.siteId) ? filters.siteId : [filters.siteId];
      filtered = filtered.filter((i) => sites.includes(i.siteId || ''));
    }
    if (filters.assetId) {
      filtered = filtered.filter((i) => i.assetId === filters.assetId);
    }
    
    // Status filters (OR logic)
    if (filters.showOverdue || filters.showFailed || filters.showDueSoon) {
      const today = new Date();
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((i) => {
        const isOverdue = filters.showOverdue && i.dueDate && 
          new Date(i.dueDate) < today && 
          i.status !== 'Closed' &&
          !i.isPaused; // Don't count paused inspections as overdue
        const isFailed = filters.showFailed && i.result === 'Fail';
        const isDueSoon = filters.showDueSoon && i.dueDate && 
          new Date(i.dueDate) > new Date() &&
          new Date(i.dueDate) <= nextWeek &&
          i.status !== 'Closed';
        return isOverdue || isFailed || isDueSoon;
      });
    }

    // Quick filters
    if (activeQuickFilter === 'drafts') {
      filtered = filtered.filter((i) => i.status === 'Draft');
    }
    if (activeQuickFilter === 'overdue') {
      const today = new Date();
      filtered = filtered.filter((i) => {
        if (!i.dueDate) return false;
        return new Date(i.dueDate) < today && i.status !== 'Closed';
      });
    }
    if (activeQuickFilter === 'failed') {
      filtered = filtered.filter((i) => i.result === 'Fail');
    }
    if (activeQuickFilter === 'my-inspections') {
      filtered = filtered.filter((i) => i.inspectorId === user?.id);
    }

    // Wildcard filters
    if (wildcardFilter !== 'ALL') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      switch (wildcardFilter) {
        case 'COMPLETED_WEEK':
          filtered = filtered.filter((i) => {
            if (!i.completedAt || i.status !== 'Closed') return false;
            const completedDate = new Date(i.completedAt);
            completedDate.setHours(0, 0, 0, 0);
            return completedDate >= weekStart;
          });
          break;
        case 'OVERDUE':
          filtered = filtered.filter((i) => {
            if (!i.dueDate) return false;
        const dueDate = new Date(i.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate < today && i.status !== 'Closed' && i.status !== 'Approved' && !i.isPaused;
          });
          break;
        case 'FAILED':
          filtered = filtered.filter((i) => i.result === 'Fail');
          break;
        case 'OPEN_DEFECTS':
          filtered = filtered.filter((i) => i.linkedDefectIds && i.linkedDefectIds.length > 0);
          break;
        case 'COMPLIANCE':
          filtered = filtered.filter((i) => {
            // Check if any checklist items have compliance tags
            return i.items.some((item) => item.complianceTag === 'PUWER' || item.complianceTag === 'LOLER');
          });
          break;
      }
    }

    // Defects filter
    if (defectsFilter === 'with') {
      filtered = filtered.filter((i) => i.linkedDefectIds && i.linkedDefectIds.length > 0);
    } else if (defectsFilter === 'without') {
      filtered = filtered.filter((i) => !i.linkedDefectIds || i.linkedDefectIds.length === 0);
    }

    // Search
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.inspectionCode.toLowerCase().includes(searchLower) ||
          i.templateName.toLowerCase().includes(searchLower) ||
          i.assetId?.toLowerCase().includes(searchLower) ||
          i.inspectorName.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [allInspections, search, filters, activeQuickFilter, wildcardFilter, user?.id, defectsFilter]);

  // Table selection (must be after filteredInspections is defined)
  const tableSelection = useTableSelection({
    data: filteredInspections,
    getRowId: (row) => row.id,
    persistKey: 'inspections-selection',
  });
  const selectedInspectionIds = tableSelection.selectedIds;

  // Calculate summary from filtered inspections (before wildcard filter) to ensure wildcards reflect current table state
  const summary = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Get base filtered inspections (without wildcard filter) for summary
    let baseFiltered = [...allInspections];
    
    // Apply same filters as filteredInspections but without wildcard
    if (filters.status) {
      baseFiltered = baseFiltered.filter((i) => i.status === filters.status);
    }
    if (filters.result) {
      baseFiltered = baseFiltered.filter((i) => i.result === filters.result);
    }
    if (filters.inspectionType) {
      const types = Array.isArray(filters.inspectionType) ? filters.inspectionType : [filters.inspectionType];
      baseFiltered = baseFiltered.filter((i) => types.includes(i.inspectionType));
    }
    if (filters.siteId) {
      const sites = Array.isArray(filters.siteId) ? filters.siteId : [filters.siteId];
      baseFiltered = baseFiltered.filter((i) => sites.includes(i.siteId || ''));
    }
    if (filters.assetId) {
      baseFiltered = baseFiltered.filter((i) => i.assetId === filters.assetId);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      baseFiltered = baseFiltered.filter(
        (i) =>
          i.inspectionCode.toLowerCase().includes(searchLower) ||
          i.templateName.toLowerCase().includes(searchLower) ||
          i.assetId?.toLowerCase().includes(searchLower) ||
          i.inspectorName.toLowerCase().includes(searchLower)
      );
    }
    
    return {
      total: baseFiltered.length,
      completedThisWeek: baseFiltered.filter((i) => {
        if (!i.completedAt || i.status !== 'Closed') return false;
        const completedDate = new Date(i.completedAt);
        completedDate.setHours(0, 0, 0, 0);
        return completedDate >= weekStart;
      }).length,
      overdue: baseFiltered.filter((i) => {
        if (!i.dueDate) return false;
        const dueDate = new Date(i.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate < now && i.status !== 'Closed' && i.status !== 'Approved';
      }).length,
      failed: baseFiltered.filter((i) => i.result === 'Fail').length,
      openDefectsFromInspections: baseFiltered.filter((i) => i.linkedDefectIds && i.linkedDefectIds.length > 0).reduce((sum, i) => sum + (i.linkedDefectIds?.length || 0), 0),
      complianceInspections: baseFiltered.filter((i) => {
        return i.items.some((item) => item.complianceTag === 'PUWER' || item.complianceTag === 'LOLER');
      }).length,
    };
  }, [allInspections, filters, search]);

  const handleQuickFilter = (filter: string) => {
    setActiveQuickFilter(activeQuickFilter === filter ? null : filter);
  };

  const handleFilterChange = (key: keyof InspectionFilter, value: string | string[] | boolean) => {
    setFilters((prev) => {
      const updated = {
        ...prev,
        [key]: value,
      };
      localStorage.setItem('inspections-filters', JSON.stringify(updated));
      return updated;
    });
  };
  
  const activeFilterCount = useMemo(() => {
    let count = 0;
    // Count status filter
    if (filters.status) count++;
    // Count result filter
    if (filters.result) count++;
    // Count inspection type (array or single)
    if (filters.inspectionType) {
      if (Array.isArray(filters.inspectionType)) {
        count += filters.inspectionType.length > 0 ? 1 : 0;
      } else {
        count++;
      }
    }
    // Count site (array or single)
    if (filters.siteId) {
      if (Array.isArray(filters.siteId)) {
        count += filters.siteId.length > 0 ? 1 : 0;
      } else {
        count++;
      }
    }
    // Count asset filter
    if (filters.assetId) count++;
    // Count status checkboxes
    if (filters.showOverdue) count++;
    if (filters.showFailed) count++;
    if (filters.showDueSoon) count++;
    // Count date range
    if (filters.dateFrom || filters.dateTo) count++;
    // Count assigned to
    if (filters.inspectorId) count++;
    // Count quick filter
    if (activeQuickFilter) count++;
    // Count defects filter
    if (defectsFilter) count++;
    return count;
  }, [filters, activeQuickFilter, defectsFilter]);

  const getResultBadge = (result: InspectionResult) => {
    const variants: Record<InspectionResult, 'default' | 'success' | 'error' | 'warning'> = {
      Pass: 'success',
      Fail: 'error',
      Pending: 'warning',
    };
    return <Badge variant={variants[result]}>{result}</Badge>;
  };

  const getStatusBadge = (inspection: Inspection) => {
    if (inspection.isPaused) {
      return <Badge variant="warning">Paused</Badge>;
    }
    const variants: Record<InspectionStatus, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
      Draft: 'default',
      InProgress: 'warning',
      Submitted: 'info',
      Approved: 'success',
      Closed: 'success',
    };
    return <Badge variant={variants[inspection.status]}>{inspection.status}</Badge>;
  };

  const getTypeLabel = (type: InspectionType) => {
    const labels: Record<InspectionType, string> = {
      PlantAcceptance: 'Plant Acceptance',
      Daily: 'Daily',
      Weekly: 'Weekly',
      Monthly: 'Monthly',
      PreUse: 'Pre-Use',
      TimeBased: 'Time-Based',
    };
    return labels[type];
  };

  const canCreate = canCreateInspection(user?.role);

  // Get Draft and InProgress inspections for testing controls
  const testableInspections = useMemo(() => {
    return (allInspections ?? []).filter(ins => ins && (ins.status === 'Draft' || ins.status === 'InProgress'));
  }, [allInspections]);

  // Testing Controls handlers
  const handleForceStart = () => {
    if (!selectedTestInspection) {
      showToast('Please select an inspection', 'error');
      return;
    }
    const inspection = allInspections.find(ins => ins.id === selectedTestInspection || ins.inspectionCode === selectedTestInspection);
    if (inspection) {
      handleStartInspection(inspection.id, inspection.inspectionCode);
    }
  };

  const handleForceContinue = () => {
    if (!selectedTestInspection) {
      showToast('Please select an inspection', 'error');
      return;
    }
    const inspection = allInspections.find(ins => ins.id === selectedTestInspection || ins.inspectionCode === selectedTestInspection);
    if (inspection) {
      handleContinueInspection(inspection.id, inspection.inspectionCode);
    }
  };

  const handleClearAllSessions = () => {
    if (!confirm('Clear all inspection sessions from localStorage?')) return;
    let cleared = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('inspection-session-')) {
        localStorage.removeItem(key);
        cleared++;
      }
    }
    showToast(`Cleared ${cleared} inspection session(s)`, 'success');
    console.log('[Testing] Cleared all inspection sessions');
  };

  // PDF Export handler
  const handleDownloadPDF = async (inspection: Inspection) => {
    try {
      // Dynamic import to avoid loading jsPDF on initial page load
      const { default: jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      let yPos = margin;

      // Get PDF branding settings
      const brandingSettings = getPDFBrandingSettings();

      // Add page number footer function
      const addPageNumber = (pageNum: number, totalPages: number) => {
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(128, 128, 128);
        const pageText = `Page ${pageNum} of ${totalPages}`;
        const textWidth = doc.getTextWidth(pageText);
        doc.text(pageText, pageWidth - margin - textWidth, pageHeight - 10);
        doc.setTextColor(0, 0, 0); // Reset to black
      };

      // Banner Section
      if (brandingSettings.showBanner) {
        const bannerHeight = 40;
        const bannerY = yPos;
        yPos += bannerHeight + 10;

        if (brandingSettings.bannerLayout === 'three-column') {
          const colWidth = (pageWidth - 2 * margin) / 3;
          const slots = [
            { data: brandingSettings.bannerLeft, x: margin },
            { data: brandingSettings.bannerCenter, x: margin + colWidth },
            { data: brandingSettings.bannerRight, x: margin + 2 * colWidth },
          ];

          slots.forEach((slot) => {
            if (slot.data.image) {
              try {
                const imgWidth = colWidth - 4;
                const imgHeight = bannerHeight - 4;
                doc.addImage(slot.data.image, 'PNG', slot.x + 2, bannerY + 2, imgWidth, imgHeight);
              } catch (e) {
                // If image fails, fall back to text
                if (slot.data.text) {
                  doc.setFontSize(10);
                  doc.text(slot.data.text, slot.x + colWidth / 2, bannerY + bannerHeight / 2, {
                    align: 'center',
                    maxWidth: colWidth - 4,
                  });
                }
              }
            } else if (slot.data.text) {
              doc.setFontSize(10);
              doc.text(slot.data.text, slot.x + colWidth / 2, bannerY + bannerHeight / 2, {
                align: 'center',
                maxWidth: colWidth - 4,
              });
            }
          });
        } else {
          // Single column
          if (brandingSettings.bannerSingle.image) {
            try {
              const imgWidth = pageWidth - 2 * margin - 4;
              const imgHeight = bannerHeight - 4;
              doc.addImage(
                brandingSettings.bannerSingle.image,
                'PNG',
                margin + 2,
                bannerY + 2,
                imgWidth,
                imgHeight
              );
            } catch (e) {
              if (brandingSettings.bannerSingle.text) {
                doc.setFontSize(12);
                doc.text(
                  brandingSettings.bannerSingle.text,
                  pageWidth / 2,
                  bannerY + bannerHeight / 2,
                  { align: 'center', maxWidth: pageWidth - 2 * margin - 4 }
                );
              }
            }
          } else if (brandingSettings.bannerSingle.text) {
            doc.setFontSize(12);
            doc.text(
              brandingSettings.bannerSingle.text,
              pageWidth / 2,
              bannerY + bannerHeight / 2,
              { align: 'center', maxWidth: pageWidth - 2 * margin - 4 }
            );
          }
        }
      }

      // Title
      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      doc.text('Inspection Report', margin, yPos);
      yPos += 12;

      // Condensed Inspection Details in Grid Layout
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      const gridCol1 = margin;
      const gridCol2 = margin + (pageWidth - 2 * margin) / 2;
      const gridRowHeight = 6;
      let gridY = yPos;

      // Row 1: Inspection ID | Template
      doc.setFont(undefined, 'bold');
      doc.text('Inspection ID:', gridCol1, gridY);
      doc.setFont(undefined, 'normal');
      doc.text(inspection.inspectionCode, gridCol1 + 35, gridY);
      doc.setFont(undefined, 'bold');
      doc.text('Template:', gridCol2, gridY);
      doc.setFont(undefined, 'normal');
      doc.text(inspection.templateName, gridCol2 + 25, gridY);
      gridY += gridRowHeight;

      // Row 2: Type | Asset
      doc.setFont(undefined, 'bold');
      doc.text('Type:', gridCol1, gridY);
      doc.setFont(undefined, 'normal');
      doc.text(getTypeLabel(inspection.inspectionType), gridCol1 + 20, gridY);
      doc.setFont(undefined, 'bold');
      doc.text('Asset:', gridCol2, gridY);
      doc.setFont(undefined, 'normal');
      doc.text(inspection.assetId || '—', gridCol2 + 20, gridY);
      gridY += gridRowHeight;

      // Row 3: Site | Location
      doc.setFont(undefined, 'bold');
      doc.text('Site:', gridCol1, gridY);
      doc.setFont(undefined, 'normal');
      doc.text(inspection.siteName || '—', gridCol1 + 20, gridY);
      doc.setFont(undefined, 'bold');
      doc.text('Location:', gridCol2, gridY);
      doc.setFont(undefined, 'normal');
      doc.text(inspection.locationName || '—', gridCol2 + 30, gridY);
      gridY += gridRowHeight;

      // Row 4: Scheduled Date | Completed Date
      doc.setFont(undefined, 'bold');
      doc.text('Scheduled Date:', gridCol1, gridY);
      doc.setFont(undefined, 'normal');
      doc.text(formatDateUK(inspection.inspectionDate), gridCol1 + 45, gridY);
      doc.setFont(undefined, 'bold');
      doc.text('Completed Date:', gridCol2, gridY);
      doc.setFont(undefined, 'normal');
      doc.text(inspection.completedAt ? formatDateUK(inspection.completedAt) : '—', gridCol2 + 45, gridY);
      gridY += gridRowHeight;

      // Row 5: Result | Status
      doc.setFont(undefined, 'bold');
      doc.text('Result:', gridCol1, gridY);
      doc.setFont(undefined, 'normal');
      doc.text(inspection.result || '—', gridCol1 + 25, gridY);
      doc.setFont(undefined, 'bold');
      doc.text('Status:', gridCol2, gridY);
      doc.setFont(undefined, 'normal');
      doc.text(inspection.status || '—', gridCol2 + 25, gridY);
      gridY += gridRowHeight;

      // Row 6: Inspector
      doc.setFont(undefined, 'bold');
      doc.text('Inspector:', gridCol1, gridY);
      doc.setFont(undefined, 'normal');
      doc.text(inspection.inspectorName || '—', gridCol1 + 30, gridY);

      yPos = gridY + 10;

      // Checklist Items Table
      if (inspection.items && inspection.items.length > 0) {
        const tableData = inspection.items.map((item) => {
          const answer = inspection.answers?.find(a => a.checklistItemId === item.id);
          const result = answer?.result || 'N/A';
          const comment = answer?.comment || '';
          const value = answer?.numericValue !== undefined 
            ? `${answer.numericValue}${answer.unit || ''}`
            : answer?.textValue || '';
          
          return [
            item.question,
            result,
            value,
            comment,
          ];
        });

        autoTable(doc, {
          head: [['Question', 'Result', 'Value', 'Comment']],
          body: tableData,
          startY: yPos,
          margin: { left: margin, right: margin, bottom: 20 },
          styles: { fontSize: 9 },
          headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
          didDrawPage: (data: any) => {
            // Add page numbers on each page
            const pageNum = doc.getCurrentPageInfo().pageNumber;
            const totalPages = (doc as any).internal.pages.length;
            addPageNumber(pageNum, totalPages);
          },
        });
        
        yPos = (doc as any).lastAutoTable.finalY + 10;
      }

      // Defects Summary
      if (inspection.linkedDefectIds && inspection.linkedDefectIds.length > 0) {
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Defects Summary', margin, yPos);
        yPos += 7;
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`${inspection.linkedDefectIds.length} defect(s) linked to this inspection`, margin, yPos);
        yPos += 10;
      }

      // Signatures
      if (inspection.signatures && inspection.signatures.length > 0) {
        // Check if we need a new page
        if (yPos + 30 > pageHeight - margin - 20) {
          doc.addPage();
          yPos = margin;
        }

        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Signatures', margin, yPos);
        yPos += 10;
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        
        inspection.signatures.forEach((sig) => {
          if (yPos + 30 > pageHeight - margin - 20) {
            doc.addPage();
            yPos = margin;
          }
          doc.text(`${sig.role === 'inspector' ? 'Inspector' : 'Supervisor'}: ${sig.signedByName}`, margin, yPos);
          yPos += 5;
          doc.text(`Signed: ${formatDateUK(sig.signedAt)}`, margin, yPos);
          yPos += 5;
          
          // Try to render signature image if it's base64
          if (sig.signature && sig.method === 'drawn' && sig.signature.startsWith('data:image')) {
            try {
              const imgWidth = 60;
              const imgHeight = 20;
              if (yPos + imgHeight > pageHeight - margin - 20) {
                doc.addPage();
                yPos = margin;
              }
              doc.addImage(sig.signature, 'PNG', margin, yPos, imgWidth, imgHeight);
              yPos += imgHeight + 5;
            } catch (e) {
              doc.text('Signature: [Image - Error loading]', margin, yPos);
              yPos += 5;
            }
          } else if (sig.signature) {
            doc.text(`Signature: ${sig.signature}`, margin, yPos);
            yPos += 5;
          }
          
          yPos += 5;
        });
      } else {
        if (yPos + 20 > pageHeight - margin - 20) {
          doc.addPage();
          yPos = margin;
        }
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Signatures', margin, yPos);
        yPos += 7;
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text('Signature: —', margin, yPos);
      }

      // Add page numbers to all pages
      const totalPages = (doc as any).internal.pages.length;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        addPageNumber(i, totalPages);
      }

      // Generate filename
      const dateStr = formatDateUK(inspection.completedAt || inspection.inspectionDate).replace(/\//g, '-');
      const filename = `Inspection_${inspection.inspectionCode}_${inspection.assetId || 'NONE'}_${dateStr}.pdf`;
      
      // Save PDF
      doc.save(filename);
      showToast('PDF downloaded successfully', 'success');
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      showToast(`Failed to generate PDF: ${error.message}`, 'error');
    }
  };

  // Bulk Actions Handlers
  const handleBulkPause = () => {
    if (selectedInspectionIds.length === 0) return;
    
    const selectedInspections = allInspections.filter(ins => selectedInspectionIds.includes(ins.id));
    const canPause = selectedInspections.filter(ins => !ins.isPaused && ins.status !== 'Closed' && ins.status !== 'Approved');
    
    if (canPause.length === 0) {
      showToast('No inspections can be paused (already paused, closed, or approved)', 'warning');
      return;
    }
    
    // Update inspections to paused
    canPause.forEach(ins => {
      ins.isPaused = true;
      ins.pausedAt = new Date().toISOString();
      ins.pausedBy = user?.id;
    });
    
    showToast(`Paused ${canPause.length} inspection(s)`, 'success');
    tableSelection.clearSelection();
    loadInspections();
  };

  const handleBulkResume = () => {
    if (selectedInspectionIds.length === 0) return;
    
    const selectedInspections = allInspections.filter(ins => selectedInspectionIds.includes(ins.id));
    const canResume = selectedInspections.filter(ins => ins.isPaused);
    
    if (canResume.length === 0) {
      showToast('No paused inspections selected', 'warning');
      return;
    }
    
    // Update inspections to resume
    canResume.forEach(ins => {
      ins.isPaused = false;
      ins.pausedAt = undefined;
      ins.pausedBy = undefined;
    });
    
    showToast(`Resumed ${canResume.length} inspection(s)`, 'success');
    tableSelection.clearSelection();
    loadInspections();
  };

  const handleBulkAdjustDates = () => {
    if (selectedInspectionIds.length === 0) return;
    
    const daysToAdd = prompt('Enter number of days to add to due dates (negative to subtract):');
    if (daysToAdd === null) return;
    
    const days = parseInt(daysToAdd, 10);
    if (isNaN(days)) {
      showToast('Invalid number of days', 'error');
      return;
    }
    
    const selectedInspections = allInspections.filter(ins => selectedInspectionIds.includes(ins.id));
    const canAdjust = selectedInspections.filter(ins => ins.dueDate && ins.status !== 'Closed' && ins.status !== 'Approved');
    
    if (canAdjust.length === 0) {
      showToast('No inspections can have dates adjusted', 'warning');
      return;
    }
    
    // Adjust due dates
    canAdjust.forEach(ins => {
      if (ins.dueDate) {
        const currentDate = new Date(ins.dueDate);
        currentDate.setDate(currentDate.getDate() + days);
        ins.dueDate = currentDate.toISOString();
      }
    });
    
    showToast(`Adjusted due dates for ${canAdjust.length} inspection(s)`, 'success');
    tableSelection.clearSelection();
    loadInspections();
  };

  // Export handlers
  const tableColumns = useMemo(() => [
    {
      key: 'inspectionCode',
      label: 'Inspection ID',
      sortable: true,
      render: (_: any, row: Inspection) => row.inspectionCode,
    },
    {
      key: 'result',
      label: 'Result',
      sortable: true,
      render: (_: any, row: Inspection) => {
        const badge = getResultBadge(row.result);
        if (typeof badge === 'string') return badge;
        return row.result || '—';
      },
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (_: any, row: Inspection) => {
        const badge = getStatusBadge(row);
        if (typeof badge === 'string') return badge;
        return row.status || '—';
      },
    },
    {
      key: 'templateName',
      label: 'Template / Type',
      sortable: true,
      render: (_: any, row: Inspection) => `${row.templateName} (${getTypeLabel(row.inspectionType)})`,
    },
    {
      key: 'assetId',
      label: 'Asset',
      sortable: true,
      render: (_: any, row: Inspection) => row.assetId || '—',
    },
    {
      key: 'siteName',
      label: 'Site / Location',
      sortable: true,
      render: (_: any, row: Inspection) => row.locationName ? `${row.siteName} / ${row.locationName}` : (row.siteName || '—'),
    },
    {
      key: 'inspectorName',
      label: 'Assigned To',
      sortable: true,
      render: (_: any, row: Inspection) => row.inspectorName || '—',
    },
    {
      key: 'inspectionDate',
      label: 'Scheduled Date',
      sortable: true,
      render: (_: any, row: Inspection) => formatDateUK(row.inspectionDate),
    },
    {
      key: 'completedAt',
      label: 'Completed Date',
      sortable: true,
      render: (_: any, row: Inspection) => row.completedAt ? formatDateUK(row.completedAt) : '—',
    },
    {
      key: 'defectsCount',
      label: 'Defects',
      sortable: true,
      render: (_: any, row: Inspection) => row.linkedDefectIds?.length || 0,
    },
  ], []);

  const handleExportExcel = () => {
    const dataToExport = tableSelection.selectedCount > 0
      ? tableSelection.getSelectedRows()
      : filteredInspections;
    
    if (dataToExport.length === 0) {
      showToast('No data to export', 'error');
      return;
    }

    const date = new Date().toISOString().split('T')[0];
    const count = dataToExport.length;
    const filename = `Inspections_${date}_${count}`;
    
    exportTableToExcel(dataToExport, tableColumns, filename, 'Inspections');
    showToast(`Exported ${count} inspection${count !== 1 ? 's' : ''} to Excel`, 'success');
  };

  const handleExportPDF = () => {
    const dataToExport = tableSelection.selectedCount > 0
      ? tableSelection.getSelectedRows()
      : filteredInspections;
    
    if (dataToExport.length === 0) {
      showToast('No data to export', 'error');
      return;
    }

    const date = new Date().toISOString().split('T')[0];
    const count = dataToExport.length;
    const filename = `Inspections_${date}_${count}`;
    const title = `Inspections Export - ${date} (${count} ${count !== 1 ? 'items' : 'item'})`;
    
    exportTableToPDF(dataToExport, tableColumns, filename, title);
  };

  const handleSeedDemoSessions = () => {
    const inProgressInspections = allInspections.filter(ins => ins.status === 'InProgress');
    let seeded = 0;
    inProgressInspections.forEach(inspection => {
      const storageKey = `inspection-session-${inspection.id}`;
      if (inspection.answers && inspection.answers.length > 0) {
        const session = {
          inspectionId: inspection.id,
          templateId: inspection.templateId,
          answers: inspection.answers,
          startedAt: inspection.startedAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem(storageKey, JSON.stringify(session));
        seeded++;
      }
    });
    showToast(`Seeded ${seeded} demo session(s)`, 'success');
    console.log('[Testing] Seeded demo sessions:', seeded);
  };

  return (
    <div className="p-6 space-y-4">
      {/* Testing Controls Panel */}
      {testModeEnabled && (
        <CollapsibleCard
          title="Testing Controls"
          defaultExpanded={false}
        >
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-2">
            Debug tools for testing Start/Continue workflows
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Inspection (Draft/InProgress)
              </label>
              <Select
                value={selectedTestInspection}
                onChange={(e) => setSelectedTestInspection(e.target.value)}
                options={[
                  { value: '', label: '-- Select --' },
                  ...(testableInspections ?? []).map(ins => ({
                    value: ins.id,
                    label: `${ins.inspectionCode} - ${ins.templateName} (${ins.status})`
                  }))
                ]}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Button
                size="sm"
                variant="primary"
                onClick={handleForceStart}
                disabled={!selectedTestInspection}
              >
                Force Start Selected
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleForceContinue}
                disabled={!selectedTestInspection}
              >
                Force Continue Selected
              </Button>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleClearAllSessions}
              >
                Clear All Inspection Sessions
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleSeedDemoSessions}
              >
                Seed Demo Sessions
              </Button>
            </div>
          </div>
        </div>
      </CollapsibleCard>
      )}

      {/* Command Bar */}
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

      {/* Summary Cards */}
      <WildcardGrid>
        <StatCard
          title="Total"
          value={summary.total}
          icon={ClipboardCheck}
          accentColor="blue"
          onClick={() => setWildcardFilter('ALL')}
          className={wildcardFilter === 'ALL' ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
        />
        <StatCard
          title="Completed This Week"
          value={summary.completedThisWeek}
          icon={CheckCircle}
          accentColor="green"
          onClick={() => setWildcardFilter(wildcardFilter === 'COMPLETED_WEEK' ? 'ALL' : 'COMPLETED_WEEK')}
          className={wildcardFilter === 'COMPLETED_WEEK' ? 'ring-2 ring-green-500 bg-green-50' : ''}
        />
        <StatCard
          title="Overdue"
          value={summary.overdue}
          icon={AlertCircle}
          accentColor="red"
          onClick={() => setWildcardFilter(wildcardFilter === 'OVERDUE' ? 'ALL' : 'OVERDUE')}
          className={wildcardFilter === 'OVERDUE' ? 'ring-2 ring-red-500 bg-red-50' : ''}
        />
        <StatCard
          title="Failed"
          value={summary.failed}
          icon={XCircle}
          accentColor="red"
          onClick={() => setWildcardFilter(wildcardFilter === 'FAILED' ? 'ALL' : 'FAILED')}
          className={wildcardFilter === 'FAILED' ? 'ring-2 ring-red-500 bg-red-50' : ''}
        />
        <StatCard
          title="Open Defects"
          value={summary.openDefectsFromInspections}
          icon={AlertTriangle}
          accentColor="amber"
          onClick={() => setWildcardFilter(wildcardFilter === 'OPEN_DEFECTS' ? 'ALL' : 'OPEN_DEFECTS')}
          className={wildcardFilter === 'OPEN_DEFECTS' ? 'ring-2 ring-amber-500 bg-amber-50' : ''}
        />
        <StatCard
          title="Compliance"
          value={summary.complianceInspections}
          icon={Shield}
          accentColor="green"
          onClick={() => setWildcardFilter(wildcardFilter === 'COMPLIANCE' ? 'ALL' : 'COMPLIANCE')}
          className={wildcardFilter === 'COMPLIANCE' ? 'ring-2 ring-green-500 bg-green-50' : ''}
        />
      </WildcardGrid>

      {/* Bulk Actions Bar - moved to ListPageTable component */}

      <div className="space-y-6">
          {/* Inspections Table */}
          {loading ? (
            <Card>
              <div className="p-6 text-center py-8 text-gray-500">Loading inspections...</div>
            </Card>
          ) : (
            <ListPageTable
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search by inspection ID, template, asset, inspector…"
              onFilterClick={() => setIsFilterOpen(!isFilterOpen)}
              activeFilterCount={activeFilterCount}
              bulkActionsBar={
                selectedInspectionIds.length > 0 ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-900 whitespace-nowrap">
                        Selected: {selectedInspectionIds.length}
                      </span>
                      <div className="relative" ref={bulkMenuRef}>
                        <Button
                          size="sm"
                          onClick={() => setIsBulkMenuOpen(!isBulkMenuOpen)}
                        >
                          Bulk Actions
                        </Button>
                        <DropdownMenu
                          isOpen={isBulkMenuOpen}
                          onClose={() => setIsBulkMenuOpen(false)}
                          anchorRef={bulkMenuRef}
                          width="w-fit"
                          align="left"
                          items={[
                            {
                              label: 'Pause Inspections',
                              icon: Pause,
                              onClick: () => {
                                handleBulkPause();
                                setIsBulkMenuOpen(false);
                              },
                            },
                            {
                              label: 'Resume Inspections',
                              icon: PlayCircle,
                              onClick: () => {
                                handleBulkResume();
                                setIsBulkMenuOpen(false);
                              },
                            },
                            {
                              label: 'Adjust Due Dates',
                              icon: Calendar,
                              onClick: () => {
                                handleBulkAdjustDates();
                                setIsBulkMenuOpen(false);
                              },
                            },
                          ]}
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => tableSelection.clearSelection()}
                      className="p-1 rounded hover:bg-blue-100 text-gray-600 flex-shrink-0"
                      title="Clear selection"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : undefined
              }
              columns={[
                    {
                      key: 'inspectionCode',
                      label: 'Inspection ID',
                      sortable: true,
                      render: (_: any, row: Inspection) => (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/inspections/${row.id}/checklist`);
                          }}
                          className="font-mono font-medium text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          {row.inspectionCode}
                        </button>
                      ),
                    },
                    {
                      key: 'result',
                      label: 'Result',
                      sortable: true,
                      render: (_: any, row: Inspection) => getResultBadge(row.result),
                    },
                    {
                      key: 'status',
                      label: 'Status',
                      sortable: true,
                      render: (_: any, row: Inspection) => getStatusBadge(row),
                    },
                    {
                      key: 'templateName',
                      label: 'Template / Type',
                      sortable: true,
                      render: (_: any, row: Inspection) => (
                        <div>
                          <div className="font-medium">{row.templateName}</div>
                          <div className="text-xs text-gray-500">{getTypeLabel(row.inspectionType)}</div>
                        </div>
                      ),
                    },
                    {
                      key: 'assetId',
                      label: 'Asset',
                      sortable: true,
                      render: (_: any, row: Inspection) => (
                        row.assetId ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/assets/${row.assetId}`);
                            }}
                            className="text-blue-600 hover:text-blue-700 hover:underline font-mono text-sm"
                          >
                            {row.assetId}
                          </button>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )
                      ),
                    },
                    {
                      key: 'siteName',
                      label: 'Site / Location',
                      sortable: true,
                      render: (_: any, row: Inspection) => (
                        <div className="text-center">
                          <div className="text-sm">{row.siteName || '—'}</div>
                          {row.locationName && (
                            <div className="text-xs text-gray-500">{row.locationName}</div>
                          )}
                        </div>
                      ),
                    },
                    {
                      key: 'inspectorName',
                      label: 'Assigned To',
                      sortable: true,
                      render: (_: any, row: Inspection) => <span>{row.inspectorName}</span>,
                    },
                    {
                      key: 'inspectionDate',
                      label: 'Scheduled Date',
                      sortable: true,
                      render: (_: any, row: Inspection) => (
                        <div>
                          <div className="text-sm">{formatDateUK(row.inspectionDate)}</div>
                          {row.dueDate && new Date(row.dueDate) < new Date() && row.status !== 'Closed' && !row.isPaused && (
                            <div className="text-xs text-red-600">Overdue</div>
                          )}
                        </div>
                      ),
                    },
                    {
                      key: 'completedAt',
                      label: 'Completed Date',
                      sortable: true,
                      render: (_: any, row: Inspection) => (
                        row.completedAt ? (
                          <div className="text-sm">{formatDateUK(row.completedAt)}</div>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )
                      ),
                    },
                    {
                      key: 'actions',
                      label: 'Actions',
                      sortable: false,
                      render: (_: any, row: Inspection) => {
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
                              navigate(`/inspections/${row.id}/checklist`);
                            },
                          },
                        ];
                        
                        if (row.status === 'Draft') {
                          menuItems.push({
                            label: 'Start',
                            icon: Play,
                            onClick: () => {
                              handleStartInspection(row.id, row.inspectionCode);
                            },
                          });
                        }
                        
                        if (row.status === 'InProgress') {
                          menuItems.push({
                            label: 'Continue',
                            icon: Play,
                            onClick: () => {
                              handleContinueInspection(row.id, row.inspectionCode);
                            },
                          });
                        }
                        
                        // PDF download available for all, but preferred for Closed
                        menuItems.push({
                          label: row.status === 'Closed' ? 'Download PDF' : 'Download PDF (Draft)',
                          icon: Download,
                          onClick: () => {
                            handleDownloadPDF(row);
                          },
                        });
                        
                        return (
                          <div className="relative">
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
                    {
                      key: 'defectsCount',
                      label: 'Defects',
                      sortable: true,
                      render: (_: any, row: Inspection) => (
                        row.linkedDefectIds.length > 0 ? (
                          <Badge variant="info" size="sm">{row.linkedDefectIds.length}</Badge>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )
                      ),
                    },
                  ]}
                  data={filteredInspections.map(ins => ({
                    ...ins,
                    defectsCount: ins.linkedDefectIds.length, // Add numeric field for sorting
                  }))}
                onRowClick={(row) => navigate(`/inspections/${row.id}/checklist`)}
                getRowId={(row) => row.id}
                selectable={true}
                selectedIds={selectedInspectionIds}
                onSelectionChange={tableSelection.setSelectedIds}
                showingText={`Showing ${filteredInspections.length} inspection${filteredInspections.length !== 1 ? 's' : ''}`}
                headerActions={
                  <div className="flex items-center gap-2">
                    <ExportButton
                      onExportExcel={handleExportExcel}
                      onExportPDF={handleExportPDF}
                      selectedCount={tableSelection.selectedCount}
                      totalCount={filteredInspections.length}
                      tableName="Inspections"
                    />
                    {canCreate && (
                      <>
                        {(['Manager', 'Admin'].includes(user?.role || '')) && (
                          <Button variant="outline" onClick={() => navigate('/inspections/create')} size="sm" title="Create a new inspection template">
                            Create Inspection
                          </Button>
                        )}
                        <Button onClick={() => navigate('/inspections/start')} variant="primary" size="sm" title="Start an inspection from an existing template">
                          Start Inspection
                        </Button>
                      </>
                    )}
                  </div>
                }
                emptyMessage={
                  allInspections.length === 0 
                    ? "No inspections yet. Get started by creating your first inspection or template."
                    : "No inspections found matching your criteria"
                }
              />
          )}
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
          const emptyFilters: InspectionFilter = {};
          setTempFilters(emptyFilters);
          setFilters(emptyFilters);
          setExpandedFilterSection(null);
          setDefectsFilter(null);
          localStorage.removeItem('inspections-filters');
        }}
        title="Inspection Filters"
      >
        <div className="space-y-1">
          {/* Site */}
          <FilterSection 
            title="Site"
            isExpanded={expandedFilterSection === 'site'}
            onToggle={() => setExpandedFilterSection(expandedFilterSection === 'site' ? null : 'site')}
          >
            <MultiSelectFilter
              options={(mockSites ?? []).map((site) => ({ value: site.id, label: site.name }))}
              selected={Array.isArray(tempFilters.siteId) ? tempFilters.siteId : tempFilters.siteId ? [tempFilters.siteId] : []}
              onChange={(selected) => setTempFilters(prev => ({ ...prev, siteId: selected.length === 1 ? selected[0] : selected }))}
              placeholder="Search sites..."
              searchable={true}
            />
          </FilterSection>
          
          {/* Inspection Type */}
          <FilterSection 
            title="Inspection Type"
            isExpanded={expandedFilterSection === 'inspectionType'}
            onToggle={() => setExpandedFilterSection(expandedFilterSection === 'inspectionType' ? null : 'inspectionType')}
          >
            <FilterOptionList
              options={[
                { value: 'PlantAcceptance', label: 'Plant Acceptance' },
                { value: 'Daily', label: 'Daily' },
                { value: 'Weekly', label: 'Weekly' },
                { value: 'Monthly', label: 'Monthly' },
                { value: 'PreUse', label: 'Pre-Use' },
                { value: 'TimeBased', label: 'Time-Based' },
              ]}
              selected={Array.isArray(tempFilters.inspectionType) ? tempFilters.inspectionType : tempFilters.inspectionType ? [tempFilters.inspectionType] : []}
              onChange={(selected) => setTempFilters(prev => ({ ...prev, inspectionType: selected.length === 1 ? selected[0] : selected }))}
            />
          </FilterSection>
          
          {/* Status - Reference Pattern */}
          <FilterSection 
            title="Status"
            isExpanded={expandedFilterSection === 'status'}
            onToggle={() => setExpandedFilterSection(expandedFilterSection === 'status' ? null : 'status')}
          >
            <FilterOptionList
              options={[
                { value: 'Draft', label: 'Draft' },
                { value: 'InProgress', label: 'In Progress' },
                { value: 'Submitted', label: 'Submitted' },
                { value: 'Approved', label: 'Approved' },
                { value: 'Closed', label: 'Closed' },
              ]}
              selected={tempFilters.status ? [tempFilters.status] : []}
              onChange={(selected) => setTempFilters(prev => ({ ...prev, status: selected.length === 1 ? selected[0] : selected.length > 0 ? selected[0] : undefined }))}
              twoColumn={true}
            />
          </FilterSection>
          
          {/* Result */}
          <FilterSection 
            title="Result"
            isExpanded={expandedFilterSection === 'result'}
            onToggle={() => setExpandedFilterSection(expandedFilterSection === 'result' ? null : 'result')}
          >
            <FilterOptionList
              options={[
                { value: 'Pass', label: 'Pass' },
                { value: 'Fail', label: 'Fail' },
                { value: 'Pending', label: 'Pending' },
              ]}
              selected={tempFilters.result ? [tempFilters.result] : []}
              onChange={(selected) => setTempFilters(prev => ({ ...prev, result: selected.length === 1 ? selected[0] : selected.length > 0 ? selected[0] : undefined }))}
              twoColumn={true}
            />
          </FilterSection>
          
          {/* Safety & Statutory */}
          <FilterSection 
            title="Safety & Statutory"
            isExpanded={expandedFilterSection === 'safety'}
            onToggle={() => setExpandedFilterSection(expandedFilterSection === 'safety' ? null : 'safety')}
          >
            <FilterOptionList
              options={[
                { value: 'safety-critical', label: 'Safety-Critical' },
                { value: 'statutory', label: 'Statutory' },
              ]}
              selected={[]}
              onChange={() => {
                // Filter inspections with safety-critical items or compliance tags
                // This would need to check inspection.items for safetyCritical flag or complianceTag
              }}
              twoColumn={true}
            />
          </FilterSection>
          
          {/* Asset */}
          <FilterSection 
            title="Asset"
            isExpanded={expandedFilterSection === 'asset'}
            onToggle={() => setExpandedFilterSection(expandedFilterSection === 'asset' ? null : 'asset')}
          >
            <MultiSelectFilter
              options={Array.from(new Set(allInspections.map(i => i.assetId).filter(Boolean))).map(assetId => ({
                value: assetId,
                label: assetId,
              }))}
              selected={Array.isArray(tempFilters.assetId) ? tempFilters.assetId : tempFilters.assetId ? [tempFilters.assetId] : []}
              onChange={(selected) => setTempFilters(prev => ({ ...prev, assetId: selected.length === 1 ? selected[0] : selected }))}
              placeholder="Search assets..."
              searchable={true}
            />
          </FilterSection>
          
          {/* Assigned To */}
          <FilterSection 
            title="Assigned To"
            isExpanded={expandedFilterSection === 'assignedTo'}
            onToggle={() => setExpandedFilterSection(expandedFilterSection === 'assignedTo' ? null : 'assignedTo')}
          >
            <MultiSelectFilter
              options={Array.from(new Set(allInspections.map(i => i.inspectorName).filter(Boolean))).map(name => {
                const inspector = allInspections.find(i => i.inspectorName === name);
                return {
                  value: inspector?.inspectorId || '',
                  label: name,
                };
              }).filter(opt => opt.value)}
              selected={Array.isArray(tempFilters.inspectorId) ? tempFilters.inspectorId : tempFilters.inspectorId ? [tempFilters.inspectorId] : []}
              onChange={(selected) => setTempFilters(prev => ({ ...prev, inspectorId: selected.length === 1 ? selected[0] : selected }))}
              placeholder="Search inspectors..."
              searchable={true}
            />
          </FilterSection>
          
          {/* Date */}
          <FilterSection 
            title="Date"
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
          
          {/* Defects */}
          <FilterSection 
            title="Defects"
            isExpanded={expandedFilterSection === 'defects'}
            onToggle={() => setExpandedFilterSection(expandedFilterSection === 'defects' ? null : 'defects')}
          >
            <FilterOptionList
              options={[
                { value: 'with', label: 'With Defects' },
                { value: 'without', label: 'Without Defects' },
              ]}
              selected={defectsFilter ? [defectsFilter] : []}
              onChange={(selected) => setDefectsFilter(selected.length > 0 ? selected[0] as 'with' | 'without' : null)}
              twoColumn={true}
            />
          </FilterSection>
        </div>
      </FilterPanel>
      
    </div>
  );
}
