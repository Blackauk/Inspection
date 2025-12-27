/**
 * Reusable 3-state table sorting utility
 * Supports: strings (localeCompare), numbers (numeric), dates (Date.parse)
 * 
 * Usage:
 *   const { sortedData, sortState, handleSort } = useTriSort(data);
 *   // sortState: { key: string | null, direction: 'asc' | 'desc' | null }
 *   // handleSort: (columnKey: string) => void
 */

export type SortDirection = 'asc' | 'desc' | null;

export interface SortState {
  key: string | null;
  direction: SortDirection;
}

export interface UseTriSortOptions {
  defaultSort?: { key: string; direction: SortDirection };
  getValue?: (row: any, key: string) => any; // Custom value extractor
  compareFn?: (a: any, b: any, key: string) => number; // Custom comparison
}

export interface UseTriSortResult<T> {
  sortedData: T[];
  sortState: SortState;
  handleSort: (columnKey: string) => void;
  resetSort: () => void;
}

/**
 * Custom comparison function that handles strings, numbers, and dates
 */
function defaultCompare(a: any, b: any, key: string): number {
  // Handle null/undefined
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;

  // Try to detect date strings (ISO format or common date formats)
  const datePattern = /^\d{4}-\d{2}-\d{2}/;
  const aIsDate = typeof a === 'string' && datePattern.test(a);
  const bIsDate = typeof b === 'string' && datePattern.test(b);
  
  if (aIsDate || bIsDate) {
    const aDate = aIsDate ? Date.parse(a) : (typeof a === 'number' ? a : Date.parse(String(a)));
    const bDate = bIsDate ? Date.parse(b) : (typeof b === 'number' ? b : Date.parse(String(b)));
    if (isNaN(aDate) || isNaN(bDate)) {
      // Fallback to string comparison if date parsing fails
      return String(a).localeCompare(String(b));
    }
    return aDate - bDate;
  }

  // Number comparison
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }

  // String comparison (locale-aware)
  if (typeof a === 'string' && typeof b === 'string') {
    return a.localeCompare(b);
  }

  // Fallback: convert to string and compare
  return String(a).localeCompare(String(b));
}

/**
 * React hook for 3-state table sorting
 */
export function useTriSort<T = any>(
  data: T[],
  options: UseTriSortOptions = {}
): UseTriSortResult<T> {
  const { defaultSort, getValue, compareFn = defaultCompare } = options;
  
  const [sortState, setSortState] = useState<SortState>({
    key: defaultSort?.key || null,
    direction: defaultSort?.direction || null,
  });

  const handleSort = (columnKey: string) => {
    setSortState((prev) => {
      // 3-state toggle: None → Asc → Desc → None
      if (prev.key !== columnKey) {
        // New column: start with ascending
        return { key: columnKey, direction: 'asc' };
      } else if (prev.direction === 'asc') {
        // Currently ascending: switch to descending
        return { key: columnKey, direction: 'desc' };
      } else if (prev.direction === 'desc') {
        // Currently descending: reset to none
        return { key: null, direction: null };
      } else {
        // Currently none: start with ascending
        return { key: columnKey, direction: 'asc' };
      }
    });
  };

  const resetSort = () => {
    setSortState({ key: null, direction: null });
  };

  const sortedData = useMemo(() => {
    if (!sortState.key || !sortState.direction) {
      return data; // Return original order when no sort
    }

    return [...data].sort((a, b) => {
      const aValue = getValue ? getValue(a, sortState.key!) : (a as any)[sortState.key!];
      const bValue = getValue ? getValue(b, sortState.key!) : (b as any)[sortState.key!];

      const comparison = compareFn(aValue, bValue, sortState.key!);
      return sortState.direction === 'asc' ? comparison : -comparison;
    });
  }, [data, sortState, getValue, compareFn]);

  return {
    sortedData,
    sortState,
    handleSort,
    resetSort,
  };
}

// Non-hook version for use outside React components
export function sortTableData<T = any>(
  data: T[],
  sortKey: string | null,
  sortDirection: SortDirection,
  options: { getValue?: (row: T, key: string) => any; compareFn?: (a: any, b: any, key: string) => number } = {}
): T[] {
  if (!sortKey || !sortDirection) {
    return data;
  }

  const { getValue, compareFn = defaultCompare } = options;

  return [...data].sort((a, b) => {
    const aValue = getValue ? getValue(a, sortKey) : (a as any)[sortKey];
    const bValue = getValue ? getValue(b, sortKey) : (b as any)[sortKey];

    const comparison = compareFn(aValue, bValue, sortKey);
    return sortDirection === 'asc' ? comparison : -comparison;
  });
}







