import { getAssetTypes, mockSites, mockResponsibleTeams } from '../services';
import type { OperationalStatus, LifecycleStatus, ComplianceRAG, Ownership, Criticality } from '../types';
import { validateStatusCombination } from './statusValidation';

export interface ParsedAssetRow {
  assetId?: string;
  assetType?: string;
  make?: string;
  model?: string;
  serialNumber?: string;
  site?: string;
  operationalStatus?: string;
  lifecycleStatus?: string;
  complianceRag?: string;
  ownership?: string;
  responsibleTeam?: string;
  criticality?: string;
  lastOnSiteAt?: string;
  notes?: string;
}

export interface ValidationError {
  row: number;
  column?: string;
  message: string;
}

/**
 * Generate CSV template with headers and example rows
 */
export function generateTemplate(): string {
  const headers = [
    'assetId',
    'assetType',
    'make',
    'model',
    'serialNumber',
    'site',
    'operationalStatus',
    'lifecycleStatus',
    'complianceRag',
    'ownership',
    'responsibleTeam',
    'criticality',
    'lastOnSiteAt',
    'notes',
  ];

  // Example rows
  const examples = [
    [
      'AST-000100',
      'EX',
      'Caterpillar',
      '320D',
      'SN-EX-100-2020',
      'Site A',
      'InUse',
      'Active',
      'Green',
      'Owned',
      'Plant Team',
      'High',
      '2025-12-15',
      'Regular maintenance required',
    ],
    [
      '',
      'MEWP',
      'JLG',
      '600S',
      'SN-MEWP-101-2021',
      'Site B',
      'InUse',
      'Active',
      'Amber',
      'Hired',
      'Electrical',
      'Medium',
      '2025-12-14',
      '',
    ],
    [
      'AST-000102',
      'FL',
      'Toyota',
      '8FBE20',
      '',
      'Site C',
      'InUse',
      'Active',
      'Green',
      'Owned',
      'Warehouse',
      'Low',
      '2025-12-13',
      'Forklift in good condition',
    ],
  ];

  const rows = [headers, ...examples];
  return rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
}

/**
 * Parse CSV text into rows
 */
export function parseCSV(text: string): ParsedAssetRow[] {
  const lines = text.split('\n').filter((line) => line.trim());
  if (lines.length < 2) {
    throw new Error('CSV file must have at least a header row and one data row');
  }

  // Parse header
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine).map((h) => h.trim().toLowerCase());

  // Expected headers (case-insensitive)
  const expectedHeaders = [
    'assetid',
    'assettype',
    'make',
    'model',
    'serialnumber',
    'site',
    'operationalstatus',
    'lifecyclestatus',
    'compliancerag',
    'ownership',
    'responsibleteam',
    'criticality',
    'lastonsiteat',
    'notes',
  ];

  // Map headers to our internal keys
  const headerMap: Record<string, keyof ParsedAssetRow> = {
    assetid: 'assetId',
    assettype: 'assetType',
    make: 'make',
    model: 'model',
    serialnumber: 'serialNumber',
    site: 'site',
    operationalstatus: 'operationalStatus',
    lifecyclestatus: 'lifecycleStatus',
    compliancerag: 'complianceRag',
    ownership: 'ownership',
    responsibleteam: 'responsibleTeam',
    criticality: 'criticality',
    lastonsiteat: 'lastOnSiteAt',
    notes: 'notes',
  };

  // Parse data rows
  const rows: ParsedAssetRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: ParsedAssetRow = {};

    headers.forEach((header, index) => {
      const key = headerMap[header];
      if (key && values[index] !== undefined) {
        const value = values[index].trim();
        if (value) {
          (row as any)[key] = value;
        }
      }
    });

    rows.push(row);
  }

  return rows;
}

/**
 * Parse a single CSV line, handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  // Add last field
  values.push(current);

  return values;
}

/**
 * Validate a parsed asset row
 */
export function validateAssetRow(row: ParsedAssetRow, rowNumber: number): ValidationError[] {
  const errors: ValidationError[] = [];
  const assetTypes = getAssetTypes();
  const sites = mockSites;
  const teams = mockResponsibleTeams;

  // Required fields
  if (!row.assetType) {
    errors.push({ row: rowNumber, column: 'assetType', message: 'Asset Type is required' });
  } else {
    // Validate asset type exists (by ID or code)
    const typeCode = row.assetType.toUpperCase();
    const assetType = assetTypes.find(
      (t) => t.code.toUpperCase() === typeCode || t.id === row.assetType || t.id.toUpperCase() === typeCode
    );
    if (!assetType) {
      errors.push({
        row: rowNumber,
        column: 'assetType',
        message: `Invalid asset type: ${row.assetType}. Must be one of: ${assetTypes.map((t) => `${t.code} (ID: ${t.id})`).join(', ')}`,
      });
    }
  }

  if (!row.make) {
    errors.push({ row: rowNumber, column: 'make', message: 'Make is required' });
  }

  if (!row.model) {
    errors.push({ row: rowNumber, column: 'model', message: 'Model is required' });
  }

  if (!row.site) {
    errors.push({ row: rowNumber, column: 'site', message: 'Site is required' });
  } else {
    // Validate site exists
    const site = sites.find((s) => s.name === row.site || s.id === row.site);
    if (!site) {
      errors.push({
        row: rowNumber,
        column: 'site',
        message: `Invalid site: ${row.site}. Must be one of: ${sites.map((s) => s.name).join(', ')}`,
      });
    }
  }

  if (!row.responsibleTeam) {
    errors.push({ row: rowNumber, column: 'responsibleTeam', message: 'Responsible Team is required' });
  } else {
    // Validate team exists
    const team = teams.find((t) => t === row.responsibleTeam);
    if (!team) {
      errors.push({
        row: rowNumber,
        column: 'responsibleTeam',
        message: `Invalid team: ${row.responsibleTeam}. Must be one of: ${teams.join(', ')}`,
      });
    }
  }

  // Validate operational status
  if (row.operationalStatus) {
    const validStatuses: OperationalStatus[] = ['InUse', 'OutOfUse', 'OffHirePending', 'OffHired', 'Quarantined', 'Archived'];
    const status = row.operationalStatus as OperationalStatus;
    if (!validStatuses.includes(status)) {
      errors.push({
        row: rowNumber,
        column: 'operationalStatus',
        message: `Invalid operational status: ${row.operationalStatus}. Must be one of: ${validStatuses.join(', ')}`,
      });
    }
  }

  // Validate lifecycle status
  if (row.lifecycleStatus) {
    const validStatuses: LifecycleStatus[] = ['Active', 'Expected', 'Decommissioned', 'Disposed'];
    const status = row.lifecycleStatus as LifecycleStatus;
    if (!validStatuses.includes(status)) {
      errors.push({
        row: rowNumber,
        column: 'lifecycleStatus',
        message: `Invalid lifecycle status: ${row.lifecycleStatus}. Must be one of: ${validStatuses.join(', ')}`,
      });
    }
  }

  // Validate compliance RAG
  if (row.complianceRag) {
    const validRags: ComplianceRAG[] = ['Green', 'Amber', 'Red'];
    const rag = row.complianceRag as ComplianceRAG;
    if (!validRags.includes(rag)) {
      errors.push({
        row: rowNumber,
        column: 'complianceRag',
        message: `Invalid compliance RAG: ${row.complianceRag}. Must be one of: ${validRags.join(', ')}`,
      });
    }
  }

  // Validate ownership
  if (row.ownership) {
    const validOwnership: Ownership[] = ['Owned', 'Hired'];
    const ownership = row.ownership as Ownership;
    if (!validOwnership.includes(ownership)) {
      errors.push({
        row: rowNumber,
        column: 'ownership',
        message: `Invalid ownership: ${row.ownership}. Must be one of: ${validOwnership.join(', ')}`,
      });
    }
  }

  // Validate criticality
  if (row.criticality) {
    const validCriticality: Criticality[] = ['Low', 'Medium', 'High'];
    const criticality = row.criticality as Criticality;
    if (!validCriticality.includes(criticality)) {
      errors.push({
        row: rowNumber,
        column: 'criticality',
        message: `Invalid criticality: ${row.criticality}. Must be one of: ${validCriticality.join(', ')}`,
      });
    }
  }

  // Validate date format
  if (row.lastOnSiteAt) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(row.lastOnSiteAt)) {
      errors.push({
        row: rowNumber,
        column: 'lastOnSiteAt',
        message: `Invalid date format: ${row.lastOnSiteAt}. Must be YYYY-MM-DD`,
      });
    }
  }

  // Validate status combination
  if (row.operationalStatus && row.lifecycleStatus) {
    const opStatus = row.operationalStatus as OperationalStatus;
    const lifeStatus = row.lifecycleStatus as LifecycleStatus;
    const statusValidation = validateStatusCombination(opStatus, lifeStatus);
    
    if (!statusValidation.isValid && statusValidation.message) {
      errors.push({
        row: rowNumber,
        column: 'operationalStatus/lifecycleStatus',
        message: statusValidation.message,
      });
    }
  }

  return errors;
}
