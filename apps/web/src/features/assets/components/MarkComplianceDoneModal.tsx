import { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Textarea } from '../../../components/common/Textarea';
import { showToast } from '../../../components/common/Toast';
import { markComplianceItemDone } from '../services';
import type { ComplianceItem } from '../types';

interface MarkComplianceDoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ComplianceItem;
  onDone: () => void;
}

export function MarkComplianceDoneModal({
  isOpen,
  onClose,
  item,
  onDone,
}: MarkComplianceDoneModalProps) {
  const [formData, setFormData] = useState({
    doneDate: new Date().toISOString().split('T')[0],
    evidenceDocumentName: '',
    notes: '',
    performedBy: '',
  });

  const handleMarkDone = () => {
    try {
      markComplianceItemDone(
        item.id,
        formData.doneDate,
        undefined, // evidenceDocumentId - would be set if file uploaded
        formData.evidenceDocumentName || undefined,
        formData.notes || undefined,
        formData.performedBy || undefined
      );

      showToast('Compliance item marked as done', 'success');
      setFormData({
        doneDate: new Date().toISOString().split('T')[0],
        evidenceDocumentName: '',
        notes: '',
        performedBy: '',
      });
      onDone();
      onClose();
    } catch (error: any) {
      showToast(error.message || 'Failed to mark item as done', 'error');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Mark Compliance Item as Done"
      size="md"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Compliance Item
          </label>
          <div className="font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded border border-gray-200">
            {item.itemName}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Done Date <span className="text-red-500">*</span>
          </label>
          <Input
            type="date"
            value={formData.doneDate}
            onChange={(e) => setFormData({ ...formData, doneDate: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Evidence Document (optional)
          </label>
          <Input
            value={formData.evidenceDocumentName}
            onChange={(e) => setFormData({ ...formData, evidenceDocumentName: e.target.value })}
            placeholder="Document name or reference"
          />
          <p className="text-xs text-gray-500 mt-1">
            Upload document separately and reference it here, or enter document name
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Performed By (optional)
          </label>
          <Input
            value={formData.performedBy}
            onChange={(e) => setFormData({ ...formData, performedBy: e.target.value })}
            placeholder="Inspector name or company"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Additional notes about this compliance check..."
            rows={3}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleMarkDone}>
            <CheckCircle className="w-4 h-4 mr-2" />
            Mark as Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}


