import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ArrowUpRight, Building2, Eye, EyeOff, MailCheck, ShieldCheck, User, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { LangSwitcher } from '@/components/layout/LangSwitcher';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/context/LanguageContext';
import { homeFor } from '@/lib/routes';
import { SPORTS } from '@/lib/mockData';
import { DEMO_MODE } from '@/lib/demo';
import { DemoRolePicker } from '@/components/DemoSwitcher';
import { usePageMeta } from '@/hooks/usePageMeta';
import { Picture, photoBackground } from '@/components/Picture';

type Mode = 'login' | 'signup';
type Role = 'athlete' | 'coach' | 'club';
/** "admin" is not a profile type: it is the control room door, shown to admins and to anyone sent here from /admin. */
type Pick = Role | 'admin';

const INTENDED_ROLE_KEY = 'zenit_intended_role';
const LAST_ROLE_KEY = 'lokka_last_role';
const cream = '#F3EDE2';

const readLS = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const writeLS = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } };

/** Only same-site paths, so a crafted link cannot send someone to another website after login. */
const safeNext = (v: string | null) => (v && v.startsWith('/') && !v.startsWith('//') && !v.startsWith('/\\') ? v : null);

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

/* ─────────────────────────── the stage (left / top) ─────────────────────────── */

const LAYERS = [
  { id: 'cathedral', photo: 'sofia-cathedral', pos: '50% 40%', flip: false },
  { id: 'borisova', photo: 'sofia-borisova', pos: '50% 50%', flip: false },
  { id: 'cathedral-r', photo: 'sofia-cathedral', pos: '85% 30%', flip: true },
] as const;

const SCENE: Record<Pick | 'none', { layer: number; tint: string }> = {
  none: { layer: 0, tint: 'hsl(var(--primary))' },
  athlete: { layer: 0, tint: 'hsl(var(--primary))' },
  coach: { layer: 1, tint: 'hsl(var(--accent))' },
  club: { layer: 2, tint: 'hsl(var(--primary))' },
  admin: { layer: 2, tint: 'hsl(var(--foreground))' },
};

/** Moves a layer a little with the pointer. The element that moves must not also run a transform animation. */
const par = (x: number, y = x * 0.6): CSSProperties => ({
  transform: `translate3d(calc(var(--mx, 0) * ${x}px), calc(var(--my, 0) * ${y}px), 0)`,
  transition: 'transform 450ms ease-out',
});

function Stage({ scene }: { scene: Pick | null }) {
  const { t, lang } = useLanguage();
  const ref = useRef<HTMLDivElement>(null);
  const s = SCENE[scene ?? 'none'];

  const onMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', String(((e.clientX - r.left) / r.width - 0.5) * 2));
    el.style.setProperty('--my', String(((e.clientY - r.top) / r.height - 0.5) * 2));
  };

  const words = SPORTS.map(x => (lang === 'bg' ? x.labelBg : x.label).toUpperCase());
  const line =
    scene === 'athlete' ? t.st_stage_athlete
    : scene === 'coach' ? t.st_stage_coach
    : scene === 'club' ? t.st_stage_club
    : scene === 'admin' ? t.st_stage_admin
    : t.tn_footer_line;
  // the letters show the photo that is NOT the background, so they always pop
  const fill = LAYERS[s.layer].id === 'borisova' ? LAYERS[0].photo : LAYERS[1].photo;

  const tape = (key: string) => (
    <div className="flex w-max items-center whitespace-nowrap font-display text-3xl font-extrabold leading-none lg:text-4xl" key={key}>
      {[...words, ...words].map((w, i) => (
        <span key={i} className="flex items-center">
          <span>{w}</span>
          <span aria-hidden="true" className="mx-6 inline-block h-2.5 w-2.5 bg-accent lg:mx-8" style={key === 'b' ? { backgroundColor: cream } : undefined} />
        </span>
      ))}
    </div>
  );

  return (
    <div ref={ref} onPointerMove={onMove} className="relative h-64 overflow-hidden bg-foreground sm:h-72 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:justify-between lg:self-start" style={{ color: cream }}>
      {/* photographs, crossfading when the role changes */}
      {LAYERS.map((l, i) => (
        <div key={l.id} className={`absolute -inset-8 transition-opacity duration-1000 ${i === s.layer ? 'opacity-100' : 'opacity-0'}`} aria-hidden="true">
          <div className="h-full w-full" style={par(-14)}>
            <div className="h-full w-full" style={{ transform: l.flip ? 'scaleX(-1)' : undefined }}>
              <Picture name={l.photo} alt="" eager={i === 0} sizes="(min-width: 1024px) 55vw, 100vw" className="h-full w-full animate-[kb_40s_ease-in-out_infinite_alternate] object-cover grayscale contrast-125" style={{ objectPosition: l.pos }} />
            </div>
          </div>
        </div>
      ))}
      <div aria-hidden="true" className="absolute inset-0 mix-blend-multiply transition-colors duration-1000" style={{ backgroundColor: s.tint }} />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/30 to-foreground/60" />

      <Link to="/" className="absolute left-6 top-5 z-20 font-display text-3xl font-extrabold tracking-[0.04em] lg:left-10 lg:top-8 lg:text-4xl" style={{ color: cream }}>
        LOKKA
      </Link>

      {/* a photograph inside giant letters, drifting slowly */}
      <div aria-hidden="true" className="absolute left-5 top-16 lg:relative lg:left-auto lg:top-auto lg:px-9 lg:pt-24">
        <div style={par(24)}>
          <div key={fill} className="animate-fade-up-in">
            <p
              className="anim-pan select-none font-display font-extrabold leading-[0.8]"
              style={{
                fontSize: lang === 'bg' ? 'clamp(96px, 14.5vw, 250px)' : 'clamp(104px, 17vw, 300px)',
                backgroundImage: photoBackground(fill),
                backgroundSize: '135% auto',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {lang === 'bg' ? 'СОФИЯ' : 'SOFIA'}
            </p>
          </div>
        </div>
      </div>

      {/* a turning badge */}
      <div aria-hidden="true" className="absolute right-4 top-4 hidden h-28 w-28 sm:block lg:bottom-12 lg:right-8 lg:top-auto" style={par(-12)}>
        <svg viewBox="0 0 120 120" className="anim-spin-slow h-full w-full">
          <defs><path id="lokka-ring" d="M60,60 m-47,0 a47,47 0 1,1 94,0 a47,47 0 1,1 -94,0" /></defs>
          <text fill={cream} fontSize="10.5" fontWeight="700" className="font-display" style={{ textTransform: 'uppercase' }}>
            <textPath href="#lokka-ring" textLength="290" lengthAdjust="spacingAndGlyphs">{t.st_ring}</textPath>
          </text>
        </svg>
        <span className="absolute inset-0 m-auto grid h-11 w-11 place-items-center bg-accent text-white"><ArrowUpRight className="h-6 w-6" /></span>
      </div>

      {/* two crossing ticker tapes: pinned to the bottom on a phone, in the middle of the stage on a desktop */}
      <div aria-hidden="true" className="absolute inset-0 lg:relative lg:inset-auto lg:h-40 lg:shrink-0" style={par(6)}>
        <div className="absolute -inset-x-16 bottom-6 -rotate-3 overflow-hidden bg-[#F3EDE2] py-3 text-foreground lg:bottom-auto lg:top-3">
          <div className="animate-marquee w-max">{tape('a')}</div>
        </div>
        <div className="absolute -inset-x-16 hidden rotate-2 overflow-hidden bg-accent py-2.5 text-white lg:top-[4.5rem] lg:block">
          <div className="anim-marquee-rev w-max">{tape('b')}</div>
        </div>
      </div>

      {/* the line that changes with the role */}
      <div className="relative hidden px-10 pb-12 lg:block">
        <div key={scene ?? 'none'} className="animate-fade-up-in">
          <p className="max-w-[14ch] font-display font-extrabold leading-[0.92]" style={{ fontSize: 'clamp(42px, 4.4vw, 80px)', color: cream }}>
            {line}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── small form pieces ─────────────────────────── */

export function Field({ id, label, type = 'text', value, onChange, autoComplete, required, tabIndex, right, hint, invalid, errorId }: {
  id: string; label: string; type?: string; value: string; onChange: (v: string) => void; autoComplete?: string;
  required?: boolean; tabIndex?: number; right?: ReactNode; hint?: string;
  /** Marks the input invalid and points screen readers at the error message with this id. */
  invalid?: boolean; errorId?: string;
}) {
  const describedBy = [hint ? `${id}-hint` : '', invalid && errorId ? errorId : ''].filter(Boolean).join(' ') || undefined;
  return (
    <div className="group">
      <label htmlFor={id} className="block font-display text-xs font-bold uppercase tracking-[0.08em] text-foreground-muted transition-colors group-focus-within:text-primary">{label}</label>
      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          autoComplete={autoComplete}
          required={required}
          tabIndex={tabIndex}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className="h-12 w-full rounded-none border-0 border-b-2 border-foreground/25 bg-transparent pr-20 text-xl text-foreground outline-none transition-colors placeholder:text-foreground-muted/60"
        />
        <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 bg-primary transition-transform duration-300 group-focus-within:scale-x-100" />
        {right && <div className="absolute inset-y-0 right-0 flex items-center">{right}</div>}
      </div>
      {hint && <p id={`${id}-hint`} className="mt-1.5 text-xs text-foreground-muted">{hint}</p>}
    </div>
  );
}

export function BigButton({ children, busy, type = 'submit', onClick }: { children: ReactNode; busy?: boolean; type?: 'submit' | 'button'; onClick?: () => void }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={busy}
      className="group relative flex h-16 w-full items-center justify-between overflow-hidden bg-foreground px-6 font-display text-2xl font-extrabold uppercase text-background transition-colors hover:bg-primary disabled:opacity-80"
    >
      <span>{children}</span>
      <ArrowRight className="h-7 w-7 transition-transform duration-300 group-hover:translate-x-2" />
      {busy && <span aria-hidden="true" className="anim-sweep absolute inset-x-0 bottom-0 h-1 bg-accent" />}
    </button>
  );
}

const GoogleG = () => (
  <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);

/* ─────────────────────────── the page ─────────────────────────── */

const Start = () => {
  const navigate = useNavigate();
  const { t, lang, setLang } = useLanguage();
  usePageMeta(t.meta_start_t, t.meta_start_d);
  const { user, profile, loading, refreshProfile } = useAuth();
  const [params] = useSearchParams();
  const paramRole = params.get('role');
  const next = safeNext(params.get('next'));
  const adminNext = !!next && next.startsWith('/admin');

  // The For coaches page links here with ?role=coach&mode=signup; the admin guard sends people with ?next=/admin.
  const [role, setRole] = useState<Pick | null>(
    adminNext ? 'admin' : paramRole === 'athlete' || paramRole === 'coach' || paramRole === 'club' ? paramRole : null,
  );
  const [mode, setMode] = useState<Mode>(params.get('mode') === 'signup' ? 'signup' : 'login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hover, setHover] = useState<Pick | null>(null);
  const [sent, setSent] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [signedInChooser, setSignedInChooser] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [trap, setTrap] = useState(''); // honeypot: people never see this field, bots fill it in
  const handled = useRef(false);
  const lastRole = readLS(LAST_ROLE_KEY);

  // Allow a fresh reconciliation after a sign-out → sign-in in the same tab
  useEffect(() => {
    if (!user) { handled.current = false; setSignedInChooser(false); }
  }, [user]);

  // Already signed in (incl. returning from Google) → reconcile role then route
  useEffect(() => {
    if (DEMO_MODE || loading || !user || !profile || handled.current) return;
    handled.current = true;
    const intended = sessionStorage.getItem(INTENDED_ROLE_KEY) as Role | null;
    // A signed-in admin with nothing to finish gets to choose: the studio, the account, or the control room.
    if (!intended && !next && profile.is_admin) { setSignedInChooser(true); return; }
    (async () => {
      let active: Role = (profile.role as Role) ?? 'athlete';
      if (intended && ['athlete', 'coach', 'club'].includes(intended)) {
        await ensureRole(user.id, intended, profile.role);
        sessionStorage.removeItem(INTENDED_ROLE_KEY);
        active = intended;
        await refreshProfile();
      }
      navigate(next ?? homeFor(active), { replace: true });
    })();
  }, [loading, user, profile, navigate, refreshProfile, next]);

  const pickRole = async (r: Pick) => {
    // Authenticated user adding / switching a role, or heading to the control room
    if (user && profile) {
      if (r === 'admin') { navigate('/admin'); return; }
      setBusy(true);
      await ensureRole(user.id, r, profile.role);
      await refreshProfile();
      setBusy(false);
      writeLS(LAST_ROLE_KEY, r);
      if (r !== profile.role) toast.success(t.entry_role_added);
      navigate(homeFor(r), { replace: true });
      return;
    }
    setRole(r);
    setHover(null);
    if (r === 'admin') setMode('login');
  };

  /** Reconcile the picked role against the signed-in user, then route. Deterministic: no effect needed. */
  const finishAuth = async (userId: string, picked: Pick) => {
    if (picked === 'admin') {
      handled.current = true;
      await refreshProfile();
      navigate(next ?? '/admin', { replace: true });
      return;
    }
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
    writeLS(LAST_ROLE_KEY, picked);
    handled.current = true; // the mount effect must not re-route on top of us
    await refreshProfile();
    navigate(next ?? homeFor(picked), { replace: true });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;
    setFormError(null);
    if (!email || !password) {
      setFormError(t.auth_email_pw_required);
      return;
    }
    setBusy(true);
    if (mode === 'login' || role === 'admin') {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.user) {
        setBusy(false);
        return setFormError(error?.message ?? t.auth_email_pw_required);
      }
      toast.success(t.auth_welcome_back_toast);
      await finishAuth(data.user.id, role);
      setBusy(false);
      return;
    }

    if (password.length < 8) {
      setBusy(false);
      return setFormError(t.auth_password_min_error);
    }
    if (trap) {
      // A bot filled the hidden field: look successful, create nothing.
      setBusy(false);
      setSent(true);
      return;
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/start`,
        data: { role, full_name: name || null, language: lang },
      },
    });
    if (error) {
      setBusy(false);
      return setFormError(error.message);
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
    setSent(true);
  };

  const google = async () => {
    if (!role) return;
    if (role !== 'admin') sessionStorage.setItem(INTENDED_ROLE_KEY, role);
    const result = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: `${window.location.origin}/start${next ? `?next=${encodeURIComponent(next)}` : ''}`,
    });
    if (result.error) {
      sessionStorage.removeItem(INTENDED_ROLE_KEY);
      toast.error(result.error.message);
    }
  };

  const sendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error(t.auth_email_pw_required);
    setBusy(true);
    // The answer is the same whether or not the address has an account, so nobody can probe for accounts.
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    setBusy(false);
    setResetSent(true);
  };

  const ROLES: { key: Pick; label: string; desc: string; icon: typeof User }[] = [
    { key: 'athlete', label: t.auth_role_athlete, desc: t.entry_athlete_desc, icon: User },
    { key: 'coach', label: t.auth_role_coach, desc: t.entry_coach_desc, icon: Zap },
    { key: 'club', label: t.auth_role_club, desc: t.entry_club_desc, icon: Building2 },
  ];
  if ((user && profile?.is_admin) || adminNext) ROLES.push({ key: 'admin', label: t.st_admin, desc: t.st_admin_desc, icon: ShieldCheck });

  const scene: Pick | null = hover ?? role;
  const roleLabel = role ? ROLES.find(r => r.key === role)?.label ?? '' : '';
  const isAdminLogin = role === 'admin';
  const signup = mode === 'signup' && !isAdminLogin;
  const inForm = !!role && !sent && !forgot;

  const back = () => {
    if (sent) { setSent(false); return; }
    if (forgot) { setForgot(false); setResetSent(false); return; }
    setRole(null);
  };

  return (
    <main className="grid min-h-screen grid-cols-[minmax(0,1fr)] bg-background lg:grid-cols-[1.08fr_1fr]">
      <Stage scene={scene} />

      <div className="relative flex min-h-[70vh] flex-col px-6 py-6 sm:px-10 lg:min-h-screen lg:px-14 xl:px-24">
        <div className="flex h-10 items-center justify-between">
          {role || sent || forgot ? (
            <button type="button" onClick={back} className="group inline-flex items-center gap-2 text-sm font-medium text-foreground-muted transition-colors hover:text-foreground">
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> {t.entry_back}
            </button>
          ) : <span />}
          <LangSwitcher lang={lang} setLang={setLang} />
        </div>

        <div className="flex flex-1 items-center py-10">
          <div className="mx-auto w-full max-w-md">
            {DEMO_MODE ? (
              <DemoRolePicker />
            ) : sent ? (
              <div key="sent" className="animate-fade-up-in">
                <span className="grid h-16 w-16 place-items-center bg-accent text-white"><MailCheck className="h-8 w-8" /></span>
                <h1 className="mt-8 text-6xl leading-[0.9] sm:text-7xl">{t.st_check_h}</h1>
                <p className="mt-5 text-lg">{t.auth_account_created}</p>
                <p className="mt-2 break-all font-display text-2xl font-bold">{email}</p>
                <button type="button" onClick={() => setSent(false)} className="mt-8 text-sm font-medium underline underline-offset-4 hover:text-primary">{t.st_other_email}</button>
              </div>
            ) : forgot ? (
              <form key="forgot" onSubmit={sendReset} className="animate-fade-up-in space-y-8">
                <div>
                  <h1 className="text-6xl leading-[0.9] sm:text-7xl">{t.st_reset_h}</h1>
                  <p className="mt-4 text-foreground-muted">{t.st_reset_sub}</p>
                </div>
                <Field id="reset-email" label={t.auth_email} type="email" value={email} onChange={setEmail} autoComplete="email" required />
                {resetSent && <p className="bg-background-secondary p-4 text-sm" role="status">{t.st_reset_sent}</p>}
                <BigButton busy={busy}>{t.st_reset_send}</BigButton>
              </form>
            ) : !role ? (
              <div key="choose">
                <h1 className="text-6xl leading-[0.9] sm:text-7xl">{signedInChooser ? t.st_where : t.st_who}</h1>
                <p className="mb-8 mt-4 text-foreground-muted">{signedInChooser ? t.entry_choose_sub : t.st_who_sub}</p>
                <div className="border-b-2 border-foreground">
                  {ROLES.map((r, i) => (
                    <div key={r.key} className="animate-fade-up-in" style={{ animationDelay: `${80 + i * 70}ms` }}>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => pickRole(r.key)}
                        onMouseEnter={() => setHover(r.key)}
                        onMouseLeave={() => setHover(null)}
                        onFocus={() => setHover(r.key)}
                        onBlur={() => setHover(null)}
                        className="group relative flex w-full items-center gap-5 border-t-2 border-foreground py-6 pl-2 pr-1 text-left transition-colors hover:bg-background-secondary disabled:opacity-60"
                      >
                        <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1.5 origin-top scale-y-0 bg-accent transition-transform duration-300 group-hover:scale-y-100 group-focus-visible:scale-y-100" />
                        <span className="w-8 shrink-0 font-display text-xl font-bold text-foreground-muted">{String(i + 1).padStart(2, '0')}</span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-3">
                            <span className="block font-display text-5xl font-extrabold uppercase leading-none sm:text-6xl">{r.label}</span>
                            {lastRole === r.key && !signedInChooser && <span className="bg-foreground px-2 py-1 font-display text-[11px] font-bold uppercase tracking-[0.06em] text-background">{t.st_last_used}</span>}
                          </span>
                          <span className="mt-2 block text-sm text-foreground-muted">{r.desc}</span>
                        </span>
                        <ArrowRight className="h-8 w-8 shrink-0 -translate-x-3 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div key={`form-${role}`} className="animate-fade-up-in">
                <span className="inline-block bg-foreground px-3 py-1.5 font-display text-xs font-bold uppercase tracking-[0.08em] text-background">
                  {isAdminLogin ? t.st_admin : `${t.entry_continue_as} ${roleLabel}`}
                </span>
                <h1 key={mode} className="mt-4 animate-fade-up-in text-5xl leading-[0.9] sm:text-6xl">
                  {signup ? t.auth_create_account_heading : t.auth_welcome_back}
                </h1>

                {!isAdminLogin && (
                  <div className="relative mt-6 grid grid-cols-2 bg-background-secondary p-1" role="tablist">
                    <span aria-hidden="true" className="absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] bg-foreground transition-transform duration-300 ease-out" style={{ transform: signup ? 'translateX(100%)' : 'none' }} />
                    {(['login', 'signup'] as const).map(m => (
                      <button
                        key={m}
                        type="button"
                        role="tab"
                        aria-selected={mode === m}
                        onClick={() => { setMode(m); setFormError(null); }}
                        className={`relative z-10 h-11 font-display text-base font-bold uppercase transition-colors duration-300 ${mode === m ? 'text-background' : 'text-foreground'}`}
                      >
                        {m === 'login' ? t.auth_tab_login : t.auth_tab_signup}
                      </button>
                    ))}
                  </div>
                )}

                <form onSubmit={submit} className="mt-6 space-y-5">
                  <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${signup ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`} aria-hidden={!signup}>
                    <div className="overflow-hidden">
                      <div className="pb-0.5">
                        <Field id="name" label={role === 'club' ? t.auth_club_name : t.auth_full_name} value={name} onChange={setName} autoComplete="name" tabIndex={signup ? 0 : -1} />
                      </div>
                    </div>
                  </div>

                  <Field id="email" label={t.auth_email} type="email" value={email} onChange={v => { setEmail(v); setFormError(null); }} autoComplete="email" required invalid={!!formError} errorId="start-error" />
                  <Field
                    id="password"
                    label={t.auth_password}
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={v => { setPassword(v); setFormError(null); }}
                    autoComplete={signup ? 'new-password' : 'current-password'}
                    required
                    invalid={!!formError}
                    errorId="start-error"
                    hint={signup ? t.auth_password_min : undefined}
                    right={
                      <button type="button" onClick={() => setShowPw(v => !v)} className="inline-flex items-center gap-1.5 px-1 text-xs font-bold uppercase tracking-[0.06em] text-foreground-muted hover:text-foreground" aria-pressed={showPw}>
                        {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}{showPw ? t.st_hide : t.st_show}
                      </button>
                    }
                  />
                  {!signup && (
                    <button type="button" onClick={() => setForgot(true)} className="-mt-2 text-sm font-medium underline underline-offset-4 hover:text-primary">{t.st_forgot}</button>
                  )}

                  {signup && (
                    <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
                      <label htmlFor="start-website">Website</label>
                      <input id="start-website" name="website" type="text" tabIndex={-1} autoComplete="off" value={trap} onChange={e => setTrap(e.target.value)} />
                    </div>
                  )}

                  {formError && <p id="start-error" role="alert" className="border-l-4 border-destructive bg-background-secondary px-4 py-3 text-sm font-medium text-destructive">{formError}</p>}

                  {signup && (
                    <p className="text-xs text-foreground-muted">
                      {t.form_notice_signup} <Link to="/privacy" className="font-semibold text-foreground underline underline-offset-4">{t.footer_privacy}</Link> · <Link to="/terms" className="font-semibold text-foreground underline underline-offset-4">{t.footer_terms}</Link>
                    </p>
                  )}

                  <BigButton busy={busy}>
                    {busy ? (signup ? t.auth_creating : t.auth_signing_in) : signup ? t.auth_create_account_btn : t.auth_login}
                  </BigButton>
                </form>

                <div className="my-5 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.08em] text-foreground-muted">
                  <span className="h-px flex-1 bg-foreground/20" />{t.auth_or}<span className="h-px flex-1 bg-foreground/20" />
                </div>

                <button type="button" onClick={google} className="flex h-12 w-full items-center justify-center gap-3 border-2 border-foreground font-display text-lg font-bold uppercase transition-colors hover:bg-background-secondary">
                  <GoogleG />{t.auth_google}
                </button>

                {role !== 'athlete' && !isAdminLogin && <p className="mt-6 text-xs text-foreground-muted">{t.auth_verification_notice}</p>}
              </div>
            )}
          </div>
        </div>
        {inForm && <span className="sr-only" aria-live="polite">{signup ? t.auth_create_account_heading : t.auth_welcome_back}</span>}
      </div>
    </main>
  );
};

export default Start;
