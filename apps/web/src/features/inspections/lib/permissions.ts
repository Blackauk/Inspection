import type { UserRole } from '@ppm/shared';
import type { Inspection } from '../types';

export function canCreateInspection(role: UserRole | undefined): boolean {
  if (!role) return false;
  return ['Fitter', 'Supervisor', 'Manager', 'Admin'].includes(role);
}

export function canEditInspection(role: UserRole | undefined, inspection: Inspection): boolean {
  if (!role) return false;
  
  // Inspectors cannot edit after submission
  if (inspection.status === 'Submitted' || inspection.status === 'Approved' || inspection.status === 'Closed') {
    return ['Supervisor', 'Manager', 'Admin'].includes(role);
  }
  
  // Can edit if draft or in progress
  return ['Fitter', 'Supervisor', 'Manager', 'Admin'].includes(role);
}

export function canSubmitInspection(role: UserRole | undefined): boolean {
  if (!role) return false;
  return ['Fitter', 'Supervisor', 'Manager', 'Admin'].includes(role);
}

export function canApproveInspection(role: UserRole | undefined): boolean {
  if (!role) return false;
  return ['Supervisor', 'Manager', 'Admin'].includes(role);
}

export function canCloseInspection(role: UserRole | undefined): boolean {
  if (!role) return false;
  return ['Supervisor', 'Manager', 'Admin'].includes(role);
}

export function canReopenInspection(role: UserRole | undefined): boolean {
  if (!role) return false;
  return ['Supervisor', 'Manager', 'Admin'].includes(role);
}

export function canManageTemplates(role: UserRole | undefined): boolean {
  if (!role) return false;
  return ['Supervisor', 'Manager', 'Admin'].includes(role);
}
