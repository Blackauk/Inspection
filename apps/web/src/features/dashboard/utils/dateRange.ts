export type DateRangePreset = '7d' | '14d' | '30d' | '90d' | 'mtd' | 'custom';

export interface DateRange {
  preset: DateRangePreset;
  from?: Date;
  to?: Date;
}

/**
 * Converts a preset to a DateRange with calculated from/to dates
 */
export function getDateRangeForPreset(preset: DateRangePreset): { from: Date; to: Date } {
  const to = new Date();
  to.setHours(23, 59, 59, 999); // End of today

  let from = new Date();

  switch (preset) {
    case '7d':
      from.setDate(from.getDate() - 7);
      break;
    case '14d':
      from.setDate(from.getDate() - 14);
      break;
    case '30d':
      from.setDate(from.getDate() - 30);
      break;
    case '90d':
      from.setDate(from.getDate() - 90);
      break;
    case 'mtd':
      // First day of current month
      from = new Date(to.getFullYear(), to.getMonth(), 1);
      break;
    case 'custom':
      // For custom, from/to should be provided explicitly
      from = new Date();
      from.setDate(from.getDate() - 30); // Default fallback
      break;
  }

  from.setHours(0, 0, 0, 0); // Start of day
  return { from, to };
}

/**
 * Formats a date range for display
 */
export function formatDateRange(range: DateRange): string {
  if (range.preset === 'custom' && range.from && range.to) {
    const formatDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${formatDate(range.from)} - ${formatDate(range.to)}`;
  }

  switch (range.preset) {
    case '7d':
      return 'Last 7 days';
    case '14d':
      return 'Last 14 days';
    case '30d':
      return 'Last 30 days';
    case '90d':
      return 'Last 90 days';
    case 'mtd':
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      return `${firstDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    default:
      return 'Custom range';
  }
}

/**
 * Checks if a date falls within a date range
 */
export function isDateInRange(date: Date, range: DateRange): boolean {
  const { from, to } = range.preset === 'custom' && range.from && range.to
    ? { from: range.from, to: range.to }
    : getDateRangeForPreset(range.preset);

  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);

  return checkDate >= from && checkDate <= to;
}



