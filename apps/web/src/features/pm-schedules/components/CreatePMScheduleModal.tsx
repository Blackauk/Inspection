import { useState, useEffect } from 'react';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';
import { SearchableSelect } from '../../../components/common/SearchableSelect';
import { Textarea } from '../../../components/common/Textarea';
import { getAssets, getAssetTypes, mockSites, getAssetById } from '../../assets/services';
import { createPMSchedule } from '../services';
import { showToast } from '../../../components/common/Toast';
import type { ScheduleType } from '@ppm/shared';

interface CreatePMScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (scheduleId: string) => void;
}

const frequencyOptions = [
  { value: 'Daily', label: 'Daily' },
  { value: 'Weekly', label: 'Weekly' },
  { value: 'Monthly', label: 'Monthly' },
  { value: 'Quarterly', label: 'Quarterly' },
  { value: '6-Monthly', label: '6-Monthly' },
  { value: 'Annually', label: 'Annually' },
];

const frequencyToDays: Record<string, number> = {
  Daily: 1,
  Weekly: 7,
  Monthly: 30,
  Quarterly: 90,
  '6-Monthly': 180,
  Annually: 365,
};

const mockResponsibleTeams = [
  'Plant Team',
  'Electrical',
  'Workshop',
  'Heavy Plant',
  'Maintenance',
];

export function CreatePMScheduleModal({ isOpen, onClose, onSuccess }: CreatePMScheduleModalProps) {
  const assets = getAssets({});
  const assetTypes = getAssetTypes();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    assetId: '',
    siteId: '',
    frequency: 'Monthly' as string,
    startDate: new Date().toISOString().split('T')[0],
    nextDueDate: '',
    assignedTeam: '',
    notes: '',
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-fill site when asset is selected
  useEffect(() => {
    if (formData.assetId) {
      const asset = getAssetById(formData.assetId);
      if (asset) {
        setFormData((prev) => ({ ...prev, siteId: asset.siteId }));
      }
    }
  }, [formData.assetId]);

  // Calculate next due date from start date + frequency
  useEffect(() => {
    if (formData.startDate && formData.frequency && frequencyToDays[formData.frequency]) {
      const start = new Date(formData.startDate);
      const days = frequencyToDays[formData.frequency];
      const nextDue = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
      setFormData((prev) => ({
        ...prev,
        nextDueDate: nextDue.toISOString().split('T')[0],
      }));
    }
  }, [formData.startDate, formData.frequency]);

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Schedule name is required';
    }
    if (!formData.assetId) {
      newErrors.assetId = 'Asset is required';
    }
    if (!formData.siteId) {
      newErrors.siteId = 'Site is required';
    }
    if (!formData.frequency) {
      newErrors.frequency = 'Frequency is required';
    }
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }
    if (!formData.nextDueDate) {
      newErrors.nextDueDate = 'Next due date is required';
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
      const asset = getAssetById(formData.assetId);
      if (!asset) {
        showToast('Selected asset not found', 'error');
        return;
      }

      const scheduleId = createPMSchedule({
        name: formData.name,
        description: formData.description || undefined,
        assetId: formData.assetId,
        siteId: formData.siteId,
        frequency: formData.frequency,
        startDate: formData.startDate,
        nextDueDate: formData.nextDueDate,
        assignedTeam: formData.assignedTeam || undefined,
        notes: formData.notes || undefined,
        isActive: formData.isActive,
      });

      showToast('PM schedule created', 'success');
      onSuccess?.(scheduleId);
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        assetId: '',
        siteId: '',
        frequency: 'Monthly',
        startDate: new Date().toISOString().split('T')[0],
        nextDueDate: '',
        assignedTeam: '',
        notes: '',
        isActive: true,
      });
      setErrors({});
      onClose();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to create PM schedule', 'error');
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create PM Schedule" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Schedule Name *"
          value={formData.name}
          onChange={(e) => handleFieldChange('name', e.target.value)}
          error={errors.name}
          placeholder="e.g., Weekly MEWP Inspection"
        />

        <Textarea
          label="Description"
          value={formData.description}
          onChange={(e) => handleFieldChange('description', e.target.value)}
          rows={3}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SearchableSelect
            label="Asset *"
            value={formData.assetId}
            onChange={(value) => handleFieldChange('assetId', value)}
            error={errors.assetId}
            placeholder="Search assets..."
            options={assets.map((asset) => ({
              value: asset.id,
              label: `${asset.assetTypeCode} ${asset.id} - ${asset.make} ${asset.model}`,
              subtitle: asset.siteName ? `Site: ${asset.siteName}` : undefined,
            }))}
          />

          <Select
            label="Site *"
            value={formData.siteId}
            onChange={(e) => handleFieldChange('siteId', e.target.value)}
            error={errors.siteId}
            options={[
              { value: '', label: 'Select Site' },
              ...mockSites.map((site) => ({ value: site.id, label: site.name })),
            ]}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Frequency *"
            value={formData.frequency}
            onChange={(e) => handleFieldChange('frequency', e.target.value)}
            error={errors.frequency}
            options={frequencyOptions}
          />

          <Select
            label="Responsible Team"
            value={formData.assignedTeam}
            onChange={(e) => handleFieldChange('assignedTeam', e.target.value)}
            options={[
              { value: '', label: 'Unassigned' },
              ...mockResponsibleTeams.map((team) => ({ value: team, label: team })),
            ]}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Start Date *"
            type="date"
            value={formData.startDate}
            onChange={(e) => handleFieldChange('startDate', e.target.value)}
            error={errors.startDate}
          />

          <Input
            label="Next Due Date *"
            type="date"
            value={formData.nextDueDate}
            onChange={(e) => handleFieldChange('nextDueDate', e.target.value)}
            error={errors.nextDueDate}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => handleFieldChange('isActive', e.target.checked)}
            className="rounded"
          />
          <label htmlFor="isActive" className="text-sm text-gray-700">
            Active (uncheck to pause this schedule)
          </label>
        </div>

        <Textarea
          label="Notes"
          value={formData.notes}
          onChange={(e) => handleFieldChange('notes', e.target.value)}
          rows={2}
        />

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Create PM Schedule
          </Button>
        </div>
      </form>
    </Modal>
  );
}
