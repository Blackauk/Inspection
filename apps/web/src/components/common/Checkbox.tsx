import { forwardRef } from 'react';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label ? (
          <label className="flex items-center gap-2 cursor-pointer">
            <div className="relative flex items-center justify-center w-4 h-4 flex-shrink-0">
              <input
                type="checkbox"
                ref={ref}
                className={`w-4 h-4 rounded border border-gray-300 bg-white text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 appearance-none checked:bg-white checked:border-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
                style={{
                  backgroundImage: props.checked
                    ? "url(\"data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='%232563eb' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3.5-3.5a1 1 0 011.414-1.414L5 10.586l6.293-6.293a1 1 0 011.414 0z'/%3e%3c/svg%3e\")"
                    : 'none',
                  backgroundSize: '10px 10px',
                  backgroundPosition: '50% 50%',
                  backgroundRepeat: 'no-repeat',
                }}
                {...props}
              />
            </div>
            <span className={error ? 'text-red-600' : 'text-gray-700'}>{label}</span>
          </label>
        ) : (
          <div className="relative flex items-center justify-center w-4 h-4 flex-shrink-0">
            <input
              type="checkbox"
              ref={ref}
              className={`w-4 h-4 rounded border border-gray-300 bg-white text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 appearance-none checked:bg-white checked:border-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
              style={{
                backgroundImage: props.checked
                  ? "url(\"data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='%232563eb' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3.5-3.5a1 1 0 011.414-1.414L5 10.586l6.293-6.293a1 1 0 011.414 0z'/%3e%3c/svg%3e\")"
                  : 'none',
                backgroundSize: '10px 10px',
                backgroundPosition: '50% 50%',
                backgroundRepeat: 'no-repeat',
              }}
              {...props}
            />
          </div>
        )}
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

