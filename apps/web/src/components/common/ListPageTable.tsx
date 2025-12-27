import { ReactNode, RefObject } from 'react';
import { Card } from './Card';
import { Input } from './Input';
import { FilterButton } from './FilterButton';
import { SortableTable, type SortableColumn } from './SortableTable';

interface ListPageTableProps {
  // Search props
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  
  // Filter props
  onFilterClick: () => void;
  activeFilterCount?: number;
  filterButtonRef?: RefObject<HTMLButtonElement | HTMLDivElement>;
  
  // Table props
  columns: SortableColumn[];
  data: any[];
  onRowClick?: (row: any) => void;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  getRowId?: (row: any) => string;
  getRowClassName?: (row: any) => string;
  expandedRowId?: string | null;
  renderExpandedRow?: (row: any) => ReactNode;
  onRowHover?: (rowId: string | null) => void;
  
  // Footer props
  showingText?: string; // e.g., "Showing 1–25 of 35"
  pagination?: ReactNode; // Pagination controls if needed
  
  // Optional header actions
  headerActions?: ReactNode;
  
  // Bulk actions bar (rendered between search row and table)
  bulkActionsBar?: ReactNode;
  
  // Empty state
  emptyMessage?: string;
}

export function ListPageTable({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  onFilterClick,
  activeFilterCount = 0,
  filterButtonRef,
  columns,
  data,
  onRowClick,
  selectable,
  selectedIds,
  onSelectionChange,
  getRowId,
  getRowClassName,
  expandedRowId,
  renderExpandedRow,
  onRowHover,
  showingText,
  pagination,
  headerActions,
  bulkActionsBar,
  emptyMessage = 'No results found',
}: ListPageTableProps) {
  return (
    <Card>
      <div className="p-6">
        {/* Table Toolbar: Search + Filter */}
        <div className="flex items-center gap-3 mb-4 flex-nowrap lg:flex-nowrap">
          <div className="flex-1 min-w-0">
            <Input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full"
            />
          </div>
          <div ref={filterButtonRef as RefObject<HTMLDivElement>} className="flex-shrink-0">
            <FilterButton
              onClick={onFilterClick}
              activeFilterCount={activeFilterCount}
              size="sm"
            />
          </div>
          {headerActions && (
            <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-2 flex-shrink-0">
              {headerActions}
            </div>
          )}
        </div>
        
        {/* Bulk Actions Bar */}
        {bulkActionsBar && (
          <div className="mb-4">
            {bulkActionsBar}
          </div>
        )}
        
        {/* Table */}
        <SortableTable
          columns={columns}
          data={data}
          onRowClick={onRowClick}
          selectable={selectable}
          selectedIds={selectedIds}
          onSelectionChange={onSelectionChange}
          getRowId={getRowId}
          getRowClassName={getRowClassName}
          expandedRowId={expandedRowId}
          renderExpandedRow={renderExpandedRow}
          onRowHover={onRowHover}
        />
        
        {/* Empty State */}
        {data.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            {emptyMessage}
          </div>
        )}
        
        {/* Footer: Showing + Pagination */}
        {(showingText || pagination) && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            {showingText && (
              <div className="text-sm text-gray-600">
                {showingText}
              </div>
            )}
            {pagination && (
              <div>
                {pagination}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

