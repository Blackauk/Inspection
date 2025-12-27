import * as XLSX from 'xlsx';
import { generateExcelTemplate, parseExcelData, type ExcelRow, type ExcelMeta, type ImportResult } from './excelImportExport';

// Download Excel template
export function downloadExcelTemplate() {
  const templateData = generateExcelTemplate();
  
  // Create workbook
  const wb = XLSX.utils.book_new();
  
  // Create Checklist sheet
  const ws = XLSX.utils.json_to_sheet(templateData, {
    header: [
      'SectionName',
      'ItemText',
      'ItemType',
      'Required',
      'SafetyCritical',
      'PhotoOnFail',
      'FailRequiresComment',
      'Unit',
      'Min',
      'Max',
      'Options',
      'SortOrder',
    ],
  });
  
  // Set column widths
  ws['!cols'] = [
    { wch: 15 }, // SectionName
    { wch: 30 }, // ItemText
    { wch: 15 }, // ItemType
    { wch: 10 }, // Required
    { wch: 15 }, // SafetyCritical
    { wch: 12 }, // PhotoOnFail
    { wch: 18 }, // FailRequiresComment
    { wch: 10 }, // Unit
    { wch: 8 },  // Min
    { wch: 8 },  // Max
    { wch: 20 }, // Options
    { wch: 10 }, // SortOrder
  ];
  
  XLSX.utils.book_append_sheet(wb, ws, 'Checklist');
  
  // Create Meta sheet (optional)
  const metaData: ExcelMeta[] = [
    {
      TemplateName: '',
      InspectionType: '',
      Frequency: '',
    },
  ];
  const metaWs = XLSX.utils.json_to_sheet(metaData);
  XLSX.utils.book_append_sheet(wb, metaWs, 'Meta');
  
  // Download
  XLSX.writeFile(wb, 'inspection-template.xlsx');
}

// Upload and parse Excel file
export async function uploadExcelFile(file: File): Promise<{
  result: ImportResult;
  meta?: ExcelMeta;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        // Parse Checklist sheet
        const checklistSheet = workbook.Sheets['Checklist'] || workbook.Sheets[workbook.SheetNames[0]];
        if (!checklistSheet) {
          reject(new Error('Checklist sheet not found'));
          return;
        }
        
        const rows: ExcelRow[] = XLSX.utils.sheet_to_json(checklistSheet);
        const result = parseExcelData(rows);
        
        // Parse Meta sheet if exists
        let meta: ExcelMeta | undefined;
        const metaSheet = workbook.Sheets['Meta'];
        if (metaSheet) {
          const metaRows = XLSX.utils.sheet_to_json<ExcelMeta>(metaSheet);
          if (metaRows.length > 0) {
            meta = metaRows[0];
          }
        }
        
        resolve({ result, meta });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsBinaryString(file);
  });
}

