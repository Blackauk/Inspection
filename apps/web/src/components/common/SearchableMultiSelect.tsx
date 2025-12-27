import { useState, useRef, useEffect } from 'react';
import { X, ChevronDown, Search } from 'lucide-react';

export interface SearchableMultiSelectOption {
  value: string;
  label: string;
}

interface SearchableMultiSelectProps {
  options: SearchableMultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
}

export function SearchableMultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Select...',
  label,
  error,
  disabled = false,
}: SearchableMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter options based on search
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const toggleSelection = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const removeSelection = (value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter((v) => v !== value));
  };

  const selectedOptions = options.filter((opt) => selected.includes(opt.value));

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative" ref={dropdownRef}>
        {/* Selected chips + input */}
        <div
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`min-h-[42px] w-full px-3 py-2 border rounded-lg bg-white cursor-pointer flex items-center gap-2 flex-wrap ${
            error ? 'border-red-300' : 'border-gray-300'
          } ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'hover:border-gray-400'}`}
        >
          {selectedOptions.length === 0 ? (
            <span className="text-gray-500 text-sm">{placeholder}</span>
          ) : (
            <>
              {selectedOptions.map((opt) => (
                <span
                  key={opt.value}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm"
                >
                  {opt.label}
                  {!disabled && (
                    <button
                      type="button"
                      onClick={(e) => removeSelection(opt.value, e)}
                      className="hover:bg-blue-100 rounded p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))}
            </>
          )}
          <div className="ml-auto flex items-center gap-1">
            {selected.length > 0 && (
              <span className="text-xs text-gray-500">{selected.length} selected</span>
            )}
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </div>
        </div>

        {/* Dropdown */}
        {isOpen && !disabled && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
            {/* Search input */}
            <div className="p-2 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
            </div>

            {/* Options list */}
            <div className="max-h-48 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="p-3 text-sm text-gray-500 text-center">No options found</div>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = selected.includes(option.value);
                  return (
                    <label
                      key={option.value}
                      className={`flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer ${
                        isSelected ? 'bg-blue-50' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelection(option.value)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 flex-1">{option.label}</span>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}


