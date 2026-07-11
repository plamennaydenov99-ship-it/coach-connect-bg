import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { SPORTS, CITIES } from '@/lib/mockData';
import { BadgeCheck, ShieldAlert, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const ProfileEditor = () => {
  const { user, profile, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [city, setCity] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Coach-specific
  const [bio, setBio] = useState('');
  const [sport, setSport] = useState('');
  const [pricePerSession, setPricePerSession] = useState(60);
  const [discountOn, setDiscountOn] = useState(false);
  const [discount, setDiscount] = useState<number[]>([10]);
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
    setAvatarUrl(profile.avatar_url ?? '');

    (async () => {
      if (profile.role === 'coach') {
        const { data } = await supabase.from('coach_profiles').select('*').eq('id', user.id).maybeSingle();
        if (data) {
          setBio(data.bio ?? '');
          setSport(data.sport ?? '');
          setPricePerSession(data.price_per_session ?? 60);
          setDiscount([data.discount_pct ?? 0]);
          setDiscountOn((data.discount_pct ?? 0) > 0);
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
          setSport(data.sport ?? '');
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
      .update({ full_name: fullName, city, avatar_url: avatarUrl || null })
      .eq('id', user.id);

    if (pErr) {
      toast.error(pErr.message);
      setSaving(false);
      return;
    }

    if (profile.role === 'coach') {
      const { error } = await supabase.from('coach_profiles').update({
        bio,
        sport: sport || null,
        price_per_session: pricePerSession,
        discount_pct: discountOn ? discount[0] : 0,
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
        sport: sport || null,
      }).eq('id', user.id);
      if (error) { toast.error(error.message); setSaving(false); return; }
    }

    await refreshProfile();
    toast.success('Profile saved.');
    setSaving(false);
  };

  if (loading || !profile) {
    return <div className="text-muted-foreground p-6">Loading…</div>;
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
        <h1 className="font-display text-3xl">My profile</h1>
        <p className="text-muted-foreground mt-1 capitalize">Role: {profile.role}</p>
      </div>

      {(profile.role === 'coach' || profile.role === 'club') && (
        <div className={`surface p-4 flex items-start gap-3 ${verified ? '' : 'border-primary/30'}`}>
          {verified ? (
            <>
              <BadgeCheck className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-semibold">Verified</p>
                <p className="text-sm text-muted-foreground">Your profile is live in search results.</p>
              </div>
            </>
          ) : (
            <>
              <ShieldAlert className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-semibold">Pending verification</p>
                <p className="text-sm text-muted-foreground">
                  Your profile is not yet visible to athletes. Our team will review your account and mark you verified.
                </p>
              </div>
            </>
          )}
        </div>
      )}

      <section className="surface p-6 space-y-4">
        <h2 className="font-display text-xl">Basic info</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="name">{profile.role === 'club' ? 'Contact name' : 'Full name'}</Label>
            <Input id="name" value={fullName} onChange={e => setFullName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="city">City</Label>
            <select id="city" className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={city} onChange={e => setCity(e.target.value)}>
              <option value="">Select a city</option>
              {CITIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="avatar">Avatar URL</Label>
            <Input id="avatar" value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} placeholder="https://…" />
          </div>
        </div>
      </section>

      {profile.role === 'coach' && (
        <>
          <section className="surface p-6 space-y-4">
            <h2 className="font-display text-xl">Coaching details</h2>
            <div className="grid gap-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" rows={5} value={bio} onChange={e => setBio(e.target.value)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Sport</Label>
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={sport} onChange={e => setSport(e.target.value)}>
                  <option value="">Select a sport</option>
                  {SPORTS.map(s => <option key={s.slug} value={s.slug}>{s.label}</option>)}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="years">Years of experience</Label>
                <Input id="years" type="number" min={0} value={yearsExperience}
                  onChange={e => setYearsExperience(Number(e.target.value))} />
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Specialisms</Label>
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
                <Input value={newSpec} onChange={e => setNewSpec(e.target.value)} placeholder="Add a specialism" />
                <Button type="button" variant="outline" onClick={addSpec}><Plus className="h-4 w-4" /></Button>
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Certifications</Label>
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
                  placeholder='e.g. "UEFA B License"' />
                <Button type="button" variant="outline" onClick={addCert}><Plus className="h-4 w-4" /></Button>
              </div>
            </div>
          </section>

          <section className="surface p-6 space-y-4">
            <h2 className="font-display text-xl">Pricing</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="price">Price per session (€)</Label>
                <Input id="price" type="number" value={pricePerSession}
                  onChange={e => setPricePerSession(Number(e.target.value))} />
              </div>
              <div className="surface-2 p-4">
                <div className="flex items-center justify-between mb-3">
                  <Label htmlFor="discount-toggle" className="text-sm font-medium">Platform discount</Label>
                  <Switch id="discount-toggle" checked={discountOn} onCheckedChange={setDiscountOn} />
                </div>
                {discountOn && (
                  <>
                    <Slider value={discount} min={0} max={20} step={1} onValueChange={setDiscount} />
                    <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                      <span>0%</span><span className="font-semibold text-primary">-{discount[0]}%</span><span>20%</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>
        </>
      )}

      {profile.role === 'club' && (
        <section className="surface p-6 space-y-4">
          <h2 className="font-display text-xl">Club details</h2>
          <div className="grid gap-2">
            <Label htmlFor="cn">Club name</Label>
            <Input id="cn" value={clubName} onChange={e => setClubName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Primary sport</Label>
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={sport} onChange={e => setSport(e.target.value)}>
              <option value="">Select a sport</option>
              {SPORTS.map(s => <option key={s.slug} value={s.slug}>{s.label}</option>)}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="about">About</Label>
            <Textarea id="about" rows={5} value={clubAbout} onChange={e => setClubAbout(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="hours">Opening hours</Label>
            <Textarea id="hours" rows={4} value={clubHours} onChange={e => setClubHours(e.target.value)}
              placeholder={'Mon–Fri: 07:00–22:00\nSat–Sun: 09:00–18:00'} />
          </div>
        </section>
      )}

      <div className="flex justify-end">
        <Button size="lg" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </div>
  );
};

export default ProfileEditor;
