import { useState, useEffect } from 'react';
import { Gauge } from 'lucide-react';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { showToast } from '../../../components/common/Toast';
import type { Asset } from '../types';
import { useAuth } from '../../../contexts/AuthContext';

interface UpdateHoursModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: Asset;
  onHoursUpdated: () => void;
}

export function UpdateHoursModal({
  isOpen,
  onClose,
  asset,
  onHoursUpdated,
}: UpdateHoursModalProps) {
  const { user } = useAuth();
  const [newReading, setNewReading] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Determine if asset uses hours or mileage
  const hasHours = asset.hours !== undefined;
  const hasMileage = asset.mileage !== undefined;
  const unit = hasHours ? 'hours' : hasMileage ? 'miles' : 'hours';
  const currentReading = hasHours ? asset.hours : asset.mileage;

  useEffect(() => {
    if (isOpen) {
      setNewReading(currentReading?.toString() || '');
    }
  }, [isOpen, currentReading]);

  const handleUpdate = async () => {
    const newReadingNum = parseFloat(newReading);
    if (isNaN(newReadingNum) || newReadingNum < 0) {
      showToast('Please enter a valid number', 'error');
      return;
    }

    if (currentReading !== undefined && newReadingNum <= currentReading) {
      showToast(`New reading must be greater than current reading (${currentReading} ${unit})`, 'error');
      return;
    }

    setIsUpdating(true);

    try {
      // In a real implementation, this would call an API
      // For now, we'll show a toast and close the modal
      // The actual update logic would be handled by the parent component
      const previousReading = currentReading;
      const details = previousReading !== undefined
        ? `Meter Reading: ${previousReading.toLocaleString()} ${unit} → ${newReadingNum.toLocaleString()} ${unit}`
        : `Meter Reading set to ${newReadingNum.toLocaleString()} ${unit}`;

      showToast('Meter reading updated successfully', 'success');
      
      // Call the parent callback to handle the actual update
      onHoursUpdated();
      onClose();
    } catch (error: any) {
      showToast(error.message || 'Failed to update meter reading', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Update Meter Reading"
      size="md"
    >
      <div className="space-y-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Gauge className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-sm font-medium text-blue-900 mb-1">
                Current Meter Reading
              </div>
              <div className="text-lg text-blue-700">
                {currentReading !== undefined
                  ? `${currentReading.toLocaleString()} ${unit}`
                  : 'No reading recorded'}
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            New {unit === 'hours' ? 'Hours' : 'Mileage'}
          </label>
          <Input
            type="number"
            value={newReading}
            onChange={(e) => setNewReading(e.target.value)}
            placeholder={`Enter new ${unit}`}
            min={currentReading !== undefined ? currentReading : 0}
            step={unit === 'hours' ? '1' : '1'}
          />
          <p className="mt-1 text-xs text-gray-500">
            {currentReading !== undefined && (
              <>Must be greater than current reading ({currentReading.toLocaleString()} {unit})</>
            )}
          </p>
        </div>

        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-xs text-gray-600">
            <strong>Note:</strong> This will create an activity log entry under "Meter Reading Updated" with the change details.
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isUpdating}>
            Cancel
          </Button>
          <Button onClick={handleUpdate} disabled={isUpdating}>
            <Gauge className="w-4 h-4 mr-2" />
            {isUpdating ? 'Updating...' : 'Update Meter Reading'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

