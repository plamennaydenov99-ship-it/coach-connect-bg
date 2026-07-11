import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PublicNav } from '@/components/layout/PublicNav';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { findSport } from '@/lib/mockData';
import { BadgeCheck, MapPin, Trophy, Calendar, CheckCircle2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface CoachData {
  id: string;
  bio: string | null;
  sport: string | null;
  specialisms: string[];
  price_per_session: number | null;
  discount_pct: number;
  years_experience: number | null;
  gallery: string[];
  verified: boolean;
  level: string | null;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
    city: string | null;
  } | null;
}

const CoachProfile = () => {
  const { id } = useParams<{ id: string }>();
  const [coach, setCoach] = useState<CoachData | null>(null);
  const [loading, setLoading] = useState(true);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', message: '', date: '' });

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('coach_profiles')
        .select('id, bio, sport, specialisms, price_per_session, discount_pct, years_experience, gallery, verified, level, profiles!coach_profiles_id_fkey(full_name, avatar_url, city)')
        .eq('id', id)
        .eq('verified', true)
        .maybeSingle();
      setCoach(data as any);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <PublicNav />
        <main className="flex-1 container py-20 text-center text-muted-foreground">Loading…</main>
        <PublicFooter />
      </div>
    );
  }

  if (!coach) {
    return (
      <div className="min-h-screen flex flex-col">
        <PublicNav />
        <main className="flex-1 container py-20 text-center">
          <h1 className="font-display">Coach not found</h1>
          <Link to="/search"><Button className="mt-6">Back to search</Button></Link>
        </main>
        <PublicFooter />
      </div>
    );
  }

  const sport = coach.sport ? findSport(coach.sport as any) : null;
  const name = coach.profiles?.full_name || 'Coach';
  const avatar = coach.profiles?.avatar_url || `https://i.pravatar.cc/300?u=${coach.id}`;
  const city = coach.profiles?.city ?? '';
  const price = coach.price_per_session ?? 0;
  const finalPrice = coach.discount_pct ? Math.round(price * (1 - coach.discount_pct / 100)) : price;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error('Please complete all required fields.');
      return;
    }
    setSubmitted(true);
    toast.success('Enquiry sent — the coach will reply within 24h.');
  };

  const closeAndReset = () => {
    setEnquiryOpen(false);
    setTimeout(() => {
      setSubmitted(false);
      setForm({ name: '', email: '', message: '', date: '' });
    }, 250);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNav />

      <main className="flex-1">
        <section className="border-b border-border bg-card/40">
          <div className="container py-10 grid gap-8 md:grid-cols-[auto_1fr] items-center">
            <img src={avatar} alt={name} className="h-28 w-28 md:h-36 md:w-36 rounded-2xl object-cover border border-border" />
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {sport && (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-primary/15 text-primary capitalize">
                    {sport.label}
                  </span>
                )}
                <span className="badge-verified"><BadgeCheck className="h-3 w-3" /> Verified</span>
                {coach.discount_pct ? (
                  <span className="badge-discount">-{coach.discount_pct}% Platform rate</span>
                ) : null}
              </div>
              <h1 className="font-display">{name}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                {city && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {city}</span>}
                {coach.years_experience != null && (
                  <span className="flex items-center gap-1.5"><Trophy className="h-4 w-4" /> {coach.years_experience} yrs experience</span>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="container pb-20 pt-8 grid gap-8 md:grid-cols-[1fr_340px]">
          <div className="space-y-8">
            {coach.bio && (
              <div className="surface p-6">
                <h2 className="font-display text-2xl mb-3">About</h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{coach.bio}</p>
                {coach.specialisms?.length ? (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {coach.specialisms.map(s => (
                      <span key={s} className="px-3 py-1 rounded-md bg-secondary text-sm">{s}</span>
                    ))}
                  </div>
                ) : null}
              </div>
            )}

            {coach.gallery?.length ? (
              <div>
                <h2 className="font-display text-2xl mb-4">Gallery</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {coach.gallery.map((g, i) => (
                    <img key={i} src={g} alt={`${name} session ${i + 1}`} loading="lazy"
                      className="aspect-[4/3] rounded-xl object-cover border border-border" />
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <aside className="md:sticky md:top-20 h-fit">
            <div className="surface p-6">
              <p className="text-sm text-muted-foreground">Per session</p>
              <div className="mt-1 flex items-baseline gap-3">
                {coach.discount_pct ? (
                  <>
                    <span className="font-display text-3xl">€{finalPrice}</span>
                    <span className="text-muted-foreground line-through">€{price}</span>
                  </>
                ) : (
                  <span className="font-display text-3xl">€{price}</span>
                )}
              </div>

              <Dialog open={enquiryOpen} onOpenChange={setEnquiryOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="w-full mt-5">
                    <MessageSquare className="h-4 w-4 mr-2" /> Request a session
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Request a session with {name}</DialogTitle>
                    <DialogDescription>
                      Send a quick enquiry. The coach typically replies within 24h.
                    </DialogDescription>
                  </DialogHeader>

                  {submitted ? (
                    <div className="py-6 text-center">
                      <div className="mx-auto h-14 w-14 rounded-full bg-primary/15 text-primary flex items-center justify-center mb-3">
                        <CheckCircle2 className="h-7 w-7" />
                      </div>
                      <p className="font-display text-xl">Enquiry sent</p>
                      <Button className="mt-5" onClick={closeAndReset}>Done</Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                      <div className="grid gap-2">
                        <Label htmlFor="name">Your name</Label>
                        <Input id="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="date">Preferred date</Label>
                        <Input id="date" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="message">Message</Label>
                        <Textarea id="message" rows={4} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required />
                      </div>
                      <Button type="submit" className="w-full" size="lg">Send enquiry</Button>
                    </form>
                  )}
                </DialogContent>
              </Dialog>

              <div className="mt-5 surface-2 p-4 text-sm text-muted-foreground">
                <p className="flex items-center gap-2 text-foreground font-medium mb-1">
                  <Calendar className="h-4 w-4 text-primary" /> Booking calendar
                </p>
                Live booking calendar — coming soon.
              </div>
            </div>
          </aside>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
};

export default CoachProfile;
