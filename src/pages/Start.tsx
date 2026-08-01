import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PublicNav } from '@/components/layout/PublicNav';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Zap } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/context/LanguageContext';

type Mode = 'login' | 'signup';
type Role = 'athlete' | 'coach';

const Start = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user, profile, loading } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [role, setRole] = useState<Role>('athlete');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  // Already signed in → send to the right area
  useEffect(() => {
    if (!loading && user && profile) {
      navigate(profile.role === 'athlete' ? '/account' : '/dashboard', { replace: true });
    }
  }, [loading, user, profile, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error(t.auth_email_pw_required);
      return;
    }
    setBusy(true);
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) return toast.error(error.message);
      toast.success(t.auth_welcome_back_toast);
      return;
    }

    if (password.length < 8) {
      setBusy(false);
      return toast.error(t.auth_password_min_error);
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/start`,
        data: { role, full_name: name || null, language: 'en' },
      },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(t.auth_account_created);
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error(result.error.message);
      return;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNav />
      <main className="flex-1 container max-w-md py-16">
        <div className="surface p-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-primary text-primary-foreground">
              <Zap className="h-5 w-5" strokeWidth={2.5} />
            </div>
            <span className="font-display text-xl uppercase tracking-[0.1em]">
              {mode === 'login' ? t.auth_welcome_back : t.auth_create_account_heading}
            </span>
          </div>

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
              <>
                <div className="grid gap-2">
                  <Label>{t.auth_signup_role_q}</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['athlete', 'coach'] as const).map(r => (
                      <Button
                        key={r}
                        type="button"
                        variant={role === r ? 'default' : 'outline'}
                        onClick={() => setRole(r)}
                      >
                        {r === 'athlete' ? t.auth_role_athlete : t.auth_role_coach}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="name">{t.auth_full_name}</Label>
                  <Input id="name" value={name} onChange={e => setName(e.target.value)} />
                </div>
              </>
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

          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.12em] text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            {t.auth_or}
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button type="button" variant="outline" size="lg" className="w-full" onClick={google}>
            {t.auth_google}
          </Button>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
};

export default Start;
