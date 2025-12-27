import { showToast } from '../../../components/common/Toast';
import type { ScheduledReport } from '../types/scheduledReports';

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface ReportEmailOptions {
  to: EmailRecipient[];
  subject: string;
  body?: string;
  attachment?: {
    filename: string;
    content: Blob;
    contentType: string;
  };
}

/**
 * Email service interface for sending scheduled reports.
 * 
 * This is a mock implementation that logs to console and shows toast notifications.
 * 
 * TODO: Replace with real email service integration:
 * - SendGrid: Use @sendgrid/mail
 * - SMTP: Use nodemailer
 * - Microsoft Graph: Use @microsoft/microsoft-graph-client
 * 
 * Example SendGrid integration:
 * ```typescript
 * import sgMail from '@sendgrid/mail';
 * sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
 * 
 * export async function sendReportEmail(options: ReportEmailOptions): Promise<void> {
 *   const msg = {
 *     to: options.to.map(r => r.email),
 *     from: 'reports@yourcompany.com',
 *     subject: options.subject,
 *     text: options.body || '',
 *     html: options.body ? `<p>${options.body}</p>` : undefined,
 *     attachments: options.attachment ? [{
 *       content: await options.attachment.content.arrayBuffer(),
 *       filename: options.attachment.filename,
 *       type: options.attachment.contentType,
 *       disposition: 'attachment',
 *     }] : undefined,
 *   };
 *   await sgMail.send(msg);
 * }
 * ```
 */
export async function sendReportEmail(options: ReportEmailOptions): Promise<void> {
  // Mock implementation - log to console and show toast
  console.log('📧 Mock Email Service - Sending Report Email:', {
    to: options.to.map((r) => r.email),
    subject: options.subject,
    hasBody: !!options.body,
    hasAttachment: !!options.attachment,
    attachmentFilename: options.attachment?.filename,
  });

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Show success toast
  showToast(
    `Report email sent to ${options.to.length} recipient(s)`,
    'success'
  );

  // In a real implementation, this would:
  // 1. Validate email addresses
  // 2. Call the email service API (SendGrid/SMTP/etc)
  // 3. Handle errors and retries
  // 4. Log email delivery status
  // 5. Update schedule lastSentAt timestamp
}

/**
 * Generate email subject for a scheduled report
 */
export function generateEmailSubject(schedule: ScheduledReport): string {
  return `${schedule.name} - ${new Date().toLocaleDateString()}`;
}

/**
 * Generate email body for a scheduled report
 */
export function generateEmailBody(
  schedule: ScheduledReport,
  reportData: any
): string {
  const lines: string[] = [];
  
  lines.push(`Hello,`);
  lines.push('');
  lines.push(`Please find your ${schedule.name} attached.`);
  lines.push('');
  
  if (schedule.sections.includes('KPIs')) {
    lines.push('Key Metrics:');
    lines.push(`- Checks Completed: ${reportData.kpis?.checksCompleted || 0}`);
    lines.push(`- Checks Overdue: ${reportData.kpis?.checksOverdue || 0}`);
    lines.push(`- Open Defects: ${reportData.kpis?.openDefects || 0}`);
    lines.push(`- Open Work Orders: ${reportData.kpis?.openWorkOrders || 0}`);
    lines.push('');
  }
  
  lines.push('Best regards,');
  lines.push('CoreCheck PM System');
  
  return lines.join('\n');
}

