import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ApplicationReview } from './ApplicationReview';
import { CoachOnboarding } from './CoachOnboarding';

type Area = 'athlete' | 'staff';

export function RequireAuth({ children, area }: { children: React.ReactNode; area?: Area }) {
  const { user, profile, loading } = useAuth();
  const role = profile?.role;
  const isStaff = role === 'coach' || role === 'club';
  const [status, setStatus] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!user || !isStaff) {
      setStatus(null);
      return;
    }
    let cancelled = false;
    setChecking(true);
    (async () => {
      const table = role === 'coach' ? 'coach_profiles' : 'club_profiles';
      const { data } = await supabase.from(table).select('application_status').eq('id', user.id).maybeSingle();
      if (!cancelled) {
        setStatus((data?.application_status as string) ?? 'pending');
        setChecking(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, role, isStaff]);

  if (loading || (user && !profile) || (isStaff && checking)) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  }
  if (!user) return <Navigate to="/start" replace />;

  if (area === 'athlete' && profile && profile.role !== 'athlete') {
    return <Navigate to="/dashboard" replace />;
  }
  if (area === 'staff' && profile && profile.role === 'athlete') {
    return <Navigate to="/account" replace />;
  }

  if (area === 'staff' && role === 'coach' && status === 'draft') {
    return <CoachOnboarding onSubmitted={() => setStatus('pending')} />;
  }

  if (area === 'staff' && isStaff && (status === 'pending' || status === 'rejected')) {
    return <ApplicationReview status={status} />;
  }

  return <>{children}</>;
}
