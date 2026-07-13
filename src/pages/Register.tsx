import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PublicNav } from '@/components/layout/PublicNav';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Zap, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { SPORTS } from '@/lib/mockData';
import { useLanguage } from '@/context/LanguageContext';

type Role = 'athlete' | 'coach' | 'club';

const Register = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [params] = useSearchParams();
  const initialRole: Role =
    params.get('role') === 'coach' ? 'coach' :
    params.get('role') === 'club' ? 'club' : 'athlete';
  const [form, setForm] = useState({ name: '', email: '', password: '', city: '' });
  const [role, setRole] = useState<Role>(initialRole);
  const [loading, setLoading] = useState(false);

  const [coachSport, setCoachSport] = useState('');
  const [coachBio, setCoachBio] = useState('');
  const [coachPrice, setCoachPrice] = useState<string>('');
  const [certs, setCerts] = useState<string[]>([]);
  const [newCert, setNewCert] = useState('');

  const [clubSport, setClubSport] = useState('');
  const [clubAbout, setClubAbout] = useState('');

  const roleLabel = (r: Role) =>
    r === 'athlete' ? t.auth_role_athlete : r === 'coach' ? t.auth_role_coach : t.auth_role_club;

  const addCert = () => {
    if (newCert.trim()) {
      setCerts([...certs, newCert.trim()]);
      setNewCert('');
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error(t.auth_fill_required);
      return;
    }
    if (form.password.length < 8) {
      toast.error(t.auth_password_min_error);
      return;
    }

    setLoading(true);
    const metadata: Record<string, unknown> = {
      role,
      full_name: form.name,
      city: form.city || null,
      language: 'en',
    };
    if (role === 'coach') {
      metadata.sport = coachSport || null;
      metadata.bio = coachBio || null;
      metadata.price_per_session = coachPrice || null;
      metadata.certifications = certs;
    } else if (role === 'club') {
      metadata.sport = clubSport || null;
      metadata.about = clubAbout || null;
    }

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: metadata,
      },
    });

    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(t.auth_account_created);
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNav />
      <main className="flex-1 container max-w-lg py-16">
        <div className="surface p-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Zap className="h-5 w-5" strokeWidth={2.5} />
            </div>
            <span className="font-display text-xl">{t.auth_create_account_heading}</span>
          </div>

          <form onSubmit={submit} className="space-y-5">
            <div className="grid gap-2">
              <Label>{t.auth_i_am}</Label>
              <div className="grid grid-cols-3 gap-2">
                {(['athlete', 'coach', 'club'] as const).map(r => (
                  <Button
                    key={r}
                    type="button"
                    variant={role === r ? 'default' : 'outline'}
                    onClick={() => setRole(r)}
                  >
                    {roleLabel(r)}
                  </Button>
                ))}
              </div>
              {(role === 'coach' || role === 'club') && (
                <p className="text-xs text-muted-foreground">
                  {t.auth_verification_notice}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="name">{role === 'club' ? t.auth_club_name : t.auth_full_name}</Label>
              <Input id="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">{t.auth_email}</Label>
              <Input id="email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">{t.auth_password}</Label>
              <Input id="password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
              <p className="text-xs text-muted-foreground">{t.auth_password_min}</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="city">{t.auth_city}</Label>
              <Input
                id="city"
                value={form.city}
                onChange={e => setForm({ ...form, city: e.target.value })}
                placeholder={t.auth_city_placeholder}
              />
            </div>

            {role === 'coach' && (
              <div className="space-y-4 pt-2 border-t border-border">
                <p className="font-display text-sm uppercase tracking-[0.1em] text-muted-foreground">{t.auth_coach_details}</p>
                <div className="grid gap-2">
                  <Label>{t.auth_primary_sport}</Label>
                  <select
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={coachSport}
                    onChange={e => setCoachSport(e.target.value)}
                  >
                    <option value="">{t.auth_select_sport}</option>
                    {SPORTS.map(s => <option key={s.slug} value={s.slug}>{s.label}</option>)}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cbio">{t.auth_background}</Label>
                  <Textarea id="cbio" rows={4} value={coachBio} onChange={e => setCoachBio(e.target.value)}
                    placeholder={t.auth_background_ph} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cprice">{t.auth_starting_price}</Label>
                  <Input id="cprice" type="number" min={0} value={coachPrice}
                    onChange={e => setCoachPrice(e.target.value)} placeholder={t.auth_price_ph} />
                </div>
                <div className="grid gap-2">
                  <Label>{t.auth_certifications}</Label>
                  <div className="flex flex-wrap gap-2">
                    {certs.map((c, i) => (
                      <span key={i} className="px-3 py-1.5 rounded-md bg-secondary text-sm flex items-center gap-2">
                        {c}
                        <button type="button" onClick={() => setCerts(certs.filter((_, idx) => idx !== i))}
                          className="text-muted-foreground hover:text-foreground"><X className="h-3 w-3" /></button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input value={newCert} onChange={e => setNewCert(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCert(); } }}
                      placeholder={t.auth_cert_ph} />
                    <Button type="button" variant="outline" onClick={addCert}><Plus className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>
            )}

            {role === 'club' && (
              <div className="space-y-4 pt-2 border-t border-border">
                <p className="font-display text-sm uppercase tracking-[0.1em] text-muted-foreground">{t.auth_club_details}</p>
                <div className="grid gap-2">
                  <Label>{t.auth_primary_sport}</Label>
                  <select
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={clubSport}
                    onChange={e => setClubSport(e.target.value)}
                  >
                    <option value="">{t.auth_select_sport}</option>
                    {SPORTS.map(s => <option key={s.slug} value={s.slug}>{s.label}</option>)}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="clababout">{t.auth_about_label}</Label>
                  <Textarea id="clababout" rows={4} value={clubAbout} onChange={e => setClubAbout(e.target.value)}
                    placeholder={t.auth_club_about_ph} />
                </div>
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? t.auth_creating : t.auth_create_account_btn}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t.auth_have_account} <Link to="/login" className="text-gold hover:underline">{t.auth_login}</Link>
          </p>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
};

export default Register;
