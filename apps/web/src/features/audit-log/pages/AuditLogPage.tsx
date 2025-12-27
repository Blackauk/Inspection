import { useState, useMemo, useEffect } from 'react';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';
import { Badge } from '../../../components/common/Badge';
import { Modal } from '../../../components/common/Modal';
import { SortableTable } from '../../../components/common/SortableTable';
import { Download, Eye, X, Copy } from 'lucide-react';
import { showToast } from '../../../components/common/Toast';
import { loadAuditLog, type AuditLogEntry } from '../mockAuditData';
import { exportToCSV } from '../../reports/utils/exportUtils';

const DATE_RANGES = [
  { value: '', label: 'All Time' },
  { value: '24h', label: 'Last 24 Hours' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: 'custom', label: 'Custom Range' },
];

const ACTION_TYPES = [
  { value: '', label: 'All Actions' },
  { value: 'Create', label: 'Create' },
  { value: 'Update', label: 'Update' },
  { value: 'Delete', label: 'Delete' },
  { value: 'Login', label: 'Login' },
  { value: 'Logout', label: 'Logout' },
  { value: 'Export', label: 'Export' },
  { value: 'Import', label: 'Import' },
  { value: 'Approve', label: 'Approve' },
  { value: 'Submit', label: 'Submit' },
  { value: 'Complete', label: 'Complete' },
];

const MODULES = [
  { value: '', label: 'All Modules' },
  { value: 'Work Orders', label: 'Work Orders' },
  { value: 'Inspections', label: 'Inspections' },
  { value: 'Defects', label: 'Defects' },
  { value: 'Assets', label: 'Assets' },
  { value: 'Settings', label: 'Settings' },
  { value: 'Users', label: 'Users' },
  { value: 'Reports', label: 'Reports' },
];

const SEVERITIES = [
  { value: '', label: 'All Severities' },
  { value: 'Info', label: 'Info' },
  { value: 'Warning', label: 'Warning' },
  { value: 'Critical', label: 'Critical' },
];

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getSeverityVariant(severity: AuditLogEntry['severity']) {
  switch (severity) {
    case 'Critical':
      return 'error';
    case 'Warning':
      return 'warning';
    default:
      return 'info';
  }
}

function getActionColor(action: string) {
  switch (action) {
    case 'Create':
    case 'Login':
    case 'Import':
      return 'text-green-600';
    case 'Update':
    case 'Approve':
    case 'Submit':
      return 'text-blue-600';
    case 'Delete':
    case 'Logout':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
}

export function AuditLogPage() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterModule, setFilterModule] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterUser, setFilterUser] = useState('');

  useEffect(() => {
    const loaded = loadAuditLog();
    setEntries(loaded);
  }, []);

  // Get unique users for filter
  const users = useMemo(() => {
    const userMap = new Map<string, string>();
    entries.forEach((e) => {
      if (!userMap.has(e.userId)) {
        userMap.set(e.userId, e.userName);
      }
    });
    return Array.from(userMap.entries()).map(([id, name]) => ({ value: id, label: name }));
  }, [entries]);

  const filteredEntries = useMemo(() => {
    let filtered = [...entries];

    // Search
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.summary.toLowerCase().includes(searchLower) ||
          e.entityId.toLowerCase().includes(searchLower) ||
          e.userName.toLowerCase().includes(searchLower) ||
          e.entityName?.toLowerCase().includes(searchLower) ||
          e.siteName?.toLowerCase().includes(searchLower)
      );
    }

    // Date range
    if (dateRange && dateRange !== 'custom') {
      const now = new Date();
      const cutoff = new Date();
      switch (dateRange) {
        case '24h':
          cutoff.setHours(now.getHours() - 24);
          break;
        case '7d':
          cutoff.setDate(now.getDate() - 7);
          break;
        case '30d':
          cutoff.setDate(now.getDate() - 30);
          break;
      }
      filtered = filtered.filter((e) => new Date(e.timestamp) >= cutoff);
    } else if (dateRange === 'custom') {
      if (dateFrom) {
        filtered = filtered.filter((e) => new Date(e.timestamp) >= new Date(dateFrom));
      }
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        filtered = filtered.filter((e) => new Date(e.timestamp) <= toDate);
      }
    }

    // Filters
    if (filterAction) {
      filtered = filtered.filter((e) => e.action === filterAction);
    }
    if (filterModule) {
      filtered = filtered.filter((e) => e.module === filterModule);
    }
    if (filterSeverity) {
      filtered = filtered.filter((e) => e.severity === filterSeverity);
    }
    if (filterUser) {
      filtered = filtered.filter((e) => e.userId === filterUser);
    }

    return filtered;
  }, [entries, search, dateRange, dateFrom, dateTo, filterAction, filterModule, filterSeverity, filterUser]);

  const handleRowClick = (entry: AuditLogEntry) => {
    setSelectedEntry(entry);
    setShowDetailModal(true);
  };

  const handleExport = () => {
    try {
      const csvData = filteredEntries.map((e) => ({
        Timestamp: formatTimestamp(e.timestamp),
        User: e.userName,
        Action: e.action,
        Module: e.module,
        Entity: e.entityName || e.entityId,
        Summary: e.summary,
        Site: e.siteName || '',
        Severity: e.severity,
        IP: e.ipAddress || '',
        Device: e.device || '',
      }));

      exportToCSV(csvData, 'audit-log-export');
      showToast('Audit log exported successfully', 'success');
    } catch (error) {
      console.error('Export failed:', error);
      showToast('Failed to export audit log', 'error');
    }
  };

  const handleCopyDetail = async () => {
    if (!selectedEntry) return;

    const detail = {
      id: selectedEntry.id,
      timestamp: selectedEntry.timestamp,
      user: selectedEntry.userName,
      action: selectedEntry.action,
      entity: `${selectedEntry.entityType} ${selectedEntry.entityId}`,
      summary: selectedEntry.summary,
      before: selectedEntry.before,
      after: selectedEntry.after,
      metadata: selectedEntry.metadata,
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(detail, null, 2));
      showToast('Copied to clipboard', 'success');
    } catch (error) {
      console.error('Copy failed:', error);
      showToast('Failed to copy', 'error');
    }
  };

  const columns = [
    {
      key: 'timestamp',
      label: 'Timestamp',
      sortable: true,
      render: (_: any, row: AuditLogEntry) => (
        <div className="text-sm text-gray-900">{formatTimestamp(row.timestamp)}</div>
      ),
    },
    {
      key: 'userName',
      label: 'User',
      sortable: true,
      render: (_: any, row: AuditLogEntry) => (
        <div className="text-sm font-medium text-gray-900">{row.userName}</div>
      ),
    },
    {
      key: 'action',
      label: 'Action',
      sortable: true,
      render: (_: any, row: AuditLogEntry) => (
        <span className={`text-sm font-medium ${getActionColor(row.action)}`}>{row.action}</span>
      ),
    },
    {
      key: 'module',
      label: 'Module',
      sortable: true,
      render: (_: any, row: AuditLogEntry) => (
        <div className="text-sm text-gray-700">{row.module}</div>
      ),
    },
    {
      key: 'entity',
      label: 'Entity',
      sortable: false,
      render: (_: any, row: AuditLogEntry) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">{row.entityName || row.entityId}</div>
          <div className="text-xs text-gray-500">{row.entityType}</div>
        </div>
      ),
    },
    {
      key: 'summary',
      label: 'Details',
      sortable: false,
      render: (_: any, row: AuditLogEntry) => (
        <div className="text-sm text-gray-600 max-w-xs truncate">{row.summary}</div>
      ),
    },
    {
      key: 'site',
      label: 'Site',
      sortable: true,
      render: (_: any, row: AuditLogEntry) => (
        <div className="text-sm text-gray-600">{row.siteName || '-'}</div>
      ),
    },
    {
      key: 'severity',
      label: 'Severity',
      sortable: true,
      render: (_: any, row: AuditLogEntry) => (
        <Badge variant={getSeverityVariant(row.severity)} size="sm">
          {row.severity}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: '',
      sortable: false,
      render: (_: any, row: AuditLogEntry) => (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleRowClick(row);
          }}
        >
          <Eye className="w-4 h-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6">
      {/* Command Bar */}
      <div className="flex items-center justify-end mb-6">
        <Button onClick={handleExport} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="mt-6">
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <Input
                placeholder="Search across user, action, entity, ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              options={DATE_RANGES}
              label="Date Range"
            />
            <Select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              options={ACTION_TYPES}
              label="Action Type"
            />
          </div>

          {dateRange === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="date"
                label="From Date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
              <Input
                type="date"
                label="To Date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              value={filterModule}
              onChange={(e) => setFilterModule(e.target.value)}
              options={MODULES}
              label="Module"
            />
            <Select
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              options={[{ value: '', label: 'All Users' }, ...users]}
              label="User"
            />
            <Select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              options={SEVERITIES}
              label="Severity"
            />
          </div>
        </div>
      </Card>

      {/* Results */}
      <Card className="mt-6">
        <div className="p-6">
          <div className="mb-4 text-sm text-gray-600">
            Showing {filteredEntries.length} of {entries.length} entries
          </div>
          {filteredEntries.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No audit log entries found
            </div>
          ) : (
            <SortableTable
              columns={columns}
              data={filteredEntries}
              onRowClick={handleRowClick}
            />
          )}
        </div>
      </Card>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedEntry(null);
        }}
        title="Audit Log Detail"
        size="lg"
      >
        {selectedEntry && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Timestamp</label>
                <div className="text-sm text-gray-900">{formatTimestamp(selectedEntry.timestamp)}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
                <div className="text-sm text-gray-900">{selectedEntry.userName}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                <div className="text-sm">
                  <span className={`font-medium ${getActionColor(selectedEntry.action)}`}>
                    {selectedEntry.action}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Module</label>
                <div className="text-sm text-gray-900">{selectedEntry.module}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Entity</label>
                <div className="text-sm text-gray-900">
                  {selectedEntry.entityName || selectedEntry.entityId}
                </div>
                <div className="text-xs text-gray-500">{selectedEntry.entityType}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                <Badge variant={getSeverityVariant(selectedEntry.severity)} size="sm">
                  {selectedEntry.severity}
                </Badge>
              </div>
              {selectedEntry.siteName && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Site</label>
                  <div className="text-sm text-gray-900">{selectedEntry.siteName}</div>
                </div>
              )}
              {selectedEntry.ipAddress && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">IP Address</label>
                  <div className="text-sm text-gray-900">{selectedEntry.ipAddress}</div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Summary</label>
              <div className="text-sm text-gray-900">{selectedEntry.summary}</div>
            </div>

            {(selectedEntry.before || selectedEntry.after) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Changes</label>
                <div className="grid grid-cols-2 gap-4">
                  {selectedEntry.before && (
                    <div>
                      <div className="text-xs font-medium text-gray-500 mb-1">Before</div>
                      <pre className="text-xs bg-gray-50 p-3 rounded border border-gray-200 overflow-auto max-h-40">
                        {JSON.stringify(selectedEntry.before, null, 2)}
                      </pre>
                    </div>
                  )}
                  {selectedEntry.after && (
                    <div>
                      <div className="text-xs font-medium text-gray-500 mb-1">After</div>
                      <pre className="text-xs bg-gray-50 p-3 rounded border border-gray-200 overflow-auto max-h-40">
                        {JSON.stringify(selectedEntry.after, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedEntry.metadata && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Metadata</label>
                <pre className="text-xs bg-gray-50 p-3 rounded border border-gray-200 overflow-auto max-h-40">
                  {JSON.stringify(selectedEntry.metadata, null, 2)}
                </pre>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-gray-200">
              <Button variant="outline" onClick={handleCopyDetail}>
                <Copy className="w-4 h-4 mr-2" />
                Copy to Clipboard
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
