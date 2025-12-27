import { ReactNode } from 'react';
import { Checkbox } from './Checkbox';

export interface FilterOption {
  value: string;
  label: string;
  count?: number; // Optional count badge
}

interface FilterOptionListProps {
  options: FilterOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  showSelectAll?: boolean;
  twoColumn?: boolean;
  className?: string;
}

export function FilterOptionList({
  options,
  selected,
  onChange,
  showSelectAll = false,
  twoColumn = false,
  className = '',
}: FilterOptionListProps) {
  const handleToggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const handleSelectAll = () => {
    if (selected.length === options.length && options.length > 0) {
      onChange([]);
    } else {
      onChange(options.map((opt) => opt.value));
    }
  };

  const allSelected = selected.length === options.length && options.length > 0;

  return (
    <div className={className}>
      {showSelectAll && options.length > 1 && (
        <div className="mb-2 pb-2 border-b border-gray-200">
          <label className="flex items-center gap-2 px-3 py-2 rounded cursor-pointer text-sm hover:bg-gray-50 min-h-[40px]">
            <div className="flex-shrink-0">
              <Checkbox
                checked={allSelected}
                onChange={handleSelectAll}
              />
            </div>
            <span className="font-medium text-gray-700 truncate">Select All</span>
          </label>
        </div>
      )}
      
      <div className={twoColumn ? 'grid grid-cols-2 gap-2' : 'space-y-1'}>
        {options.map((option) => {
          const isSelected = selected.includes(option.value);
          return (
            <label
              key={option.value}
              className={`flex items-center gap-2 px-3 py-2 rounded cursor-pointer text-sm min-h-[40px] ${
                isSelected
                  ? 'bg-blue-50 border border-blue-200 hover:bg-blue-100'
                  : 'hover:bg-gray-50 border border-transparent'
              }`}
            >
              <div className="flex-shrink-0">
                <Checkbox
                  checked={isSelected}
                  onChange={() => handleToggle(option.value)}
                />
              </div>
              <span className={`flex-1 min-w-0 truncate ${isSelected ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                {option.label}
              </span>
              {option.count !== undefined && (
                <span className="flex-shrink-0 text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                  {option.count}
                </span>
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}

