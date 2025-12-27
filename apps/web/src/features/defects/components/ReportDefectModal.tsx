import { useState, useEffect } from 'react';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Combobox } from '../../../components/common/Combobox';
import { Select } from '../../../components/common/Select';
import { FileUpload, type UploadedFile } from '../../../components/common/FileUpload';
import { getAssets, mockSites } from '../../assets/services';
import { useAuth } from '../../../contexts/AuthContext';
import { useDefects } from '../context/DefectsContext';
import { showToast } from '../../../components/common/Toast';
import type { DefectSeverity, SeverityModel } from '../types';

interface ReportDefectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (defectId: string) => void;
  prefillAssetId?: string;
  onCloseWithoutSubmit?: () => void; // For "Submit & Add Another" - closes without calling onClose
}

export function ReportDefectModal({ isOpen, onClose, onSuccess, prefillAssetId, onCloseWithoutSubmit }: ReportDefectModalProps) {
  const { user } = useAuth();
  const { createNewDefect, settings } = useDefects();
  const assets = getAssets({});
  
  // Get default severity model from settings
  const severityModel: SeverityModel = settings?.severityModelDefault || 'LMH';
  const severityOptions = severityModel === 'LMH' 
    ? ['Low', 'Medium', 'High'] as const
    : ['Minor', 'Major', 'Critical'] as const;
  
  // Determine default site from user's siteIds or first site
  const defaultSiteId = user?.siteIds?.[0] || mockSites[0]?.id || '';
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assetId: prefillAssetId || '',
    siteId: defaultSiteId,
    severity: (severityModel === 'LMH' ? 'Medium' : 'Major') as DefectSeverity,
    severityModel,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [persistedSiteId, setPersistedSiteId] = useState<string>(defaultSiteId);

  // Update form when prefillAssetId changes or modal opens
  useEffect(() => {
    if (isOpen) {
      if (prefillAssetId) {
        const asset = assets.find((a) => a.id === prefillAssetId);
        if (asset) {
          setFormData((prev) => ({
            ...prev,
            assetId: asset.id,
            siteId: asset.siteId || defaultSiteId,
          }));
          setPersistedSiteId(asset.siteId || defaultSiteId);
        }
      } else {
        // Reset form, but use persisted site if available
        setFormData((prev) => ({
          ...prev,
          assetId: '',
          siteId: persistedSiteId || defaultSiteId,
          title: '',
          description: '',
        }));
      }
      setHasUnsavedChanges(false);
      setErrors({});
      setAttachments([]);
    }
  }, [prefillAssetId, isOpen, assets, defaultSiteId, persistedSiteId]);

  // Update severity model when settings change
  useEffect(() => {
    if (settings?.severityModelDefault) {
      setFormData((prev) => ({
        ...prev,
        severityModel: settings.severityModelDefault,
        severity: settings.severityModelDefault === 'LMH' ? 'Medium' : 'Major',
      }));
    }
  }, [settings]);

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Defect Title is required';
    }
    if (!formData.description?.trim()) {
      newErrors.description = 'Defect Description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent, addAnother: boolean = false) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    if (!user) {
      showToast('You must be logged in to report a defect', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert attachments to defect attachments format
      const defectAttachments = attachments.map((file) => ({
        id: Math.random().toString(36).substr(2, 9),
        type: file.type === 'photo' ? 'photo' as const : 'document' as const,
        filename: file.file.name,
        uri: file.preview || URL.createObjectURL(file.file),
        createdAt: new Date().toISOString(),
      }));

      const newDefect = await createNewDefect({
        title: formData.title.trim(),
        description: formData.description?.trim() || '',
        assetId: formData.assetId || undefined,
        siteId: formData.siteId || undefined,
        severityModel: formData.severityModel,
        severity: formData.severity,
        status: 'Open',
        complianceTags: [],
        actions: [],
        attachments: defectAttachments,
        beforeAfterRequired: settings?.beforeAfterRequired || false,
        reopenedCount: 0,
        createdAt: new Date().toISOString(),
        createdBy: user.id,
        createdByName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        updatedAt: new Date().toISOString(),
        updatedBy: user.id,
        updatedByName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      } as any);

      showToast('Defect reported successfully', 'success');
      setHasUnsavedChanges(false);
      onSuccess?.(newDefect.id);

      if (addAnother) {
        // Persist site selection, optionally persist asset
        const persistedAsset = formData.assetId || '';
        setPersistedSiteId(formData.siteId);
        
        // Reset form but keep site/asset
        setFormData({
          title: '',
          description: '',
          assetId: persistedAsset, // Keep asset if selected
          siteId: formData.siteId, // Keep site
          severity: (severityModel === 'LMH' ? 'Medium' : 'Major') as DefectSeverity,
          severityModel,
        });
        setAttachments([]);
        setErrors({});
        setHasUnsavedChanges(false);
      } else {
        handleClose();
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to report defect', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      if (!window.confirm('You have unsaved changes. Discard changes?')) {
        return;
      }
    }
    setFormData({
      title: '',
      description: '',
      assetId: prefillAssetId || '',
      siteId: defaultSiteId,
      severity: (severityModel === 'LMH' ? 'Medium' : 'Major') as DefectSeverity,
      severityModel,
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

  // Current severity options based on model
  const currentSeverityOptions = formData.severityModel === 'LMH'
    ? ['Low', 'Medium', 'High']
    : ['Minor', 'Major', 'Critical'];

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Report Defect" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Title */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Defect Title <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.title}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              placeholder="e.g., Hydraulic leak detected"
            />
            {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title}</p>}
          </div>

          {/* Asset */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Asset (Optional)
            </label>
            <Combobox
              value={formData.assetId}
              onChange={(value) => {
                const asset = assets.find((a) => a.id === value);
                handleFieldChange('assetId', value);
                if (asset) {
                  handleFieldChange('siteId', asset.siteId || defaultSiteId);
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
            />
          </div>

          {/* Site */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Site
            </label>
            <Select
              value={formData.siteId}
              onChange={(e) => handleFieldChange('siteId', e.target.value)}
              disabled={!!prefillAssetId && !!selectedAsset}
              options={[
                { value: '', label: 'Select Site' },
                ...availableSites.map((site) => ({
                  value: site.id,
                  label: site.name,
                })),
              ]}
            />
          </div>

          {/* Severity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority <span className="text-red-500">*</span>
            </label>
            <Select
              value={formData.severity}
              onChange={(e) => handleFieldChange('severity', e.target.value as DefectSeverity)}
              options={currentSeverityOptions.map((s) => ({
                value: s,
                label: s === 'High' || s === 'Critical' ? `${s} (Safety-Critical)` : s,
              }))}
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Defect Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder:text-gray-500"
            rows={4}
            placeholder="Describe the defect in detail..."
            style={{ scrollbarColor: '#cbd5e0 #f9fafb' }}
          />
          {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description}</p>}
        </div>

        {/* Photo Upload */}
        <FileUpload
          files={attachments.filter((f) => f.type === 'photo')}
          onFilesChange={(files) => {
            const allFiles = [...attachments.filter((f) => f.type !== 'photo'), ...files];
            setAttachments(allFiles);
            setHasUnsavedChanges(true);
          }}
          accept="image/*"
          label="Photos (Optional)"
        />

        {/* Actions */}
        <div className="flex justify-between gap-3 pt-4 border-t border-gray-200">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleClose} 
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <div className="flex gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={(e) => {
                e.preventDefault();
                handleSubmit(e as any, true);
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit & Add Another'}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Defect'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

