import { Button } from './Button';

interface FilterFooterProps {
  onReset: () => void;
  onApply?: () => void;
  showApply?: boolean;
  resetLabel?: string;
  applyLabel?: string;
}

export function FilterFooter({
  onReset,
  onApply,
  showApply = false,
  resetLabel = 'Reset',
  applyLabel = 'Apply Filters',
}: FilterFooterProps) {
  return (
    <div className="flex items-center gap-3 p-4 border-t border-gray-200 bg-white flex-shrink-0">
      {showApply && onApply ? (
        <>
          <Button variant="outline" onClick={onReset} className="flex-1">
            {resetLabel}
          </Button>
          <Button variant="primary" onClick={onApply} className="flex-1">
            {applyLabel}
          </Button>
        </>
      ) : (
        <Button variant="outline" onClick={onReset} className="w-full">
          {resetLabel}
        </Button>
      )}
    </div>
  );
}

