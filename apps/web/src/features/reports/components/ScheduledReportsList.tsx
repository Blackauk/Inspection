import { useState, useEffect, useMemo } from 'react';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { SortableTable } from '../../../components/common/SortableTable';
import {
  getAllSchedules,
  deleteSchedule,
  markScheduleAsSent,
} from '../services/scheduleService';
import { getUserName } from '../services/mockUsers';
import { mockSites } from '../../assets/services';
import { runScheduleNow } from '../services/reportRunnerService';
import type { ScheduledReport } from '../types/scheduledReports';
import { showToast } from '../../../components/common/Toast';
import { useAuth } from '../../../contexts/AuthContext';
import { Edit, Trash2, Play, Calendar, Mail } from 'lucide-react';

interface ScheduledReportsListProps {
  onCreateClick: () => void;
  onEditClick: (schedule: ScheduledReport) => void;
  reportData: any;
  filters: any;
  siteNames: Record<string, string>;
}

export function ScheduledReportsList({
  onCreateClick,
  onEditClick,
  reportData,
  filters,
  siteNames,
}: ScheduledReportsListProps) {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<ScheduledReport[]>([]);
  const [runningScheduleId, setRunningScheduleId] = useState<string | null>(null);

  // Check permissions
  const canCreate = user?.role === 'Admin' || user?.role === 'Manager';
  const canEdit = (schedule: ScheduledReport) => {
    if (user?.role === 'Admin') return true;
    if (user?.role === 'Manager') {
      // Managers can edit schedules for their sites
      return schedule.scope.siteIds.some((siteId) => user.siteIds?.includes(siteId));
    }
    return false;
  };
  const canDelete = (schedule: ScheduledReport) => {
    return user?.role === 'Admin';
  };

  // Load schedules
  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = () => {
    const allSchedules = getAllSchedules();
    // Filter by permissions
    const filtered = allSchedules.filter((schedule) => {
      if (user?.role === 'Admin') return true;
      if (user?.role === 'Manager') {
        // Managers can see schedules for their sites
        return schedule.scope.siteIds.some((siteId) => user.siteIds?.includes(siteId));
      }
      return false;
    });
    setSchedules(filtered);
  };

  // Handle delete
  const handleDelete = async (schedule: ScheduledReport) => {
    if (!confirm(`Are you sure you want to delete "${schedule.name}"?`)) {
      return;
    }

    try {
      deleteSchedule(schedule.id);
      showToast('Schedule deleted successfully', 'success');
      loadSchedules();
    } catch (error: any) {
      showToast(error.message || 'Failed to delete schedule', 'error');
    }
  };

  // Handle run now
  const handleRunNow = async (schedule: ScheduledReport) => {
    setRunningScheduleId(schedule.id);
    try {
      await runScheduleNow({
        schedule,
        reportData,
        filters,
        siteNames,
      });
      showToast('Report sent successfully', 'success');
      loadSchedules(); // Refresh to update lastSentAt
    } catch (error: any) {
      showToast(error.message || 'Failed to run schedule', 'error');
    } finally {
      setRunningScheduleId(null);
    }
  };

  // Format recipients display
  const formatRecipients = (schedule: ScheduledReport): string => {
    const parts: string[] = [];
    if (schedule.recipients.userIds.length > 0) {
      parts.push(`${schedule.recipients.userIds.length} user(s)`);
    }
    if (schedule.recipients.externalEmails.length > 0) {
      parts.push(`${schedule.recipients.externalEmails.length} external`);
    }
    return parts.join(', ') || 'None';
  };

  // Format scope display
  const formatScope = (schedule: ScheduledReport): string => {
    const siteNamesList = schedule.scope.siteIds
      .map((id) => siteNames[id] || id)
      .join(', ');
    return siteNamesList;
  };

  // Table columns
  const columns = useMemo(
    () => [
      {
        key: 'name',
        label: 'Schedule Name',
        sortable: true,
        render: (_: any, row: ScheduledReport) => (
          <span className="font-medium text-gray-900">{row.name}</span>
        ),
      },
      {
        key: 'frequency',
        label: 'Frequency',
        sortable: true,
        render: (_: any, row: ScheduledReport) => (
          <Badge variant="info">{row.frequency}</Badge>
        ),
      },
      {
        key: 'recipients',
        label: 'Recipients',
        sortable: false,
        render: (_: any, row: ScheduledReport) => (
          <span className="text-sm text-gray-600">{formatRecipients(row)}</span>
        ),
      },
      {
        key: 'scope',
        label: 'Scope',
        sortable: false,
        render: (_: any, row: ScheduledReport) => (
          <span className="text-sm text-gray-600">{formatScope(row)}</span>
        ),
      },
      {
        key: 'lastSentAt',
        label: 'Last Sent',
        sortable: true,
        render: (_: any, row: ScheduledReport) => (
          <span className="text-sm text-gray-600">
            {row.lastSentAt
              ? new Date(row.lastSentAt).toLocaleDateString()
              : 'Never'}
          </span>
        ),
      },
      {
        key: 'nextSendAt',
        label: 'Next Send',
        sortable: true,
        render: (_: any, row: ScheduledReport) => (
          <span className="text-sm font-medium text-gray-900">
            {new Date(row.nextSendAt).toLocaleString()}
          </span>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        sortable: true,
        render: (_: any, row: ScheduledReport) => (
          <Badge
            variant={
              row.status === 'Active'
                ? 'success'
                : row.status === 'Paused'
                ? 'warning'
                : 'default'
            }
          >
            {row.status}
          </Badge>
        ),
      },
      {
        key: 'actions',
        label: 'Actions',
        sortable: false,
        render: (_: any, row: ScheduledReport) => (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleRunNow(row)}
              disabled={runningScheduleId === row.id}
              className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
              title="Run now"
            >
              <Play className="w-4 h-4" />
            </button>
            {canEdit(row) && (
              <button
                onClick={() => onEditClick(row)}
                className="p-1.5 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded transition-colors"
                title="Edit"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            {canDelete(row) && (
              <button
                onClick={() => handleDelete(row)}
                className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ),
      },
    ],
    [runningScheduleId, siteNames]
  );

  if (!canCreate) {
    return (
      <Card>
        <div className="p-12 text-center">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-sm text-gray-500">
            You do not have permission to view scheduled reports.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Scheduled Reports</h2>
          <p className="text-sm text-gray-500 mt-1">
            Automatically send reports to recipients on a schedule
          </p>
        </div>
        {canCreate && (
          <Button variant="primary" onClick={onCreateClick}>
            <Mail className="w-4 h-4 mr-2" />
            New Schedule
          </Button>
        )}
      </div>

      {/* Table */}
      {schedules.length === 0 ? (
        <Card>
          <div className="p-12 text-center">
            <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No scheduled reports yet
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Create a schedule to automatically send reports to recipients.
            </p>
            <Button variant="primary" onClick={onCreateClick}>
              Create Schedule
            </Button>
          </div>
        </Card>
      ) : (
        <Card>
          <SortableTable columns={columns} data={schedules} />
        </Card>
      )}
    </div>
  );
}

