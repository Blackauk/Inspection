import { X } from 'lucide-react';

interface FilterChipProps {
  label: string;
  value: string;
  onRemove: () => void;
}

export function FilterChip({ label, value, onRemove }: FilterChipProps) {
  return (
    <div className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
      <span className="font-medium">{label}:</span>
      <span>{value}</span>
      <button
        onClick={onRemove}
        className="ml-1 hover:bg-blue-100 rounded-full p-0.5 transition-colors"
        aria-label={`Remove ${label} filter`}
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}


