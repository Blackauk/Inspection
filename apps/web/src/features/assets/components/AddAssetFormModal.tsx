import { useState, useMemo, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';
import { FileUpload, type UploadedFile } from '../../../components/common/FileUpload';
import { getAssetTypes, mockSites, mockResponsibleTeams, createAsset } from '../services';
import { validateStatusCombination, getStatusHelperText } from '../utils/statusValidation';
import type { OperationalStatus, LifecycleStatus, ComplianceRAG, Ownership, Criticality } from '../types';
import { showToast } from '../../../components/common/Toast';

interface AddAssetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddAssetFormModal({ isOpen, onClose, onSuccess }: AddAssetFormModalProps) {
  const assetTypes = getAssetTypes();
  const [formData, setFormData] = useState({
    id: '', // Auto-generated if empty
    assetTypeId: '',
    make: '',
    model: '',
    supplierSerialNumber: '',
    siteId: '',
    operationalStatus: 'InUse' as OperationalStatus,
    lifecycleStatus: 'Active' as LifecycleStatus,
    ownership: 'Owned' as Ownership,
    responsibleTeam: '',
    criticality: 'Medium' as Criticality,
    complianceRAG: 'Green' as ComplianceRAG,
    notes: '',
    lastOnSiteAt: new Date().toISOString().split('T')[0],
    expectedArrivalDate: '',
    dateBroughtToSite: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);
  const [statusWarning, setStatusWarning] = useState<string | null>(null);

  // Validate status combination when statuses change
  useEffect(() => {
    const validation = validateStatusCombination(formData.operationalStatus, formData.lifecycleStatus);
    
    if (!validation.isValid && validation.message) {
      setStatusWarning(validation.message);
      
      // Auto-correct if suggested
      if (validation.autoCorrect) {
        if (validation.autoCorrect.operationalStatus) {
          setFormData((prev) => ({
            ...prev,
            operationalStatus: validation.autoCorrect!.operationalStatus!,
          }));
        }
        if (validation.autoCorrect.lifecycleStatus) {
          setFormData((prev) => ({
            ...prev,
            lifecycleStatus: validation.autoCorrect!.lifecycleStatus!,
          }));
        }
      }
    } else {
      setStatusWarning(null);
    }
  }, [formData.operationalStatus, formData.lifecycleStatus]);

  const statusHelperText = useMemo(() => {
    return getStatusHelperText(formData.operationalStatus, formData.lifecycleStatus);
  }, [formData.operationalStatus, formData.lifecycleStatus]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.assetTypeId) {
      newErrors.assetTypeId = 'Asset Type is required';
    }
    if (!formData.make.trim()) {
      newErrors.make = 'Make is required';
    }
    if (!formData.model.trim()) {
      newErrors.model = 'Model is required';
    }
    if (!formData.siteId) {
      newErrors.siteId = 'Site is required';
    }
    if (!formData.responsibleTeam) {
      newErrors.responsibleTeam = 'Responsible Team is required';
    }

    // Validate status combination
    const statusValidation = validateStatusCombination(formData.operationalStatus, formData.lifecycleStatus);
    if (!statusValidation.isValid) {
      newErrors.status = statusValidation.message || 'Invalid status combination';
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
      // Convert uploaded files to asset attachments format
      const assetAttachments = attachments.map((file) => ({
        id: file.id,
        filename: file.file.name,
        type: file.type,
        uri: file.preview || URL.createObjectURL(file.file),
        uploadedAt: new Date().toISOString(),
      }));

      createAsset({
        id: formData.id || undefined,
        assetTypeId: formData.assetTypeId,
        make: formData.make,
        model: formData.model,
        supplierSerialNumber: formData.supplierSerialNumber || undefined,
        siteId: formData.siteId,
        operationalStatus: formData.operationalStatus,
        lifecycleStatus: formData.lifecycleStatus,
        ownership: formData.ownership,
        responsibleTeam: formData.responsibleTeam,
        criticality: formData.criticality,
        complianceRAG: formData.complianceRAG,
        notes: formData.notes || undefined,
        lastOnSiteAt: formData.lifecycleStatus === 'Expected' ? undefined : formData.lastOnSiteAt,
        expectedArrivalDate: formData.expectedArrivalDate || undefined,
        dateBroughtToSite: formData.lifecycleStatus === 'Expected' ? undefined : (formData.dateBroughtToSite || new Date().toISOString().split('T')[0]),
        attachments: assetAttachments.length > 0 ? assetAttachments : undefined,
      });

      showToast('Asset created successfully', 'success');
      onSuccess();
      handleClose();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to create asset', 'error');
    }
  };

  const handleClose = () => {
    setFormData({
      id: '',
      assetTypeId: '',
      make: '',
      model: '',
      supplierSerialNumber: '',
      siteId: '',
      operationalStatus: 'InUse',
      lifecycleStatus: 'Active',
      ownership: 'Owned',
      responsibleTeam: '',
      criticality: 'Medium',
      complianceRAG: 'Green',
      notes: '',
      lastOnSiteAt: new Date().toISOString().split('T')[0],
      expectedArrivalDate: '',
      dateBroughtToSite: '',
    });
    setErrors({});
    setAttachments([]);
    setStatusWarning(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add 1 Asset" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Asset ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Asset ID
              <span className="text-gray-500 text-xs ml-1">(auto-generated if empty)</span>
            </label>
            <Input
              value={formData.id}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              placeholder="AST-000001"
            />
            {errors.id && <p className="text-xs text-red-600 mt-1">{errors.id}</p>}
          </div>

          {/* Asset Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Asset Type <span className="text-red-500">*</span>
            </label>
            <Select
              value={formData.assetTypeId}
              onChange={(e) => setFormData({ ...formData, assetTypeId: e.target.value })}
              options={[
                { value: '', label: 'Select Asset Type' },
                ...assetTypes.map((type) => ({
                  value: type.id,
                  label: `${type.code} - ${type.name}`,
                })),
              ]}
            />
            {errors.assetTypeId && <p className="text-xs text-red-600 mt-1">{errors.assetTypeId}</p>}
          </div>

          {/* Make */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Make <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.make}
              onChange={(e) => setFormData({ ...formData, make: e.target.value })}
              placeholder="e.g., Caterpillar"
            />
            {errors.make && <p className="text-xs text-red-600 mt-1">{errors.make}</p>}
          </div>

          {/* Model */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Model <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              placeholder="e.g., 320D"
            />
            {errors.model && <p className="text-xs text-red-600 mt-1">{errors.model}</p>}
          </div>

          {/* Serial Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Serial Number
            </label>
            <Input
              value={formData.supplierSerialNumber}
              onChange={(e) => setFormData({ ...formData, supplierSerialNumber: e.target.value })}
              placeholder="Optional"
            />
          </div>

          {/* Site */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Site <span className="text-red-500">*</span>
            </label>
            <Select
              value={formData.siteId}
              onChange={(e) => setFormData({ ...formData, siteId: e.target.value })}
              options={[
                { value: '', label: 'Select Site' },
                ...mockSites.map((site) => ({
                  value: site.id,
                  label: site.name,
                })),
              ]}
            />
            {errors.siteId && <p className="text-xs text-red-600 mt-1">{errors.siteId}</p>}
          </div>

          {/* Operational Status */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Operational Status <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  const event = new CustomEvent('openHelp', { detail: { articleId: 'operational-vs-lifecycle-status' } });
                  window.dispatchEvent(event);
                }}
                className="text-blue-600 hover:text-blue-700"
                title="Learn about statuses"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>
            <Select
              value={formData.operationalStatus}
              onChange={(e) => setFormData({ ...formData, operationalStatus: e.target.value as OperationalStatus })}
              options={[
                { value: 'InUse', label: 'In Use' },
                { value: 'OutOfUse', label: 'Out of Use' },
                { value: 'OffHirePending', label: 'Off Hire Pending' },
                { value: 'OffHired', label: 'Off Hired' },
                { value: 'Quarantined', label: 'Quarantined' },
                { value: 'Archived', label: 'Archived' },
              ]}
            />
            {statusHelperText && (
              <p className="text-xs text-amber-600 mt-1">
                {statusHelperText}{' '}
                <button
                  type="button"
                  onClick={() => {
                    const event = new CustomEvent('openHelp', { detail: { articleId: 'operational-vs-lifecycle-status' } });
                    window.dispatchEvent(event);
                  }}
                  className="text-blue-600 hover:underline"
                >
                  Why?
                </button>
              </p>
            )}
          </div>

          {/* Lifecycle Status */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Lifecycle Status
              </label>
              <button
                type="button"
                onClick={() => {
                  // Open help panel with the status article
                  const event = new CustomEvent('openHelp', { detail: { articleId: 'operational-vs-lifecycle-status' } });
                  window.dispatchEvent(event);
                }}
                className="text-blue-600 hover:text-blue-700"
                title="Learn about statuses"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>
            <Select
              value={formData.lifecycleStatus}
              onChange={(e) => setFormData({ ...formData, lifecycleStatus: e.target.value as LifecycleStatus })}
              options={[
                { value: 'Active', label: 'Active / On Site' },
                { value: 'Expected', label: 'Expected / Not Yet On Site' },
                { value: 'Decommissioned', label: 'Decommissioned' },
                { value: 'Disposed', label: 'Disposed' },
              ]}
            />
            {statusHelperText && (
              <p className="text-xs text-amber-600 mt-1">{statusHelperText}</p>
            )}
            {statusWarning && (
              <p className="text-xs text-red-600 mt-1">{statusWarning}</p>
            )}
          </div>

          {/* Expected Arrival Date (only show if Expected) */}
          {formData.lifecycleStatus === 'Expected' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expected Arrival Date
              </label>
              <Input
                type="date"
                value={formData.expectedArrivalDate}
                onChange={(e) => setFormData({ ...formData, expectedArrivalDate: e.target.value })}
              />
            </div>
          )}

          {/* Ownership */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ownership <span className="text-red-500">*</span>
            </label>
            <Select
              value={formData.ownership}
              onChange={(e) => setFormData({ ...formData, ownership: e.target.value as Ownership })}
              options={[
                { value: 'Owned', label: 'Owned' },
                { value: 'Hired', label: 'Hired' },
              ]}
            />
          </div>

          {/* Responsible Team */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Responsible Team <span className="text-red-500">*</span>
            </label>
            <Select
              value={formData.responsibleTeam}
              onChange={(e) => setFormData({ ...formData, responsibleTeam: e.target.value })}
              options={[
                { value: '', label: 'Select Team' },
                ...mockResponsibleTeams.map((team) => ({
                  value: team,
                  label: team,
                })),
              ]}
            />
            {errors.responsibleTeam && <p className="text-xs text-red-600 mt-1">{errors.responsibleTeam}</p>}
          </div>

          {/* Criticality */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Criticality <span className="text-red-500">*</span>
            </label>
            <Select
              value={formData.criticality}
              onChange={(e) => setFormData({ ...formData, criticality: e.target.value as Criticality })}
              options={[
                { value: 'Low', label: 'Low' },
                { value: 'Medium', label: 'Medium' },
                { value: 'High', label: 'High' },
              ]}
            />
          </div>

          {/* Compliance RAG */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Compliance RAG
            </label>
            <Select
              value={formData.complianceRAG}
              onChange={(e) => setFormData({ ...formData, complianceRAG: e.target.value as ComplianceRAG })}
              options={[
                { value: 'Green', label: 'Green' },
                { value: 'Amber', label: 'Amber' },
                { value: 'Red', label: 'Red' },
              ]}
            />
          </div>

          {/* Date Brought to Site */}
          {formData.lifecycleStatus !== 'Expected' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Brought to Site
              </label>
              <Input
                type="date"
                value={formData.dateBroughtToSite || new Date().toISOString().split('T')[0]}
                onChange={(e) => setFormData({ ...formData, dateBroughtToSite: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">Defaults to today for new assets</p>
            </div>
          )}

          {/* Last On Site At */}
          {formData.lifecycleStatus !== 'Expected' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last On Site At
              </label>
              <Input
                type="date"
                value={formData.lastOnSiteAt}
                onChange={(e) => setFormData({ ...formData, lastOnSiteAt: e.target.value })}
              />
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            placeholder="Optional notes about this asset"
          />
        </div>

        {/* Attachments */}
        <FileUpload
          files={attachments}
          onFilesChange={setAttachments}
          label="Photos & Documents"
        />

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit">
            Create Asset
          </Button>
        </div>
      </form>
    </Modal>
  );
}
