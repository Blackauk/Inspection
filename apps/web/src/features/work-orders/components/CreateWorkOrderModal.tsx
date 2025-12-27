import { useState, useEffect } from 'react';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';
import { Combobox } from '../../../components/common/Combobox';
import { DatePicker } from '../../../components/common/DatePicker';
import { FileUpload, type UploadedFile } from '../../../components/common/FileUpload';
import { getAssets, mockSites } from '../../assets/services';
import { useAuth } from '../../../contexts/AuthContext';
import { createWorkOrder } from '../services';
import { showToast } from '../../../components/common/Toast';
import type { WorkOrderPriority } from '../types';
import type { WorkOrderType, WorkOrderStatus } from '@ppm/shared';

interface CreateWorkOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (workOrderId: string) => void;
  prefillAssetId?: string;
}

export function CreateWorkOrderModal({ isOpen, onClose, onSuccess, prefillAssetId }: CreateWorkOrderModalProps) {
  const { user } = useAuth();
  const assets = getAssets({});
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assetId: prefillAssetId || '',
    siteId: '',
    category: '',
    type: 'Corrective' as WorkOrderType,
    priority: 'Medium' as WorkOrderPriority,
    status: 'Open' as WorkOrderStatus,
    assignedToId: '',
    dueDate: '',
    targetStart: '',
    assetIsolated: false,
    permitRequired: false,
    steps: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Update form when prefillAssetId changes
  useEffect(() => {
    if (prefillAssetId && isOpen) {
      const asset = assets.find((a) => a.id === prefillAssetId);
      if (asset) {
        setFormData((prev) => ({
          ...prev,
          assetId: asset.id,
          siteId: asset.siteId,
        }));
      }
    }
  }, [prefillAssetId, isOpen, assets]);

  // Track unsaved changes
  useEffect(() => {
    if (isOpen) {
      setHasUnsavedChanges(false);
    }
  }, [isOpen]);

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.assetId) {
      newErrors.assetId = 'Asset is required';
    }
    if (!formData.siteId) {
      newErrors.siteId = 'Site is required';
    }
    if (!formData.dueDate) {
      newErrors.dueDate = 'Due Date is required';
    }
    if (!formData.priority) {
      newErrors.priority = 'Priority is required';
    }
    if (!formData.type) {
      newErrors.type = 'Type is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    // Validate Target Start is not after Due Date
    if (formData.targetStart && formData.dueDate) {
      const targetStartDate = new Date(formData.targetStart);
      const dueDate = new Date(formData.dueDate);
      if (targetStartDate > dueDate) {
        newErrors.targetStart = 'Target Start date cannot be after Due Date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      const asset = assets.find((a) => a.id === formData.assetId);
      if (!asset) {
        showToast('Selected asset not found', 'error');
        return;
      }

      const site = mockSites.find((s) => s.id === formData.siteId);
      if (!site) {
        showToast('Selected site not found', 'error');
        return;
      }

      // Convert attachments
      const workOrderAttachments = attachments.map((file) => ({
        id: file.id,
        filename: file.file.name,
        type: file.type,
        uri: file.preview || URL.createObjectURL(file.file),
        uploadedAt: new Date().toISOString(),
      }));

      const workOrder = createWorkOrder({
        title: formData.title,
        description: formData.description,
        assetId: asset.id,
        siteId: site.id,
        category: formData.category || undefined,
        type: formData.type,
        priority: formData.priority,
        status: formData.status,
        assignedToId: formData.assignedToId || undefined,
        dueDate: formData.dueDate,
        targetStart: formData.targetStart || undefined,
        assetIsolated: formData.assetIsolated,
        permitRequired: formData.permitRequired,
        steps: formData.steps || undefined,
        attachments: workOrderAttachments.length > 0 ? workOrderAttachments : undefined,
        createdById: user?.id || 'unknown',
        createdByName: user ? (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email || 'Unknown User') : 'Unknown User',
      });

      showToast('Work order created successfully', 'success');
      setHasUnsavedChanges(false);
      onSuccess?.(workOrder.id);
      handleClose();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to create work order', 'error');
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      if (!window.confirm('Discard changes?')) {
        return;
      }
    }
    setFormData({
      title: '',
      description: '',
      assetId: prefillAssetId || '',
      siteId: '',
      category: '',
      type: 'Corrective',
      priority: 'Medium',
      status: 'Open',
      assignedToId: '',
      dueDate: '',
      targetStart: '',
      assetIsolated: false,
      permitRequired: false,
      steps: '',
    });
    setErrors({});
    setAttachments([]);
    setHasUnsavedChanges(false);
    onClose();
  };

  const selectedAsset = assets.find((a) => a.id === formData.assetId);
  const availableSites = formData.assetId && selectedAsset
    ? mockSites.filter((s) => s.id === selectedAsset.siteId)
    : mockSites;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Work Order" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Work Order ID (auto-generated, read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Work Order ID
            </label>
            <Input
              value="(Auto-generated)"
              disabled
              className="bg-gray-100"
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title / Summary <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.title}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              placeholder="e.g., Replace hydraulic filter"
            />
            {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title}</p>}
          </div>

          {/* Asset */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Asset <span className="text-red-500">*</span>
            </label>
            <Combobox
              value={formData.assetId}
              onChange={(value) => {
                const asset = assets.find((a) => a.id === value);
                handleFieldChange('assetId', value);
                if (asset) {
                  handleFieldChange('siteId', asset.siteId);
                }
              }}
              disabled={!!prefillAssetId}
              placeholder="Search assets by name or ID..."
              options={assets.map((asset) => ({
                value: asset.id,
                label: `${asset.make} ${asset.model} (${asset.id})`,
                searchText: `${asset.id} ${asset.make} ${asset.model} ${asset.assetTypeCode}`,
              }))}
              displayValue={(option) => {
                if (!option) return '';
                const asset = assets.find((a) => a.id === option.value);
                return asset ? `${asset.make} ${asset.model} (${asset.id})` : option.label;
              }}
              error={errors.assetId}
            />
          </div>

          {/* Site */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Site <span className="text-red-500">*</span>
            </label>
            <Select
              value={formData.siteId}
              onChange={(e) => handleFieldChange('siteId', e.target.value)}
              disabled={!!prefillAssetId}
              options={[
                { value: '', label: 'Select Site' },
                ...availableSites.map((site) => ({
                  value: site.id,
                  label: site.name,
                })),
              ]}
            />
            {errors.siteId && <p className="text-xs text-red-600 mt-1">{errors.siteId}</p>}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <Select
              value={formData.category}
              onChange={(e) => handleFieldChange('category', e.target.value)}
              options={[
                { value: '', label: 'Select Category' },
                { value: 'Mechanical', label: 'Mechanical' },
                { value: 'Electrical', label: 'Electrical' },
                { value: 'Hydraulic', label: 'Hydraulic' },
                { value: 'Inspection', label: 'Inspection' },
                { value: 'Safety', label: 'Safety' },
                { value: 'Other', label: 'Other' },
              ]}
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type <span className="text-red-500">*</span>
            </label>
            <Select
              value={formData.type}
              onChange={(e) => handleFieldChange('type', e.target.value as WorkOrderType)}
              options={[
                { value: 'Corrective', label: 'Corrective' },
                { value: 'Preventive', label: 'Preventive' },
                { value: 'Inspection', label: 'Inspection' },
                { value: 'Breakdown', label: 'Breakdown' },
                { value: 'Planned', label: 'Planned' },
              ]}
            />
            {errors.type && <p className="text-xs text-red-600 mt-1">{errors.type}</p>}
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority <span className="text-red-500">*</span>
            </label>
            <Select
              value={formData.priority}
              onChange={(e) => handleFieldChange('priority', e.target.value as WorkOrderPriority)}
              options={[
                { value: 'Low', label: 'Low' },
                { value: 'Medium', label: 'Medium' },
                { value: 'High', label: 'High' },
                { value: 'Critical', label: 'Critical' },
              ]}
            />
            {errors.priority && <p className="text-xs text-red-600 mt-1">{errors.priority}</p>}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <Select
              value={formData.status}
              onChange={(e) => handleFieldChange('status', e.target.value as WorkOrderStatus)}
              options={[
                { value: 'Open', label: 'Open' },
                { value: 'Assigned', label: 'Assigned' },
                { value: 'InProgress', label: 'In Progress' },
              ]}
            />
          </div>

          {/* Assigned To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assigned To
            </label>
            <Select
              value={formData.assignedToId}
              onChange={(e) => handleFieldChange('assignedToId', e.target.value)}
              options={[
                { value: '', label: 'Unassigned' },
                { value: 'user-1', label: 'John Smith' },
                { value: 'user-2', label: 'Sarah Johnson' },
                { value: 'user-3', label: 'Mike Davis' },
                { value: 'user-4', label: 'Emma Wilson' },
              ]}
            />
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date <span className="text-red-500">*</span>
            </label>
            <DatePicker
              value={formData.dueDate}
              onChange={(value) => handleFieldChange('dueDate', value)}
              placeholder="Select due date"
              required
              error={errors.dueDate}
            />
          </div>

          {/* Target Start */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Start
            </label>
            <DatePicker
              value={formData.targetStart}
              onChange={(value) => handleFieldChange('targetStart', value)}
              placeholder="Select target start date"
              maxDate={formData.dueDate ? new Date(formData.dueDate + 'T23:59:59') : undefined}
              error={errors.targetStart}
            />
            {errors.targetStart && <p className="text-xs text-red-600 mt-1">{errors.targetStart}</p>}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Detailed Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder:text-gray-500"
            rows={4}
            placeholder="Describe the work required..."
            style={{ scrollbarColor: '#cbd5e0 #f9fafb' }}
          />
          {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description}</p>}
        </div>

        {/* Steps / Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Steps / Notes
          </label>
          <textarea
            value={formData.steps}
            onChange={(e) => handleFieldChange('steps', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder:text-gray-500"
            rows={3}
            placeholder="Optional steps or additional notes..."
            style={{ scrollbarColor: '#cbd5e0 #f9fafb' }}
          />
        </div>

        {/* Safety / Controls */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Safety / Controls
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.assetIsolated}
              onChange={(e) => handleFieldChange('assetIsolated', e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-700">Asset isolated / LOTO required?</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.permitRequired}
              onChange={(e) => handleFieldChange('permitRequired', e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-700">Permit required?</span>
          </label>
        </div>

        {/* Attachments */}
        <FileUpload
          files={attachments}
          onFilesChange={(files) => {
            setAttachments(files);
            setHasUnsavedChanges(true);
          }}
          label="Photos & Documents"
        />

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit">
            Create Work Order
          </Button>
        </div>
      </form>
    </Modal>
  );
}
