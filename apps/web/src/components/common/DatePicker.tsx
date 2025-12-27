import { useState, useRef, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

interface DatePickerProps {
  value: string; // Format: YYYY-MM-DD (ISO format for internal storage)
  onChange: (value: string) => void; // Returns YYYY-MM-DD format
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
  required?: boolean;
  minDate?: Date;
  maxDate?: Date;
  label?: string; // Optional label to match Input component API
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Select date',
  disabled = false,
  error,
  className = '',
  required = false,
  minDate,
  maxDate,
  label,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Convert YYYY-MM-DD to Date object
  const selectedDate = value ? new Date(value + 'T00:00:00') : undefined;

  // Format date for display as dd/mm/yyyy
  const formatDisplayDate = (date: Date | undefined): string => {
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Parse dd/mm/yyyy to Date
  const parseInputDate = (input: string): Date | null => {
    const parts = input.split('/');
    if (parts.length !== 3) return null;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    return new Date(year, month, day);
  };

  const displayValue = formatDisplayDate(selectedDate);

  // Close calendar when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      // Convert to YYYY-MM-DD format
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      onChange(`${year}-${month}-${day}`);
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    // Allow typing in dd/mm/yyyy format
    if (input.length === 10 && input.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      const date = parseInputDate(input);
      if (date && !isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        onChange(`${year}-${month}-${day}`);
      }
    }
  };

  const handleInputFocus = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    } else if (e.key === 'Enter' && isOpen) {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative" ref={containerRef}>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={displayValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={placeholder}
            required={required}
            className={`w-full px-3 py-2 border rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              error ? 'border-red-300' : 'border-gray-300'
            } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        {isOpen && !disabled && (
          <div className="absolute z-50 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-3 max-h-[calc(100vh-200px)] overflow-y-auto">
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={disabled}
              fromDate={minDate}
              toDate={maxDate}
              className="rdp"
              classNames={{
                months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
                month: 'space-y-4',
                caption: 'flex items-center justify-between pt-1 px-1',
                caption_label: 'text-sm font-medium text-gray-900 flex-1 text-center',
                nav: 'flex items-center flex-shrink-0',
                nav_button: 'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 flex items-center justify-center rounded hover:bg-gray-100 transition-opacity cursor-pointer',
                nav_button_previous: '',
                nav_button_next: '',
                table: 'w-full border-collapse space-y-1',
                head_row: 'flex',
                head_cell: 'text-gray-500 rounded-md w-9 font-normal text-[0.8rem]',
                row: 'flex w-full mt-2',
                cell: 'text-center text-sm p-0 relative [&:has([aria-selected])]:bg-blue-50 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
                day: 'h-9 w-9 p-0 font-normal text-gray-900 aria-selected:opacity-100 hover:bg-gray-100 rounded-md',
                day_selected: 'bg-blue-600 text-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white',
                day_today: 'bg-blue-100 text-blue-900 font-semibold',
                day_outside: 'text-gray-400 opacity-50',
                day_disabled: 'text-gray-300 opacity-50',
                day_range_middle: 'aria-selected:bg-blue-50 aria-selected:text-blue-900',
                day_hidden: 'invisible',
              }}
            />
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

