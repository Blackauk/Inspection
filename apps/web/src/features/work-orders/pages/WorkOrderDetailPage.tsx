import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { Card } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { Tabs } from '../../../components/common/Tabs';
import { Table, TableHeader, TableRow, TableHeaderCell, TableCell } from '../../../components/common/Table';
import { Input } from '../../../components/common/Input';
import {
  getWorkOrderById,
  getWorkOrderParts,
  getWorkOrderUpdates,
} from '../services';
import type { WorkOrderPriority } from '../types';
import type { WorkOrderStatus } from '@ppm/shared';

export function WorkOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [completionNotes, setCompletionNotes] = useState('');
  const [showCompletionForm, setShowCompletionForm] = useState(false);

  const workOrder = id ? getWorkOrderById(id) : undefined;
  const parts = workOrder ? getWorkOrderParts(workOrder.id) : [];
  const updates = workOrder ? getWorkOrderUpdates(workOrder.id) : [];

  if (!workOrder) {
    return (
      <div className="p-6">
        <Card>
          <div className="p-8 text-center text-gray-500">
            Work Order not found
          </div>
        </Card>
      </div>
    );
  }

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

  const canAssign = ['Supervisor', 'Manager', 'Admin'].includes(user?.role || '');
  const canChangeStatus = ['Fitter', 'Supervisor', 'Manager', 'Admin'].includes(user?.role || '');
  const canClose = ['Supervisor', 'Manager', 'Admin'].includes(user?.role || '');
  const requiresAttachment = (workOrder.priority === 'Critical' || workOrder.priority === 'High') && !workOrder.completionNotes;

  const handleMarkCompleted = () => {
    if (!completionNotes.trim()) {
      alert('Completion notes are required');
      return;
    }
    if (requiresAttachment) {
      if (!confirm('Warning: This is a Critical/High priority work order. It is recommended to attach documentation before closing. Continue anyway?')) {
        return;
      }
    }
    // Placeholder - would update work order status
    console.log('Mark completed:', { workOrderId: workOrder.id, notes: completionNotes });
    setShowCompletionForm(false);
    setCompletionNotes('');
  };

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      content: (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Work Order Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Work Order ID</label>
                <div className="font-mono font-medium text-gray-900">{workOrder.id}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <div className="text-gray-900">{workOrder.type}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                {getStatusBadge(workOrder.status)}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                {getPriorityBadge(workOrder.priority)}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <div className="text-gray-900">{workOrder.title}</div>
              </div>

              {workOrder.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <div className="text-gray-900 whitespace-pre-wrap">{workOrder.description}</div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Asset</label>
                <div className="flex items-center gap-2">
                  <Badge variant="info">{workOrder.assetTypeCode}</Badge>
                  <button
                    onClick={() => navigate(`/assets/${workOrder.assetId}`)}
                    className="font-mono text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    {workOrder.assetId}
                  </button>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {workOrder.assetMake} {workOrder.assetModel}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Site / Location</label>
                <div className="text-gray-900">
                  {workOrder.siteName} {workOrder.location && `→ ${workOrder.location}`}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                <div className="text-gray-900">{workOrder.assignedToName || 'Unassigned'}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Created By</label>
                <div className="text-gray-900">{workOrder.createdByName}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Created At</label>
                <div className="text-gray-900">
                  {new Date(workOrder.createdAt).toLocaleString()}
                </div>
              </div>

              {workOrder.dueDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <div className="text-gray-900">
                    {new Date(workOrder.dueDate).toLocaleString()}
                  </div>
                </div>
              )}

              {workOrder.completedAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Completed At</label>
                  <div className="text-gray-900">
                    {new Date(workOrder.completedAt).toLocaleString()}
                  </div>
                </div>
              )}

              {workOrder.completionNotes && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Completion Notes</label>
                  <div className="text-gray-900 whitespace-pre-wrap">{workOrder.completionNotes}</div>
                </div>
              )}

              {/* Origin Panel - if created from PM Task */}
              {(workOrder.isDraft || workOrder.pmScheduleId) && (
                <div className="md:col-span-2 mt-4 pt-4 border-t">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Origin</label>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="text-sm text-gray-700">
                      {workOrder.isDraft && (
                        <Badge variant="default" className="mb-2">Draft</Badge>
                      )}
                      {workOrder.pmScheduleId && (
                        <>
                          <div className="font-medium mb-1">Created from PM Schedule</div>
                          <button
                            onClick={() => navigate(`/pm-schedules/${workOrder.pmScheduleId}`)}
                            className="text-blue-600 hover:text-blue-700 hover:underline"
                          >
                            View PM Schedule
                          </button>
                          {workOrder.pmChecklistItemId && (
                            <div className="text-xs text-gray-500 mt-1">
                              Checklist item reference: {workOrder.pmChecklistItemId}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      ),
    },
    {
      id: 'updates',
      label: 'Updates',
      content: (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Updates</h3>
            <div className="space-y-4">
              {updates.map((update) => (
                <div key={update.id} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-900">{update.userName}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(update.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-sm text-gray-700">{update.note}</div>
                </div>
              ))}
              {updates.length === 0 && (
                <div className="text-center py-8 text-gray-500">No updates yet</div>
              )}
            </div>
          </div>
        </Card>
      ),
    },
    {
      id: 'parts',
      label: 'Parts',
      content: (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Parts Required</h3>
            {parts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>Part Number</TableHeaderCell>
                    <TableHeaderCell>Description</TableHeaderCell>
                    <TableHeaderCell>Quantity</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <tbody>
                  {parts.map((part) => (
                    <TableRow key={part.id}>
                      <TableCell className="font-mono">{part.partNumber}</TableCell>
                      <TableCell>{part.description || 'N/A'}</TableCell>
                      <TableCell>{part.quantity}</TableCell>
                    </TableRow>
                  ))}
                </tbody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">No parts required</div>
            )}
          </div>
        </Card>
      ),
    },
    {
      id: 'documents',
      label: 'Documents/Media',
      content: (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents & Media</h3>
            <div className="text-center py-8 text-gray-500">
              Documents and media for this work order will be displayed here
            </div>
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
            <div className="text-center py-8 text-gray-500">
              Activity log for this work order will be displayed here
            </div>
          </div>
        </Card>
      ),
    },
  ];

  return (
    <div className="pb-6">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl font-bold font-mono text-gray-900">{workOrder.id}</span>
                {getStatusBadge(workOrder.status)}
                {getPriorityBadge(workOrder.priority)}
              </div>
              <div className="text-lg text-gray-700 mb-1">{workOrder.title}</div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div>
                  Asset:{' '}
                  <button
                    onClick={() => navigate(`/assets/${workOrder.assetId}`)}
                    className="text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    <Badge variant="info" size="sm">{workOrder.assetTypeCode}</Badge> {workOrder.assetId}
                  </button>
                  {' • '}
                  {workOrder.siteName} {workOrder.location && `→ ${workOrder.location}`}
                </div>
              </div>
              <div className="text-sm text-gray-600 mt-2">
                Assigned to: {workOrder.assignedToName || 'Unassigned'} • Created by: {workOrder.createdByName} • {new Date(workOrder.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {canAssign && (
              <Button size="sm" variant="outline">
                Assign / Reassign
              </Button>
            )}
            {canChangeStatus && (
              <Button size="sm" variant="outline">
                Change Status
              </Button>
            )}
            {canChangeStatus && workOrder.status !== 'Completed' && workOrder.status !== 'ApprovedClosed' && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => setShowCompletionForm(!showCompletionForm)}
              >
                Mark Completed
              </Button>
            )}
            {canClose && workOrder.status === 'Completed' && (
              <Button size="sm" variant="primary">
                Close
              </Button>
            )}
          </div>

          {/* Completion Form */}
          {showCompletionForm && (
            <Card className="mt-4">
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Completion Notes <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    value={completionNotes}
                    onChange={(e) => setCompletionNotes(e.target.value)}
                    placeholder="Enter completion notes..."
                    required
                  />
                  {requiresAttachment && (
                    <p className="text-sm text-yellow-600 mt-2">
                      ⚠️ Warning: This is a {workOrder.priority} priority work order. It is recommended to attach documentation.
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleMarkCompleted} disabled={!completionNotes.trim()}>
                    Submit Completion
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setShowCompletionForm(false);
                    setCompletionNotes('');
                  }}>
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Tabs Content */}
      <div className="p-6">
        <Tabs tabs={tabs} defaultTab="overview" />
      </div>
    </div>
  );
}
