import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { Card } from '../../../components/common/Card';
import { Input } from '../../../components/common/Input';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { SortableTable } from '../../../components/common/SortableTable';
import { FloatingFilterPanel, FilterSection } from '../../../components/common/FloatingFilterPanel';
import { MultiSelectFilter } from '../../../components/common/MultiSelectFilter';
import { FilterButton } from '../../../components/common/FilterButton';
import { getCheckSheetTemplates } from '../services';
import type { CheckSheetTemplate } from '../types';

export function CheckSheetsListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<{ category?: string[]; assetType?: string[]; isActive?: boolean }>({});
  const filterButtonRef = useRef<HTMLDivElement>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const templates = getCheckSheetTemplates();

  const filteredTemplates = useMemo(() => {
    let filtered = [...templates];

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(searchLower) ||
          t.category.toLowerCase().includes(searchLower) ||
          t.description?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.category && filters.category.length > 0) {
      filtered = filtered.filter((t) => filters.category!.includes(t.category));
    }

    if (filters.assetType && filters.assetType.length > 0) {
      filtered = filtered.filter((t) =>
        t.assetTypeCodes?.some((code) => filters.assetType!.includes(code))
      );
    }

    if (filters.isActive !== undefined) {
      filtered = filtered.filter((t) => t.isActive === filters.isActive);
    }

    return filtered;
  }, [templates, search, filters]);

  const columns = useMemo(
    () => [
      {
        key: 'name',
        label: 'Template Name',
        sortable: true,
        render: (_: any, row: CheckSheetTemplate) => (
          <button
            onClick={() => navigate(`/inspections/templates/${row.id}`)}
            className="text-blue-600 hover:text-blue-700 hover:underline font-medium text-left"
          >
            {row.name}
          </button>
        ),
      },
      {
        key: 'category',
        label: 'Category',
        sortable: true,
        render: (_: any, row: CheckSheetTemplate) => <span>{row.category}</span>,
      },
      {
        key: 'assetTypeCodes',
        label: 'Applies To',
        sortable: false,
        render: (_: any, row: CheckSheetTemplate) => (
          <div className="flex gap-1 flex-wrap">
            {row.assetTypeCodes?.map((code) => (
              <Badge key={code} variant="info" size="sm">
                {code}
              </Badge>
            )) || <span className="text-gray-400 text-sm">All</span>}
          </div>
        ),
      },
      {
        key: 'version',
        label: 'Version',
        sortable: true,
        render: (_: any, row: CheckSheetTemplate) => <span className="font-mono text-sm">{row.version}</span>,
      },
      {
        key: 'items',
        label: 'Items',
        sortable: false,
        render: (_: any, row: CheckSheetTemplate) => (
          <span className="text-sm text-gray-600">{row.items.length} items</span>
        ),
      },
      {
        key: 'isActive',
        label: 'Status',
        sortable: true,
        render: (_: any, row: CheckSheetTemplate) => (
          <Badge variant={row.isActive ? 'success' : 'default'} size="sm">
            {row.isActive ? 'Active' : 'Archived'}
          </Badge>
        ),
      },
    ],
    [navigate]
  );

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.category && filters.category.length > 0) count++;
    if (filters.assetType && filters.assetType.length > 0) count++;
    if (filters.isActive !== undefined) count++;
    return count;
  }, [filters]);

  const categories = useMemo(() => {
    const cats = new Set(templates.map((t) => t.category));
    return Array.from(cats).map((cat) => ({ value: cat, label: cat }));
  }, [templates]);

  const assetTypes = useMemo(() => {
    const types = new Set<string>();
    templates.forEach((t) => {
      t.assetTypeCodes?.forEach((code) => types.add(code));
    });
    return Array.from(types).map((type) => ({ value: type, label: type }));
  }, [templates]);

  return (
    <div className="p-6 space-y-6">
      {/* Command Bar */}
      <div className="flex items-center justify-end">
        <Button onClick={() => navigate('/inspections/templates/new')}>+ New Check Sheet</Button>
      </div>

      <Card>
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Search by name, category, or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div ref={filterButtonRef}>
              <FilterButton
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                activeFilterCount={activeFilterCount}
              />
            </div>
          </div>

          {filteredTemplates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No check sheets found</div>
          ) : (
            <SortableTable columns={columns} data={filteredTemplates} />
          )}
        </div>
      </Card>

      <FloatingFilterPanel
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        anchorRef={filterButtonRef}
      >
        <FilterSection title="Category">
          <MultiSelectFilter
            options={categories}
            selected={filters.category || []}
            onChange={(selected) => setFilters((prev) => ({ ...prev, category: selected.length > 0 ? selected : undefined }))}
          />
        </FilterSection>

        <FilterSection title="Asset Type">
          <MultiSelectFilter
            options={assetTypes}
            selected={filters.assetType || []}
            onChange={(selected) => setFilters((prev) => ({ ...prev, assetType: selected.length > 0 ? selected : undefined }))}
          />
        </FilterSection>

        <FilterSection title="Status">
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.isActive === true}
                onChange={(e) => setFilters((prev) => ({ ...prev, isActive: e.target.checked ? true : undefined }))}
                className="rounded"
              />
              <span className="text-sm">Active</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.isActive === false}
                onChange={(e) => setFilters((prev) => ({ ...prev, isActive: e.target.checked ? false : undefined }))}
                className="rounded"
              />
              <span className="text-sm">Archived</span>
            </label>
          </div>
        </FilterSection>

        <div className="pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setFilters({});
              setSearch('');
            }}
          >
            Clear All
          </Button>
        </div>
      </FloatingFilterPanel>
    </div>
  );
}






