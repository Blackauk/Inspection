// Mock users for scheduled reports
// TODO: Replace with real user service API call
export interface MockUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'Admin' | 'Manager' | 'Supervisor' | 'Fitter' | 'Viewer';
  siteIds: string[];
}

export const mockUsers: MockUser[] = [
  {
    id: 'user-1',
    email: 'admin@demo.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'Admin',
    siteIds: ['1', '2', '3'],
  },
  {
    id: 'user-2',
    email: 'manager@demo.com',
    firstName: 'Manager',
    lastName: 'User',
    role: 'Manager',
    siteIds: ['1', '2', '3'],
  },
  {
    id: 'user-3',
    email: 'supervisor@demo.com',
    firstName: 'Supervisor',
    lastName: 'User',
    role: 'Supervisor',
    siteIds: ['1'],
  },
  {
    id: 'user-4',
    email: 'fitter@demo.com',
    firstName: 'Fitter',
    lastName: 'User',
    role: 'Fitter',
    siteIds: ['1'],
  },
  {
    id: 'user-5',
    email: 'viewer@demo.com',
    firstName: 'Viewer',
    lastName: 'User',
    role: 'Viewer',
    siteIds: ['1'],
  },
];

export function getUserName(userId: string): string {
  const user = mockUsers.find((u) => u.id === userId);
  return user ? `${user.firstName} ${user.lastName}` : userId;
}

export function getUserEmail(userId: string): string {
  const user = mockUsers.find((u) => u.id === userId);
  return user?.email || '';
}

