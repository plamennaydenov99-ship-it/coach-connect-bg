import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, CheckCircle2, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/context/LanguageContext';
import { SPORTS } from '@/lib/mockData';

const TOTAL = 6;

export function CoachOnboarding({ onSubmitted }: { onSubmitted: () => void }) {
  const { user, profile, refreshProfile } = useAuth();
  const { t } = useLanguage();

  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const [fullName, setFullName] = useState('');
  const [sport, setSport] = useState('');
  const [city, setCity] = useState('');
  const [bio, setBio] = useState('');
  const [certs, setCerts] = useState<string[]>([]);
  const [certDraft, setCertDraft] = useState('');
  const [social, setSocial] = useState({ instagram: '', facebook: '', website: '', strava: '' });
  const [priceSolo, setPriceSolo] = useState('');
  const [priceGroup, setPriceGroup] = useState('');

  useEffect(() => {
    if (!user) return;
    setFullName(profile?.full_name ?? '');
    setCity(profile?.city ?? '');
    (async () => {
      const { data } = await supabase
        .from('coach_profiles')
        .select('sport, bio, certifications, social_links, price_per_session, price_per_group_session')
        .eq('id', user.id)
        .maybeSingle();
      if (!data) return;
      setSport(data.sport ?? '');
      setBio(data.bio ?? '');
      setCerts(data.certifications ?? []);
      const s = (data.social_links ?? {}) as Record<string, string>;
      setSocial({
        instagram: s.instagram ?? '',
        facebook: s.facebook ?? '',
        website: s.website ?? '',
        strava: s.strava ?? '',
      });
      setPriceSolo(data.price_per_session != null ? String(data.price_per_session) : '');
      setPriceGroup(data.price_per_group_session != null ? String(data.price_per_group_session) : '');
    })();
  }, [user, profile]);

  if (!user) return null;

  const saveStep = async () => {
    await supabase.from('profiles').update({ full_name: fullName || null, city: city || null }).eq('id', user.id);
    await supabase
      .from('coach_profiles')
      .update({
        sport: sport || null,
        bio: bio || null,
        certifications: certs,
        social_links: social,
        price_per_session: priceSolo ? Number(priceSolo) : null,
        price_per_group_session: priceGroup ? Number(priceGroup) : null,
      })
      .eq('id', user.id);
  };

  const next = async () => {
    if (step === 1 && !fullName.trim()) return toast.error(t.onb_name_required);
    if (step === 2 && !sport) return toast.error(t.onb_sport_required);
    setBusy(true);
    await saveStep();
    setBusy(false);
    setStep(s => Math.min(TOTAL, s + 1));
  };

  const finish = async () => {
    setBusy(true);
    await saveStep();
    await supabase.from('coach_profiles').update({ application_status: 'pending' }).eq('id', user.id);
    await refreshProfile();
    setBusy(false);
    setDone(true);
  };

  const addCert = () => {
    const v = certDraft.trim();
    if (!v) return;
    setCerts(c => [...c, v]);
    setCertDraft('');
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="surface max-w-md w-full p-8 text-center">
          <CheckCircle2 className="h-10 w-10 mx-auto mb-4" />
          <h1 className="font-display text-2xl uppercase tracking-[0.1em]">{t.onb_done_title}</h1>
          <p className="text-sm text-muted-foreground mt-3">{t.onb_done_body}</p>
          <Button className="w-full mt-7" size="lg" onClick={onSubmitted}>{t.onb_done_cta}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="surface max-w-lg w-full p-8">
        <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{t.onb_title}</p>
        <div className="mt-3 mb-6">
          <Progress value={(step / TOTAL) * 100} />
          <p className="text-xs text-muted-foreground mt-2">{t.onb_step} {step} {t.onb_of} {TOTAL}</p>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-display text-2xl uppercase tracking-[0.08em]">{t.onb_name_title}</h2>
            <p className="text-sm text-muted-foreground">{t.onb_name_sub}</p>
            <div className="grid gap-2">
              <Label htmlFor="name">{t.auth_full_name}</Label>
              <Input id="name" value={fullName} onChange={e => setFullName(e.target.value)} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-display text-2xl uppercase tracking-[0.08em]">{t.onb_sport_title}</h2>
            <p className="text-sm text-muted-foreground">{t.onb_sport_sub}</p>
            <div className="grid grid-cols-2 gap-2">
              {SPORTS.map(s => (
                <Button
                  key={s.slug}
                  type="button"
                  variant={sport === s.slug ? 'default' : 'outline'}
                  onClick={() => setSport(s.slug)}
                >
                  {s.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-display text-2xl uppercase tracking-[0.08em]">{t.onb_loc_title}</h2>
            <p className="text-sm text-muted-foreground">{t.onb_loc_sub}</p>
            <div className="grid gap-2">
              <Label htmlFor="city">{t.onb_city}</Label>
              <Input id="city" value={city} onChange={e => setCity(e.target.value)} placeholder={t.onb_city_ph} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bio">{t.onb_bio}</Label>
              <Textarea id="bio" rows={5} value={bio} onChange={e => setBio(e.target.value)} placeholder={t.onb_bio_ph} />
              <p className="text-xs text-muted-foreground">{t.onb_bio_note}</p>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="font-display text-2xl uppercase tracking-[0.08em]">{t.onb_cert_title}</h2>
            <p className="text-sm text-muted-foreground">{t.onb_cert_sub}</p>
            <div className="flex gap-2">
              <Input
                value={certDraft}
                onChange={e => setCertDraft(e.target.value)}
                placeholder={t.onb_cert_ph}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCert(); } }}
              />
              <Button type="button" variant="outline" onClick={addCert}>{t.onb_cert_add}</Button>
            </div>
            <ul className="space-y-2">
              {certs.map((c, i) => (
                <li key={`${c}-${i}`} className="flex items-center justify-between border border-border px-3 py-2 text-sm">
                  <span className="truncate">{c}</span>
                  <button type="button" onClick={() => setCerts(list => list.filter((_, idx) => idx !== i))}>
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">{t.onb_optional_note}</p>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <h2 className="font-display text-2xl uppercase tracking-[0.08em]">{t.onb_social_title}</h2>
            <p className="text-sm text-muted-foreground">{t.onb_social_sub}</p>
            {([
              ['instagram', 'Instagram'],
              ['facebook', 'Facebook'],
              ['website', t.onb_website],
              ['strava', 'Strava'],
            ] as const).map(([key, label]) => (
              <div className="grid gap-2" key={key}>
                <Label htmlFor={key}>{label}</Label>
                <Input
                  id={key}
                  value={social[key]}
                  onChange={e => setSocial(s => ({ ...s, [key]: e.target.value }))}
                  placeholder="https://"
                />
              </div>
            ))}
          </div>
        )}

        {step === 6 && (
          <div className="space-y-4">
            <h2 className="font-display text-2xl uppercase tracking-[0.08em]">{t.onb_price_title}</h2>
            <p className="text-sm text-muted-foreground">{t.onb_price_sub}</p>
            <div className="grid gap-2">
              <Label htmlFor="solo">{t.onb_price_solo}</Label>
              <Input id="solo" type="number" min="0" value={priceSolo} onChange={e => setPriceSolo(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="group">{t.onb_price_group}</Label>
              <Input id="group" type="number" min="0" value={priceGroup} onChange={e => setPriceGroup(e.target.value)} />
            </div>
            <p className="text-xs text-muted-foreground">{t.onb_optional_note}</p>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 mt-8">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStep(s => Math.max(1, s - 1))}
            disabled={step === 1 || busy}
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> {t.onb_back}
          </Button>
          <div className="flex items-center gap-3">
            {step >= 3 && step < TOTAL && (
              <Button type="button" variant="ghost" onClick={next} disabled={busy}>{t.onb_skip}</Button>
            )}
            <Button type="button" onClick={step === TOTAL ? finish : next} disabled={busy}>
              {busy ? t.onb_saving : step === TOTAL ? t.onb_finish : t.onb_next}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
