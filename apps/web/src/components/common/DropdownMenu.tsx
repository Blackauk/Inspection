import { useEffect, useRef, ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

export interface DropdownMenuItem {
  label: string;
  subtitle?: string;
  icon?: LucideIcon;
  onClick: () => void;
}

interface DropdownMenuProps {
  isOpen: boolean;
  onClose: () => void;
  items: DropdownMenuItem[];
  anchorRef: React.RefObject<HTMLElement>;
  align?: 'left' | 'right';
  width?: string;
}

export function DropdownMenu({
  isOpen,
  onClose,
  items,
  anchorRef,
  align = 'right',
  width = 'w-72',
}: DropdownMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, anchorRef]);

  if (!isOpen) return null;

  // Determine width class - support custom width strings or use default
  const widthClass = width.startsWith('w-') ? width : `w-[${width}]`;
  
  // Apply fit-content sizing for bulk actions menu
  const isBulkActionsMenu = width === 'w-[240px]' || width === 'w-fit';
  const inlineStyles = isBulkActionsMenu ? {
    minWidth: '220px',
    maxWidth: '280px',
    width: 'fit-content',
  } : undefined;

  return (
    <>
      {/* Backdrop - invisible but captures clicks */}
      <div className="fixed inset-0 z-10" onClick={onClose} aria-hidden="true" />
      
      {/* Dropdown Menu */}
      <div
        ref={menuRef}
        className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} top-full mt-2 ${isBulkActionsMenu ? '' : widthClass} bg-white rounded-lg shadow-lg border border-gray-200 z-20`}
        style={inlineStyles}
      >
        <div className="py-1">
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                onClick={() => {
                  item.onClick();
                  onClose();
                }}
                className={`${isBulkActionsMenu ? 'w-auto min-w-full' : 'w-full'} text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg flex items-center gap-3 whitespace-nowrap`}
              >
                {Icon && (
                  <div className="flex-shrink-0">
                    <Icon className="w-5 h-5 text-gray-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900">{item.label}</div>
                  {item.subtitle && (
                    <div className="text-xs text-gray-500 mt-0.5">{item.subtitle}</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

