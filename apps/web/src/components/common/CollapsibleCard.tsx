import { useState, useEffect, ReactNode } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Card } from './Card';

interface CollapsibleCardProps {
  title: string;
  children: ReactNode;
  defaultExpanded?: boolean;
  actions?: ReactNode;
  onToggle?: (expanded: boolean) => void;
  storageKey?: string; // Unique key for localStorage persistence
}

export function CollapsibleCard({
  title,
  children,
  defaultExpanded = true,
  actions,
  onToggle,
  storageKey,
}: CollapsibleCardProps) {
  // Get initial state from localStorage if key provided
  const getInitialState = (): boolean => {
    if (storageKey) {
      const stored = localStorage.getItem(`collapsible-${storageKey}`);
      if (stored !== null) {
        return stored === 'true';
      }
    }
    return defaultExpanded;
  };

  const [isExpanded, setIsExpanded] = useState(getInitialState);

  // Persist to localStorage when state changes
  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(`collapsible-${storageKey}`, String(isExpanded));
    }
  }, [isExpanded, storageKey]);

  const handleToggle = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    onToggle?.(newState);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <Card>
      <div className="p-6">
        <div
          role="button"
          tabIndex={0}
          aria-expanded={isExpanded}
          aria-label={`${title} section, ${isExpanded ? 'expanded' : 'collapsed'}`}
          className="flex items-center justify-between cursor-pointer select-none"
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
        >
          <h2 className="text-lg font-semibold text-gray-900 flex-1">{title}</h2>
          <div className="flex items-center gap-2">
            {actions && (
              <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                {actions}
              </div>
            )}
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-gray-500 transition-transform" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-500 transition-transform" />
            )}
          </div>
        </div>
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isExpanded ? 'max-h-[2000px] opacity-100 mt-2' : 'max-h-0 opacity-0'
          }`}
          aria-hidden={!isExpanded}
        >
          {children}
        </div>
      </div>
    </Card>
  );
}
