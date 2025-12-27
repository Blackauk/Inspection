import { useState, useEffect } from 'react';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { DatePicker } from '../../../components/common/DatePicker';

interface DateRangePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (from: Date, to: Date) => void;
  initialFrom?: Date;
  initialTo?: Date;
}

// Convert Date to YYYY-MM-DD string
const dateToString = (date: Date | undefined): string => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Convert YYYY-MM-DD string to Date
const stringToDate = (str: string): Date | undefined => {
  if (!str) return undefined;
  return new Date(str + 'T00:00:00');
};

export function DateRangePickerModal({
  isOpen,
  onClose,
  onConfirm,
  initialFrom,
  initialTo,
}: DateRangePickerModalProps) {
  const [fromStr, setFromStr] = useState<string>(dateToString(initialFrom));
  const [toStr, setToStr] = useState<string>(dateToString(initialTo));

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setFromStr(dateToString(initialFrom));
      setToStr(dateToString(initialTo));
    }
  }, [isOpen, initialFrom, initialTo]);

  const handleConfirm = () => {
    const from = stringToDate(fromStr);
    const to = stringToDate(toStr);
    if (from && to && from <= to) {
      onConfirm(from, to);
      onClose();
    }
  };

  const from = stringToDate(fromStr);
  const to = stringToDate(toStr);
  const isValid = from && to && from <= to;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Date Range" size="sm">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            From Date
          </label>
          <DatePicker
            value={fromStr}
            onChange={(value) => setFromStr(value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            To Date
          </label>
          <DatePicker
            value={toStr}
            onChange={(value) => setToStr(value)}
            minDate={from}
          />
        </div>
        {from && to && from > to && (
          <p className="text-sm text-red-600">To date must be after from date</p>
        )}
        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleConfirm} disabled={!isValid}>
            Apply
          </Button>
        </div>
      </div>
    </Modal>
  );
}

