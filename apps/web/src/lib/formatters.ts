/**
 * Formatting utilities for consistent display across the app
 */

export type OperationalStatus = 'InUse' | 'OutOfUse' | 'OffHirePending' | 'OffHired' | 'Quarantined' | 'Archived';

/**
 * Format operational status for display
 * Converts camelCase/PascalCase to readable format
 */
export function formatOperationalStatus(status: OperationalStatus): string {
  const statusMap: Record<OperationalStatus, string> = {
    InUse: 'In Use',
    OutOfUse: 'Out of Use',
    OffHirePending: 'Off Hire Pending',
    OffHired: 'Off Hired',
    Quarantined: 'Quarantined',
    Archived: 'Archived',
  };
  return statusMap[status] || status;
}

/**
 * Format lifecycle status for display
 */
export function formatLifecycleStatus(status: string): string {
  // Already formatted, but keeping for consistency
  return status;
}

/**
 * Format date to UK format (DD/MM/YYYY)
 * Safely handles ISO strings, Date objects, and invalid dates
 */
export function formatDateUK(dateLike: string | Date | null | undefined): string {
  if (!dateLike) return '—';
  
  try {
    let date: Date;
    
    if (typeof dateLike === 'string') {
      // If it's already an ISO string (YYYY-MM-DD or full ISO), parse directly
      if (dateLike.includes('T') || /^\d{4}-\d{2}-\d{2}/.test(dateLike)) {
        date = new Date(dateLike);
      } else {
        // Try to parse as-is, but log warning in dev
        date = new Date(dateLike);
        if (import.meta.env.DEV && isNaN(date.getTime())) {
          console.warn(`[formatDateUK] Failed to parse date string: "${dateLike}"`);
        }
      }
    } else {
      date = dateLike;
    }
    
    // Validate date
    if (isNaN(date.getTime())) {
      if (import.meta.env.DEV) {
        console.warn(`[formatDateUK] Invalid date:`, dateLike);
      }
      return '—';
    }
    
    // Format as DD/MM/YYYY
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn(`[formatDateUK] Error formatting date:`, dateLike, error);
    }
    return '—';
  }
}