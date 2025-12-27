import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { exportToCSV } from './exportUtils';
import type { ReportFilters } from '../types';

interface GeneratePDFOptions {
  reportType: string;
  sections: string[];
  filters: ReportFilters;
  reportData: any;
  siteName?: string;
  reportName: string;
}

interface GenerateCSVOptions {
  reportType: string;
  sections: string[];
  reportData: any;
  reportName: string;
}

// Helper to format date
function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Helper to format datetime
function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Calculate KPI data from report data
function calculateKPIData(reportData: any) {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  // Checks completed (last 7 days)
  const checksCompleted = reportData.filteredInspections?.filter((ins: any) => {
    const insDate = new Date(ins.inspectionDate || ins.createdAt);
    return (ins.status === 'Closed' || ins.status === 'Approved') && insDate >= sevenDaysAgo;
  }).length || 0;

  // Checks overdue
  const checksOverdue = reportData.filteredInspections?.filter((ins: any) => {
    if (ins.status === 'Closed' || ins.status === 'Approved') return false;
    const dueDate = ins.dueDate ? new Date(ins.dueDate) : null;
    return dueDate && dueDate < now;
  }).length || 0;

  // Open defects
  const openDefects = reportData.filteredDefects?.filter((def: any) => 
    def.status === 'Open' || def.status === 'InProgress' || def.status === 'Acknowledged'
  ).length || 0;

  // Open work orders
  const openWorkOrders = reportData.filteredWorkOrders?.filter((wo: any) =>
    wo.status === 'Open' || wo.status === 'Assigned' || wo.status === 'InProgress'
  ).length || 0;

  // Upcoming PM schedules (next 7 days)
  const upcomingPMSchedules = reportData.allPMSchedules?.filter((pm: any) => {
    // Skip completed schedules
    if (pm.completedAt) return false;
    // Skip inactive schedules
    if (pm.isActive === false) return false;
    if (!pm.nextDueDate) return false;
    const dueDate = new Date(pm.nextDueDate);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return dueDate >= now && dueDate <= sevenDaysFromNow;
  }).length || 0;

  return {
    checksCompleted,
    checksOverdue,
    openDefects,
    openWorkOrders,
    upcomingPMSchedules,
  };
}

// Generate PDF Report
export async function generateReportPDF(options: GeneratePDFOptions): Promise<void> {
  const { reportType, sections, filters, reportData, siteName, reportName } = options;
  
  const doc = new jsPDF();
  let yPosition = 20;

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(reportName, 14, yPosition);
  yPosition += 10;

  // Report metadata
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${formatDateTime(new Date())}`, 14, yPosition);
  yPosition += 5;
  if (siteName) {
    doc.text(`Site: ${siteName}`, 14, yPosition);
    yPosition += 5;
  }

  // Filters summary
  const filterTexts: string[] = [];
  if (filters.dateFrom || filters.dateTo) {
    const dateRange = filters.dateFrom && filters.dateTo
      ? `${formatDate(filters.dateFrom)} - ${formatDate(filters.dateTo)}`
      : filters.dateFrom
      ? `From ${formatDate(filters.dateFrom)}`
      : `Until ${formatDate(filters.dateTo!)}`;
    filterTexts.push(`Date Range: ${dateRange}`);
  }
  if (filters.status) filterTexts.push(`Status: ${filters.status}`);
  if (filters.severity) filterTexts.push(`Severity: ${filters.severity}`);

  if (filterTexts.length > 0) {
    yPosition += 3;
    doc.text(`Filters: ${filterTexts.join(', ')}`, 14, yPosition);
    yPosition += 8;
  } else {
    yPosition += 5;
  }

  // KPIs Section
  if (sections.includes('KPIs')) {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Key Performance Indicators', 14, yPosition);
    yPosition += 10;

    const kpiData = calculateKPIData(reportData);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Checks Completed (Last 7 Days): ${kpiData.checksCompleted}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Checks Overdue: ${kpiData.checksOverdue}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Open Defects: ${kpiData.openDefects}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Open Work Orders: ${kpiData.openWorkOrders}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Upcoming PM Schedules (Next 7 Days): ${kpiData.upcomingPMSchedules}`, 20, yPosition);
    yPosition += 10;
  }

  // Charts Section
  if (sections.includes('Charts')) {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Charts & Analytics', 14, yPosition);
    yPosition += 10;

    // Inspections completed per day (last 7 days)
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Inspections Completed Per Day (Last 7 Days)', 20, yPosition);
    yPosition += 7;

    if (reportData.inspectionsChartData && reportData.inspectionsChartData.length > 0) {
      const last7Days = reportData.inspectionsChartData
        .slice(-7)
        .map((item: any) => ({
          date: formatDate(item.date),
          count: item.value,
        }));

      autoTable(doc, {
        startY: yPosition,
        head: [['Date', 'Inspections']],
        body: last7Days.map((item: any) => [item.date, item.count.toString()]),
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: 20, right: 14 },
      });
      yPosition = (doc as any).lastAutoTable.finalY + 10;
    } else {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.text('No data available', 20, yPosition);
      yPosition += 7;
    }

    // Defects by severity
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Defects by Severity', 20, yPosition);
    yPosition += 7;

    if (reportData.defectsBySeverityData && reportData.defectsBySeverityData.length > 0) {
      const severityData = reportData.defectsBySeverityData.map((item: any) => [
        item.label,
        item.value.toString(),
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Severity', 'Count']],
        body: severityData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: 20, right: 14 },
      });
      yPosition = (doc as any).lastAutoTable.finalY + 10;
    } else {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.text('No data available', 20, yPosition);
      yPosition += 7;
    }
  }

  // Tables Section
  if (sections.includes('Tables')) {
    // Overdue PM schedules (top 10)
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Tables', 14, yPosition);
    yPosition += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Overdue PM Schedules (Top 10)', 20, yPosition);
    yPosition += 7;

    if (reportData.allPMSchedules) {
      const now = new Date();
      const overduePM = reportData.allPMSchedules
        .filter((pm: any) => {
          // Skip completed schedules
          if (pm.completedAt) return false;
          // Skip inactive schedules
          if (pm.isActive === false) return false;
          if (!pm.nextDueDate) return false;
          const dueDate = new Date(pm.nextDueDate);
          return dueDate < now;
        })
        .slice(0, 10)
        .map((pm: any) => [
          pm.name || pm.id,
          pm.assetId || '—',
          pm.nextDueDate ? formatDate(pm.nextDueDate) : '—',
        ]);

      if (overduePM.length > 0) {
        autoTable(doc, {
          startY: yPosition,
          head: [['Schedule', 'Asset', 'Due Date']],
          body: overduePM,
          theme: 'striped',
          headStyles: { fillColor: [59, 130, 246] },
          margin: { left: 20, right: 14 },
        });
        yPosition = (doc as any).lastAutoTable.finalY + 10;
      } else {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.text('No overdue PM schedules', 20, yPosition);
        yPosition += 7;
      }
    } else {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.text('No data available', 20, yPosition);
      yPosition += 7;
    }

    // Open defects (top 10)
    if (yPosition > 220) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Open Defects (Top 10)', 20, yPosition);
    yPosition += 7;

    if (reportData.filteredDefects) {
      const openDefects = reportData.filteredDefects
        .filter((def: any) => def.status === 'Open' || def.status === 'InProgress' || def.status === 'Acknowledged')
        .slice(0, 10)
        .map((def: any) => [
          def.defectCode || def.id,
          (def.title || 'Untitled').substring(0, 40),
          def.severity || '—',
          def.assetId || '—',
        ]);

      if (openDefects.length > 0) {
        autoTable(doc, {
          startY: yPosition,
          head: [['Defect Code', 'Title', 'Severity', 'Asset']],
          body: openDefects,
          theme: 'striped',
          headStyles: { fillColor: [59, 130, 246] },
          margin: { left: 20, right: 14 },
          styles: { fontSize: 9 },
        });
        yPosition = (doc as any).lastAutoTable.finalY + 10;
      } else {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.text('No open defects', 20, yPosition);
        yPosition += 7;
      }
    }

    // Open work orders (top 10)
    if (yPosition > 220) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Open Work Orders (Top 10)', 20, yPosition);
    yPosition += 7;

    if (reportData.filteredWorkOrders) {
      const openWorkOrders = reportData.filteredWorkOrders
        .filter((wo: any) => wo.status === 'Open' || wo.status === 'Assigned' || wo.status === 'InProgress')
        .slice(0, 10)
        .map((wo: any) => [
          wo.id || wo.number || '—',
          (wo.title || 'Untitled').substring(0, 40),
          wo.status || '—',
          wo.priority || '—',
          wo.assetId || '—',
        ]);

      if (openWorkOrders.length > 0) {
        autoTable(doc, {
          startY: yPosition,
          head: [['Work Order', 'Title', 'Status', 'Priority', 'Asset']],
          body: openWorkOrders,
          theme: 'striped',
          headStyles: { fillColor: [59, 130, 246] },
          margin: { left: 20, right: 14 },
          styles: { fontSize: 9 },
        });
      } else {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.text('No open work orders', 20, yPosition);
      }
    }
  }

  // Footer on each page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Save PDF
  doc.save(`${reportName}.pdf`);
}

// Generate CSV Report
export function generateReportCSV(options: GenerateCSVOptions): void {
  const { reportType, sections, reportData, reportName } = options;

  // For CSV, we'll export tables as CSV
  if (!sections.includes('Tables')) {
    throw new Error('CSV export requires Tables section to be selected');
  }

  const csvData: any[] = [];

  // Add KPI summary as first row
  if (sections.includes('KPIs')) {
    const kpiData = calculateKPIData(reportData);
    csvData.push({
      Metric: 'Checks Completed (Last 7 Days)',
      Value: kpiData.checksCompleted,
    });
    csvData.push({
      Metric: 'Checks Overdue',
      Value: kpiData.checksOverdue,
    });
    csvData.push({
      Metric: 'Open Defects',
      Value: kpiData.openDefects,
    });
    csvData.push({
      Metric: 'Open Work Orders',
      Value: kpiData.openWorkOrders,
    });
    csvData.push({
      Metric: 'Upcoming PM Schedules (Next 7 Days)',
      Value: kpiData.upcomingPMSchedules,
    });
    csvData.push({}); // Empty row separator
  }

  // Add open defects
  if (reportData.filteredDefects) {
    const openDefects = reportData.filteredDefects
      .filter((def: any) => def.status === 'Open' || def.status === 'InProgress' || def.status === 'Acknowledged')
      .slice(0, 10)
      .map((def: any) => ({
        'Defect Code': def.defectCode || def.id,
        Title: def.title || 'Untitled',
        Severity: def.severity || '—',
        Status: def.status || '—',
        Asset: def.assetId || '—',
        'Created At': def.createdAt ? formatDate(def.createdAt) : '—',
      }));

    if (openDefects.length > 0) {
      csvData.push({ 'Section': 'Open Defects (Top 10)' });
      csvData.push(...openDefects);
      csvData.push({});
    }
  }

  // Add open work orders
  if (reportData.filteredWorkOrders) {
    const openWorkOrders = reportData.filteredWorkOrders
      .filter((wo: any) => wo.status === 'Open' || wo.status === 'Assigned' || wo.status === 'InProgress')
      .slice(0, 10)
      .map((wo: any) => ({
        'Work Order': wo.id || wo.number || '—',
        Title: wo.title || 'Untitled',
        Status: wo.status || '—',
        Priority: wo.priority || '—',
        Asset: wo.assetId || '—',
        'Created At': wo.createdAt ? formatDate(wo.createdAt) : '—',
      }));

    if (openWorkOrders.length > 0) {
      csvData.push({ 'Section': 'Open Work Orders (Top 10)' });
      csvData.push(...openWorkOrders);
    }
  }

  if (csvData.length === 0) {
    throw new Error('No data available to export');
  }

  // Filter out empty rows for final export
  const finalData = csvData.filter(row => Object.keys(row).length > 0);

  exportToCSV(finalData, reportName);
}

