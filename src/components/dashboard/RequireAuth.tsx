import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

type Area = 'athlete' | 'staff';

export function RequireAuth({ children, area }: { children: React.ReactNode; area?: Area }) {
  const { user, profile, loading } = useAuth();

  if (loading || (user && !profile)) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  }
  if (!user) return <Navigate to="/start" replace />;

  if (area === 'athlete' && profile && profile.role !== 'athlete') {
    return <Navigate to="/dashboard" replace />;
  }
  if (area === 'staff' && profile && profile.role === 'athlete') {
    return <Navigate to="/account" replace />;
  }
  return <>{children}</>;
}
