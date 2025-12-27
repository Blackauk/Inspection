import { useState } from 'react';
import { FilterSearch } from './FilterSearch';
import { FilterOptionList, type FilterOption } from './FilterOptionList';

interface Option {
  value: string;
  label: string;
}

interface MultiSelectFilterProps {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  searchable?: boolean;
  placeholder?: string;
  twoColumn?: boolean;
}

export function MultiSelectFilter({
  options,
  selected,
  onChange,
  searchable = false,
  placeholder = 'Search...',
  twoColumn = false,
}: MultiSelectFilterProps) {
  const [search, setSearch] = useState('');

  const filteredOptions: FilterOption[] = searchable
    ? options
        .filter((opt) => opt.label.toLowerCase().includes(search.toLowerCase()))
        .map(opt => ({ value: opt.value, label: opt.label }))
    : options.map(opt => ({ value: opt.value, label: opt.label }));

  return (
    <div className="space-y-2">
      {searchable && (
        <FilterSearch
          value={search}
          onChange={setSearch}
          placeholder={placeholder}
        />
      )}

      <div className="max-h-48 overflow-y-auto">
        <FilterOptionList
          options={filteredOptions}
          selected={selected}
          onChange={onChange}
          showSelectAll={!twoColumn && filteredOptions.length > 1}
          twoColumn={twoColumn}
        />
      </div>

      {selected.length > 0 && (
        <div className="pt-2 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            {selected.length} selected
          </div>
        </div>
      )}
    </div>
  );
}
