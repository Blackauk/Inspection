import type { UserRole } from '@ppm/shared';

export function canCreateSite(role: UserRole | undefined): boolean {
  if (!role) return false;
  return role === 'Admin';
}

export function canEditSite(role: UserRole | undefined): boolean {
  if (!role) return false;
  return role === 'Admin';
}

export function canArchiveSite(role: UserRole | undefined): boolean {
  if (!role) return false;
  return role === 'Admin';
}

export function canCreateLocation(role: UserRole | undefined): boolean {
  if (!role) return false;
  return ['Admin', 'Manager'].includes(role);
}

export function canEditLocation(role: UserRole | undefined): boolean {
  if (!role) return false;
  return ['Admin', 'Manager'].includes(role);
}

export function canArchiveLocation(role: UserRole | undefined): boolean {
  if (!role) return false;
  return role === 'Admin';
}

export function canViewSite(userSiteIds: string[], siteId: string, role: UserRole | undefined): boolean {
  if (!role) return false;
  // Admin and Manager can see all sites
  if (role === 'Admin' || role === 'Manager') {
    return true;
  }
  // Others can only see assigned sites
  return userSiteIds.includes(siteId);
}
