import { useState, useMemo, ReactNode } from 'react';
import { ArrowUp, ArrowDown, ArrowLeftRight } from 'lucide-react';
import { Table, TableHeader, TableRow, TableHeaderCell, TableCell } from './Table';
import { Checkbox } from './Checkbox';

export type SortDirection = 'asc' | 'desc' | null;

export interface SortableColumn {
  key: string;
  label: string | ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: number;
  render?: (value: any, row: any) => ReactNode;
  renderHeader?: (sortKey: string | null, sortDirection: SortDirection) => ReactNode;
}

interface SortableTableProps {
  columns: SortableColumn[];
  data: any[];
  onRowClick?: (row: any) => void;
  defaultSort?: { key: string; direction: SortDirection };
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  getRowId?: (row: any) => string;
  getRowClassName?: (row: any) => string;
  expandedRowId?: string | null;
  renderExpandedRow?: (row: any) => ReactNode;
  onRowHover?: (rowId: string | null) => void;
}

export function SortableTable({
  columns,
  data,
  onRowClick,
  defaultSort,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  getRowId = (row) => row.id,
  getRowClassName,
  expandedRowId = null,
  renderExpandedRow,
  onRowHover,
}: SortableTableProps) {
  const [sortKey, setSortKey] = useState<string | null>(defaultSort?.key || null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(defaultSort?.direction || null);

  const handleHeaderClick = (key: string, sortable?: boolean) => {
    if (!sortable) return;

    // 3-state toggle: None → Asc → Desc → None
    if (sortKey !== key) {
      // New column: start with ascending
      setSortKey(key);
      setSortDirection('asc');
    } else if (sortDirection === 'asc') {
      // Currently ascending: switch to descending
      setSortDirection('desc');
    } else if (sortDirection === 'desc') {
      // Currently descending: reset to none
      setSortKey(null);
      setSortDirection(null);
    } else {
      // Currently none: start with ascending
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const sortedData = useMemo(() => {
    if (!sortKey || !sortDirection) {
      return data; // Return original order when no sort
    }

    const column = columns.find((col) => col.key === sortKey);
    if (!column) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];

      // Handle null/undefined
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      // Try to detect date strings (ISO format or common date formats)
      const datePattern = /^\d{4}-\d{2}-\d{2}/;
      const aIsDate = typeof aValue === 'string' && datePattern.test(aValue);
      const bIsDate = typeof bValue === 'string' && datePattern.test(bValue);
      
      let comparison = 0;
      if (aIsDate || bIsDate) {
        // Date comparison
        const aDate = aIsDate ? Date.parse(aValue) : (typeof aValue === 'number' ? aValue : Date.parse(String(aValue)));
        const bDate = bIsDate ? Date.parse(bValue) : (typeof bValue === 'number' ? bValue : Date.parse(String(bValue)));
        if (isNaN(aDate) || isNaN(bDate)) {
          comparison = String(aValue).localeCompare(String(bValue));
        } else {
          comparison = aDate - bDate;
        }
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        // Number comparison
        comparison = aValue - bValue;
      } else if (typeof aValue === 'string' && typeof bValue === 'string') {
        // String comparison (locale-aware)
        comparison = aValue.localeCompare(bValue);
      } else {
        // Fallback: convert to string and compare
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortKey, sortDirection, columns]);

  // Selection handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectable || !onSelectionChange) return;
    e.stopPropagation();
    
    if (e.target.checked) {
      onSelectionChange(sortedData.map((row) => getRowId(row)));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectRow = (rowId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectable || !onSelectionChange) return;
    e.stopPropagation();
    
    if (e.target.checked) {
      onSelectionChange([...selectedIds, rowId]);
    } else {
      onSelectionChange(selectedIds.filter((id) => id !== rowId));
    }
  };

  const handleRowClick = (row: any, e: React.MouseEvent) => {
    // Don't navigate if clicking checkbox
    if ((e.target as HTMLElement).closest('input[type="checkbox"]')) {
      return;
    }
    // Don't navigate if clicking chevron or view button
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    onRowClick?.(row);
  };

  const handleRowKeyDown = (row: any, e: React.KeyboardEvent) => {
    // Space key toggles selection when row is focused
    if (e.key === ' ' && selectable && onSelectionChange) {
      e.preventDefault();
      const rowId = getRowId(row);
      const isSelected = selectedIds.includes(rowId);
      if (isSelected) {
        onSelectionChange(selectedIds.filter((id) => id !== rowId));
      } else {
        onSelectionChange([...selectedIds, rowId]);
      }
    }
  };

  const allSelected = selectable && sortedData.length > 0 && sortedData.every((row) => selectedIds.includes(getRowId(row)));
  const someSelected = selectable && selectedIds.length > 0 && !allSelected;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {selectable && (
            <TableHeaderCell className="w-12">
              <Checkbox
                checked={allSelected}
                ref={(input) => {
                  if (input) (input as any).indeterminate = someSelected;
                }}
                onChange={handleSelectAll}
                onClick={(e) => e.stopPropagation()}
              />
            </TableHeaderCell>
          )}
          {columns.map((column, colIndex) => {
            const alignClass = column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left';
            const style = column.width ? { width: `${column.width}px`, minWidth: `${column.width}px`, maxWidth: `${column.width}px` } : {};
            return (
              <TableHeaderCell
                key={column.key}
                className={`${column.sortable ? 'cursor-pointer select-none hover:bg-gray-100' : ''} ${alignClass} relative`}
                onClick={() => handleHeaderClick(column.key, column.sortable)}
                style={style}
              >
                {column.renderHeader ? (
                  column.renderHeader(sortKey, sortDirection)
                ) : (
                  <div className={`flex items-center gap-2 ${column.align === 'center' ? 'justify-center' : column.align === 'right' ? 'justify-end' : ''}`}>
                    <span>{column.label}</span>
                    {column.sortable && (
                      <span className="text-gray-400">
                        {sortKey === column.key && sortDirection === 'asc' ? (
                          <ArrowUp className="w-4 h-4" />
                        ) : sortKey === column.key && sortDirection === 'desc' ? (
                          <ArrowDown className="w-4 h-4" />
                        ) : (
                          <ArrowLeftRight className="w-3 h-3 opacity-30" />
                        )}
                      </span>
                    )}
                  </div>
                )}
              </TableHeaderCell>
            );
          })}
        </TableRow>
      </TableHeader>
      <tbody>
        {sortedData.map((row, index) => {
          const rowId = getRowId(row);
          const isSelected = selectable && selectedIds.includes(rowId);
          const isExpanded = expandedRowId === rowId;
          const colSpan = columns.length + (selectable ? 1 : 0);
          
          return (
            <>
              <TableRow
                key={rowId || index}
                onClick={(e) => handleRowClick(row, e)}
                onKeyDown={(e) => handleRowKeyDown(row, e)}
                onMouseEnter={onRowHover ? () => onRowHover(rowId) : undefined}
                onMouseLeave={onRowHover ? () => onRowHover(null) : undefined}
                className={`${onRowClick ? 'cursor-pointer hover:bg-blue-50' : ''} ${getRowClassName ? getRowClassName(row) : ''} ${selectable ? 'focus-within:bg-blue-50' : ''}`}
                tabIndex={selectable ? 0 : undefined}
              >
                {selectable && (
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={isSelected}
                      onChange={(e) => handleSelectRow(rowId, e)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </TableCell>
                )}
                {columns.map((column) => {
                  const alignClass = column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left';
                  const style = column.width ? { width: `${column.width}px`, minWidth: `${column.width}px`, maxWidth: `${column.width}px` } : {};
                  return (
                    <TableCell key={column.key} className={alignClass} style={style}>
                      {column.render ? column.render(row[column.key], row) : String(row[column.key] || '')}
                    </TableCell>
                  );
                })}
              </TableRow>
              {isExpanded && renderExpandedRow && (
                <TableRow key={`${rowId}-expanded`}>
                  <TableCell colSpan={colSpan} className="px-6 py-4 bg-gray-50">
                    {renderExpandedRow(row)}
                  </TableCell>
                </TableRow>
              )}
            </>
          );
        })}
      </tbody>
    </Table>
  );
}
