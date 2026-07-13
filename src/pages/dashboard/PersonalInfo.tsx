import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { SPORTS } from '@/lib/mockData';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const PersonalInfo = () => {
  const { user, profile, loading } = useAuth();
  const [heightCm, setHeightCm] = useState<string>('');
  const [weightKg, setWeightKg] = useState<string>('');
  const [sports, setSports] = useState<string[]>([]);
  const [goals, setGoals] = useState('');
  const [saving, setSaving] = useState(false);
  const [rowExists, setRowExists] = useState(false);

  useEffect(() => {
    if (!user || !profile || profile.role !== 'athlete') return;
    (async () => {
      const { data } = await supabase
        .from('athlete_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      if (data) {
        setRowExists(true);
        setHeightCm(data.height_cm?.toString() ?? '');
        setWeightKg(data.weight_kg?.toString() ?? '');
        setSports(data.sports ?? []);
        setGoals(data.goals ?? '');
      }
    })();
  }, [user, profile]);

  if (loading || !profile) return <div className="text-muted-foreground p-6">Loading…</div>;
  if (profile.role !== 'athlete') {
    return <div className="text-muted-foreground p-6">Personal info is only available for athletes.</div>;
  }

  const toggleSport = (slug: string) => {
    setSports(prev => prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]);
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const payload = {
      id: user.id,
      height_cm: heightCm ? parseInt(heightCm, 10) : null,
      weight_kg: weightKg ? parseFloat(weightKg) : null,
      sports,
      goals: goals || null,
    };
    const { error } = rowExists
      ? await supabase.from('athlete_profiles').update(payload).eq('id', user.id)
      : await supabase.from('athlete_profiles').insert(payload);
    if (error) toast.error(error.message);
    else { toast.success('Personal info saved.'); setRowExists(true); }
    setSaving(false);
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl">Personal info</h1>
        <p className="text-muted-foreground mt-1">Help coaches understand you better.</p>
      </div>

      <section className="surface p-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="height">Height (cm)</Label>
            <Input id="height" type="number" value={heightCm} onChange={e => setHeightCm(e.target.value)} placeholder="180" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="weight">Weight (kg)</Label>
            <Input id="weight" type="number" step="0.1" value={weightKg} onChange={e => setWeightKg(e.target.value)} placeholder="75" />
          </div>
        </div>
      </section>

      <section className="surface p-6 space-y-4">
        <div>
          <Label>Sports</Label>
          <p className="text-sm text-muted-foreground mt-1">Tap to add or remove.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {SPORTS.map(sp => {
            const active = sports.includes(sp.slug);
            return (
              <button
                type="button"
                key={sp.slug}
                onClick={() => toggleSport(sp.slug)}
                className={`px-3 py-1.5 text-sm border transition-colors ${
                  active
                    ? 'border-gold bg-gold/15 text-gold'
                    : 'border-border text-foreground-muted hover:text-foreground hover:border-foreground-muted'
                }`}
              >
                {sp.label}
                {active && <X className="inline h-3 w-3 ml-1.5" />}
              </button>
            );
          })}
        </div>
        {sports.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border">
            {sports.map(s => (
              <Badge key={s} variant="secondary">{SPORTS.find(sp => sp.slug === s)?.label ?? s}</Badge>
            ))}
          </div>
        )}
      </section>

      <section className="surface p-6 space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="goals">Goals</Label>
          <Textarea
            id="goals"
            rows={4}
            value={goals}
            onChange={e => setGoals(e.target.value)}
            placeholder="What are you working toward? e.g. Prepare for a marathon, improve backhand, build strength…"
          />
        </div>
      </section>

      <Button onClick={save} disabled={saving}>
        {saving ? 'Saving…' : 'Save changes'}
      </Button>
    </div>
  );
};

export default PersonalInfo;
