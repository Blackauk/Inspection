import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Development mode flag - set to false to re-enable login
const IS_DEV = import.meta.env.DEV;

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  // Development mode: bypass all auth checks (including loading)
  if (IS_DEV) {
    return <>{children}</>;
  }

  // Production mode: check loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Production mode: require authentication
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}


