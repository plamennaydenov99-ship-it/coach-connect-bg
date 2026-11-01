import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PublicNav } from '@/components/layout/PublicNav';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Zap, User, Building2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/context/LanguageContext';
import { homeFor } from '@/lib/routes';
import { DEMO_MODE } from '@/lib/demo';
import { DemoRolePicker } from '@/components/DemoSwitcher';

type Mode = 'login' | 'signup';
type Role = 'athlete' | 'coach' | 'club';

const INTENDED_ROLE_KEY = 'zenit_intended_role';

/** Make sure the signed-in user has the extension row for `role`, and set it as their active role. */
export async function ensureRole(userId: string, role: Role, currentRole?: string | null) {
  if (currentRole !== role) {
    await supabase.from('profiles').update({ role }).eq('id', userId);
  }
  if (role === 'athlete') {
    const { data } = await supabase.from('athlete_profiles').select('id').eq('id', userId).maybeSingle();
    if (!data) await supabase.from('athlete_profiles').insert({ id: userId });
  } else if (role === 'coach') {
    const { data } = await supabase.from('coach_profiles').select('id').eq('id', userId).maybeSingle();
    if (!data) await supabase.from('coach_profiles').insert({ id: userId, application_status: 'draft' });
  } else {
    const { data } = await supabase.from('club_profiles').select('id').eq('id', userId).maybeSingle();
    if (!data) await supabase.from('club_profiles').insert({ id: userId, application_status: 'pending' });
  }
}

const Start = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user, profile, loading, refreshProfile } = useAuth();
  const [params] = useSearchParams();
  const paramRole = params.get('role');
  // The For coaches page links here with ?role=coach&mode=signup so nobody is asked twice.
  const [role, setRole] = useState<Role | null>(paramRole === 'athlete' || paramRole === 'coach' || paramRole === 'club' ? paramRole : null);
  const [mode, setMode] = useState<Mode>(params.get('mode') === 'signup' ? 'signup' : 'login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const handled = useRef(false);

  // Allow a fresh reconciliation after a sign-out → sign-in in the same tab
  useEffect(() => {
    if (!user) handled.current = false;
  }, [user]);

  // Already signed in (incl. returning from Google) → reconcile role then route
  useEffect(() => {
    if (DEMO_MODE || loading || !user || !profile || handled.current) return;
    handled.current = true;
    (async () => {
      const intended = sessionStorage.getItem(INTENDED_ROLE_KEY) as Role | null;
      let active: Role = (profile.role as Role) ?? 'athlete';
      if (intended && ['athlete', 'coach', 'club'].includes(intended)) {
        await ensureRole(user.id, intended, profile.role);
        sessionStorage.removeItem(INTENDED_ROLE_KEY);
        active = intended;
        await refreshProfile();
      }
      navigate(homeFor(active), { replace: true });
    })();
  }, [loading, user, profile, navigate, refreshProfile]);

  const pickRole = async (r: Role) => {
    // Authenticated user adding / switching a role
    if (user && profile) {
      setBusy(true);
      await ensureRole(user.id, r, profile.role);
      await refreshProfile();
      setBusy(false);
      if (r !== profile.role) toast.success(t.entry_role_added);
      navigate(homeFor(r), { replace: true });
      return;
    }
    setRole(r);
  };

  /** Reconcile the picked role against the signed-in user, then route. Deterministic — no effect needed. */
  const finishAuth = async (userId: string, picked: Role) => {
    // The profile row is created by a DB trigger on signup; poll briefly for it.
    let currentRole: string | null = null;
    for (let i = 0; i < 10; i++) {
      const { data } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle();
      if (data) {
        currentRole = data.role as string;
        break;
      }
      await new Promise(r => setTimeout(r, 300));
    }
    await ensureRole(userId, picked, currentRole);
    sessionStorage.removeItem(INTENDED_ROLE_KEY);
    handled.current = true; // the mount effect must not re-route on top of us
    await refreshProfile();
    navigate(homeFor(picked), { replace: true });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;
    if (!email || !password) {
      toast.error(t.auth_email_pw_required);
      return;
    }
    setBusy(true);
    if (mode === 'login') {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.user) {
        setBusy(false);
        return toast.error(error?.message ?? t.auth_email_pw_required);
      }
      toast.success(t.auth_welcome_back_toast);
      await finishAuth(data.user.id, role);
      setBusy(false);
      return;
    }

    if (password.length < 8) {
      setBusy(false);
      return toast.error(t.auth_password_min_error);
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/start`,
        data: { role, full_name: name || null, language: 'en' },
      },
    });
    if (error) {
      setBusy(false);
      return toast.error(error.message);
    }

    // Auto-confirm on → a session comes back immediately; otherwise the user must confirm by email.
    if (data.session && data.user) {
      toast.success(t.auth_account_ready);
      await finishAuth(data.user.id, role);
      setBusy(false);
      return;
    }

    setBusy(false);
    sessionStorage.setItem(INTENDED_ROLE_KEY, role);
    toast.success(t.auth_account_created);
  };

  const google = async () => {
    if (!role) return;
    sessionStorage.setItem(INTENDED_ROLE_KEY, role);
    const result = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: `${window.location.origin}/start`,
    });
    if (result.error) {
      sessionStorage.removeItem(INTENDED_ROLE_KEY);
      toast.error(result.error.message);
    }
  };

  const ROLES: { key: Role; label: string; desc: string; icon: typeof User }[] = [
    { key: 'athlete', label: t.auth_role_athlete, desc: t.entry_athlete_desc, icon: User },
    { key: 'coach', label: t.auth_role_coach, desc: t.entry_coach_desc, icon: Zap },
    { key: 'club', label: t.auth_role_club, desc: t.entry_club_desc, icon: Building2 },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNav />
      <main className="grid flex-1 lg:grid-cols-2">
        <div className="relative hidden overflow-hidden bg-foreground text-[#F3EDE2] lg:block">
          <p aria-hidden="true" className="absolute -left-4 top-6 select-none font-display font-extrabold uppercase leading-[0.8] text-[#F3EDE2]/[0.07]" style={{ fontSize: 'clamp(260px, 28vw, 460px)' }}>Lokka</p>
          <p className="absolute bottom-10 left-10 right-10 font-display font-extrabold uppercase leading-[0.9]" style={{ fontSize: 'clamp(48px, 5vw, 84px)', color: '#F3EDE2' }}>{t.tn_footer_line}</p>
        </div>
        <div className="flex items-center justify-center px-4 py-16">
        <div className="surface w-full max-w-md p-8">
          {DEMO_MODE ? (
            <DemoRolePicker />
          ) : !role ? (
            <>
              <h1 className="text-5xl">{t.entry_choose_title}</h1>
              <p className="text-sm text-muted-foreground mt-2 mb-6">{t.entry_choose_sub}</p>
              <div className="space-y-3">
                {ROLES.map(r => (
                  <button
                    key={r.key}
                    type="button"
                    disabled={busy}
                    onClick={() => pickRole(r.key)}
                    className="flex w-full items-start gap-3 bg-background p-4 text-left transition-colors hover:bg-card disabled:opacity-60"
                  >
                    <r.icon className="h-5 w-5 mt-0.5 shrink-0" />
                    <span>
                      <span className="block font-display text-lg font-bold uppercase">
                        {t.entry_continue_as} {r.label}
                      </span>
                      <span className="block text-sm text-muted-foreground mt-1">{r.desc}</span>
                    </span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setRole(null)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
              >
                <ArrowLeft className="h-4 w-4" /> {t.entry_back}
              </button>

              <div className="flex items-center gap-2 mb-6">
                <div className="flex h-9 w-9 items-center justify-center bg-primary text-primary-foreground">
                  <Zap className="h-5 w-5" strokeWidth={2.5} />
                </div>
                <span className="font-display text-3xl font-extrabold uppercase">
                  {mode === 'login' ? t.auth_welcome_back : t.auth_create_account_heading}
                </span>
              </div>

              <p className="text-xs uppercase tracking-[0.02em] text-muted-foreground mb-4">
                {t.entry_continue_as} {ROLES.find(r => r.key === role)!.label}
              </p>

              <div className="grid grid-cols-2 gap-2 mb-6">
                {(['login', 'signup'] as const).map(m => (
                  <Button
                    key={m}
                    type="button"
                    variant={mode === m ? 'default' : 'outline'}
                    onClick={() => setMode(m)}
                  >
                    {m === 'login' ? t.auth_tab_login : t.auth_tab_signup}
                  </Button>
                ))}
              </div>

              <form onSubmit={submit} className="space-y-4">
                {mode === 'signup' && (
                  <div className="grid gap-2">
                    <Label htmlFor="name">{role === 'club' ? t.auth_club_name : t.auth_full_name}</Label>
                    <Input id="name" value={name} onChange={e => setName(e.target.value)} />
                  </div>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="email">{t.auth_email}</Label>
                  <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">{t.auth_password}</Label>
                  <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                  {mode === 'signup' && <p className="text-xs text-muted-foreground">{t.auth_password_min}</p>}
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={busy}>
                  {busy
                    ? mode === 'login' ? t.auth_signing_in : t.auth_creating
                    : mode === 'login' ? t.auth_login : t.auth_create_account_btn}
                </Button>
              </form>

              <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.02em] text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                {t.auth_or}
                <span className="h-px flex-1 bg-border" />
              </div>

              <Button type="button" variant="outline" size="lg" className="w-full" onClick={google}>
                {t.auth_google}
              </Button>

              {role !== 'athlete' && (
                <p className="mt-6 text-xs text-muted-foreground">{t.auth_verification_notice}</p>
              )}
            </>
          )}
        </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
};

export default Start;
