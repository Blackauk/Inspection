import { useState } from 'react';
import { FileText } from 'lucide-react';

interface SavedReportsIndicatorProps {
  count: number;
  onClick: () => void;
}

export function SavedReportsIndicator({ count, onClick }: SavedReportsIndicatorProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (count === 0) {
    return null; // Don't show if no saved reports
  }

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <button
        onClick={onClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        className="
          flex items-center gap-2
          px-4 py-2
          bg-white border border-gray-200 rounded-full shadow-lg
          hover:bg-gray-50 hover:shadow-xl
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          cursor-pointer
        "
        aria-label={`View saved reports. Saved count: ${count}.`}
      >
        <FileText className="w-4 h-4 text-gray-600" aria-hidden="true" />
        <span className="text-sm font-medium text-gray-700">
          Saved: {count}
        </span>
      </button>
      
      {showTooltip && (
        <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap">
          View Saved Reports
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
}



