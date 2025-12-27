import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, AlertTriangle, Shield, FileText } from 'lucide-react';
import { Card } from '../../../components/common/Card';
import { Input } from '../../../components/common/Input';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { Checkbox } from '../../../components/common/Checkbox';
import { SortableTable } from '../../../components/common/SortableTable';
import { FilterPanel } from '../../../components/common/FilterPanel';
import { FilterSection } from '../../../components/common/FilterSection';
import { MultiSelectFilter } from '../../../components/common/MultiSelectFilter';
import { FilterButton } from '../../../components/common/FilterButton';
import { FilterOptionList } from '../../../components/common/FilterOptionList';
import { PMCalendar } from '../components/PMCalendar';
import { CreatePMScheduleModal } from '../components/CreatePMScheduleModal';
import { getPMSchedules, getPMScheduleStatus, type PMScheduleFilter } from '../services';
import { mockSites } from '../../assets/services';
import { showToast } from '../../../components/common/Toast';
import type { ComplianceRAG } from '../../assets/types';
import type { ScheduleType } from '@ppm/shared';
import type { PMSchedule, Frequency, ImportanceLevel } from '../types';

export function PMSchedulesListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<PMScheduleFilter>(() => {
    const saved = localStorage.getItem('pm-schedules-filters');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {};
      }
    }
    return {};
  });
  const [tempFilters, setTempFilters] = useState<PMScheduleFilter>({});
  const [expandedFilterSection, setExpandedFilterSection] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Sync tempFilters when filter panel opens
  useEffect(() => {
    if (isFilterOpen) {
      setTempFilters(filters);
    }
  }, [isFilterOpen, filters]);

  // Persist filters to localStorage
  useEffect(() => {
    localStorage.setItem('pm-schedules-filters', JSON.stringify(filters));
  }, [filters]);

  // Get all schedules (for counting hidden ones)
  const allPMSchedules = useMemo(() => {
    return getPMSchedules({
      search: search || undefined,
    });
  }, [search]);

  const pmSchedules = useMemo(() => {
    return getPMSchedules({
      ...filters,
      search: search || undefined,
    });
  }, [search, filters]);

  // Count hidden PMs
  const hiddenCount = allPMSchedules.length - pmSchedules.length;

  const handleFilterChange = (groupId: string, value: string | string[] | undefined) => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      if (!value || (Array.isArray(value) && value.length === 0) || value === '') {
        delete newFilters[groupId as keyof PMScheduleFilter];
      } else {
        newFilters[groupId as keyof PMScheduleFilter] = value as any;
      }
      return newFilters;
    });
  };

  const handleMultiSelectChange = (groupId: string, selected: string[]) => {
    handleFilterChange(groupId, selected.length > 0 ? selected : undefined);
  };

  const clearFilters = () => {
    setSearch('');
    setFilters({});
  };

  const getRAGBadge = (rag: ComplianceRAG) => {
    const variants = {
      Red: 'error' as const,
      Amber: 'warning' as const,
      Green: 'success' as const,
    };
    return <Badge variant={variants[rag]}>{rag}</Badge>;
  };

  const getStatusBadge = (schedule: PMSchedule) => {
    const status = getPMScheduleStatus(schedule);
    
    if (status === 'completed') {
      return (
        <Badge variant="success" className="flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Completed
        </Badge>
      );
    } else if (status === 'overdue') {
      return <Badge variant="error">Overdue</Badge>;
    } else if (status === 'due') {
      return <Badge variant="warning">Due Today</Badge>;
    } else {
      return <Badge variant="default">Upcoming</Badge>;
    }
  };

  const getFrequencyDisplay = (schedule: typeof pmSchedules[0]) => {
    if (schedule.frequency) {
      return schedule.frequency;
    }
    if (schedule.scheduleType === 'TimeBased' && schedule.intervalDays) {
      if (schedule.intervalDays === 1) return 'Daily';
      if (schedule.intervalDays === 7) return 'Weekly';
      if (schedule.intervalDays === 30) return 'Monthly';
      if (schedule.intervalDays === 90) return 'Quarterly';
      if (schedule.intervalDays === 180) return '6-Monthly';
      if (schedule.intervalDays === 365) return 'Annual';
      return `Every ${schedule.intervalDays} days`;
    }
    if (schedule.scheduleType === 'HoursBased' && schedule.intervalHours) {
      return `Every ${schedule.intervalHours} hours`;
    }
    return schedule.scheduleType;
  };

  // Helper to convert filter value to array (moved before usage to avoid temporal dead zone)
  function getSelectedArray(value: string | string[] | undefined): string[] {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }

  // Quick filter actions
  const handleHideWeekly = (e: React.ChangeEvent<HTMLInputElement>) => {
    const allFrequencies: Frequency[] = ['Daily', 'Weekly', 'Monthly', 'Quarterly', '6-Monthly', 'Annual'];
    const currentFreq = getSelectedArray(filters.frequencyCategory) as Frequency[];
    const isHidingWeekly = currentFreq.length > 0 && !currentFreq.includes('Weekly') && currentFreq.length < allFrequencies.length;
    
    if (e.target.checked) {
      // Hide weekly - show all except weekly
      const withoutWeekly = allFrequencies.filter(f => f !== 'Weekly');
      handleFilterChange('frequencyCategory', withoutWeekly);
    } else {
      // Show all (clear filter)
      handleFilterChange('frequencyCategory', undefined);
    }
  };
  
  const isHidingWeekly = useMemo(() => {
    const currentFreq = getSelectedArray(filters.frequencyCategory);
    const allFrequencies: Frequency[] = ['Daily', 'Weekly', 'Monthly', 'Quarterly', '6-Monthly', 'Annual'];
    return currentFreq.length > 0 && !currentFreq.includes('Weekly') && currentFreq.length < allFrequencies.length;
  }, [filters.frequencyCategory]);

  const handleShowSafetyStatutoryOnly = (e: React.ChangeEvent<HTMLInputElement>) => {
    const safetyStatutory = ['Safety Critical', 'Statutory'];
    
    if (e.target.checked) {
      // Set to Safety Critical and Statutory only
      handleFilterChange('importanceLevel', safetyStatutory);
    } else {
      // Clear the filter
      handleFilterChange('importanceLevel', undefined);
    }
  };

  // Helper to get row styling based on importance
  const getRowClassName = (schedule: PMSchedule) => {
    const isWeekly = schedule.frequency === 'Weekly' || schedule.intervalDays === 7;
    const isRoutine = schedule.importanceLevel === 'Housekeeping' || schedule.importanceLevel === 'Operational';
    
    if (isWeekly && isRoutine) {
      return 'opacity-75 hover:opacity-100';
    }
    return '';
  };

  // Table columns
  const columns = [
    {
      key: 'assetId',
      label: 'Asset',
      sortable: true,
      render: (_: any, row: PMSchedule) => (
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="info" size="sm">{row.assetTypeCode}</Badge>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/assets/${row.assetId}`);
              }}
              className="font-mono text-xs text-blue-600 hover:text-blue-700 hover:underline"
            >
              {row.assetId}
            </button>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {row.assetMake} {row.assetModel}
          </div>
        </div>
      ),
    },
    {
      key: 'name',
      label: 'PM Name',
      sortable: true,
      render: (_: any, row: PMSchedule) => (
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium">{row.name}</span>
            {/* Importance badges */}
            {row.importanceLevel === 'Safety Critical' && (
              <Badge variant="error" className="flex items-center gap-1 text-xs font-semibold">
                <AlertTriangle className="w-3 h-3" />
                SAFETY CRITICAL
              </Badge>
            )}
            {row.importanceLevel === 'Statutory' && (
              <Badge variant="warning" className="flex items-center gap-1 text-xs font-semibold">
                <Shield className="w-3 h-3" />
                STATUTORY
              </Badge>
            )}
            {/* Tags */}
            {row.tags && row.tags.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                {row.tags.map((tag) => (
                  <Badge key={tag} variant="default" size="sm" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          {row.description && (
            <div className="text-xs text-gray-500 mt-1">{row.description}</div>
          )}
        </div>
      ),
    },
    {
      key: 'scheduleType',
      label: 'Frequency',
      sortable: true,
      render: (_: any, row: PMSchedule) => getFrequencyDisplay(row),
    },
    {
      key: 'lastDoneDate',
      label: 'Last Done',
      sortable: true,
      render: (value: string) => value ? new Date(value).toLocaleDateString() : 'Never',
    },
    {
      key: 'nextDueDate',
      label: 'Next Due',
      sortable: true,
      render: (value: string) => (
        <div className="font-medium">
          {new Date(value).toLocaleDateString()}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (_: any, row: PMSchedule) => getStatusBadge(row),
    },
    {
      key: 'assignedTeam',
      label: 'Assigned Team',
      sortable: true,
      render: (value: string) => value || 'N/A',
    },
  ];

  // Get active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.siteId && (Array.isArray(filters.siteId) ? filters.siteId.length > 0 : true)) count++;
    if (filters.frequency && (Array.isArray(filters.frequency) ? filters.frequency.length > 0 : true)) count++;
    if (filters.frequencyCategory && (Array.isArray(filters.frequencyCategory) ? filters.frequencyCategory.length > 0 : true)) count++;
    if (filters.importanceLevel && (Array.isArray(filters.importanceLevel) ? filters.importanceLevel.length > 0 : true)) count++;
    if (filters.showDueSoon) count++;
    if (filters.showOverdue) count++;
    if (filters.showCompleted) count++;
    if (filters.assignedTeam && (Array.isArray(filters.assignedTeam) ? filters.assignedTeam.length > 0 : true)) count++;
    if (filters.isActive !== undefined) count++;
    if (filters.showShiftChangeovers) count++;
    if (filters.shiftType && (Array.isArray(filters.shiftType) ? filters.shiftType.length > 0 : true)) count++;
    return count;
  }, [filters]);

  const mockResponsibleTeams = [
    'Plant Team',
    'Electrical',
    'Workshop',
    'Heavy Plant',
    'Maintenance',
  ];


  return (
    <div className="p-6 space-y-6">
      {/* PM Schedules Table or Calendar */}
      {viewMode === 'list' ? (
        <Card>
          <div className="p-6">
            {/* Table Toolbar: Search + Filter */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1">
                <Input
                  placeholder="Search by asset ID, asset type, or PM name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div>
                <FilterButton
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  activeFilterCount={activeFilterCount}
                  size="sm"
                />
              </div>
            </div>

            {/* Controls Row: Toggles (left) + View Controls (right) */}
            <div className="flex items-center justify-between gap-3 mb-3 flex-wrap sm:flex-nowrap">
              {/* Left: Toggles */}
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                {/* Toggle: Hide Weekly */}
                <label className="flex items-center gap-2 px-3 py-1 h-9 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 cursor-pointer transition-colors">
                  <Checkbox
                    checked={isHidingWeekly}
                    onChange={handleHideWeekly}
                    className="w-4 h-4"
                  />
                  <span className="text-gray-700 whitespace-nowrap">Hide Weekly</span>
                </label>
                {/* Toggle: Safety & Statutory Only */}
                <label className="flex items-center gap-2 px-3 py-1 h-9 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 cursor-pointer transition-colors">
                  <Checkbox
                    checked={
                      getSelectedArray(filters.importanceLevel).length === 2 &&
                      getSelectedArray(filters.importanceLevel).includes('Safety Critical') &&
                      getSelectedArray(filters.importanceLevel).includes('Statutory')
                    }
                    onChange={handleShowSafetyStatutoryOnly}
                    className="w-4 h-4"
                  />
                  <span className="text-gray-700 whitespace-nowrap">Safety & Statutory Only</span>
                </label>
              </div>

              {/* Right: View Controls */}
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <div className="flex gap-1 border border-gray-300 rounded-lg p-1 h-9">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-1 text-sm rounded h-full flex items-center ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    List
                  </button>
                  <button
                    onClick={() => setViewMode('calendar')}
                    className={`px-3 py-1 text-sm rounded h-full flex items-center ${viewMode === 'calendar' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    Calendar
                  </button>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)} size="sm" className="h-9">
                  + New PM Schedule
                </Button>
              </div>
            </div>

            {/* Filter Chips */}
            <div className="mb-3">

              {/* Active filter chips */}
              {activeFilterCount > 0 && (
                <div className="flex flex-wrap gap-2">
                  {getSelectedArray(filters.siteId).map((siteId) => {
                    const site = mockSites.find(s => s.id === siteId);
                    return site ? (
                      <Badge key={siteId} variant="default" className="flex items-center gap-1">
                        Site: {site.name}
                        <button
                          onClick={() => {
                            const current = getSelectedArray(filters.siteId);
                            handleMultiSelectChange('siteId', current.filter(id => id !== siteId));
                          }}
                          className="ml-1 hover:text-red-600"
                        >
                          ×
                        </button>
                      </Badge>
                    ) : null;
                  })}
                  {filters.showDueSoon && (
                    <Badge variant="default" className="flex items-center gap-1">
                      Due Soon
                      <button
                        onClick={() => setFilters(prev => ({ ...prev, showDueSoon: false }))}
                        className="ml-1 hover:text-red-600"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {filters.showOverdue && (
                    <Badge variant="default" className="flex items-center gap-1">
                      Overdue
                      <button
                        onClick={() => setFilters(prev => ({ ...prev, showOverdue: false }))}
                        className="ml-1 hover:text-red-600"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {filters.showCompleted && (
                    <Badge variant="default" className="flex items-center gap-1">
                      Completed
                      <button
                        onClick={() => setFilters(prev => ({ ...prev, showCompleted: false }))}
                        className="ml-1 hover:text-red-600"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  <Button size="sm" variant="outline" onClick={clearFilters}>
                    Clear all
                  </Button>
                </div>
              )}
            </div>

            {/* Table */}
            <SortableTable
              columns={columns}
              data={pmSchedules}
              onRowClick={(row) => navigate(`/pm-schedules/${row.id}`)}
              getRowClassName={getRowClassName}
            />

            {/* Empty State */}
            {pmSchedules.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No PM schedules found matching your criteria
              </div>
            )}

            {/* Footer: Showing X PM schedules */}
            {pmSchedules.length > 0 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Showing {pmSchedules.length} PM schedule{pmSchedules.length !== 1 ? 's' : ''}
                  {hiddenCount > 0 && (
                    <span className="ml-2 text-xs text-gray-500">
                      ({hiddenCount} hidden by filters)
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>
      ) : (
        <PMCalendar
          schedules={pmSchedules}
          filters={filters}
          onScheduleClick={(schedule) => navigate(`/pm-schedules/${schedule.id}`)}
          onFilterChange={(newFilters) => setFilters((prev) => ({ ...prev, ...newFilters }))}
          onViewChange={(view) => setViewMode(view)}
        />
      )}

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
          const emptyFilters: PMScheduleFilter = {};
          setTempFilters(emptyFilters);
          setFilters(emptyFilters);
          setExpandedFilterSection(null);
          localStorage.removeItem('pm-schedules-filters');
        }}
        title="PM Schedule Filters"
      >
        <div className="space-y-1">
          <FilterSection 
            title="Site"
            isExpanded={expandedFilterSection === 'site'}
            onToggle={() => setExpandedFilterSection(expandedFilterSection === 'site' ? null : 'site')}
          >
            <MultiSelectFilter
              options={mockSites.map((site) => ({ value: site.id, label: site.name }))}
              selected={getSelectedArray(tempFilters.siteId)}
              onChange={(selected) => setTempFilters(prev => ({ ...prev, siteId: selected.length > 0 ? selected : undefined }))}
              placeholder="Search sites..."
              searchable={true}
            />
          </FilterSection>

          <FilterSection 
            title="Frequency"
            isExpanded={expandedFilterSection === 'frequency'}
            onToggle={() => setExpandedFilterSection(expandedFilterSection === 'frequency' ? null : 'frequency')}
          >
            <FilterOptionList
              options={[
                { value: 'Daily', label: 'Daily' },
                { value: 'Weekly', label: 'Weekly' },
                { value: 'Monthly', label: 'Monthly' },
                { value: 'Quarterly', label: 'Quarterly' },
                { value: '6-Monthly', label: '6-Monthly' },
                { value: 'Annual', label: 'Annual' },
              ]}
              selected={getSelectedArray(tempFilters.frequencyCategory)}
              onChange={(selected) => setTempFilters(prev => ({ ...prev, frequencyCategory: selected.length > 0 ? selected : undefined }))}
              twoColumn={true}
            />
          </FilterSection>

          <FilterSection 
            title="Importance / Category"
            isExpanded={expandedFilterSection === 'importance'}
            onToggle={() => setExpandedFilterSection(expandedFilterSection === 'importance' ? null : 'importance')}
          >
            <FilterOptionList
              options={[
                { value: 'Safety Critical', label: 'Safety Critical' },
                { value: 'Statutory', label: 'Statutory / Compliance' },
                { value: 'Operational', label: 'Operational' },
                { value: 'Housekeeping', label: 'Housekeeping' },
              ]}
              selected={getSelectedArray(tempFilters.importanceLevel)}
              onChange={(selected) => setTempFilters(prev => ({ ...prev, importanceLevel: selected.length > 0 ? selected : undefined }))}
              twoColumn={true}
            />
          </FilterSection>

          <FilterSection 
            title="Status"
            isExpanded={expandedFilterSection === 'status'}
            onToggle={() => setExpandedFilterSection(expandedFilterSection === 'status' ? null : 'status')}
          >
            <FilterOptionList
              options={[
                { value: 'dueSoon', label: 'Due Soon' },
                { value: 'overdue', label: 'Overdue' },
                { value: 'completed', label: 'Completed' },
              ]}
              selected={[
                ...(tempFilters.showDueSoon ? ['dueSoon'] : []),
                ...(tempFilters.showOverdue ? ['overdue'] : []),
                ...(tempFilters.showCompleted ? ['completed'] : []),
              ]}
              onChange={(selected) => {
                setTempFilters(prev => ({
                  ...prev,
                  showDueSoon: selected.includes('dueSoon') ? true : undefined,
                  showOverdue: selected.includes('overdue') ? true : undefined,
                  showCompleted: selected.includes('completed') ? true : undefined,
                }));
              }}
              twoColumn={true}
            />
          </FilterSection>

          <FilterSection 
            title="Responsible Team"
            isExpanded={expandedFilterSection === 'responsibleTeam'}
            onToggle={() => setExpandedFilterSection(expandedFilterSection === 'responsibleTeam' ? null : 'responsibleTeam')}
          >
            <MultiSelectFilter
              options={mockResponsibleTeams.map((team) => ({ value: team, label: team }))}
              selected={getSelectedArray(tempFilters.assignedTeam)}
              onChange={(selected) => setTempFilters(prev => ({ ...prev, assignedTeam: selected.length > 0 ? selected : undefined }))}
              placeholder="Search teams..."
              searchable={true}
            />
          </FilterSection>

          <FilterSection 
            title="Active Status"
            isExpanded={expandedFilterSection === 'activeStatus'}
            onToggle={() => setExpandedFilterSection(expandedFilterSection === 'activeStatus' ? null : 'activeStatus')}
          >
            <FilterOptionList
              options={[
                { value: 'all', label: 'All' },
                { value: 'active', label: 'Active' },
                { value: 'paused', label: 'Paused' },
              ]}
              selected={[
                tempFilters.isActive === undefined ? 'all' : '',
                tempFilters.isActive === true ? 'active' : '',
                tempFilters.isActive === false ? 'paused' : '',
              ].filter(Boolean)}
              onChange={(selected) => {
                const value = selected[0];
                setTempFilters(prev => ({
                  ...prev,
                  isActive: value === 'all' ? undefined : value === 'active' ? true : false,
                }));
              }}
              twoColumn={true}
            />
          </FilterSection>

          <FilterSection 
            title="Shift Changeovers"
            isExpanded={expandedFilterSection === 'shiftChangeovers'}
            onToggle={() => setExpandedFilterSection(expandedFilterSection === 'shiftChangeovers' ? null : 'shiftChangeovers')}
          >
            <FilterOptionList
              options={[
                { value: 'showShiftChangeovers', label: 'Show Shift Changeovers' },
              ]}
              selected={tempFilters.showShiftChangeovers ? ['showShiftChangeovers'] : []}
              onChange={(selected) => {
                const show = selected.includes('showShiftChangeovers');
                setTempFilters(prev => ({ ...prev, showShiftChangeovers: show }));
              }}
              twoColumn={true}
            />
            {tempFilters.showShiftChangeovers && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <MultiSelectFilter
                  options={[
                    { value: 'DaysToNights', label: 'Days → Nights' },
                    { value: 'NightsToDays', label: 'Nights → Days' },
                    { value: 'AMHandover', label: 'AM Handover' },
                    { value: 'PMHandover', label: 'PM Handover' },
                  ]}
                  selected={getSelectedArray(tempFilters.shiftType)}
                  onChange={(selected) => setTempFilters(prev => ({ ...prev, shiftType: selected.length > 0 ? selected : undefined }))}
                  placeholder="Search shift types..."
                  searchable={true}
                />
              </div>
            )}
          </FilterSection>
        </div>
      </FilterPanel>


      {/* Create PM Schedule Modal */}
      <CreatePMScheduleModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(scheduleId) => {
          showToast('PM schedule created', 'success');
          // Trigger re-render
          setSearch((prev) => prev);
        }}
      />
    </div>
  );
}
