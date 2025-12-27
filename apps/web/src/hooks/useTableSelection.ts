import { useState, useEffect, useCallback } from 'react';

interface UseTableSelectionOptions<T> {
  data: T[];
  getRowId: (row: T) => string;
  persistKey?: string; // localStorage key for persistence
}

export function useTableSelection<T>({
  data,
  getRowId,
  persistKey,
}: UseTableSelectionOptions<T>) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    if (persistKey) {
      const saved = localStorage.getItem(persistKey);
      if (saved) {
        try {
          return new Set(JSON.parse(saved));
        } catch {
          return new Set<string>();
        }
      }
    }
    return new Set<string>();
  });

  // Persist selections to localStorage
  useEffect(() => {
    if (persistKey) {
      localStorage.setItem(persistKey, JSON.stringify(Array.from(selectedIds)));
    }
  }, [selectedIds, persistKey]);

  // Clean up selections that no longer exist in data
  useEffect(() => {
    const currentIds = new Set(data.map(getRowId));
    setSelectedIds((prev) => {
      const filtered = new Set(Array.from(prev).filter((id) => currentIds.has(id)));
      return filtered.size !== prev.size ? filtered : prev;
    });
  }, [data, getRowId]);

  const toggleSelection = useCallback((rowId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    const allIds = new Set(data.map(getRowId));
    setSelectedIds(allIds);
  }, [data, getRowId]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback(
    (rowId: string) => selectedIds.has(rowId),
    [selectedIds]
  );

  const isAllSelected = useCallback(() => {
    if (data.length === 0) return false;
    return data.every((row) => selectedIds.has(getRowId(row)));
  }, [data, selectedIds, getRowId]);

  const isSomeSelected = useCallback(() => {
    return selectedIds.size > 0 && !isAllSelected();
  }, [selectedIds, isAllSelected]);

  const getSelectedRows = useCallback(() => {
    const selectedIdsArray = Array.from(selectedIds);
    return data.filter((row) => selectedIdsArray.includes(getRowId(row)));
  }, [data, selectedIds, getRowId]);

  return {
    selectedIds: Array.from(selectedIds),
    selectedCount: selectedIds.size,
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
    isAllSelected,
    isSomeSelected,
    getSelectedRows,
    setSelectedIds: (ids: string[]) => setSelectedIds(new Set(ids)),
  };
}

