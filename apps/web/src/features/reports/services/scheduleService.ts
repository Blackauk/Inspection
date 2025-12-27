import type {
  ScheduledReport,
  CreateScheduleData,
  UpdateScheduleData,
  ScheduleFrequency,
} from '../types/scheduledReports';

const STORAGE_KEY = 'scheduled-reports';

// Get all schedules from storage
export function getAllSchedules(): ScheduledReport[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error loading schedules:', error);
    return [];
  }
}

// Save schedules to storage
function saveSchedules(schedules: ScheduledReport[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules));
  } catch (error) {
    console.error('Error saving schedules:', error);
    throw new Error('Failed to save schedules');
  }
}

// Calculate next send date based on frequency and schedule settings
export function calculateNextSendDate(
  frequency: ScheduleFrequency,
  time: string,
  dayOfWeek?: number,
  dayOfMonth?: number,
  lastSentAt?: string
): string {
  const now = new Date();
  const [hours, minutes] = time.split(':').map(Number);
  
  // Start from now, or last sent date if provided
  const startDate = lastSentAt ? new Date(lastSentAt) : now;
  const nextSend = new Date(startDate);
  
  nextSend.setHours(hours, minutes, 0, 0);
  
  // If time has passed today, move to next occurrence
  if (nextSend <= now) {
    switch (frequency) {
      case 'Daily':
        nextSend.setDate(nextSend.getDate() + 1);
        break;
      case 'Weekly':
        if (dayOfWeek !== undefined) {
          const daysUntilNext = (dayOfWeek - nextSend.getDay() + 7) % 7;
          nextSend.setDate(nextSend.getDate() + (daysUntilNext || 7));
        } else {
          nextSend.setDate(nextSend.getDate() + 7);
        }
        break;
      case 'Monthly':
        if (dayOfMonth !== undefined) {
          nextSend.setDate(dayOfMonth);
          nextSend.setMonth(nextSend.getMonth() + 1);
          // Handle months with fewer days
          if (nextSend.getDate() !== dayOfMonth) {
            nextSend.setDate(0); // Last day of previous month
          }
        } else {
          nextSend.setMonth(nextSend.getMonth() + 1);
        }
        break;
    }
  } else {
    // If time hasn't passed yet today, schedule for today
    switch (frequency) {
      case 'Daily':
        // Already set for today
        break;
      case 'Weekly':
        if (dayOfWeek !== undefined && nextSend.getDay() !== dayOfWeek) {
          const daysUntilNext = (dayOfWeek - nextSend.getDay() + 7) % 7;
          nextSend.setDate(nextSend.getDate() + (daysUntilNext || 7));
        }
        break;
      case 'Monthly':
        if (dayOfMonth !== undefined && nextSend.getDate() !== dayOfMonth) {
          const nextMonth = new Date(nextSend);
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          nextMonth.setDate(dayOfMonth);
          if (nextMonth.getDate() !== dayOfMonth) {
            nextMonth.setDate(0); // Last day of month
          }
          return nextMonth.toISOString();
        }
        break;
    }
  }
  
  return nextSend.toISOString();
}

// Create a new schedule
export function createSchedule(
  data: CreateScheduleData,
  createdById: string
): ScheduledReport {
  const schedules = getAllSchedules();
  
  const nextSendAt = calculateNextSendDate(
    data.frequency,
    data.time,
    data.dayOfWeek,
    data.dayOfMonth
  );
  
  const newSchedule: ScheduledReport = {
    id: crypto.randomUUID(),
    ...data,
    status: 'Active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nextSendAt,
    createdById,
  };
  
  schedules.push(newSchedule);
  saveSchedules(schedules);
  
  return newSchedule;
}

// Update an existing schedule
export function updateSchedule(
  id: string,
  data: UpdateScheduleData
): ScheduledReport {
  const schedules = getAllSchedules();
  const index = schedules.findIndex((s) => s.id === id);
  
  if (index === -1) {
    throw new Error('Schedule not found');
  }
  
  const existing = schedules[index];
  const updated: ScheduledReport = {
    ...existing,
    ...data,
    updatedAt: new Date().toISOString(),
  };
  
  // Recalculate next send date if frequency or timing changed
  if (
    data.frequency !== undefined ||
    data.time !== undefined ||
    data.dayOfWeek !== undefined ||
    data.dayOfMonth !== undefined
  ) {
    updated.nextSendAt = calculateNextSendDate(
      updated.frequency,
      updated.time,
      updated.dayOfWeek,
      updated.dayOfMonth,
      updated.lastSentAt
    );
  }
  
  schedules[index] = updated;
  saveSchedules(schedules);
  
  return updated;
}

// Delete a schedule
export function deleteSchedule(id: string): void {
  const schedules = getAllSchedules();
  const filtered = schedules.filter((s) => s.id !== id);
  
  if (filtered.length === schedules.length) {
    throw new Error('Schedule not found');
  }
  
  saveSchedules(filtered);
}

// Get schedule by ID
export function getScheduleById(id: string): ScheduledReport | undefined {
  const schedules = getAllSchedules();
  return schedules.find((s) => s.id === id);
}

// Mark schedule as sent (update lastSentAt and nextSendAt)
export function markScheduleAsSent(id: string): ScheduledReport {
  const schedule = getScheduleById(id);
  if (!schedule) {
    throw new Error('Schedule not found');
  }
  
  const now = new Date().toISOString();
  const nextSendAt = calculateNextSendDate(
    schedule.frequency,
    schedule.time,
    schedule.dayOfWeek,
    schedule.dayOfMonth,
    now
  );
  
  return updateSchedule(id, {
    lastSentAt: now,
    nextSendAt,
  });
}

