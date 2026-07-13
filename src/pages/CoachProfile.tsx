import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { PublicNav } from '@/components/layout/PublicNav';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { findSport } from '@/lib/mockData';
import { BadgeCheck, MapPin, Trophy, Calendar, MessageSquare, Clock, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { getOrCreateConversation } from '@/lib/messaging';

interface CoachData {
  id: string;
  bio: string | null;
  sport: string | null;
  specialisms: string[];
  certifications: string[];
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

interface Slot { id: string; date: string; start_time: string; end_time: string; }

const CoachProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [coach, setCoach] = useState<CoachData | null>(null);
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('coach_profiles')
        .select('id, bio, sport, specialisms, certifications, price_per_session, discount_pct, years_experience, gallery, verified, level, profiles!coach_profiles_id_fkey(full_name, avatar_url, city)')
        .eq('id', id)
        .eq('verified', true)
        .maybeSingle();
      setCoach(data as any);
      setLoading(false);
    })();
  }, [id]);

  const loadSlots = async () => {
    if (!id) return;
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabase
      .from('availability_slots')
      .select('id, date, start_time, end_time')
      .eq('coach_id', id)
      .eq('status', 'open')
      .gte('date', today)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });
    setSlots((data as Slot[]) ?? []);
  };

  useEffect(() => { loadSlots(); }, [id]);

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

  const requireAthlete = (): boolean => {
    if (!user) {
      toast.error('Sign in to continue.');
      navigate('/login');
      return false;
    }
    if (profile && profile.role !== 'athlete') {
      toast.error('Only athlete accounts can book or message coaches.');
      return false;
    }
    return true;
  };

  const openMessage = async () => {
    if (!requireAthlete() || !user) return;
    try {
      const cid = await getOrCreateConversation(user.id, coach.id);
      navigate(`/dashboard/messages?c=${cid}`);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const submitBooking = async () => {
    if (!user || !selectedSlot) return;
    setSubmitting(true);
    // Reserve slot
    const { error: slotErr } = await supabase
      .from('availability_slots')
      .update({ status: 'pending' })
      .eq('id', selectedSlot.id)
      .eq('status', 'open');
    if (slotErr) { toast.error(slotErr.message); setSubmitting(false); return; }

    const { error: bookErr } = await supabase.from('bookings').insert({
      slot_id: selectedSlot.id,
      athlete_id: user.id,
      coach_id: coach.id,
      status: 'pending',
      note: note.trim() || null,
      price: finalPrice,
    });
    if (bookErr) {
      await supabase.from('availability_slots').update({ status: 'open' }).eq('id', selectedSlot.id);
      toast.error(bookErr.message);
      setSubmitting(false);
      return;
    }

    // Auto-create conversation
    try { await getOrCreateConversation(user.id, coach.id); } catch {}

    toast.success('Request sent. The coach will reply shortly.');
    setSubmitting(false);
    setSelectedSlot(null);
    setNote('');
    loadSlots();
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
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-gold/15 text-gold capitalize">
                    {sport.label}
                  </span>
                )}
                <span className="badge-verified"><BadgeCheck className="h-3 w-3" /> Verified</span>
                {coach.discount_pct ? (
                  <span className="badge-discount">-{coach.discount_pct}% Platform rate</span>
                ) : null}
              </div>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h1 className="font-display">{name}</h1>
                <BookmarkButton targetType="coach" targetId={coach.id} />
              </div>
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
                  <div className="mt-5">
                    <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground mb-2">Specialisms</p>
                    <div className="flex flex-wrap gap-2">
                      {coach.specialisms.map(s => (
                        <span key={s} className="px-3 py-1 rounded-md bg-secondary text-sm">{s}</span>
                      ))}
                    </div>
                  </div>
                ) : null}
                {coach.certifications?.length ? (
                  <div className="mt-5">
                    <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground mb-2">Certifications</p>
                    <div className="flex flex-wrap gap-2">
                      {coach.certifications.map(c => (
                        <span key={c} className="px-3 py-1 rounded-md border border-gold/40 text-gold text-sm flex items-center gap-1.5">
                          <BadgeCheck className="h-3.5 w-3.5" /> {c}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            <div className="surface p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-gold" />
                <h2 className="font-display text-2xl">Available sessions</h2>
              </div>
              {slots.length === 0 ? (
                <p className="text-muted-foreground text-sm">No open slots right now. Send {name.split(' ')[0]} a message to arrange one.</p>
              ) : (
                <ul className="grid sm:grid-cols-2 gap-3">
                  {slots.map(s => (
                    <li key={s.id}>
                      <button
                        onClick={() => { if (requireAthlete()) setSelectedSlot(s); }}
                        className="w-full text-left border border-border p-4 hover:border-gold transition-colors"
                      >
                        <p className="font-medium">
                          {new Date(s.date + 'T00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                          <Clock className="h-3.5 w-3.5" /> {s.start_time.slice(0,5)} – {s.end_time.slice(0,5)}
                        </p>
                        <p className="text-sm text-gold mt-2">Request · €{finalPrice}</p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

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

              <Button size="lg" className="w-full mt-5" onClick={openMessage}>
                <MessageSquare className="h-4 w-4 mr-2" /> Message {name.split(' ')[0]}
              </Button>

              <div className="mt-5 flex items-start gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <p>All communication and bookings happen through Zenit. Do not share personal contact details.</p>
              </div>
            </div>
          </aside>
        </section>
      </main>

      <Dialog open={!!selectedSlot} onOpenChange={(o) => !o && setSelectedSlot(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request this session</DialogTitle>
            <DialogDescription>
              {selectedSlot && `${new Date(selectedSlot.date + 'T00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })} · ${selectedSlot.start_time.slice(0,5)} – ${selectedSlot.end_time.slice(0,5)} · €${finalPrice}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="note">Add a short note (optional)</Label>
            <Textarea id="note" rows={4} value={note} onChange={e => setNote(e.target.value)}
              placeholder="Level, goals, anything the coach should know…" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedSlot(null)}>Cancel</Button>
            <Button onClick={submitBooking} disabled={submitting}>
              {submitting ? 'Sending…' : 'Send request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PublicFooter />
    </div>
  );
};

export default CoachProfile;
