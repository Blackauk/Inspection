import { useState, useRef, useEffect, ReactNode } from 'react';

export interface ComboboxOption {
  value: string;
  label: string;
  searchText?: string; // Optional searchable text (defaults to label)
}

interface ComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
  displayValue?: (option: ComboboxOption | undefined) => string; // Custom display function
}

export function Combobox({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  disabled = false,
  error,
  className = '',
  displayValue,
}: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Filter options based on search query
  const filteredOptions = options.filter((option) => {
    const searchText = option.searchText || option.label;
    const query = searchQuery.toLowerCase();
    return searchText.toLowerCase().includes(query) || option.value.toLowerCase().includes(query);
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
        setHighlightedIndex(-1);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement;
      if (item) {
        item.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchQuery('');
    setHighlightedIndex(-1);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex((prev) =>
            prev < filteredOptions.length - 1 ? prev + 1 : prev
          );
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (isOpen && highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex].value);
        } else if (isOpen && filteredOptions.length === 1) {
          handleSelect(filteredOptions[0].value);
        } else if (!isOpen) {
          setIsOpen(true);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchQuery('');
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
      case 'Tab':
        setIsOpen(false);
        setSearchQuery('');
        setHighlightedIndex(-1);
        break;
    }
  };

  const getDisplayText = () => {
    if (searchQuery) return searchQuery;
    if (selectedOption) {
      return displayValue ? displayValue(selectedOption) : selectedOption.label;
    }
    return '';
  };

  return (
    <div className={`w-full relative ${className}`} ref={containerRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={getDisplayText()}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(-1);
            if (!isOpen) {
              setIsOpen(true);
            }
          }}
          onFocus={() => {
            if (!disabled) {
              setIsOpen(true);
              setSearchQuery('');
            }
          }}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full px-3 py-2 border rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            error ? 'border-red-300' : 'border-gray-300'
          } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto combobox-dropdown" style={{ scrollbarColor: '#cbd5e0 #f9fafb' }}>
          {filteredOptions.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              No results found
            </div>
          ) : (
            <ul ref={listRef} className="py-1">
              {filteredOptions.map((option, index) => (
                <li key={option.value}>
                  <button
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`w-full text-left px-4 py-2 text-sm ${
                      option.value === value
                        ? 'bg-blue-50 text-blue-900 font-medium'
                        : highlightedIndex === index
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {displayValue ? displayValue(option) : option.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

