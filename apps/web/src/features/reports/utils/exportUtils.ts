import * as XLSX from 'xlsx';
import type { SortableColumn } from '../../../components/common/SortableTable';

// Export table data to CSV
export function exportToCSV(data: any[], filename: string, headers?: string[]) {
  if (data.length === 0) {
    alert('No data to export');
    return;
  }

  // Get headers from first row if not provided
  const csvHeaders = headers || Object.keys(data[0]);
  
  // Create CSV content
  const csvContent = [
    csvHeaders.join(','),
    ...data.map(row => 
      csvHeaders.map(header => {
        const value = row[header];
        // Escape commas and quotes
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    )
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Export table data to Excel
export function exportToExcel(data: any[], filename: string, sheetName: string = 'Data') {
  if (data.length === 0) {
    alert('No data to export');
    return;
  }

  // Create workbook
  const wb = XLSX.utils.book_new();
  
  // Convert data to worksheet
  const ws = XLSX.utils.json_to_sheet(data);
  
  // Set column widths
  const maxWidths: number[] = [];
  const headers = Object.keys(data[0]);
  headers.forEach((header, colIndex) => {
    const maxLength = Math.max(
      header.length,
      ...data.map(row => String(row[header] || '').length)
    );
    maxWidths[colIndex] = Math.min(maxLength + 2, 50);
  });
  ws['!cols'] = maxWidths.map(w => ({ wch: w }));
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  
  // Download
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// Export table data with columns (respects column render functions)
export function exportTableToExcel(
  data: any[],
  columns: SortableColumn[],
  filename: string,
  sheetName: string = 'Data'
) {
  if (data.length === 0) {
    alert('No data to export');
    return;
  }

  // Extract headers and data using column definitions
  const headers = columns.map((col) => {
    if (typeof col.label === 'string') return col.label;
    return col.key;
  });

  const exportData = data.map((row) => {
    const rowData: Record<string, any> = {};
    columns.forEach((col) => {
      if (col.render) {
        // For rendered columns, extract text content from rendered output
        const rendered = col.render(row[col.key], row);
        if (typeof rendered === 'string') {
          rowData[col.key] = rendered;
        } else if (rendered && typeof rendered === 'object' && 'props' in rendered) {
          // Try to extract text from React elements
          const textContent = extractTextFromReactElement(rendered);
          rowData[col.key] = textContent || String(row[col.key] || '');
        } else {
          rowData[col.key] = String(row[col.key] || '');
        }
      } else {
        rowData[col.key] = row[col.key] ?? '';
      }
    });
    return rowData;
  });

  // Create workbook
  const wb = XLSX.utils.book_new();
  
  // Convert to worksheet with headers
  const ws = XLSX.utils.json_to_sheet(exportData, { header: columns.map((c) => c.key) });
  
  // Update header row with actual labels
  const headerRange = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  headers.forEach((header, index) => {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: index });
    if (!ws[cellAddress]) ws[cellAddress] = { t: 's', v: '' };
    ws[cellAddress].v = header;
  });
  
  // Set column widths
  const maxWidths: number[] = [];
  columns.forEach((col, colIndex) => {
    const maxLength = Math.max(
      headers[colIndex].length,
      ...exportData.map(row => String(row[col.key] || '').length)
    );
    maxWidths[colIndex] = Math.min(maxLength + 2, 50);
  });
  ws['!cols'] = maxWidths.map(w => ({ wch: w }));
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  
  // Download
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// Helper to extract text from React elements
function extractTextFromReactElement(element: any): string {
  if (typeof element === 'string') return element;
  if (typeof element === 'number') return String(element);
  if (!element || typeof element !== 'object') return '';
  
  if (element.props && element.props.children) {
    if (typeof element.props.children === 'string') return element.props.children;
    if (Array.isArray(element.props.children)) {
      return element.props.children.map(extractTextFromReactElement).join(' ');
    }
    return extractTextFromReactElement(element.props.children);
  }
  
  return '';
}

// Export table data to PDF (creates a table HTML element)
export function exportTableToPDF(
  data: any[],
  columns: SortableColumn[],
  filename: string,
  title?: string
) {
  if (data.length === 0) {
    alert('No data to export');
    return;
  }

  // Extract headers
  const headers = columns.map((col) => {
    if (typeof col.label === 'string') return col.label;
    return col.key;
  });

  // Build table HTML
  let tableHTML = `
    <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
      <thead>
        <tr style="background-color: #f3f4f6;">
  `;
  
  headers.forEach((header) => {
    tableHTML += `<th style="border: 1px solid #d1d5db; padding: 8px; text-align: left; font-weight: 600;">${header}</th>`;
  });
  
  tableHTML += `
        </tr>
      </thead>
      <tbody>
  `;
  
  data.forEach((row) => {
    tableHTML += '<tr>';
    columns.forEach((col) => {
      let cellValue = '';
      if (col.render) {
        const rendered = col.render(row[col.key], row);
        cellValue = extractTextFromReactElement(rendered) || String(row[col.key] || '');
      } else {
        cellValue = String(row[col.key] || '');
      }
      tableHTML += `<td style="border: 1px solid #d1d5db; padding: 8px;">${cellValue}</td>`;
    });
    tableHTML += '</tr>';
  });
  
  tableHTML += `
      </tbody>
    </table>
  `;

  // Create print window
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to export PDF');
    return;
  }

  // Get styles
  const styles = Array.from(document.styleSheets)
    .map(sheet => {
      try {
        return Array.from(sheet.cssRules)
          .map(rule => rule.cssText)
          .join('\n');
      } catch {
        return '';
      }
    })
    .join('\n');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${filename}</title>
        <style>
          ${styles}
          body { margin: 20px; font-family: system-ui, -apple-system, sans-serif; }
          h1 { margin-bottom: 20px; }
          @media print {
            @page { margin: 1cm; }
          }
        </style>
      </head>
      <body>
        ${title ? `<h1>${title}</h1>` : ''}
        ${tableHTML}
      </body>
    </html>
  `);

  printWindow.document.close();
  
  // Wait for content to load, then print
  setTimeout(() => {
    printWindow.print();
    // Close after print dialog
    setTimeout(() => printWindow.close(), 100);
  }, 250);
}

// Export page as PDF (simple HTML to PDF using browser print)
export function exportPageAsPDF(filename: string, elementId?: string) {
  const element = elementId ? document.getElementById(elementId) : document.body;
  if (!element) {
    alert('Element not found for PDF export');
    return;
  }

  // Create a new window with the content
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to export PDF');
    return;
  }

  // Get styles
  const styles = Array.from(document.styleSheets)
    .map(sheet => {
      try {
        return Array.from(sheet.cssRules)
          .map(rule => rule.cssText)
          .join('\n');
      } catch {
        return '';
      }
    })
    .join('\n');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${filename}</title>
        <style>
          ${styles}
          body { margin: 20px; }
          @media print {
            @page { margin: 1cm; }
          }
        </style>
      </head>
      <body>
        ${element.innerHTML}
      </body>
    </html>
  `);

  printWindow.document.close();
  
  // Wait for content to load, then print
  setTimeout(() => {
    printWindow.print();
    // Close after print dialog
    setTimeout(() => printWindow.close(), 100);
  }, 250);
}


