import { useState } from 'react';
import { ClipboardCheck } from 'lucide-react';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { Select } from '../../../components/common/Select';
import { showToast } from '../../../components/common/Toast';
import { useNavigate } from 'react-router-dom';
import { getCheckSheetTemplates } from '../../inspections/services';

interface StartInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  assetId: string;
  assetTypeCode: string;
}

export function StartInspectionModal({
  isOpen,
  onClose,
  assetId,
  assetTypeCode,
}: StartInspectionModalProps) {
  const navigate = useNavigate();
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  // Get templates that match the asset type or are generic
  const templates = getCheckSheetTemplates().filter(
    (t) => !t.assetTypeCodes || t.assetTypeCodes.length === 0 || t.assetTypeCodes.includes(assetTypeCode)
  );

  const handleStart = () => {
    if (!selectedTemplateId) {
      showToast('Please select an inspection template', 'error');
      return;
    }

    // Navigate to start inspection page with template and asset pre-filled
    navigate(`/inspections/start?templateId=${selectedTemplateId}&assetId=${assetId}`);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Start Inspection"
      size="md"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Inspection Template
          </label>
          <Select
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
            options={[
              { value: '', label: '-- Select Template --' },
              ...templates.map((t) => ({
                value: t.id,
                label: t.name,
              })),
            ]}
          />
          {templates.length === 0 && (
            <p className="text-sm text-gray-500 mt-2">
              No templates available for this asset type.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleStart} disabled={!selectedTemplateId}>
            <ClipboardCheck className="w-4 h-4 mr-2" />
            Start Inspection
          </Button>
        </div>
      </div>
    </Modal>
  );
}

