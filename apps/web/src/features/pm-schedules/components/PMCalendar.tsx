import { useState, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight, Clock, AlertTriangle, CheckCircle, RotateCcw } from 'lucide-react';
import { Card } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Modal } from '../../../components/common/Modal';
import { FloatingFilterPanel, FilterSection } from '../../../components/common/FloatingFilterPanel';
import { MultiSelectFilter } from '../../../components/common/MultiSelectFilter';
import { FilterButton } from '../../../components/common/FilterButton';
import { getShiftChangeovers, updatePMSchedule } from '../services';
import { mockSites } from '../../assets/services';
import { useAuth } from '../../../contexts/AuthContext';
import { showToast } from '../../../components/common/Toast';
import type { PMSchedule, PMScheduleFilter, ShiftChangeoverEvent } from '../types';

interface PMCalendarProps {
  schedules: PMSchedule[];
  filters?: PMScheduleFilter;
  onScheduleClick?: (schedule: PMSchedule) => void;
  onFilterChange?: (filters: Partial<PMScheduleFilter>) => void;
  onViewChange?: (view: 'list' | 'calendar') => void;
}

export function PMCalendar({ schedules, filters, onScheduleClick, onFilterChange, onViewChange }: PMCalendarProps) {
  const filterButtonRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedSchedule, setSelectedSchedule] = useState<PMSchedule | null>(null);
  const [selectedShiftChangeover, setSelectedShiftChangeover] = useState<ShiftChangeoverEvent | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isRescheduleMode, setIsRescheduleMode] = useState(false);
  const [rescheduleData, setRescheduleData] = useState({
    nextDueDate: '',
    notes: '',
    keepFrequency: true,
  });
  const [rescheduleErrors, setRescheduleErrors] = useState<{
    nextDueDate?: string;
  }>({});

  // Get week start preference from localStorage
  const weekStart = (() => {
    const saved = localStorage.getItem('calendar-week-start');
    return saved === 'monday' ? 'monday' : 'sunday';
  })();

  // Get shift changeovers based on filters
  const shiftChangeovers = useMemo(() => {
    if (!filters?.showShiftChangeovers) {
      return [];
    }
    return getShiftChangeovers({
      siteId: filters.siteId,
      shiftType: filters.shiftType,
    });
  }, [filters]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  
  // Calculate starting day of week based on preference
  // getDay() returns 0 (Sunday) to 6 (Saturday)
  let startingDayOfWeek = firstDay.getDay();
  if (weekStart === 'monday') {
    // Convert: Sunday (0) -> 6, Monday (1) -> 0, Tuesday (2) -> 1, etc.
    startingDayOfWeek = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;
  }

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Group schedules by date
  const schedulesByDate = useMemo(() => {
    const grouped: Record<string, PMSchedule[]> = {};
    schedules.forEach((schedule) => {
      const date = new Date(schedule.nextDueDate);
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(schedule);
    });
    return grouped;
  }, [schedules]);

  // Group shift changeovers by date
  const shiftChangeoversByDate = useMemo(() => {
    const grouped: Record<string, ShiftChangeoverEvent[]> = {};
    shiftChangeovers.forEach((event) => {
      const date = new Date(event.startDateTime);
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });
    return grouped;
  }, [shiftChangeovers]);

  // Get status for a schedule
  const getScheduleStatus = (schedule: PMSchedule): 'completed' | 'overdue' | 'due' | 'dueSoon' | 'upcoming' => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(schedule.nextDueDate);
    dueDate.setHours(0, 0, 0, 0);
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // If completed, always show as completed
    if (schedule.completedAt) {
      return 'completed';
    }

    // If past due date, show as overdue
    if (dueDate < today) {
      return 'overdue';
    }

    // If due today, show as due
    if (dueDate.getTime() === today.getTime()) {
      return 'due';
    }

    // If due within next 7 days, show as due soon
    if (daysUntilDue <= 7 && daysUntilDue > 0) {
      return 'dueSoon';
    }

    // Otherwise upcoming/planned
    return 'upcoming';
  };

  const getShiftTypeLabel = (shiftType: ShiftChangeoverEvent['shiftType']): string => {
    const labels = {
      DaysToNights: 'Days → Nights',
      NightsToDays: 'Nights → Days',
      AMHandover: 'AM Handover',
      PMHandover: 'PM Handover',
    };
    return labels[shiftType];
  };

  // Render calendar days
  const calendarDays = [];
  
  // Empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(
      <div key={`empty-${i}`} className="h-24 border border-gray-200 bg-gray-50" />
    );
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const daySchedules = schedulesByDate[dateKey] || [];
    const dayShiftChangeovers = shiftChangeoversByDate[dateKey] || [];
    const isToday = 
      date.getDate() === new Date().getDate() &&
      date.getMonth() === new Date().getMonth() &&
      date.getFullYear() === new Date().getFullYear();

    calendarDays.push(
      <div
        key={day}
        className={`h-24 border border-gray-200 p-1 overflow-y-auto ${
          isToday ? 'bg-blue-50 border-blue-300' : 'bg-white'
        } hover:bg-gray-50 transition-colors`}
      >
        <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
          {day}
        </div>
        <div className="space-y-1">
          {/* Shift Changeovers - show up to 2 total events (shift + PM combined) */}
          {dayShiftChangeovers.slice(0, Math.max(0, 2 - daySchedules.length)).map((changeover) => (
            <div
              key={changeover.id}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedShiftChangeover(changeover);
              }}
              className="text-xs p-1 rounded cursor-pointer truncate bg-purple-100 text-purple-800 border border-purple-200 hover:opacity-80 transition-opacity"
              title={changeover.title}
            >
              <div className="flex items-center gap-1">
                <RotateCcw className="w-3 h-3" />
                <span className="truncate">{getShiftTypeLabel(changeover.shiftType)}</span>
              </div>
            </div>
          ))}
          
          {/* PM Schedules - show remaining slots up to 2 total */}
          {daySchedules.slice(0, Math.max(0, 2 - dayShiftChangeovers.length)).map((schedule) => {
            const status = getScheduleStatus(schedule);
            const statusLabel = status === 'completed' ? 'Completed' : 
                               status === 'overdue' ? 'Overdue' : 
                               status === 'due' ? 'Due Today' : 
                               status === 'dueSoon' ? 'Due Soon' : 'Planned';
            const fullTitle = `${schedule.assetTypeCode} ${schedule.assetId} · ${schedule.siteName || 'No Site'} · ${statusLabel}`;
            return (
              <div
                key={schedule.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedSchedule(schedule);
                }}
                className={`text-xs p-1 rounded cursor-pointer ${
                  status === 'completed'
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : status === 'overdue'
                    ? 'bg-red-100 text-red-800 border border-red-200'
                    : status === 'due'
                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                    : status === 'dueSoon'
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                } hover:opacity-80 transition-opacity`}
                title={fullTitle}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1 truncate">
                    {status === 'completed' && <CheckCircle className="w-3 h-3 flex-shrink-0" />}
                    {status === 'overdue' && <AlertTriangle className="w-3 h-3 flex-shrink-0" />}
                    {status === 'due' && <Clock className="w-3 h-3 flex-shrink-0" />}
                    {status === 'dueSoon' && <Clock className="w-3 h-3 flex-shrink-0" />}
                    {status === 'upcoming' && <CheckCircle className="w-3 h-3 flex-shrink-0" />}
                    <span className="font-mono text-xs font-semibold">{schedule.assetTypeCode} {schedule.assetId}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] truncate opacity-90">
                    <span className="truncate">{schedule.siteName || 'No Site'}</span>
                    <span>·</span>
                    <span className="font-medium">{statusLabel}</span>
                  </div>
                </div>
              </div>
            );
          })}
          {daySchedules.length + dayShiftChangeovers.length > 2 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedDay(date);
              }}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              +{daySchedules.length + dayShiftChangeovers.length - 2} more
            </button>
          )}
        </div>
      </div>
    );
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getSelectedArray = (value: string | string[] | undefined): string[] => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  };

  return (
    <>
      <Card>
        <div className="p-6">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={goToPreviousMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                title="Previous month"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-5 h-5 text-gray-700" />
              </button>
              <h2 className="text-xl font-semibold text-gray-900">
                {monthNames[month]} {year}
              </h2>
              <button
                onClick={goToNextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                title="Next month"
                aria-label="Next month"
              >
                <ChevronRight className="w-5 h-5 text-gray-700" />
              </button>
            </div>
            <div className="flex items-center gap-2" ref={filterButtonRef}>
              {/* List/Calendar Toggle */}
              <div className="flex gap-1 border border-gray-300 rounded-lg p-1 h-9">
                <button
                  onClick={() => onViewChange?.('list')}
                  className="px-3 py-1 text-sm rounded h-full flex items-center text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label="Switch to List view"
                >
                  List
                </button>
                <button
                  onClick={() => onViewChange?.('calendar')}
                  className="px-3 py-1 text-sm rounded h-full flex items-center bg-blue-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label="Switch to Calendar view"
                  aria-current="page"
                >
                  Calendar
                </button>
              </div>
              <FilterButton
                size="sm"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                activeFilterCount={0}
              />
              <Button size="sm" variant="outline" onClick={goToToday}>
                Today
              </Button>
            </div>
          </div>

          {/* Day labels */}
          <div className="grid grid-cols-7 gap-0 mb-2">
            {weekStart === 'monday'
              ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                  <div key={day} className="text-center text-sm font-semibold text-gray-700 py-2">
                    {day}
                  </div>
                ))
              : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-center text-sm font-semibold text-gray-700 py-2">
                    {day}
                  </div>
                ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-0 border border-gray-200 rounded-lg overflow-hidden">
            {calendarDays}
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center gap-6 text-sm flex-wrap">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-gray-700">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-gray-700">Overdue</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-600" />
              <span className="text-gray-700">Due Today</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span className="text-gray-700">Due Soon (7 days)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-blue-600" />
              <span className="text-gray-700">Planned</span>
            </div>
            {filters?.showShiftChangeovers && (
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-purple-600" />
                <span className="text-gray-700">Shift Changeover</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Filter Panel */}
      <FloatingFilterPanel
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        anchorRef={filterButtonRef}
      >
        <div className="space-y-4">
          <FilterSection title="Site">
            <MultiSelectFilter
              options={mockSites.map((site) => ({ value: site.id, label: site.name }))}
              selected={getSelectedArray(filters?.siteId)}
              onChange={(selected) => {
                onFilterChange?.({ siteId: selected.length > 0 ? selected : undefined });
              }}
            />
          </FilterSection>

          <FilterSection title="Frequency">
            <MultiSelectFilter
              options={[
                { value: 'TimeBased', label: 'Time Based' },
                { value: 'HoursBased', label: 'Hours Based' },
              ]}
              selected={getSelectedArray(filters?.frequency)}
              onChange={(selected) => {
                onFilterChange?.({ frequency: selected.length > 0 ? selected : undefined });
              }}
            />
          </FilterSection>

          <FilterSection title="Status">
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters?.showDueSoon || false}
                  onChange={(e) => {
                    onFilterChange?.({ showDueSoon: e.target.checked ? true : undefined });
                  }}
                  className="rounded"
                />
                <span className="text-sm">Due Soon</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters?.showOverdue || false}
                  onChange={(e) => {
                    onFilterChange?.({ showOverdue: e.target.checked ? true : undefined });
                  }}
                  className="rounded"
                />
                <span className="text-sm">Overdue</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters?.showCompleted || false}
                  onChange={(e) => {
                    onFilterChange?.({ showCompleted: e.target.checked ? true : undefined });
                  }}
                  className="rounded"
                />
                <span className="text-sm">Completed</span>
              </label>
            </div>
          </FilterSection>

          <FilterSection title="Shift Changeovers">
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters?.showShiftChangeovers || false}
                  onChange={(e) => {
                    onFilterChange?.({ showShiftChangeovers: e.target.checked ? true : undefined });
                  }}
                  className="rounded"
                />
                <span className="text-sm">Show Shift Changeovers</span>
              </label>
              {filters?.showShiftChangeovers && (
                <div className="ml-6 mt-2 space-y-2">
                  <MultiSelectFilter
                    options={[
                      { value: 'DaysToNights', label: 'Days → Nights' },
                      { value: 'NightsToDays', label: 'Nights → Days' },
                      { value: 'AMHandover', label: 'AM Handover' },
                      { value: 'PMHandover', label: 'PM Handover' },
                    ]}
                    selected={getSelectedArray(filters?.shiftType)}
                    onChange={(selected) => {
                      onFilterChange?.({ shiftType: selected.length > 0 ? selected : undefined });
                    }}
                  />
                </div>
              )}
            </div>
          </FilterSection>
        </div>
      </FloatingFilterPanel>

      {/* Schedule Detail Modal */}
      <Modal
        isOpen={!!selectedSchedule}
        onClose={() => {
          setSelectedSchedule(null);
          setIsRescheduleMode(false);
          setRescheduleData({ nextDueDate: '', notes: '', keepFrequency: true });
          setRescheduleErrors({});
        }}
        title={isRescheduleMode ? "Reschedule PM" : "PM Schedule Details"}
        size="md"
      >
        {selectedSchedule && (
          <div className="space-y-4">
            {!isRescheduleMode ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PM Name</label>
                  <div className="text-gray-900 font-medium">{selectedSchedule.name}</div>
                </div>
                {selectedSchedule.description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <div className="text-gray-700">{selectedSchedule.description}</div>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Asset</label>
                  <div className="flex items-center gap-2">
                    <Badge variant="info">{selectedSchedule.assetTypeCode}</Badge>
                    <span className="font-mono text-sm">{selectedSchedule.assetId}</span>
                    <span className="text-gray-600">
                      {selectedSchedule.assetMake} {selectedSchedule.assetModel}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Site</label>
                  <div className="text-gray-900">{selectedSchedule.siteName}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Next Due Date</label>
                  <div className="text-gray-900">
                    {new Date(selectedSchedule.nextDueDate).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <Badge
                    variant={
                      getScheduleStatus(selectedSchedule) === 'completed'
                        ? 'success'
                        : getScheduleStatus(selectedSchedule) === 'overdue'
                        ? 'error'
                        : getScheduleStatus(selectedSchedule) === 'due'
                        ? 'warning'
                        : 'default'
                    }
                  >
                    {getScheduleStatus(selectedSchedule) === 'completed'
                      ? 'Completed ✓'
                      : getScheduleStatus(selectedSchedule) === 'overdue'
                      ? 'Overdue'
                      : getScheduleStatus(selectedSchedule) === 'due'
                      ? 'Due Today'
                      : 'Upcoming'}
                  </Badge>
                </div>
                {selectedSchedule.assignedTeam && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Team</label>
                    <div className="text-gray-900">{selectedSchedule.assignedTeam}</div>
                  </div>
                )}
                <div className="flex gap-2 pt-4">
                  {(['Supervisor', 'Manager', 'Admin'].includes(user?.role || '')) && (
                    <Button
                      variant="primary"
                      onClick={() => {
                        setIsRescheduleMode(true);
                        setRescheduleData({
                          nextDueDate: selectedSchedule.nextDueDate,
                          notes: '',
                          keepFrequency: true,
                        });
                      }}
                    >
                      Reschedule
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => {
                      onScheduleClick?.(selectedSchedule);
                      setSelectedSchedule(null);
                    }}
                  >
                    View Details
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedSchedule(null)}>
                    Close
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PM Name</label>
                  <div className="text-gray-900 font-medium">{selectedSchedule.name}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Next Due Date</label>
                  <div className="text-gray-900">
                    {new Date(selectedSchedule.nextDueDate).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <Input
                    label="New Next Due Date *"
                    type="date"
                    value={rescheduleData.nextDueDate}
                    onChange={(e) => {
                      setRescheduleData({ ...rescheduleData, nextDueDate: e.target.value });
                      if (rescheduleErrors.nextDueDate) {
                        setRescheduleErrors({ ...rescheduleErrors, nextDueDate: undefined });
                      }
                    }}
                    error={rescheduleErrors.nextDueDate}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reason/Notes (Optional)</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    value={rescheduleData.notes}
                    onChange={(e) => setRescheduleData({ ...rescheduleData, notes: e.target.value })}
                    placeholder="Enter reason for rescheduling..."
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="keepFrequency"
                    checked={rescheduleData.keepFrequency}
                    onChange={(e) => setRescheduleData({ ...rescheduleData, keepFrequency: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="keepFrequency" className="text-sm text-gray-700">
                    Apply and Keep Frequency
                  </label>
                </div>
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="primary"
                    onClick={() => {
                      // Validation
                      if (!rescheduleData.nextDueDate) {
                        setRescheduleErrors({ nextDueDate: 'Next due date is required' });
                        return;
                      }

                      const newDate = new Date(rescheduleData.nextDueDate);
                      const startDate = selectedSchedule.lastDoneDate 
                        ? new Date(selectedSchedule.lastDoneDate)
                        : new Date(selectedSchedule.createdAt);
                      
                      if (newDate < startDate) {
                        setRescheduleErrors({ 
                          nextDueDate: 'Next due date cannot be before start date' 
                        });
                        return;
                      }

                      // Update schedule
                      const updated: Partial<PMSchedule> = {
                        nextDueDate: rescheduleData.nextDueDate,
                      };

                      // If keeping frequency, calculate next cycle from new date
                      if (rescheduleData.keepFrequency && selectedSchedule.scheduleType === 'TimeBased' && selectedSchedule.intervalDays) {
                        // The frequency is already set, so future cycles will calculate from the new nextDueDate
                        // No additional action needed as the intervalDays remains the same
                      }

                      updatePMSchedule(selectedSchedule.id, updated);

                      // Add activity log entry
                      const activity = JSON.parse(localStorage.getItem('pm-schedule-activity') || '[]');
                      activity.push({
                        id: `act-${Date.now()}`,
                        scheduleId: selectedSchedule.id,
                        timestamp: new Date().toISOString(),
                        userId: user?.id || '',
                        userName: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email || 'Unknown',
                        action: 'rescheduled',
                        details: `Next due date changed to ${rescheduleData.nextDueDate}${rescheduleData.notes ? `. Reason: ${rescheduleData.notes}` : ''}`,
                      });
                      localStorage.setItem('pm-schedule-activity', JSON.stringify(activity));

                      showToast('PM rescheduled', 'success');
                      
                      // Reset and close
                      setIsRescheduleMode(false);
                      setRescheduleData({ nextDueDate: '', notes: '', keepFrequency: true });
                      setRescheduleErrors({});
                      setSelectedSchedule(null);
                      
                      // Refresh the page to update calendar
                      window.location.reload();
                    }}
                  >
                    Save Reschedule
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsRescheduleMode(false);
                      setRescheduleData({ nextDueDate: '', notes: '', keepFrequency: true });
                      setRescheduleErrors({});
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Shift Changeover Detail Modal */}
      <Modal
        isOpen={!!selectedShiftChangeover}
        onClose={() => setSelectedShiftChangeover(null)}
        title="Shift Changeover Details"
        size="md"
      >
        {selectedShiftChangeover && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <div className="text-gray-900 font-medium">{selectedShiftChangeover.title}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Site</label>
              <div className="text-gray-900">{selectedShiftChangeover.siteName}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shift Type</label>
              <div className="text-gray-900">{getShiftTypeLabel(selectedShiftChangeover.shiftType)}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <div className="text-gray-900">
                {new Date(selectedShiftChangeover.startDateTime).toLocaleString()}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <div className="text-gray-900">
                {new Date(selectedShiftChangeover.endDateTime).toLocaleString()}
              </div>
            </div>
            {selectedShiftChangeover.notes && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <div className="text-gray-700">{selectedShiftChangeover.notes}</div>
              </div>
            )}
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setSelectedShiftChangeover(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Day Events Modal */}
      <Modal
        isOpen={!!selectedDay}
        onClose={() => setSelectedDay(null)}
        title={`Events for ${selectedDay ? new Date(selectedDay).toLocaleDateString() : ''}`}
        size="md"
      >
        {selectedDay && (
          <div className="space-y-2">
            {(() => {
              const dateKey = `${selectedDay.getFullYear()}-${String(selectedDay.getMonth() + 1).padStart(2, '0')}-${String(selectedDay.getDate()).padStart(2, '0')}`;
              const daySchedules = schedulesByDate[dateKey] || [];
              const dayShiftChangeovers = shiftChangeoversByDate[dateKey] || [];
              
              return (
                <>
                  {dayShiftChangeovers.map((changeover) => (
                    <div
                      key={changeover.id}
                      onClick={() => {
                        setSelectedDay(null);
                        setSelectedShiftChangeover(changeover);
                      }}
                      className="p-3 rounded-lg border cursor-pointer hover:opacity-80 transition-opacity bg-purple-50 border-purple-200"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <RotateCcw className="w-4 h-4 text-purple-600" />
                        <span className="font-medium text-purple-900">Shift Changeover</span>
                      </div>
                      <div className="text-sm text-gray-700">{getShiftTypeLabel(changeover.shiftType)}</div>
                      <div className="text-sm text-gray-600">{changeover.siteName}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(changeover.startDateTime).toLocaleTimeString()} - {new Date(changeover.endDateTime).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                  {daySchedules.map((schedule) => {
                    const status = getScheduleStatus(schedule);
                    return (
                      <div
                        key={schedule.id}
                        onClick={() => {
                          setSelectedDay(null);
                          setSelectedSchedule(schedule);
                        }}
                        className={`p-3 rounded-lg border cursor-pointer hover:opacity-80 transition-opacity ${
                          status === 'completed'
                            ? 'bg-green-50 border-green-200'
                            : status === 'overdue'
                            ? 'bg-red-50 border-red-200'
                            : status === 'due'
                            ? 'bg-yellow-50 border-yellow-200'
                            : 'bg-blue-50 border-blue-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {status === 'completed' && <CheckCircle className="w-4 h-4 text-green-600" />}
                          {status === 'overdue' && <AlertTriangle className="w-4 h-4 text-red-600" />}
                          {status === 'due' && <Clock className="w-4 h-4 text-yellow-600" />}
                          {status === 'upcoming' && <CheckCircle className="w-4 h-4 text-blue-600" />}
                          <Badge variant="info">{schedule.assetTypeCode}</Badge>
                          <span className="font-mono text-sm">{schedule.assetId}</span>
                        </div>
                        <div className="font-medium text-gray-900">{schedule.name}</div>
                        <div className="text-sm text-gray-600">{schedule.siteName}</div>
                      </div>
                    );
                  })}
                  {daySchedules.length === 0 && dayShiftChangeovers.length === 0 && (
                    <div className="text-center py-8 text-gray-500">No events on this day</div>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </Modal>
    </>
  );
}
