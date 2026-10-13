import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { SPORTS } from '@/lib/mockData';
import { BadgeCheck, ShieldAlert, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { AvatarUpload } from '@/components/AvatarUpload';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';

const ProfileEditor = () => {
  const { user, profile, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [city, setCity] = useState('');

  // Coach-specific
  const [bio, setBio] = useState('');
  const [sports, setSports] = useState<string[]>([]);
  const toggleSport = (slug: string) => {
    if (sports.includes(slug)) return setSports(sports.filter(x => x !== slug));
    if (sports.length >= 3) return toast.error(t.onb_sport_max);
    setSports([...sports, slug]);
  };

  const [pricePerSession, setPricePerSession] = useState(60);
  const [yearsExperience, setYearsExperience] = useState<number>(0);
  const [specialisms, setSpecialisms] = useState<string[]>([]);
  const [newSpec, setNewSpec] = useState('');
  const [certifications, setCertifications] = useState<string[]>([]);
  const [newCert, setNewCert] = useState('');
  const [verified, setVerified] = useState(false);

  // Club-specific
  const [clubName, setClubName] = useState('');
  const [clubAbout, setClubAbout] = useState('');
  const [clubHours, setClubHours] = useState('');

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!profile || !user) return;
    setFullName(profile.full_name ?? '');
    setCity(profile.city ?? '');

    (async () => {
      if (profile.role === 'coach') {
        const { data } = await supabase.from('coach_profiles').select('*').eq('id', user.id).maybeSingle();
        if (data) {
          setBio(data.bio ?? '');
          setSports(data.sports ?? []);
          setPricePerSession(data.price_per_session ?? 60);
          setYearsExperience(data.years_experience ?? 0);
          setSpecialisms(data.specialisms ?? []);
          setCertifications(data.certifications ?? []);
          setVerified(data.verified);
        }
      } else if (profile.role === 'club') {
        const { data } = await supabase.from('club_profiles').select('*').eq('id', user.id).maybeSingle();
        if (data) {
          setClubName(data.name ?? '');
          setClubAbout(data.about ?? '');
          setClubHours(data.hours ?? '');
          setSports(data.sports ?? []);
          setVerified(data.verified);
        }
      }
    })();
  }, [profile, user]);

  const save = async () => {
    if (!user || !profile) return;
    setSaving(true);

    const { error: pErr } = await supabase
      .from('profiles')
      .update({ full_name: fullName, city })
      .eq('id', user.id);

    if (pErr) {
      toast.error(pErr.message);
      setSaving(false);
      return;
    }

    if (profile.role === 'coach') {
      const { error } = await supabase.from('coach_profiles').update({
        bio,
        sports,
        price_per_session: pricePerSession,
        years_experience: yearsExperience,
        specialisms,
        certifications,
      }).eq('id', user.id);
      if (error) { toast.error(error.message); setSaving(false); return; }
    } else if (profile.role === 'club') {
      const { error } = await supabase.from('club_profiles').update({
        name: clubName,
        about: clubAbout,
        hours: clubHours,
        sports,
      }).eq('id', user.id);
      if (error) { toast.error(error.message); setSaving(false); return; }
    }

    await refreshProfile();
    toast.success(t.profileed_saved_toast);
    setSaving(false);
  };

  if (loading || !profile) {
    return <div className="text-muted-foreground p-6">{t.profileed_loading}</div>;
  }

  const addSpec = () => {
    if (newSpec.trim()) {
      setSpecialisms([...specialisms, newSpec.trim()]);
      setNewSpec('');
    }
  };

  const addCert = () => {
    if (newCert.trim()) {
      setCertifications([...certifications, newCert.trim()]);
      setNewCert('');
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-3xl">{t.profileed_title}</h1>
        <p className="text-muted-foreground mt-1 capitalize">{t.profileed_role}: {profile.role}</p>
      </div>

      {(profile.role === 'coach' || profile.role === 'club') && (
        <div className={`surface p-4 flex items-start gap-3 ${verified ? '' : 'border-gold/30'}`}>
          {verified ? (
            <>
              <BadgeCheck className="h-5 w-5 text-gold mt-0.5" />
              <div>
                <p className="font-semibold">{t.profileed_verified}</p>
                <p className="text-sm text-muted-foreground">
                  {t.profileed_verified_sub}
                </p>
              </div>
            </>
          ) : (
            <>
              <ShieldAlert className="h-5 w-5 text-gold mt-0.5" />
              <div>
                <p className="font-semibold">{t.profileed_pending}</p>
                <p className="text-sm text-muted-foreground">
                  {t.profileed_pending_sub}
                </p>
              </div>
            </>
          )}
        </div>
      )}

      <section className="surface p-6 space-y-4">
        <h2 className="font-display text-xl">{t.profileed_basic_info}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="name">{profile.role === 'club' ? t.profileed_contact_name : t.profileed_full_name}</Label>
            <Input id="name" value={fullName} onChange={e => setFullName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="city">{t.profileed_city}</Label>
            <Input id="city" value={city} onChange={e => setCity(e.target.value)} placeholder={t.profileed_city_ph} />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label>{t.profileed_avatar}</Label>
            <AvatarUpload />
          </div>
        </div>
      </section>

      {profile.role === 'coach' && (
        <>
          <section className="surface p-6 space-y-4">
            <h2 className="font-display text-xl">{t.profileed_coaching_details}</h2>
            <div className="grid gap-2">
              <Label htmlFor="bio">{t.profileed_bio}</Label>
              <Textarea id="bio" rows={5} value={bio} onChange={e => setBio(e.target.value)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2 sm:col-span-2">
                <Label>{t.profileed_sport}</Label>
                <div className="flex flex-wrap gap-2">
                  {SPORTS.map(s => (
                    <Button key={s.slug} type="button" size="sm"
                      variant={sports.includes(s.slug) ? 'default' : 'outline'}
                      onClick={() => toggleSport(s.slug)}>
                      {s.label}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">{t.onb_sport_count.replace('{n}', String(sports.length))}{sports[0] ? ` · ${t.profileed_primary_sport}: ${SPORTS.find(x => x.slug === sports[0])?.label ?? sports[0]}` : ''}</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="years">{t.profileed_years}</Label>
                <Input id="years" type="number" min={0} value={yearsExperience}
                  onChange={e => setYearsExperience(Number(e.target.value))} />
              </div>
            </div>

            <div>
              <Label className="mb-2 block">{t.profileed_specialisms}</Label>
              <p className="text-xs text-muted-foreground -mt-1 mb-2">{t.profileed_disciplines_hint}</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {specialisms.map((s, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-md bg-secondary text-sm flex items-center gap-2">
                    {s}
                    <button type="button" onClick={() => setSpecialisms(specialisms.filter((_, idx) => idx !== i))}
                      className="text-muted-foreground hover:text-foreground">×</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={newSpec} onChange={e => setNewSpec(e.target.value)} placeholder={t.profileed_add_specialism} />
                <Button type="button" variant="outline" onClick={addSpec}><Plus className="h-4 w-4" /></Button>
              </div>
            </div>

            <div>
              <Label className="mb-2 block">{t.profileed_certifications}</Label>
              <div className="flex flex-wrap gap-2 mb-3">
                {certifications.map((c, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-md bg-secondary text-sm flex items-center gap-2">
                    {c}
                    <button type="button" onClick={() => setCertifications(certifications.filter((_, idx) => idx !== i))}
                      className="text-muted-foreground hover:text-foreground">×</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={newCert} onChange={e => setNewCert(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCert(); } }}
                  placeholder={t.profileed_cert_ph} />
                <Button type="button" variant="outline" onClick={addCert}><Plus className="h-4 w-4" /></Button>
              </div>
            </div>
          </section>

          <section className="surface p-6 space-y-4">
            <h2 className="font-display text-xl">{t.profileed_pricing}</h2>
            <div className="grid gap-2 max-w-xs">
              <Label htmlFor="price">{t.profileed_price_session}</Label>
              <Input id="price" type="number" value={pricePerSession}
                onChange={e => setPricePerSession(Number(e.target.value))} />
            </div>
          </section>
        </>
      )}

      {profile.role === 'club' && (
        <section className="surface p-6 space-y-4">
          <h2 className="font-display text-xl">{t.profileed_club_details}</h2>
          <div className="grid gap-2">
            <Label htmlFor="cn">{t.profileed_club_name}</Label>
            <Input id="cn" value={clubName} onChange={e => setClubName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>{t.profileed_primary_sport}</Label>
            <div className="flex flex-wrap gap-2">
                  {SPORTS.map(s => (
                    <Button key={s.slug} type="button" size="sm"
                      variant={sports.includes(s.slug) ? 'default' : 'outline'}
                      onClick={() => toggleSport(s.slug)}>
                      {s.label}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">{t.onb_sport_count.replace('{n}', String(sports.length))}{sports[0] ? ` · ${t.profileed_primary_sport}: ${SPORTS.find(x => x.slug === sports[0])?.label ?? sports[0]}` : ''}</p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="about">{t.profileed_about}</Label>
            <Textarea id="about" rows={5} value={clubAbout} onChange={e => setClubAbout(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="hours">{t.profileed_hours}</Label>
            <Textarea id="hours" rows={4} value={clubHours} onChange={e => setClubHours(e.target.value)}
              placeholder={'Mon–Fri: 07:00–22:00\nSat–Sun: 09:00–18:00'} />
          </div>
        </section>
      )}

      <div className="flex justify-end">
        <Button size="lg" onClick={save} disabled={saving}>
          {saving ? t.profileed_saving : t.profileed_save}
        </Button>
      </div>
    </div>
  );
};

export default ProfileEditor;
