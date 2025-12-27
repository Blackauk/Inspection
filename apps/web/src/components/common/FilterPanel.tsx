import { ReactNode, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: () => void;
  onReset: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function FilterPanel({
  isOpen,
  onClose,
  onApply,
  onReset,
  title = 'Filters',
  children,
  className = '',
}: FilterPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  // Handle ESC key to close and focus trap
  useEffect(() => {
    if (!isOpen) return;

    // Store the previously focused element
    previousActiveElementRef.current = document.activeElement as HTMLElement;

    // Focus the panel when it opens
    const panel = panelRef.current;
    if (panel) {
      // Find the first focusable element in the panel
      const firstFocusable = panel.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (firstFocusable) {
        firstFocusable.focus();
      } else {
        panel.focus();
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleTab = (e: KeyboardEvent) => {
      if (!panel) return;

      const focusableElements = panel.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // If Shift+Tab on first element, focus last element
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
        return;
      }

      // If Tab on last element, focus first element
      if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
        return;
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('keydown', handleTab);
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleTab);
      
      // Restore focus to previously focused element when closing
      if (previousActiveElementRef.current) {
        previousActiveElementRef.current.focus();
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Panel */}
      <div
        ref={panelRef}
        className={`fixed inset-y-0 right-0 w-full md:w-[420px] max-w-[90vw] bg-white shadow-xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-panel-title"
        tabIndex={-1}
      >
        <Card className="h-full rounded-none border-0 shadow-none flex flex-col">
          {/* Header - Sticky with Actions */}
          <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-gray-200 bg-white flex-shrink-0">
            <h2 id="filter-panel-title" className="text-lg font-semibold text-gray-900">{title}</h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onReset}>
                Reset
              </Button>
              <Button variant="primary" size="sm" onClick={onApply}>
                Apply Filters
              </Button>
              <button
                onClick={onClose}
                className="p-1 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Close filters"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4">
            {children}
          </div>
        </Card>
      </div>
    </>
  );
}
