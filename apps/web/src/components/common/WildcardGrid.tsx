import { ReactNode } from 'react';

interface WildcardGridProps {
  children: ReactNode;
  columns?: 4 | 6;
}

/**
 * Standard grid layout for wildcard/KPI cards.
 * Matches the Dashboard top-6 card layout exactly.
 * 
 * Default: 6-column grid (1 col mobile, 2 cols sm, 3 cols lg, 6 cols xl)
 * Alternative: 4-column grid (1 col mobile, 2 cols sm, 2 cols lg, 4 cols xl)
 */
export function WildcardGrid({ children, columns = 6 }: WildcardGridProps) {
  const gridClasses = columns === 6
    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4'
    : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4';

  return (
    <div className={gridClasses}>
      {children}
    </div>
  );
}



