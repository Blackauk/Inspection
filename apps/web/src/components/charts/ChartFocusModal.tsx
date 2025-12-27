import { ReactNode } from 'react';
import { Modal } from '../common/Modal';
import { FilterButton } from '../common/FilterButton';

interface ChartFocusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  showFilter?: boolean;
  onFilterClick?: () => void;
  activeFilterCount?: number;
}

export function ChartFocusModal({
  open,
  onOpenChange,
  title,
  children,
  showFilter = false,
  onFilterClick,
  activeFilterCount = 0,
}: ChartFocusModalProps) {
  return (
    <Modal
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title={title}
      size="xl"
    >
      <div className="space-y-4">
        {/* Header with Filter button */}
        {showFilter && onFilterClick && (
          <div className="flex justify-end -mt-2 mb-2">
            <FilterButton
              onClick={onFilterClick}
              activeFilterCount={activeFilterCount}
              size="sm"
            />
          </div>
        )}
        
        {/* Chart content */}
        <div className="w-full" style={{ height: '600px', minHeight: '600px' }}>
          {children}
        </div>
      </div>
    </Modal>
  );
}

