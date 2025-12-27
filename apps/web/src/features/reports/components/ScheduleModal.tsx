import { useState, useEffect, useMemo } from 'react';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';
import { Checkbox } from '../../../components/common/Checkbox';
import { MultiSelectFilter } from '../../../components/common/MultiSelectFilter';
import { showToast } from '../../../components/common/Toast';
import {
  createSchedule,
  updateSchedule,
  type CreateScheduleData,
} from '../services/scheduleService';
import { mockUsers } from '../services/mockUsers';
import { mockTeams } from '../services/mockTeams';
import { mockSites } from '../../assets/services';
import type {
  ScheduledReport,
  ScheduleFrequency,
  ReportSection,
  DateRangeOption,
} from '../types/scheduledReports';
import { AlertCircle, Loader2, X } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  schedule?: ScheduledReport;
}

export function ScheduleModal({
  isOpen,
  onClose,
  onSuccess,
  schedule,
}: ScheduleModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState<ScheduleFrequency>('Weekly');
  const [time, setTime] = useState('09:00');
  const [dayOfWeek, setDayOfWeek] = useState<number>(1); // Monday
  const [dayOfMonth, setDayOfMonth] = useState<number>(1);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [externalEmails, setExternalEmails] = useState<string[]>(['']);
  const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>([]);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [selectedSections, setSelectedSections] = useState<ReportSection[]>(['KPIs', 'Tables']);
  const [dateRange, setDateRange] = useState<DateRangeOption>('Last 7 days');
  const [includeUpcomingPM, setIncludeUpcomingPM] = useState(true);
  const [upcomingPMDays, setUpcomingPMDays] = useState(7);
  const [outputFormat, setOutputFormat] = useState<'PDF' | 'EmailBody' | 'Both'>('PDF');

  // Reset form when modal opens/closes or schedule changes
  useEffect(() => {
    if (isOpen) {
      if (schedule) {
        // Edit mode
        setName(schedule.name);
        setFrequency(schedule.frequency);
        setTime(schedule.time);
        setDayOfWeek(schedule.dayOfWeek ?? 1);
        setDayOfMonth(schedule.dayOfMonth ?? 1);
        setSelectedUserIds(schedule.recipients.userIds);
        setExternalEmails(
          schedule.recipients.externalEmails.length > 0
            ? schedule.recipients.externalEmails
            : ['']
        );
        setSelectedSiteIds(schedule.scope.siteIds);
        setSelectedTeamIds(schedule.scope.teamIds || []);
        setSelectedSections(schedule.sections);
        setDateRange(schedule.dateRange);
        setIncludeUpcomingPM(schedule.includeUpcomingPM);
        setUpcomingPMDays(schedule.upcomingPMDays);
        setOutputFormat(schedule.outputFormat);
      } else {
        // Create mode - reset to defaults
        setName('');
        setFrequency('Weekly');
        setTime('09:00');
        setDayOfWeek(1);
        setDayOfMonth(1);
        setSelectedUserIds([]);
        setExternalEmails(['']);
        setSelectedSiteIds([]);
        setSelectedTeamIds([]);
        setSelectedSections(['KPIs', 'Tables']);
        setDateRange('Last 7 days');
        setIncludeUpcomingPM(true);
        setUpcomingPMDays(7);
        setOutputFormat('PDF');
      }
      setError(null);
    }
  }, [isOpen, schedule]);

  // User and site options
  const userOptions = useMemo(() => {
    return mockUsers.map((u) => ({
      value: u.id,
      label: `${u.firstName} ${u.lastName} (${u.email})`,
    }));
  }, []);

  const siteOptions = useMemo(() => {
    return mockSites.map((s) => ({
      value: s.id,
      label: s.name,
    }));
  }, []);

  const teamOptions = useMemo(() => {
    return mockTeams.map((t) => ({
      value: t.id,
      label: t.name,
    }));
  }, []);

  // Handle external email input
  const handleExternalEmailChange = (index: number, value: string) => {
    const newEmails = [...externalEmails];
    newEmails[index] = value;
    setExternalEmails(newEmails);
  };

  const handleAddExternalEmail = () => {
    setExternalEmails([...externalEmails, '']);
  };

  const handleRemoveExternalEmail = (index: number) => {
    if (externalEmails.length > 1) {
      setExternalEmails(externalEmails.filter((_, i) => i !== index));
    }
  };

  // Validation
  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    
    if (!name.trim()) errors.push('Schedule name is required');
    if (selectedUserIds.length === 0 && externalEmails.filter(e => e.trim()).length === 0) {
      errors.push('At least one recipient is required');
    }
    if (selectedSiteIds.length === 0) errors.push('At least one site must be selected');
    if (selectedSections.length === 0) errors.push('At least one section must be selected');
    
    // Validate external emails
    const validExternalEmails = externalEmails.filter(e => e.trim());
    for (const email of validExternalEmails) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push(`Invalid email address: ${email}`);
      }
    }
    
    return errors;
  }, [name, selectedUserIds, externalEmails, selectedSiteIds, selectedSections]);

  const isValid = validationErrors.length === 0;

  // Handle submit
  const handleSubmit = async () => {
    if (!isValid || !user) {
      setError(validationErrors.join(', '));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const validExternalEmails = externalEmails.filter(e => e.trim());
      
      const scheduleData: CreateScheduleData = {
        name: name.trim(),
        frequency,
        time,
        dayOfWeek: frequency === 'Weekly' ? dayOfWeek : undefined,
        dayOfMonth: frequency === 'Monthly' ? dayOfMonth : undefined,
        recipients: {
          userIds: selectedUserIds,
          externalEmails: validExternalEmails,
        },
        scope: {
          siteIds: selectedSiteIds,
          teamIds: selectedTeamIds.length > 0 ? selectedTeamIds : undefined,
        },
        sections: selectedSections,
        dateRange,
        includeUpcomingPM,
        upcomingPMDays,
        outputFormat,
      };

      if (schedule) {
        await updateSchedule(schedule.id, scheduleData);
        showToast('Schedule updated successfully', 'success');
      } else {
        await createSchedule(scheduleData, user.id);
        showToast('Schedule created successfully', 'success');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error saving schedule:', err);
      setError(err.message || 'Failed to save schedule');
      showToast(err.message || 'Failed to save schedule', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSectionToggle = (section: ReportSection) => {
    setSelectedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={schedule ? 'Edit Schedule' : 'New Scheduled Report'}
      size="lg"
    >
      <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-2">
        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Schedule Name */}
        <Input
          label="Schedule Name *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Site A Weekly Summary"
        />

        {/* Frequency and Time */}
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Frequency *"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as ScheduleFrequency)}
            options={[
              { value: 'Daily', label: 'Daily' },
              { value: 'Weekly', label: 'Weekly' },
              { value: 'Monthly', label: 'Monthly' },
            ]}
          />
          <Input
            label="Time *"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>

        {/* Day of Week (Weekly) */}
        {frequency === 'Weekly' && (
          <Select
            label="Day of Week *"
            value={dayOfWeek.toString()}
            onChange={(e) => setDayOfWeek(Number(e.target.value))}
            options={[
              { value: '0', label: 'Sunday' },
              { value: '1', label: 'Monday' },
              { value: '2', label: 'Tuesday' },
              { value: '3', label: 'Wednesday' },
              { value: '4', label: 'Thursday' },
              { value: '5', label: 'Friday' },
              { value: '6', label: 'Saturday' },
            ]}
          />
        )}

        {/* Day of Month (Monthly) */}
        {frequency === 'Monthly' && (
          <Select
            label="Day of Month *"
            value={dayOfMonth.toString()}
            onChange={(e) => setDayOfMonth(Number(e.target.value))}
            options={Array.from({ length: 31 }, (_, i) => ({
              value: (i + 1).toString(),
              label: (i + 1).toString(),
            }))}
          />
        )}

        {/* Recipients */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Recipients *
          </label>
          <MultiSelectFilter
            options={userOptions}
            selected={selectedUserIds}
            onChange={setSelectedUserIds}
            searchable
            placeholder="Search users..."
          />
          
          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              External Emails
            </label>
            {externalEmails.map((email, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => handleExternalEmailChange(index, e.target.value)}
                  placeholder="email@example.com"
                />
                {externalEmails.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveExternalEmail(index)}
                    className="p-2 text-gray-400 hover:text-red-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddExternalEmail}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              + Add Email
            </button>
          </div>
        </div>

        {/* Scope */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sites * (Multi-select)
          </label>
          <MultiSelectFilter
            options={siteOptions}
            selected={selectedSiteIds}
            onChange={setSelectedSiteIds}
            searchable
            placeholder="Search sites..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Teams (Optional - Multi-select)
          </label>
          <MultiSelectFilter
            options={teamOptions}
            selected={selectedTeamIds}
            onChange={setSelectedTeamIds}
            searchable
            placeholder="Search teams..."
          />
        </div>

        {/* Sections */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sections *
          </label>
          <div className="space-y-2 border border-gray-200 rounded-md p-3">
            {(['KPIs', 'Charts', 'Tables'] as ReportSection[]).map((section) => (
              <Checkbox
                key={section}
                label={section}
                checked={selectedSections.includes(section)}
                onChange={() => handleSectionToggle(section)}
              />
            ))}
          </div>
        </div>

        {/* Date Range */}
        <Select
          label="Date Range"
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value as DateRangeOption)}
          options={[
            { value: 'Last 7 days', label: 'Last 7 days' },
            { value: 'Last 14 days', label: 'Last 14 days' },
            { value: 'Last 30 days', label: 'Last 30 days' },
          ]}
        />

        {/* Upcoming PM */}
        <div className="space-y-2">
          <Checkbox
            label="Include Upcoming PM Schedules"
            checked={includeUpcomingPM}
            onChange={(e) => setIncludeUpcomingPM(e.target.checked)}
          />
          {includeUpcomingPM && (
            <Select
              label="Next X Days"
              value={upcomingPMDays.toString()}
              onChange={(e) => setUpcomingPMDays(Number(e.target.value))}
              options={[
                { value: '7', label: 'Next 7 days' },
                { value: '14', label: 'Next 14 days' },
              ]}
            />
          )}
        </div>

        {/* Output Format */}
        <Select
          label="Output Format"
          value={outputFormat}
          onChange={(e) => setOutputFormat(e.target.value as 'PDF' | 'EmailBody' | 'Both')}
          options={[
            { value: 'PDF', label: 'PDF Attachment' },
            { value: 'EmailBody', label: 'Email Body Summary' },
            { value: 'Both', label: 'Both PDF and Email Body' },
          ]}
        />

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={loading || !isValid}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : schedule ? (
              'Update Schedule'
            ) : (
              'Create Schedule'
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

