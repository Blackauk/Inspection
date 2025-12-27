import { useState, useMemo } from 'react';
import { AlertTriangle, Settings } from 'lucide-react';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { Checkbox } from '../../../components/common/Checkbox';
import { Select } from '../../../components/common/Select';
import { showToast } from '../../../components/common/Toast';
import {
  getChildAssets,
  updateAssetStatusWithDependencies,
  type UpdateStatusOptions,
} from '../services';
import type { Asset, OperationalStatus } from '../types';
import { formatOperationalStatus } from '../../../lib/formatters';

interface ChangeStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: Asset;
  onStatusChanged: () => void;
}

export function ChangeStatusModal({
  isOpen,
  onClose,
  asset,
  onStatusChanged,
}: ChangeStatusModalProps) {
  const [newStatus, setNewStatus] = useState<OperationalStatus>(asset.operationalStatus);
  const [updateChildren, setUpdateChildren] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const children = useMemo(() => getChildAssets(asset.id), [asset.id]);

  // Statuses that affect children
  const statusesThatAffectChildren: OperationalStatus[] = ['OutOfUse', 'Quarantined'];
  const willAffectChildren =
    statusesThatAffectChildren.includes(newStatus) &&
    children.length > 0 &&
    newStatus !== asset.operationalStatus;

  // Statuses that restore (In Use)
  const restoringStatuses: OperationalStatus[] = ['InUse'];
  const isRestoring = restoringStatuses.includes(newStatus) && newStatus !== asset.operationalStatus;

  const handleUpdate = async () => {
    if (newStatus === asset.operationalStatus) {
      showToast('Status unchanged', 'info');
      onClose();
      return;
    }

    setIsUpdating(true);

    try {
      const options: UpdateStatusOptions = {
        updateChildren: willAffectChildren && updateChildren,
      };

      const result = updateAssetStatusWithDependencies(asset.id, newStatus, options);

      if (result.updated.length > 1) {
        showToast(
          `Updated ${result.updated.length} asset(s) (${result.auditLog.length} changes logged)`,
          'success'
        );
      } else {
        showToast('Status updated successfully', 'success');
      }

      if (isRestoring) {
        showToast('Parent restored. Child assets remain unchanged.', 'info');
      }

      onStatusChanged();
      onClose();
    } catch (error: any) {
      showToast(error.message || 'Failed to update status', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const statusOptions: Array<{ value: OperationalStatus; label: string }> = [
    { value: 'InUse', label: 'In Use' },
    { value: 'OutOfUse', label: 'Out of Service' },
    { value: 'Quarantined', label: 'Quarantined' },
    { value: 'OffHirePending', label: 'Off Hire Pending' },
    { value: 'OffHired', label: 'Off Hired' },
    { value: 'Archived', label: 'Archived' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Change Asset Status"
      size="md"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Status
          </label>
          <div className="flex items-center gap-2">
            <Badge
              variant={
                asset.operationalStatus === 'InUse'
                  ? 'success'
                  : asset.operationalStatus === 'Quarantined' || asset.operationalStatus === 'OutOfUse'
                  ? 'error'
                  : 'warning'
              }
            >
              {formatOperationalStatus(asset.operationalStatus)}
            </Badge>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            New Status
          </label>
          <Select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value as OperationalStatus)}
            options={statusOptions.map((opt) => ({
              value: opt.value,
              label: opt.label,
            }))}
          />
        </div>

        {willAffectChildren && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="font-medium text-amber-900 mb-2">
                  Update dependent assets?
                </div>
                <div className="text-sm text-amber-700 mb-3">
                  This asset has {children.length} dependent asset(s). Do you want to set all
                  child assets to {formatOperationalStatus(newStatus)} as well?
                </div>
                <div className="space-y-2 mb-3">
                  {children.map((child) => (
                    <div
                      key={child.id}
                      className="flex items-center gap-2 text-sm text-gray-700"
                    >
                      <Badge variant="info">{child.assetTypeCode}</Badge>
                      <span className="font-mono">{child.id}</span>
                      <span className="text-gray-600">
                        {child.make} {child.model}
                      </span>
                    </div>
                  ))}
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={updateChildren}
                    onChange={(e) => setUpdateChildren(e.target.checked)}
                  />
                  <span className="text-sm font-medium text-amber-900">
                    Update parent + children
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        {isRestoring && children.length > 0 && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm text-blue-700">
              <strong>Note:</strong> Restoring this parent asset will not automatically restore
              its {children.length} dependent asset(s). They will remain in their current status.
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isUpdating}>
            Cancel
          </Button>
          <Button onClick={handleUpdate} disabled={isUpdating}>
            <Settings className="w-4 h-4 mr-2" />
            {isUpdating ? 'Updating...' : 'Update Status'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

