import type { FastifyRequest } from 'fastify';
import type { UserRole } from '../shared/index.js';

export interface AuthenticatedUser {
  userId: string;
  role: UserRole;
  siteIds: string[];
}

export function getUserFromRequest(request: FastifyRequest): AuthenticatedUser | null {
  return (request as any).user || null;
}

export function requireAuth(request: FastifyRequest): AuthenticatedUser {
  const user = getUserFromRequest(request);
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

export function requireRole(request: FastifyRequest, allowedRoles: UserRole[]): AuthenticatedUser {
  const user = requireAuth(request);
  if (!allowedRoles.includes(user.role)) {
    throw new Error('Forbidden');
  }
  return user;
}

export function canAccessSite(user: AuthenticatedUser, siteId: string): boolean {
  if (user.role === 'Admin' || user.role === 'Manager') {
    return true;
  }
  return user.siteIds.includes(siteId);
}

export function canModifyAsset(user: AuthenticatedUser): boolean {
  return ['Fitter', 'Supervisor', 'Manager', 'Admin'].includes(user.role);
}

export function canCreateWorkOrder(user: AuthenticatedUser): boolean {
  return ['Fitter', 'Supervisor', 'Manager', 'Admin'].includes(user.role);
}

export function canApproveWorkOrder(user: AuthenticatedUser): boolean {
  return ['Supervisor', 'Manager', 'Admin'].includes(user.role);
}

export function canManageSchedules(user: AuthenticatedUser): boolean {
  return ['Supervisor', 'Manager', 'Admin'].includes(user.role);
}

export function canManageCheckTemplates(user: AuthenticatedUser): boolean {
  return ['Supervisor', 'Manager', 'Admin'].includes(user.role);
}


