import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ApplicationReview } from './ApplicationReview';
import { CoachOnboarding } from './CoachOnboarding';

type Area = 'athlete' | 'staff';

export function RequireAuth({ children, area }: { children: React.ReactNode; area?: Area }) {
  const { user, profile, loading, profileLoading, profileError, refreshProfile } = useAuth();
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
      try {
        const { data, error } = await supabase.from(table).select('application_status').eq('id', user.id).maybeSingle();
        if (error) console.error('Failed to load application status', error);
        if (!cancelled) setStatus((data?.application_status as string) ?? 'pending');
      } catch (e) {
        console.error('Failed to load application status', e);
        if (!cancelled) setStatus('pending');
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id, role, isStaff]);

  if (loading || (user && !profile && (profileLoading || !profileError)) || (isStaff && checking)) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  }
  if (!user) return <Navigate to="/start" replace />;

  if (!profile && profileError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-muted-foreground text-sm">We couldn’t load your account details.</p>
        <button className="underline" onClick={() => refreshProfile()}>Try again</button>
      </div>
    );
  }

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
