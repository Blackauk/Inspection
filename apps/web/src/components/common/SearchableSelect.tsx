import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';

interface SearchableSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; subtitle?: string }[];
  placeholder?: string;
  error?: string;
  className?: string;
}

export function SearchableSelect({
  label,
  value,
  onChange,
  options,
  placeholder = 'Search and select...',
  error,
  className = '',
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter options based on search
  const filteredOptions = options.filter((option) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      option.label.toLowerCase().includes(query) ||
      option.value.toLowerCase().includes(query) ||
      (option.subtitle && option.subtitle.toLowerCase().includes(query))
    );
  });

  // Get selected option label
  const selectedOption = options.find((opt) => opt.value === value);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Focus input when opened
      setTimeout(() => inputRef.current?.focus(), 0);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchQuery('');
    } else if (e.key === 'Enter' && filteredOptions.length > 0) {
      onChange(filteredOptions[0].value);
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <div className={`w-full ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full px-3 py-2 border rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left flex items-center justify-between ${
            error ? 'border-red-300' : 'border-gray-300'
          } ${isOpen ? 'ring-2 ring-blue-500' : ''}`}
        >
          <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
            {/* Search input */}
            <div className="p-2 border-b border-gray-200">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type to search..."
                  className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Options list */}
            <div className="overflow-y-auto max-h-48">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500 text-center">No results found</div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    className={`w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none transition-colors ${
                      value === option.value ? 'bg-blue-50 text-blue-900' : 'text-gray-900'
                    }`}
                  >
                    <div className="text-sm font-medium">{option.label}</div>
                    {option.subtitle && (
                      <div className="text-xs text-gray-500 mt-0.5">{option.subtitle}</div>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}







