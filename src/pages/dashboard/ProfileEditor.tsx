import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { SPORTS, CITIES } from '@/lib/mockData';
import { Star, Upload, Plus } from 'lucide-react';
import { toast } from 'sonner';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SLOTS = ['Morning', 'Midday', 'Evening'];

const ProfileEditor = () => {
  const [form, setForm] = useState({
    name: 'Rui Marques',
    city: 'Sofia',
    bio: 'Former semi-pro footballer turned coach. I work with youth and adult players on technique, tactical awareness and match readiness.',
    price: 65,
  });
  const [sportsSel, setSportsSel] = useState<string[]>(['football']);
  const [certs, setCerts] = useState<string[]>(['UEFA C licence', 'Youth coaching diploma']);
  const [newCert, setNewCert] = useState('');
  const [discountOn, setDiscountOn] = useState(true);
  const [discount, setDiscount] = useState([15]);
  const [availability, setAvailability] = useState<Record<string, boolean>>({
    'Mon-Evening': true, 'Tue-Evening': true, 'Wed-Morning': true,
    'Sat-Morning': true, 'Sat-Midday': true,
  });

  const toggleSport = (s: string) =>
    setSportsSel(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);

  const addCert = () => {
    if (newCert.trim()) {
      setCerts([...certs, newCert.trim()]);
      setNewCert('');
    }
  };

  const finalPrice = discountOn ? Math.round(form.price * (1 - discount[0] / 100)) : form.price;

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-3xl">My profile</h1>
        <p className="text-muted-foreground mt-1">Edit how athletes see you on Atleta.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Editor */}
        <div className="space-y-6">
          <section className="surface p-6">
            <h2 className="font-display text-xl mb-4">Basic info</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="city">City</Label>
                <select
                  id="city"
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={form.city}
                  onChange={e => setForm({ ...form, city: e.target.value })}
                >
                  {CITIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-4 grid gap-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" rows={4} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} />
            </div>
          </section>

          <section className="surface p-6">
            <h2 className="font-display text-xl mb-4">Sports</h2>
            <div className="flex flex-wrap gap-2">
              {SPORTS.map(s => (
                <button
                  key={s.slug}
                  type="button"
                  onClick={() => toggleSport(s.slug)}
                  className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
                    sportsSel.includes(s.slug)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border bg-secondary hover:border-primary/40'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </section>

          <section className="surface p-6">
            <h2 className="font-display text-xl mb-4">Pricing</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="price">Price per session (€)</Label>
                <Input
                  id="price"
                  type="number"
                  value={form.price}
                  onChange={e => setForm({ ...form, price: Number(e.target.value) })}
                />
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

          <section className="surface p-6">
            <h2 className="font-display text-xl mb-4">Photos</h2>
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
              <Upload className="h-7 w-7 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm">Drag photos here or <span className="text-primary font-medium">browse</span></p>
              <p className="text-xs text-muted-foreground mt-1">JPG or PNG, up to 10MB each.</p>
            </div>
          </section>

          <section className="surface p-6">
            <h2 className="font-display text-xl mb-4">Certifications</h2>
            <div className="flex flex-wrap gap-2 mb-3">
              {certs.map((c, i) => (
                <span key={i} className="px-3 py-1.5 rounded-md bg-secondary text-sm flex items-center gap-2">
                  {c}
                  <button type="button" onClick={() => setCerts(certs.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-foreground">×</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={newCert} onChange={e => setNewCert(e.target.value)} placeholder="Add a certification" />
              <Button type="button" variant="outline" onClick={addCert}><Plus className="h-4 w-4" /></Button>
            </div>
          </section>

          <section className="surface p-6">
            <h2 className="font-display text-xl mb-4">Weekly availability</h2>
            <div className="grid grid-cols-[80px_repeat(7,1fr)] gap-1 text-xs text-center">
              <div />
              {DAYS.map(d => <div key={d} className="font-semibold py-2">{d}</div>)}
              {SLOTS.map(slot => (
                <>
                  <div key={`l-${slot}`} className="py-2 text-left text-muted-foreground self-center">{slot}</div>
                  {DAYS.map(d => {
                    const k = `${d}-${slot}`;
                    const on = !!availability[k];
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setAvailability({ ...availability, [k]: !on })}
                        className={`h-9 rounded-md border transition-colors ${
                          on ? 'bg-primary border-primary' : 'border-border bg-secondary hover:border-primary/40'
                        }`}
                        aria-label={`${d} ${slot}`}
                      />
                    );
                  })}
                </>
              ))}
            </div>
          </section>

          <div className="flex justify-end">
            <Button size="lg" onClick={() => toast.success('Profile saved.')}>Save changes</Button>
          </div>
        </div>

        {/* Live preview */}
        <aside className="lg:sticky lg:top-8 h-fit">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Live preview</p>
          <div className="surface overflow-hidden">
            <img src="https://picsum.photos/seed/sport1/800/500" alt="" className="aspect-[4/3] w-full object-cover" />
            <div className="p-5">
              <div className="flex items-center gap-3">
                <img src="https://i.pravatar.cc/300?img=12" alt="" className="h-10 w-10 rounded-full" />
                <div>
                  <p className="font-display text-lg leading-tight">{form.name}</p>
                  <p className="text-xs text-muted-foreground">{form.city}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-3 line-clamp-3">{form.bio}</p>
              <div className="mt-3 flex items-center gap-1.5 text-sm">
                <Star className="h-4 w-4 fill-primary text-primary" /> 4.90 <span className="text-muted-foreground">(87)</span>
              </div>
              <div className="mt-3 pt-3 border-t border-border">
                {discountOn ? (
                  <div className="flex items-baseline gap-2">
                    <span className="text-muted-foreground line-through text-sm">€{form.price}</span>
                    <span className="font-display text-2xl text-primary">€{finalPrice}</span>
                  </div>
                ) : (
                  <span className="font-display text-2xl">€{form.price}</span>
                )}
                <p className="text-xs text-muted-foreground">per session</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ProfileEditor;
