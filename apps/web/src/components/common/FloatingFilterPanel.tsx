import { useState, useEffect, useRef, ReactNode } from 'react';
import { X } from 'lucide-react';
import { Card } from './Card';
import { FilterSection } from './FilterSection';

interface FloatingFilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  anchorRef?: React.RefObject<HTMLElement | null>;
}

export function FloatingFilterPanel({
  isOpen,
  onClose,
  children,
  anchorRef,
}: FloatingFilterPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, right: 0 });

  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      if (anchorRef?.current) {
        const rect = anchorRef.current.getBoundingClientRect();
        setPosition({
          top: rect.bottom + 8,
          right: window.innerWidth - rect.right,
        });
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, anchorRef]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        anchorRef?.current &&
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

  return (
    <>
      {/* Backdrop - invisible but captures clicks */}
      <div className="fixed inset-0 z-40" aria-hidden="true" />
      
      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed z-50"
        style={{
          top: anchorRef?.current ? `${position.top}px` : '80px',
          right: anchorRef?.current ? `${position.right}px` : '24px',
          maxWidth: '420px',
          width: 'fit-content',
          minWidth: '360px',
        }}
      >
        <Card className="shadow-xl border-2 border-gray-300">
          <div className="max-h-[70vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-lg font-semibold text-gray-900">Filter</h3>
              <button
                onClick={onClose}
                className="p-1 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                aria-label="Close filter panel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto flex-1 p-4 space-y-1">
              {children}
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}

// Re-export FilterSection for convenience
export { FilterSection } from './FilterSection';
