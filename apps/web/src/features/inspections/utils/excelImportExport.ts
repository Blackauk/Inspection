// Excel import/export utilities for inspection templates

export interface ExcelRow {
  SectionName: string;
  ItemText: string;
  ItemType: string;
  Required?: string | boolean;
  Critical?: string | boolean; // Backward compatibility
  SafetyCritical?: string | boolean;
  PhotoOnFail?: string | boolean;
  FailRequiresComment?: string | boolean;
  Unit?: string;
  Min?: string | number;
  Max?: string | number;
  Options?: string;
  SortOrder?: string | number;
}

export interface ExcelMeta {
  TemplateName?: string;
  InspectionType?: string;
  Frequency?: string;
}

export interface ImportResult {
  sections: Array<{ id: string; title: string; order: number }>;
  items: Array<{
    id: string;
    sectionId: string;
    question: string;
    type: 'PassFail' | 'PassFailNA' | 'Number' | 'Text';
    required: boolean;
    safetyCritical: boolean;
    critical?: boolean; // Backward compatibility
    order: number;
    photoRequiredOnFail: boolean;
    failRequiresComment?: boolean;
    unit?: string;
    minValue?: number;
    maxValue?: number;
  }>;
  warnings: Array<{ row: number; message: string }>;
  errors: Array<{ row: number; message: string }>;
}

// Normalize boolean values
function normalizeBoolean(value: any): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    return lower === 'true' || lower === 'yes' || lower === 'y' || lower === '1';
  }
  return false;
}

// Normalize ItemType
function normalizeItemType(value: string): 'PassFail' | 'PassFailNA' | 'Number' | 'Text' | null {
  const normalized = value.trim().toUpperCase().replace(/[\/_]/g, '');
  if (normalized.includes('PASSFAILNA') || normalized.includes('PASSFAILN/A') || normalized.includes('PASSFAILN-A')) {
    return 'PassFailNA';
  }
  if (normalized.includes('PASSFAIL') || normalized.includes('PASS/FAIL')) {
    return 'PassFail';
  }
  if (normalized.includes('NUMBER') || normalized.includes('NUM')) {
    return 'Number';
  }
  if (normalized.includes('TEXT') || normalized.includes('STRING')) {
    return 'Text';
  }
  // Handle DROPDOWN as Text for now (since our type system doesn't support it yet)
  if (normalized.includes('DROPDOWN') || normalized.includes('SELECT')) {
    return 'Text';
  }
  return null;
}

// Parse Excel data
export function parseExcelData(rows: ExcelRow[]): ImportResult {
  const sections: Map<string, { id: string; title: string; order: number }> = new Map();
  const items: ImportResult['items'] = [];
  const warnings: ImportResult['warnings'] = [];
  const errors: ImportResult['errors'] = [];

  let sectionOrder = 0;
  const sectionOrderMap = new Map<string, number>();

  rows.forEach((row, index) => {
    const rowNum = index + 2; // +2 because Excel rows are 1-indexed and we skip header

    // Skip blank rows
    if (!row.SectionName && !row.ItemText) {
      return;
    }

    // Validate required fields
    if (!row.SectionName || !row.SectionName.trim()) {
      errors.push({ row: rowNum, message: 'SectionName is required' });
      return;
    }

    if (!row.ItemText || !row.ItemText.trim()) {
      errors.push({ row: rowNum, message: 'ItemText is required' });
      return;
    }

    if (!row.ItemType || !row.ItemType.trim()) {
      errors.push({ row: rowNum, message: 'ItemType is required' });
      return;
    }

    // Normalize ItemType
    const itemType = normalizeItemType(row.ItemType);
    if (!itemType) {
      errors.push({ row: rowNum, message: `Invalid ItemType: ${row.ItemType}. Must be one of: PASS_FAIL_NA, PassFail, Number, Text` });
      return;
    }

    // Normalize Safety Critical (prefer SafetyCritical, fallback to Critical for backward compatibility)
    const safetyCritical = normalizeBoolean(row.SafetyCritical ?? row.Critical);

    // Get or create section
    const sectionName = row.SectionName.trim();
    let sectionId: string;
    if (sections.has(sectionName)) {
      sectionId = sections.get(sectionName)!.id;
    } else {
      sectionId = `section-${Date.now()}-${sectionOrder}`;
      sectionOrderMap.set(sectionName, sectionOrder);
      sections.set(sectionName, {
        id: sectionId,
        title: sectionName,
        order: sectionOrder++,
      });
    }

    // Validate type-specific fields
    if (itemType === 'Number') {
      if (row.Min && isNaN(Number(row.Min))) {
        warnings.push({ row: rowNum, message: 'Min value is not numeric, ignoring' });
      }
      if (row.Max && isNaN(Number(row.Max))) {
        warnings.push({ row: rowNum, message: 'Max value is not numeric, ignoring' });
      }
    }

    if (itemType === 'Text' && (row.Unit || row.Min || row.Max)) {
      warnings.push({ row: rowNum, message: 'Unit/Min/Max are ignored for Text type' });
    }

    if (itemType === 'PassFail' || itemType === 'PassFailNA') {
      if (row.Unit || row.Min || row.Max) {
        warnings.push({ row: rowNum, message: 'Unit/Min/Max are ignored for Pass/Fail types' });
      }
    }

    // Create item
    const sortOrder = row.SortOrder ? Number(row.SortOrder) : items.filter(i => i.sectionId === sectionId).length;
    
    const item: ImportResult['items'][0] = {
      id: `item-${Date.now()}-${index}`,
      sectionId,
      question: row.ItemText.trim(),
      type: itemType,
      required: normalizeBoolean(row.Required),
      safetyCritical: safetyCritical,
      critical: safetyCritical, // Backward compatibility
      order: sortOrder,
      photoRequiredOnFail: safetyCritical ? true : normalizeBoolean(row.PhotoOnFail), // Auto-enable if safety critical
      failRequiresComment: safetyCritical ? true : normalizeBoolean(row.FailRequiresComment), // Auto-enable if safety critical
    };

    // Add type-specific fields
    if (itemType === 'Number') {
      if (row.Unit) item.unit = row.Unit.trim();
      if (row.Min && !isNaN(Number(row.Min))) {
        item.minValue = Number(row.Min);
      }
      if (row.Max && !isNaN(Number(row.Max))) {
        item.maxValue = Number(row.Max);
      }
    }

    items.push(item);
  });

  // Sort items by section order, then by item order
  const sortedItems = items.sort((a, b) => {
    const aSection = Array.from(sections.values()).find(s => s.id === a.sectionId);
    const bSection = Array.from(sections.values()).find(s => s.id === b.sectionId);
    const aSectionOrder = aSection?.order ?? 0;
    const bSectionOrder = bSection?.order ?? 0;
    if (aSectionOrder !== bSectionOrder) return aSectionOrder - bSectionOrder;
    return a.order - b.order;
  });

  return {
    sections: Array.from(sections.values()).sort((a, b) => a.order - b.order),
    items: sortedItems,
    warnings,
    errors,
  };
}

// Generate Excel template data
export function generateExcelTemplate(): ExcelRow[] {
  return [
    {
      SectionName: 'General',
      ItemText: 'Check guards fitted',
      ItemType: 'PASS_FAIL_NA',
      Required: true,
      SafetyCritical: false,
      PhotoOnFail: true,
      SortOrder: 1,
    },
    {
      SectionName: 'General',
      ItemText: 'Record oil pressure',
      ItemType: 'NUMBER',
      Required: true,
      Unit: 'bar',
      Min: 0,
      Max: 300,
      SortOrder: 2,
    },
    {
      SectionName: 'Safety',
      ItemText: 'PPE worn',
      ItemType: 'TEXT',
      Required: true,
      SortOrder: 1,
    },
  ];
}

