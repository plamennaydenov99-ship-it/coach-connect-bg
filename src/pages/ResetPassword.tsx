import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { LangSwitcher } from '@/components/layout/LangSwitcher';
import { useLanguage } from '@/context/LanguageContext';
import { BigButton, Field } from '@/pages/Start';
import { usePageMeta } from '@/hooks/usePageMeta';

/** Where the link in the "forgot password" email lands: pick a new password, then carry on signed in. */
export default function ResetPassword() {
  const { t, lang, setLang } = useLanguage();
  usePageMeta(t.meta_reset_t, t.meta_reset_d);
  const navigate = useNavigate();
  const [state, setState] = useState<'wait' | 'ready' | 'expired'>('wait');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Opening the emailed link signs the visitor into a short recovery session. Wait for it, briefly.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => { if (event === 'PASSWORD_RECOVERY') setState('ready'); });
    supabase.auth.getSession().then(({ data }) => { if (data.session) setState('ready'); });
    const timer = setTimeout(() => setState(s => (s === 'wait' ? 'expired' : s)), 4000);
    return () => { sub.subscription.unsubscribe(); clearTimeout(timer); };
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error(t.auth_password_min_error);
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(t.st_newpw_done);
    navigate('/start', { replace: true });
  };

  return (
    <main className="relative flex min-h-screen flex-col bg-background px-6 py-6 sm:px-10">
      <div className="flex items-center justify-between">
        <Link to="/" className="font-display text-3xl font-extrabold tracking-[0.04em] text-foreground">LOKKA</Link>
        <LangSwitcher lang={lang} setLang={setLang} />
      </div>
      <div className="flex flex-1 items-center py-12">
        <div className="mx-auto w-full max-w-md animate-fade-up-in">
          {state === 'expired' ? (
            <>
              <h1 className="text-6xl leading-[0.9] sm:text-7xl">{t.st_reset_h}</h1>
              <p className="mb-8 mt-5 text-lg">{t.st_link_expired}</p>
              <Link to="/start" className="inline-block text-sm font-medium underline underline-offset-4 hover:text-primary">{t.auth_tab_login}</Link>
            </>
          ) : (
            <form onSubmit={save} className="space-y-8">
              <h1 className="text-6xl leading-[0.9] sm:text-7xl">{t.st_newpw_h}</h1>
              <Field
                id="new-password"
                label={t.auth_password}
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={setPassword}
                autoComplete="new-password"
                required
                hint={t.auth_password_min}
                right={
                  <button type="button" onClick={() => setShowPw(v => !v)} className="inline-flex items-center gap-1.5 px-1 text-xs font-bold uppercase tracking-[0.06em] text-foreground-muted hover:text-foreground" aria-pressed={showPw}>
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}{showPw ? t.st_hide : t.st_show}
                  </button>
                }
              />
              <BigButton busy={busy || state === 'wait'}>{t.st_newpw_btn}</BigButton>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
