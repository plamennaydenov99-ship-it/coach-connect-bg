import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/context/LanguageContext';
import { DEMO_MODE, DEMO_ROLES, DEMO_HOME, type DemoRole } from '@/lib/demo';
import { cn } from '@/lib/utils';

function useDemoSwitch() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { profile, refreshProfile } = useAuth();
  const [busy, setBusy] = useState<DemoRole | null>(null);

  const current: DemoRole | null = profile
    ? profile.is_admin ? 'admin' : (profile.role as DemoRole)
    : null;

  const switchTo = async (role: DemoRole) => {
    if (busy) return;
    setBusy(role);
    try {
      await supabase.auth.signOut();
      const { data, error } = await supabase.functions.invoke('demo-login', { body: { role } });
      if (error || !data?.access_token) throw error ?? new Error('no session');
      const { error: sErr } = await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });
      if (sErr) throw sErr;
      await refreshProfile();
      navigate(DEMO_HOME[role], { replace: true });
    } catch {
      toast.error(t.demo_error);
    } finally {
      setBusy(null);
    }
  };

  const label = (r: DemoRole) =>
    ({ coach: t.demo_coach, club: t.demo_club, athlete: t.demo_athlete, admin: t.demo_admin })[r];

  return { current, busy, switchTo, label, t };
}

/** Fixed bottom bar shown on every page while testing mode is on. */
export function DemoSwitcher() {
  const s = useDemoSwitch();
  if (!DEMO_MODE) return null;
  return (
    <div className="coach-portal fixed bottom-16 md:bottom-3 left-1/2 -translate-x-1/2 z-[60] max-w-[calc(100vw-1rem)]">
      <div className="flex items-center gap-1 rounded-md border border-portal-border bg-portal-card px-2 py-1 font-body text-portal-ink">
        <span className="hidden sm:inline font-display uppercase tracking-[0.1em] text-[11px] text-portal-muted pr-1 whitespace-nowrap">
          {s.t.demo_bar}
        </span>
        {DEMO_ROLES.map((r) => {
          const active = s.current === r;
          return (
            <button
              key={r}
              type="button"
              disabled={!!s.busy}
              onClick={() => s.switchTo(r)}
              aria-pressed={active}
              className={cn(
                'flex items-center gap-1 rounded-sm border px-2 py-1 font-display uppercase tracking-[0.08em] text-xs transition-colors disabled:opacity-60',
                active
                  ? 'border-portal-selected-border bg-portal-selected text-portal-ink'
                  : 'border-transparent text-portal-muted-strong hover:text-portal-blue',
              )}
            >
              {s.busy === r && <Loader2 className="h-3 w-3 animate-spin" />}
              {s.label(r)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Replaces the auth forms on /start while testing mode is on. */
export function DemoRolePicker() {
  const s = useDemoSwitch();
  return (
    <>
      <h1 className="font-display text-2xl uppercase tracking-[0.1em]">{s.t.demo_start_title}</h1>
      <p className="text-sm text-muted-foreground mt-2 mb-6">{s.t.demo_start_sub}</p>
      <div className="space-y-3">
        {DEMO_ROLES.map((r) => (
          <button
            key={r}
            type="button"
            disabled={!!s.busy}
            onClick={() => s.switchTo(r)}
            className="w-full text-left border border-border p-4 flex items-center justify-between hover:border-foreground transition-colors disabled:opacity-60 font-display uppercase tracking-[0.08em]"
          >
            {s.label(r)}
            {s.busy === r && <Loader2 className="h-4 w-4 animate-spin" />}
          </button>
        ))}
      </div>
    </>
  );
}
