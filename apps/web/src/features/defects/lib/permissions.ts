import type { UserRole } from '@ppm/shared';
import type { Defect } from '../types';

export function canRaiseDefect(role: UserRole | undefined): boolean {
  if (!role) return false;
  return role !== 'Viewer';
}

export function canEditDefect(role: UserRole | undefined): boolean {
  if (!role) return false;
  return ['Supervisor', 'Manager', 'Admin'].includes(role);
}

export function canCloseDefect(role: UserRole | undefined): boolean {
  if (!role) return false;
  return role !== 'Viewer';
}

export function canReopenDefect(role: UserRole | undefined): boolean {
  if (!role) return false;
  // Only Supervisor, Manager, and Admin can reopen defects
  return ['Supervisor', 'Manager', 'Admin'].includes(role);
}

export function canDeleteDefect(role: UserRole | undefined): boolean {
  if (!role) return false;
  return ['Manager', 'Admin'].includes(role);
}

export function validateCloseDefect(defect: Defect): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check if high severity requires completed actions
  const highSeverity = defect.severityModel === 'LMH' 
    ? defect.severity === 'High'
    : (defect.severity === 'Major' || defect.severity === 'Critical');
  
  if (highSeverity) {
    const hasRequiredAction = defect.actions.some((a) => a.required && a.completed);
    if (!hasRequiredAction) {
      errors.push('At least one required action must be completed before closing high severity defects');
    }
  }

  // Check before/after photos if required
  if (defect.beforeAfterRequired) {
    const beforePhotos = defect.attachments.filter(
      (a) => a.type === 'photo' && a.label === 'before'
    );
    const afterPhotos = defect.attachments.filter(
      (a) => a.type === 'photo' && a.label === 'after'
    );

    if (beforePhotos.length === 0 || afterPhotos.length === 0) {
      errors.push('Before and after photos are required before closing this defect');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
