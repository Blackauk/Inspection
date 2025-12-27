export type ScheduleFrequency = 'Daily' | 'Weekly' | 'Monthly';

export type ScheduleStatus = 'Active' | 'Paused' | 'Draft';

export type ReportSection = 'KPIs' | 'Charts' | 'Tables';

export type DateRangeOption = 'Last 7 days' | 'Last 14 days' | 'Last 30 days';

export interface ScheduledReport {
  id: string;
  name: string;
  frequency: ScheduleFrequency;
  time: string; // HH:mm format
  dayOfWeek?: number; // 0-6 (Sunday-Saturday), for Weekly
  dayOfMonth?: number; // 1-31, for Monthly
  recipients: {
    userIds: string[]; // Internal user IDs
    externalEmails: string[]; // External email addresses
  };
  scope: {
    siteIds: string[];
    teamIds?: string[]; // Optional team filtering
  };
  sections: ReportSection[];
  dateRange: DateRangeOption;
  includeUpcomingPM: boolean;
  upcomingPMDays: number; // 7 or 14
  outputFormat: 'PDF' | 'EmailBody' | 'Both';
  status: ScheduleStatus;
  createdAt: string;
  updatedAt: string;
  lastSentAt?: string;
  nextSendAt: string;
  createdById: string;
}

export interface CreateScheduleData {
  name: string;
  frequency: ScheduleFrequency;
  time: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  recipients: {
    userIds: string[];
    externalEmails: string[];
  };
  scope: {
    siteIds: string[];
    teamIds?: string[];
  };
  sections: ReportSection[];
  dateRange: DateRangeOption;
  includeUpcomingPM: boolean;
  upcomingPMDays: number;
  outputFormat: 'PDF' | 'EmailBody' | 'Both';
}

export interface UpdateScheduleData extends Partial<CreateScheduleData> {
  status?: ScheduleStatus;
}

