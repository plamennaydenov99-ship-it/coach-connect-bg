import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PublicNav } from '@/components/layout/PublicNav';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { findCoach, findSport, discountedPrice } from '@/lib/mockData';
import { BadgeCheck, Star, MapPin, Trophy, Calendar, CheckCircle2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

const CoachProfile = () => {
  const { slug } = useParams<{ slug: string }>();
  const coach = slug ? findCoach(slug) : undefined;
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', message: '', date: '' });

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

  const sport = findSport(coach.sport);
  const final = discountedPrice(coach.pricePerSession, coach.discountPct);

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
            <img
              src={coach.avatar}
              alt={coach.name}
              className="h-28 w-28 md:h-36 md:w-36 rounded-2xl object-cover border border-border"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-primary/15 text-primary capitalize">
                  {sport?.label}
                </span>
                {coach.verified && (
                  <span className="badge-verified"><BadgeCheck className="h-3 w-3" /> Verified</span>
                )}
                {coach.discountPct ? (
                  <span className="badge-discount">-{coach.discountPct}% Platform rate</span>
                ) : null}
              </div>
              <h1 className="font-display">{coach.name}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {coach.city}</span>
                <span className="flex items-center gap-1.5"><Star className="h-4 w-4 fill-primary text-primary" /> {coach.rating.toFixed(2)} ({coach.reviewCount} reviews)</span>
                <span className="flex items-center gap-1.5"><Trophy className="h-4 w-4" /> {coach.yearsExperience} yrs experience</span>
              </div>
            </div>
          </div>
        </section>

        <section className="container py-6">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Years experience', value: coach.yearsExperience },
              { label: 'Sessions completed', value: coach.sessionsCompleted.toLocaleString() },
              { label: 'Sports covered', value: 1 },
            ].map(s => (
              <div key={s.label} className="surface p-5 text-center">
                <p className="font-display text-2xl md:text-3xl text-primary">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="container pb-20 grid gap-8 md:grid-cols-[1fr_340px]">
          <div className="space-y-8">
            <div className="surface p-6">
              <h2 className="font-display text-2xl mb-3">About</h2>
              <p className="text-muted-foreground leading-relaxed">{coach.bio}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {coach.specialisms.map(s => (
                  <span key={s} className="px-3 py-1 rounded-md bg-secondary text-sm">{s}</span>
                ))}
              </div>
            </div>

            <div>
              <h2 className="font-display text-2xl mb-4">Gallery</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {coach.gallery.map((g, i) => (
                  <img
                    key={i}
                    src={g}
                    alt={`${coach.name} session ${i + 1}`}
                    loading="lazy"
                    className="aspect-[4/3] rounded-xl object-cover border border-border"
                  />
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-end justify-between mb-4">
                <h2 className="font-display text-2xl">Reviews</h2>
                <div className="text-right">
                  <p className="font-display text-3xl text-primary">{coach.rating.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">{coach.reviewCount} ratings</p>
                </div>
              </div>

              <div className="surface p-5 mb-4">
                {[5, 4, 3, 2, 1].map(stars => {
                  const pct = stars === 5 ? 70 : stars === 4 ? 22 : stars === 3 ? 5 : stars === 2 ? 2 : 1;
                  return (
                    <div key={stars} className="flex items-center gap-3 text-sm py-1">
                      <span className="w-6 text-muted-foreground">{stars}★</span>
                      <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-10 text-right text-muted-foreground">{pct}%</span>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-3">
                {coach.reviews.map(r => (
                  <div key={r.id} className="surface p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img src={r.avatar} alt={r.author} className="h-9 w-9 rounded-full object-cover" />
                        <div>
                          <p className="font-medium text-sm">{r.author}</p>
                          <p className="text-xs text-muted-foreground">{r.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: r.rating }).map((_, i) => (
                          <Star key={i} className="h-3.5 w-3.5 fill-primary text-primary" />
                        ))}
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">{r.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="md:sticky md:top-20 h-fit">
            <div className="surface p-6">
              <p className="text-sm text-muted-foreground">Per session</p>
              <div className="mt-1 flex items-baseline gap-3">
                {coach.discountPct ? (
                  <>
                    <span className="font-display text-3xl">€{final}</span>
                    <span className="text-muted-foreground line-through">€{coach.pricePerSession}</span>
                  </>
                ) : (
                  <span className="font-display text-3xl">€{coach.pricePerSession}</span>
                )}
              </div>
              {coach.discountPct ? (
                <p className="mt-2 text-xs text-primary font-semibold">
                  You save €{coach.pricePerSession - final} with the platform rate.
                </p>
              ) : null}

              <Dialog open={enquiryOpen} onOpenChange={setEnquiryOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="w-full mt-5">
                    <MessageSquare className="h-4 w-4 mr-2" /> Request a session
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Request a session with {coach.name}</DialogTitle>
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
                      <p className="text-sm text-muted-foreground mt-2">
                        We'll notify you in-app the moment the coach replies.
                      </p>
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
                        <Textarea id="message" rows={4} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required placeholder="Tell the coach about your goals and experience." />
                      </div>
                      <Button type="submit" className="w-full" size="lg">Send enquiry</Button>
                      <p className="text-xs text-muted-foreground text-center">
                        All contact happens through Atleta — no personal contact details exchanged.
                      </p>
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
