import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../utils/api';
import type { UserRole } from '@ppm/shared';

// Development mode flag - set to false to re-enable login
const IS_DEV = import.meta.env.DEV;

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  role: UserRole;
  siteIds: string[];
  company?: {
    id: string;
    name: string;
  };
}

// Mock user for development
const MOCK_DEV_USER: User = {
  id: 'dev-user-1',
  email: 'dev@example.com',
  firstName: 'Dev',
  lastName: 'User',
  role: 'Admin',
  siteIds: ['1', '2', '3'],
  company: {
    id: 'dev-company-1',
    name: 'Development Company',
  },
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/107c67e1-b121-4ce5-b267-7a0a6dafd4f6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:46',message:'AuthProvider render start',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/107c67e1-b121-4ce5-b267-7a0a6dafd4f6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:52',message:'AuthProvider hooks initialized',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/107c67e1-b121-4ce5-b267-7a0a6dafd4f6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:56',message:'useEffect checkAuth called',data:{isDev:IS_DEV},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    checkAuth();
  }, []);

  async function checkAuth() {
    // Development mode: bypass auth and use mock user
    if (IS_DEV) {
      // Load displayName from localStorage if available
      const savedProfile = localStorage.getItem('ppma.profile');
      let displayName: string | undefined;
      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile);
          displayName = parsed.displayName;
        } catch (e) {
          // Ignore parse errors
        }
      }
      setUser({ ...MOCK_DEV_USER, displayName });
      setLoading(false);
      return;
    }

    // Production mode: normal auth flow
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        const userData = await api.get('/me') as User;
        setUser(userData);
      }
    } catch (error) {
      localStorage.removeItem('accessToken');
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, password: string) {
    // Development mode: bypass login and use mock user
    if (IS_DEV) {
      // Load displayName from localStorage if available
      const savedProfile = localStorage.getItem('ppma.profile');
      let displayName: string | undefined;
      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile);
          displayName = parsed.displayName;
        } catch (e) {
          // Ignore parse errors
        }
      }
      setUser({ ...MOCK_DEV_USER, displayName });
      // Navigate is not available in AuthProvider - will be handled by ProtectedRoute redirect
      return;
    }

    // Production mode: normal login flow
    const response = await api.post('/auth/login', { email, password }) as { accessToken: string; user: User };
    localStorage.setItem('accessToken', response.accessToken);
    // Load displayName from localStorage if available
    const savedProfile = localStorage.getItem('ppma.profile');
    let displayName: string | undefined;
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        displayName = parsed.displayName;
      } catch (e) {
        // Ignore parse errors
      }
    }
    setUser({ ...response.user, displayName });
    // Navigate is not available in AuthProvider - will be handled by ProtectedRoute redirect
  }

  async function logout() {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Ignore errors
    }
    localStorage.removeItem('accessToken');
    setUser(null);
    // Navigate is not available in AuthProvider - will be handled by ProtectedRoute redirect
    window.location.href = '/login';
  }

  async function refreshUser() {
    try {
      const userData = await api.get('/me') as User;
      // Load displayName from localStorage if available
      const savedProfile = localStorage.getItem('ppma.profile');
      let displayName: string | undefined;
      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile);
          displayName = parsed.displayName;
        } catch (e) {
          // Ignore parse errors
        }
      }
      setUser({ ...userData, displayName });
    } catch (error) {
      await logout();
    }
  }

  function updateUser(updates: Partial<User>) {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      // Persist displayName to localStorage if it's being updated
      if (updates.displayName !== undefined) {
        const savedProfile = localStorage.getItem('ppma.profile');
        let profile: any = {};
        if (savedProfile) {
          try {
            profile = JSON.parse(savedProfile);
          } catch (e) {
            // Ignore parse errors
          }
        }
        profile.displayName = updates.displayName;
        localStorage.setItem('ppma.profile', JSON.stringify(profile));
      }
      return updated;
    });
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}


