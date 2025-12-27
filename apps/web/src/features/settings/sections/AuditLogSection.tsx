import { useState, useMemo, useRef } from 'react';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';
import { Badge } from '../../../components/common/Badge';
import { Modal } from '../../../components/common/Modal';
import { SortableTable } from '../../../components/common/SortableTable';
import { FilterPanel } from '../../../components/common/FilterPanel';
import { FilterButton } from '../../../components/common/FilterButton';
import { exportToCSV } from '../../reports/utils/exportUtils';
import { Download, Eye } from 'lucide-react';
import { 
  loadAuditLog,
  loadUsers,
  type AuditLogEntry 
} from '../mock/settingsData';

export function AuditLogSection() {
  const [entries, setEntries] = useState(loadAuditLog());
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [search, setSearch] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Filter state
  const [filterUser, setFilterUser] = useState<string>('');
  const [filterAction, setFilterAction] = useState<string>('');
  const [filterEntityType, setFilterEntityType] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  
  // Temp filter state for panel
  const [tempFilterUser, setTempFilterUser] = useState<string>('');
  const [tempFilterAction, setTempFilterAction] = useState<string>('');
  const [tempFilterEntityType, setTempFilterEntityType] = useState<string>('');
  const [tempDateFrom, setTempDateFrom] = useState<string>('');
  const [tempDateTo, setTempDateTo] = useState<string>('');
  
  const users = loadUsers();

  const filteredEntries = useMemo(() => {
    let filtered = [...entries];
    
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(e =>
        e.summary.toLowerCase().includes(searchLower) ||
        e.entityId.toLowerCase().includes(searchLower) ||
        e.userName.toLowerCase().includes(searchLower)
      );
    }
    
    if (filterUser) {
      filtered = filtered.filter(e => e.userId === filterUser);
    }
    
    if (filterAction) {
      filtered = filtered.filter(e => e.action === filterAction);
    }
    
    if (filterEntityType) {
      filtered = filtered.filter(e => e.entityType === filterEntityType);
    }
    
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      filtered = filtered.filter(e => new Date(e.timestamp) >= fromDate);
    }
    
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59);
      filtered = filtered.filter(e => new Date(e.timestamp) <= toDate);
    }
    
    return filtered;
  }, [entries, search, filterUser, filterAction, filterEntityType, dateFrom, dateTo]);

  const handleViewDetails = (entry: AuditLogEntry) => {
    setSelectedEntry(entry);
    setShowDetailModal(true);
  };

  const handleExportCSV = () => {
    exportToCSV(filteredEntries, `audit-log-${new Date().toISOString().split('T')[0]}`);
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterUser) count++;
    if (filterAction) count++;
    if (filterEntityType) count++;
    if (dateFrom) count++;
    if (dateTo) count++;
    return count;
  }, [filterUser, filterAction, filterEntityType, dateFrom, dateTo]);

  const handleApplyFilters = () => {
    setFilterUser(tempFilterUser);
    setFilterAction(tempFilterAction);
    setFilterEntityType(tempFilterEntityType);
    setDateFrom(tempDateFrom);
    setDateTo(tempDateTo);
    setIsFilterOpen(false);
  };

  const handleResetFilters = () => {
    setTempFilterUser('');
    setTempFilterAction('');
    setTempFilterEntityType('');
    setTempDateFrom('');
    setTempDateTo('');
    setFilterUser('');
    setFilterAction('');
    setFilterEntityType('');
    setDateFrom('');
    setDateTo('');
  };

  const handleOpenFilter = () => {
    // Sync current filters to temp filters when opening
    setTempFilterUser(filterUser);
    setTempFilterAction(filterAction);
    setTempFilterEntityType(filterEntityType);
    setTempDateFrom(dateFrom);
    setTempDateTo(dateTo);
    setIsFilterOpen(true);
  };

  const columns = [
    {
      key: 'timestamp',
      label: 'Timestamp',
      sortable: true,
      render: (_: any, row: AuditLogEntry) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">
            {new Date(row.timestamp).toLocaleDateString()}
          </div>
          <div className="text-gray-500">
            {new Date(row.timestamp).toLocaleTimeString()}
          </div>
        </div>
      ),
    },
    {
      key: 'user',
      label: 'User',
      sortable: true,
      render: (_: any, row: AuditLogEntry) => (
        <div className="text-sm text-gray-900">{row.userName}</div>
      ),
    },
    {
      key: 'action',
      label: 'Action',
      sortable: true,
      render: (_: any, row: AuditLogEntry) => (
        <Badge variant="default">{row.action}</Badge>
      ),
    },
    {
      key: 'entity',
      label: 'Entity',
      sortable: true,
      render: (_: any, row: AuditLogEntry) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">{row.entityType}</div>
          <div className="text-gray-500 font-mono text-xs">{row.entityId}</div>
        </div>
      ),
    },
    {
      key: 'summary',
      label: 'Summary',
      sortable: false,
      render: (_: any, row: AuditLogEntry) => (
        <div className="text-sm text-gray-700 line-clamp-2">{row.summary}</div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_: any, row: AuditLogEntry) => (
        <button
          onClick={() => handleViewDetails(row)}
          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
          title="View Details"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  const uniqueActions = Array.from(new Set(entries.map(e => e.action))).sort();
  const uniqueEntityTypes = Array.from(new Set(entries.map(e => e.entityType))).sort();

  return (
    <div className="space-y-4">
      {/* Search + Filter Row */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search audit log..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <FilterButton
          onClick={handleOpenFilter}
          activeFilterCount={activeFilterCount}
          size="sm"
        />
      </div>

      {/* Table Card */}
      <Card>
        <div className="p-6">
          {/* Table Header with Export CSV */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-600">
              Showing {filteredEntries.length} of {entries.length} entries
            </div>
            <Button variant="outline" size="sm" onClick={handleExportCSV} className="inline-flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>
          <SortableTable
            columns={columns}
            data={filteredEntries}
          />
        </div>
      </Card>

      {/* Filter Panel */}
      <FilterPanel
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        title="Audit Log Filters"
      >
        <div className="space-y-4">
          <Select
            label="User"
            value={tempFilterUser}
            onChange={(e) => setTempFilterUser(e.target.value)}
            options={[
              { value: '', label: 'All Users' },
              ...users.map(user => ({ value: user.id, label: `${user.firstName} ${user.lastName}` })),
            ]}
          />
          <Select
            label="Action"
            value={tempFilterAction}
            onChange={(e) => setTempFilterAction(e.target.value)}
            options={[
              { value: '', label: 'All Actions' },
              ...uniqueActions.map(action => ({ value: action, label: action })),
            ]}
          />
          <Select
            label="Entity Type"
            value={tempFilterEntityType}
            onChange={(e) => setTempFilterEntityType(e.target.value)}
            options={[
              { value: '', label: 'All Entities' },
              ...uniqueEntityTypes.map(type => ({ value: type, label: type })),
            ]}
          />
          <Input
            type="date"
            label="Date From"
            value={tempDateFrom}
            onChange={(e) => setTempDateFrom(e.target.value)}
          />
          <Input
            type="date"
            label="Date To"
            value={tempDateTo}
            onChange={(e) => setTempDateTo(e.target.value)}
          />
        </div>
      </FilterPanel>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedEntry(null);
        }}
        title="Audit Log Entry Details"
        size="lg"
      >
        {selectedEntry && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Timestamp</label>
                <div className="text-sm text-gray-900 mt-1">
                  {new Date(selectedEntry.timestamp).toLocaleString()}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">User</label>
                <div className="text-sm text-gray-900 mt-1">{selectedEntry.userName}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Action</label>
                <div className="mt-1">
                  <Badge variant="default">{selectedEntry.action}</Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Entity Type</label>
                <div className="text-sm text-gray-900 mt-1">{selectedEntry.entityType}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Entity ID</label>
                <div className="text-sm text-gray-900 font-mono mt-1">{selectedEntry.entityId}</div>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700">Summary</label>
              <div className="text-sm text-gray-900 mt-1 p-3 bg-gray-50 rounded">
                {selectedEntry.summary}
              </div>
            </div>
            
            {(selectedEntry.before || selectedEntry.after) && (
              <div className="grid grid-cols-2 gap-4">
                {selectedEntry.before && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Before</label>
                    <pre className="text-xs text-gray-900 mt-1 p-3 bg-gray-50 rounded overflow-auto max-h-40">
                      {JSON.stringify(selectedEntry.before, null, 2)}
                    </pre>
                  </div>
                )}
                {selectedEntry.after && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">After</label>
                    <pre className="text-xs text-gray-900 mt-1 p-3 bg-gray-50 rounded overflow-auto max-h-40">
                      {JSON.stringify(selectedEntry.after, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedEntry(null);
                }}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}


