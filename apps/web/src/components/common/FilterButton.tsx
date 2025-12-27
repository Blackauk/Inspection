import { Filter } from 'lucide-react';
import { Button } from './Button';

interface FilterButtonProps {
  onClick: () => void;
  activeFilterCount?: number;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export function FilterButton({
  onClick,
  activeFilterCount = 0,
  className = '',
  variant = 'outline',
  size = 'md',
  disabled = false,
}: FilterButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 ${className}`}
    >
      <Filter className="w-4 h-4" />
      <span>Filter</span>
      {activeFilterCount > 0 && (
        <span className="bg-blue-600 text-white text-xs font-medium px-2 py-0.5 rounded-full">
          {activeFilterCount}
        </span>
      )}
    </Button>
  );
}



