import { SelectHTMLAttributes, ReactNode, useEffect, useRef } from 'react';

export interface Option {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options?: Option[];
  children?: ReactNode;
}

// Track if we've warned about undefined options to avoid spam
let hasWarnedUndefinedOptions = false;

export function Select({ label, error, options, className = '', children, ...props }: SelectProps) {
  const warnedRef = useRef(false);

  // Default options to empty array if undefined
  const safeOptions = options ?? [];
  
  // Warn once if options is undefined (dev mode only)
  useEffect(() => {
    if (options === undefined && !warnedRef.current && !hasWarnedUndefinedOptions) {
      console.warn('Select received undefined options; defaulting to []');
      warnedRef.current = true;
      hasWarnedUndefinedOptions = true;
    }
  }, [options]);

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <select
        className={`w-full px-3 py-2 border rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
          error ? 'border-red-300' : 'border-gray-300'
        } ${className}`}
        {...props}
      >
        {children || (
          safeOptions.length > 0 ? (
            safeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))
          ) : (
            <option value="">No options</option>
          )
        )}
      </select>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
