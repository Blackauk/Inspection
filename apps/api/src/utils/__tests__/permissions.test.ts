import { describe, it, expect } from 'vitest';
import { canAccessSite } from '../permissions';
import type { AuthenticatedUser } from '../permissions';

describe('Permissions', () => {
  describe('canAccessSite', () => {
    it('should allow Admin to access any site', () => {
      const admin: AuthenticatedUser = {
        userId: '1',
        role: 'Admin',
        siteIds: ['site1'],
      };
      expect(canAccessSite(admin, 'site2')).toBe(true);
    });

    it('should allow Manager to access any site', () => {
      const manager: AuthenticatedUser = {
        userId: '1',
        role: 'Manager',
        siteIds: ['site1'],
      };
      expect(canAccessSite(manager, 'site2')).toBe(true);
    });

    it('should allow Supervisor to access only assigned sites', () => {
      const supervisor: AuthenticatedUser = {
        userId: '1',
        role: 'Supervisor',
        siteIds: ['site1', 'site2'],
      };
      expect(canAccessSite(supervisor, 'site1')).toBe(true);
      expect(canAccessSite(supervisor, 'site2')).toBe(true);
      expect(canAccessSite(supervisor, 'site3')).toBe(false);
    });

    it('should allow Fitter to access only assigned sites', () => {
      const fitter: AuthenticatedUser = {
        userId: '1',
        role: 'Fitter',
        siteIds: ['site1'],
      };
      expect(canAccessSite(fitter, 'site1')).toBe(true);
      expect(canAccessSite(fitter, 'site2')).toBe(false);
    });

    it('should allow Viewer to access only assigned sites', () => {
      const viewer: AuthenticatedUser = {
        userId: '1',
        role: 'Viewer',
        siteIds: ['site1'],
      };
      expect(canAccessSite(viewer, 'site1')).toBe(true);
      expect(canAccessSite(viewer, 'site2')).toBe(false);
    });
  });
});


