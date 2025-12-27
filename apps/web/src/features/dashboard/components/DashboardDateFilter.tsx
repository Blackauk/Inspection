import { useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { DropdownMenu, type DropdownMenuItem } from '../../../components/common/DropdownMenu';
import { DateRangePickerPopover } from './DateRangePickerPopover';
import type { DateRange, DateRangePreset } from '../utils/dateRange';
import { formatDateRange } from '../utils/dateRange';

interface DashboardDateFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  allowCustomRange?: boolean;
}

export function DashboardDateFilter({
  value,
  onChange,
  allowCustomRange = true,
}: DashboardDateFilterProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCustomRangeOpen, setIsCustomRangeOpen] = useState(false);
  const dropdownRef = useRef<HTMLButtonElement>(null);

  const handlePresetChange = (preset: DateRangePreset) => {
    onChange({ preset });
    setIsDropdownOpen(false);
    setIsCustomRangeOpen(false);
  };

  const handleCustomRangeClick = () => {
    // Close dropdown first, then open custom range popover
    setIsDropdownOpen(false);
    // Small delay to allow dropdown to close, then open popover
    setTimeout(() => {
      setIsCustomRangeOpen(true);
    }, 100);
  };

  const handleCustomRangeApply = (from: Date, to: Date) => {
    onChange({
      preset: 'custom',
      from,
      to,
    });
    setIsCustomRangeOpen(false);
  };

  const handleCustomRangeClose = () => {
    setIsCustomRangeOpen(false);
  };

  // Convert preset to days for button matching
  const getButtonValue = (preset: DateRangePreset): number | null => {
    if (preset === '7d') return 7;
    if (preset === '14d') return 14;
    if (preset === '30d') return 30;
    return null;
  };

  const buttonValue = getButtonValue(value.preset);

  const menuItems: DropdownMenuItem[] = [
    {
      label: 'Last 7 days',
      onClick: () => handlePresetChange('7d'),
    },
    {
      label: 'Last 14 days',
      onClick: () => handlePresetChange('14d'),
    },
    {
      label: 'Last 30 days',
      onClick: () => handlePresetChange('30d'),
    },
    {
      label: 'This month (to date)',
      subtitle: formatDateRange({ preset: 'mtd' }),
      onClick: () => handlePresetChange('mtd'),
    },
    {
      label: 'Last 90 days',
      onClick: () => handlePresetChange('90d'),
    },
  ];

  if (allowCustomRange) {
    menuItems.push({
      label: 'Custom range',
      onClick: handleCustomRangeClick,
    });
  }

  return (
    <>
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        {/* Range toggle buttons */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {([7, 14, 30] as const).map((days) => {
            const preset = days === 7 ? '7d' : days === 14 ? '14d' : '30d';
            const isActive = value.preset === preset;
            return (
              <button
                key={days}
                onClick={() => handlePresetChange(preset)}
                className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                  isActive
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {days}d
              </button>
            );
          })}
        </div>
        {/* Additional ranges dropdown */}
        <div className="relative">
          <button
            ref={dropdownRef}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
            aria-label="More range options"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          <DropdownMenu
            isOpen={isDropdownOpen}
            onClose={() => setIsDropdownOpen(false)}
            items={menuItems}
            anchorRef={dropdownRef}
            align="right"
            width="w-56"
          />
        </div>
      </div>

      {/* Custom Date Range Picker Popover */}
      {isCustomRangeOpen && (
        <DateRangePickerPopover
          isOpen={isCustomRangeOpen}
          onClose={handleCustomRangeClose}
          onApply={handleCustomRangeApply}
          initialFrom={value.preset === 'custom' ? value.from : undefined}
          initialTo={value.preset === 'custom' ? value.to : undefined}
          anchorRef={dropdownRef}
        />
      )}
    </>
  );
}

