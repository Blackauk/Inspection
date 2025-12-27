import { useState, useEffect, useRef } from 'react';
import { Button } from '../../../components/common/Button';
import { DatePicker } from '../../../components/common/DatePicker';

interface DateRangePickerPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (from: Date, to: Date) => void;
  onClear?: () => void;
  initialFrom?: Date;
  initialTo?: Date;
  anchorRef: React.RefObject<HTMLElement>;
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

export function DateRangePickerPopover({
  isOpen,
  onClose,
  onApply,
  onClear,
  initialFrom,
  initialTo,
  anchorRef,
}: DateRangePickerPopoverProps) {
  const [fromStr, setFromStr] = useState<string>(dateToString(initialFrom));
  const [toStr, setToStr] = useState<string>(dateToString(initialTo));
  const popoverRef = useRef<HTMLDivElement>(null);

  // Reset when popover opens
  useEffect(() => {
    if (isOpen) {
      setFromStr(dateToString(initialFrom));
      setToStr(dateToString(initialTo));
    }
  }, [isOpen, initialFrom, initialTo]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, anchorRef]);

  const handleApply = () => {
    const from = stringToDate(fromStr);
    const to = stringToDate(toStr);
    if (from && to && from <= to) {
      onApply(from, to);
      onClose();
    }
  };

  const handleClear = () => {
    setFromStr('');
    setToStr('');
    if (onClear) {
      onClear();
    }
    onClose();
  };

  const from = stringToDate(fromStr);
  const to = stringToDate(toStr);
  const isValid = from && to && from <= to;

  if (!isOpen) return null;

  // Calculate position - anchor to the right of the dropdown menu item or button
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  useEffect(() => {
    if (isOpen && anchorRef.current) {
      const updatePosition = () => {
        const rect = anchorRef.current?.getBoundingClientRect();
        if (rect) {
          const popoverWidth = 320; // w-80 = 320px
          const gap = 4;
          // Position popover below the anchor
          let left = rect.left;
          
          // If popover would overflow right edge, align right edge with anchor right edge
          if (rect.left + popoverWidth > window.innerWidth) {
            left = rect.right - popoverWidth;
          }
          
          // Ensure popover doesn't go off left edge
          if (left < 8) {
            left = 8;
          }
          
          setPosition({
            top: rect.bottom + gap,
            left: left,
          });
        }
      };
      updatePosition();
      // Update position on scroll/resize
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen, anchorRef]);

  return (
    <div
        ref={popoverRef}
        className="fixed z-40 bg-white rounded-lg shadow-lg border border-gray-200 p-4 w-80"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              From Date
            </label>
            <DatePicker
              value={fromStr}
              onChange={(value) => setFromStr(value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
            {onClear && (
              <Button variant="outline" size="sm" onClick={handleClear}>
                Clear
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleApply} disabled={!isValid}>
              Apply
            </Button>
          </div>
        </div>
      </div>
  );
}

