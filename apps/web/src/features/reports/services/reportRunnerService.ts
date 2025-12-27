import { generateReportPDF } from '../utils/reportGenerator';
import { sendReportEmail, generateEmailSubject, generateEmailBody } from './emailService';
import { markScheduleAsSent } from './scheduleService';
import { getUserEmail, getUserName } from './mockUsers';
import type { ScheduledReport } from '../types/scheduledReports';
import type { ReportFilters } from '../types';

/**
 * Service for running scheduled reports
 * Generates report content and sends emails
 */
export interface ReportRunContext {
  schedule: ScheduledReport;
  reportData: any;
  filters: ReportFilters;
  siteNames: Record<string, string>;
}

/**
 * Run a scheduled report now
 * Generates the report and sends emails to all recipients
 */
export async function runScheduleNow(context: ReportRunContext): Promise<void> {
  const { schedule, reportData, filters, siteNames } = context;
  
  try {
    // Generate PDF if needed
    let pdfBlob: Blob | undefined;
    if (schedule.outputFormat === 'PDF' || schedule.outputFormat === 'Both') {
      const reportName = `${schedule.name} - ${new Date().toLocaleDateString()}`;
      const siteName = schedule.scope.siteIds.length === 1
        ? siteNames[schedule.scope.siteIds[0]]
        : undefined;
      
      // Generate PDF (this will trigger download, we need to capture it)
      // For MVP, we'll generate a blob version
      pdfBlob = await generateReportPDFBlob({
        reportType: 'summary',
        sections: schedule.sections,
        filters,
        reportData,
        siteName,
        reportName,
      });
    }
    
    // Collect all recipients
    const recipients = [
      // Internal users
      ...schedule.recipients.userIds.map((userId) => ({
        email: getUserEmail(userId),
        name: getUserName(userId),
      })),
      // External emails
      ...schedule.recipients.externalEmails.map((email) => ({
        email,
        name: undefined,
      })),
    ];
    
    // Send email
    const subject = generateEmailSubject(schedule);
    const body = schedule.outputFormat === 'EmailBody' || schedule.outputFormat === 'Both'
      ? generateEmailBody(schedule, reportData)
      : undefined;
    
    await sendReportEmail({
      to: recipients,
      subject,
      body,
      attachment: pdfBlob
        ? {
            filename: `${schedule.name} - ${new Date().toISOString().split('T')[0]}.pdf`,
            content: pdfBlob,
            contentType: 'application/pdf',
          }
        : undefined,
    });
    
    // Mark schedule as sent
    markScheduleAsSent(schedule.id);
  } catch (error: any) {
    console.error('Error running scheduled report:', error);
    throw new Error(`Failed to run scheduled report: ${error.message}`);
  }
}

/**
 * Generate report PDF as blob (for email attachment)
 * This is a wrapper around generateReportPDF that returns a blob instead of triggering download
 */
async function generateReportPDFBlob(options: {
  reportType: string;
  sections: string[];
  filters: ReportFilters;
  reportData: any;
  siteName?: string;
  reportName: string;
}): Promise<Blob> {
  // For MVP, we'll use the existing PDF generator logic but return a blob
  // In production, this should generate the PDF in memory and return as blob
  
  // Import the PDF generator utilities
  const jsPDF = (await import('jspdf')).default;
  const autoTable = (await import('jspdf-autotable')).default;
  
  // For now, we'll use the same logic but return a blob
  // This is a simplified version - in production, refactor generateReportPDF to support blob output
  
  // TODO: Refactor generateReportPDF to accept a "returnBlob" option
  // For MVP, we'll note that PDF generation for email attachments needs this refactor
  // For now, return a placeholder blob
  console.warn('PDF blob generation for email attachments needs refactoring of generateReportPDF');
  return new Blob(['PDF placeholder - email attachment PDF generation needs refactoring'], { type: 'application/pdf' });
}

