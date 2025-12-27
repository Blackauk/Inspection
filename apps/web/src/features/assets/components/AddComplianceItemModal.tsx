import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';
import { Textarea } from '../../../components/common/Textarea';
import { showToast } from '../../../components/common/Toast';
import { createComplianceItem } from '../services';
import type { ComplianceType } from '../types';

interface AddComplianceItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  assetId: string;
  onAdd: () => void;
}

export function AddComplianceItemModal({
  isOpen,
  onClose,
  assetId,
  onAdd,
}: AddComplianceItemModalProps) {
  const [formData, setFormData] = useState({
    complianceType: 'PUWER' as ComplianceType,
    itemName: '',
    frequencyValue: 12,
    frequencyUnit: 'months' as 'days' | 'weeks' | 'months' | 'years',
    standardReference: '',
    notes: '',
    customTypeName: '',
  });

  const handleSave = () => {
    if (!formData.itemName) {
      showToast('Item name is required', 'error');
      return;
    }

    try {
      const finalItemName = formData.complianceType === 'Custom' 
        ? formData.customTypeName 
        : (formData.itemName || getDefaultItemName(formData.complianceType));

      createComplianceItem(assetId, {
        complianceType: formData.complianceType,
        itemName: finalItemName,
        frequencyValue: formData.frequencyValue,
        frequencyUnit: formData.frequencyUnit,
        standardReference: formData.standardReference || (formData.complianceType === 'Custom' ? '' : formData.complianceType),
        notes: formData.notes || undefined,
      });

      showToast('Compliance item added successfully', 'success');
      setFormData({
        complianceType: 'PUWER',
        itemName: '',
        frequencyValue: 12,
        frequencyUnit: 'months',
        standardReference: '',
        notes: '',
        customTypeName: '',
      });
      onAdd();
      onClose();
    } catch (error: any) {
      showToast(error.message || 'Failed to add compliance item', 'error');
    }
  };

  const getDefaultItemName = (type: ComplianceType) => {
    switch (type) {
      case 'PUWER':
        return 'PUWER Inspection';
      case 'LOLER':
        return 'LOLER Thorough Examination';
      case 'FIRE_SUPPRESSION':
        return 'Fire Suppression System Service';
      default:
        return '';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Compliance Item"
      size="md"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Compliance Type <span className="text-red-500">*</span>
          </label>
          <Select
            value={formData.complianceType}
            onChange={(e) => {
              const type = e.target.value as ComplianceType;
              setFormData({
                ...formData,
                complianceType: type,
                itemName: getDefaultItemName(type),
                standardReference: type === 'Custom' ? '' : type,
              });
            }}
            options={[
              { value: 'PUWER', label: 'PUWER' },
              { value: 'LOLER', label: 'LOLER' },
              { value: 'FIRE_SUPPRESSION', label: 'Fire Suppression' },
              { value: 'Custom', label: 'Custom' },
            ]}
          />
        </div>

        {formData.complianceType === 'Custom' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Item Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.customTypeName}
              onChange={(e) => setFormData({ ...formData, customTypeName: e.target.value })}
              placeholder="Enter compliance item name"
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Item Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.itemName}
              onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
              placeholder={getDefaultItemName(formData.complianceType)}
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Frequency Value <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              min="1"
              value={formData.frequencyValue}
              onChange={(e) => setFormData({ ...formData, frequencyValue: parseInt(e.target.value) || 1 })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Frequency Unit <span className="text-red-500">*</span>
            </label>
            <Select
              value={formData.frequencyUnit}
              onChange={(e) => setFormData({ ...formData, frequencyUnit: e.target.value as any })}
              options={[
                { value: 'days', label: 'Days' },
                { value: 'weeks', label: 'Weeks' },
                { value: 'months', label: 'Months' },
                { value: 'years', label: 'Years' },
              ]}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Standard / Reference
          </label>
          <Input
            value={formData.standardReference}
            onChange={(e) => setFormData({ ...formData, standardReference: e.target.value })}
            placeholder={formData.complianceType === 'Custom' ? 'e.g., ISO, BS Standard' : formData.complianceType}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Additional notes..."
            rows={3}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Plus className="w-4 h-4 mr-2" />
            Add Compliance Item
          </Button>
        </div>
      </div>
    </Modal>
  );
}

