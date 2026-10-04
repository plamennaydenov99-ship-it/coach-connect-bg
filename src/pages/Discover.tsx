import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Bookmark, BadgeCheck, MessageSquare, MapPin, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { PublicNav } from '@/components/layout/PublicNav';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { FeaturedCoaches } from '@/components/home/FeaturedCoaches';
import { AutoScroll } from '@/components/discover/AutoScroll';
import { SpotRequestDialog, type RequestSession } from '@/components/discover/SpotRequestDialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useDiscover } from '@/hooks/useDiscover';
import { guardAthlete, messageOwner, toggleAthleteBookmark } from '@/lib/athleteActions';
import type { Database } from '@/integrations/supabase/types';

type Item = Database['public']['Tables']['trending_items']['Row'];
const cities = ['Sofia', 'Nice', 'Monaco'];
const panel = 'bg-portal-card border border-portal-border rounded-[4px] overflow-hidden motion-card';
const sectionTitle = 'font-display text-2xl uppercase text-portal-ink';

export default function Discover() {
  const { t, lang } = useLanguage();
  const { user, profile, loading, profileLoading } = useAuth();
  const navigate = useNavigate();
  const cache = useQueryClient();
  const { publicData, privateData } = useDiscover();
  const [city, setCity] = useState('all');
  const [cityChosen, setCityChosen] = useState(false);
  const [tab, setTab] = useState('trending');
  const [request, setRequest] = useState<RequestSession | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [requested, setRequested] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!cityChosen && profile?.role === 'athlete' && profile.city && cities.includes(profile.city)) setCity(profile.city);
  }, [profile, cityChosen]);
  useEffect(() => { setRequested(new Set(privateData.data?.requests.map(r => r.session_id) ?? [])); }, [privateData.data, user?.id]);
  const ctx = { userId: user?.id, role: profile?.role, navigate, signInText: t.coach_sign_in_required, athleteOnlyText: t.disc_only_athletes, unavailableText: t.disc_unavailable };
  const { items = [], sessions = [], coaches = [], clubs = [] } = publicData.data ?? {};
  const locale = lang === 'bg' ? 'bg-BG' : lang === 'fr' ? 'fr-FR' : 'en-GB';
  const saved = new Set(privateData.data?.bookmarks.map(b => `${b.target_type}:${b.target_id}`) ?? []);
  const matchesCity = (value: string | null | undefined) => city === 'all' || !value || value === city;
  const owner = (id: string | null) => {
    const club = clubs.find(c => c.id === id);
    const coach = coaches.find(c => c.id === id);
    return { name: club?.name || coach?.profiles?.full_name || t.disc_unknown_owner, city: club?.city || coach?.profiles?.city, club: !!club, verified: club?.verified || coach?.verified };
  };
  const visible = items.filter(i => {
    const session = i.session_id ? sessions.find(s => s.id === i.session_id) : null;
    if (i.type === 'session' && !session) return false;
    const itemCity = i.city || owner(session?.owner_id || i.owner_id).city;
    const isSaved = saved.has(`${i.type}:${i.type === 'session' ? i.session_id : i.id}`);
    return tab === 'for-you' ? matchesCity(itemCity) || isSaved : matchesCity(itemCity);
  });
  const sports = visible.filter(i => i.type === 'sport');
  const sessionItems = visible.filter(i => i.type === 'session');
  if (tab === 'for-you') {
    for (const session of sessions) {
      if (!session.id || !saved.has(`session:${session.id}`) || sessionItems.some(i => i.session_id === session.id)) continue;
      sessionItems.push({ id: session.id, type: 'session', session_id: session.id, owner_id: session.owner_id,
        title: session.title || t.group_type, blurb: null, sport: session.sport, city: null, image_url: null,
        starts_on: null, ends_on: null, rank: 0, active: true, sponsored: false, created_at: null });
    }
  }
  const events = visible.filter(i => i.type === 'event');
  const actionDisabled = loading || profileLoading || (!!user && profile?.role === 'athlete' && (privateData.isLoading || privateData.isError));
  const save = async (type: 'session' | 'event' | 'club', id: string) => {
    if (busy) return;
    setBusy(`${type}:${id}`);
    try {
      const next = await toggleAthleteBookmark(ctx, type, id, saved.has(`${type}:${id}`));
      if (next !== null) { await cache.invalidateQueries({ queryKey: ['discover', user?.id, 'saved-requests'] }); toast.success(next ? t.disc_save : t.disc_unsave); }
    } catch (error) { toast.error((error as { message?: string }).message || t.crm_error); }
    finally { setBusy(null); }
  };
  const saveButton = (type: 'session' | 'event' | 'club', id: string) => <Button variant="outline" size="sm" disabled={actionDisabled || !!busy} onClick={() => save(type, id)} aria-label={saved.has(`${type}:${id}`) ? t.disc_unsave : t.disc_save} className={saved.has(`${type}:${id}`) ? 'text-portal-blue bg-portal-selected' : ''}><Bookmark className={`h-4 w-4 ${saved.has(`${type}:${id}`) ? 'fill-current' : ''}`} /><span className="ml-1">{saved.has(`${type}:${id}`) ? t.disc_saved : t.disc_save}</span></Button>;
  const date = (iso: string, ownerCity?: string | null) => {
    const timeZone = ownerCity === 'Sofia' ? 'Europe/Sofia' : 'Europe/Paris';
    return `${new Date(iso).toLocaleString(locale, { timeZone, weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} · ${ownerCity === 'Sofia' ? 'Sofia' : 'Paris'}`;
  };
  const eventDate = (day: string | null) => day ? new Date(`${day}T12:00:00`).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const art = (item: Item) => item.image_url ? <img src={item.image_url} alt={item.title} className="aspect-[16/9] w-full object-cover" loading="lazy" /> : null;
  const eventCard = (item: Item) => <article key={item.id} className={panel}>
    {art(item)}<div className="p-5 space-y-3"><p className="text-xs text-portal-blue">{[eventDate(item.starts_on), eventDate(item.ends_on)].filter(Boolean).join(' – ')}{item.city && ` · ${item.city}`}</p><h3 className="font-display text-2xl">{item.title}</h3>{item.blurb && <p className="text-sm text-portal-muted">{item.blurb}</p>}<div className="flex flex-wrap gap-2">{item.owner_id && <Button size="sm" disabled={actionDisabled} onClick={() => messageOwner(ctx, item.owner_id || '')}><MessageSquare className="h-4 w-4 mr-1" />{t.disc_organiser}</Button>}{saveButton('event', item.id)}</div></div>
  </article>;
  const liveSessionCard = (item: Item) => {
    const session = sessions.find(s => s.id === item.session_id);
    if (!session?.id || !session.owner_id || !session.starts_at) return null;
    const id = session.id, ownerId = session.owner_id;
    const staff = owner(ownerId);
    const when = date(session.starts_at, staff.city || item.city);
    const isRequested = requested.has(id);
    const spots = session.spots_left ?? 0;
    return <article key={item.id} className={panel}>{art(item)}<div className="p-5 space-y-3">
      <div className="flex flex-wrap justify-between gap-2 text-xs"><span className="text-portal-blue">{when}</span><span className="font-semibold">{spots === 0 ? t.disc_full : spots === 1 ? t.disc_one_spot : t.tr_spots_left.replace('{n}', String(spots))}</span></div>
      <h3 className="font-display text-2xl">{session.title || item.title}</h3>
      <Link className="text-sm text-portal-blue hover:underline inline-flex items-center gap-1" to={`/${staff.club ? 'clubs' : 'coaches'}/${ownerId}`}>{staff.name}{staff.verified && <BadgeCheck className="h-4 w-4 text-gold" />}</Link>
      {session.led_by && <p className="text-sm text-portal-muted">{t.disc_led_by.replace('{name}', session.led_by)}</p>}
      {session.location && <p className="text-xs text-portal-muted flex items-center gap-1"><MapPin className="h-3 w-3" />{session.location}</p>}
      {item.blurb && <p className="text-sm text-portal-muted">{item.blurb}</p>}
      <div className="flex flex-wrap gap-2"><Button size="sm" disabled={actionDisabled || isRequested || spots <= 0} onClick={() => {
        if (guardAthlete(ctx)) setRequest({ id, ownerId, title: session.title || item.title, date: when, summary: `${session.title || item.title} · ${when}` });
      }}>{isRequested ? t.disc_requested : spots <= 0 ? t.disc_full : t.disc_request}</Button><Button variant="outline" size="sm" disabled={actionDisabled} onClick={() => messageOwner(ctx, ownerId)}><MessageSquare className="h-4 w-4 mr-1" />{t.disc_message}</Button>{saveButton('session', id)}</div>
    </div></article>;
  };
  const content = <div className="space-y-10">
    {visible.length > 0 && <AutoScroll label={t.disc_trending} ticker>{visible.map(i => <span key={i.id} className="shrink-0 font-display text-lg text-portal-blue border-r border-portal-border pr-4">{i.title}</span>)}</AutoScroll>}
    {sports.length > 0 && <section className="space-y-4"><h2 className={sectionTitle}>{t.disc_sports}</h2><AutoScroll label={t.disc_sports}>{sports.map(i => <article key={i.id} className={`${panel} shrink-0 snap-start w-[270px] sm:w-[300px]`}>{art(i)}<div className="p-5"><h3 className="font-display text-2xl">{i.title}</h3>{i.blurb && <p className="mt-2 text-sm text-portal-muted">{i.blurb}</p>}<Button variant="link" asChild className="px-0 text-portal-blue"><Link to={`/search${i.sport ? `?sport=${encodeURIComponent(i.sport)}` : ''}`}>{t.disc_find_coach}<ArrowRight className="ml-1 h-4 w-4" /></Link></Button></div></article>)}</AutoScroll></section>}
    {sessionItems.length > 0 && <section className="space-y-4"><h2 className={sectionTitle}>{t.disc_sessions}</h2><div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{sessionItems.map(liveSessionCard)}</div></section>}
    {events.length > 0 && <section className="space-y-4"><h2 className={sectionTitle}>{t.disc_events_camps}</h2><div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{events.map(eventCard)}</div></section>}
    {tab === 'for-you' && privateData.data && <section className="space-y-3"><h2 className={sectionTitle}>{t.disc_saved_items}</h2><div className="flex flex-wrap gap-3">{privateData.data.bookmarks.filter(b => b.target_type === 'club' || b.target_type === 'coach').map(b => <Link key={`${b.target_type}:${b.target_id}`} className="text-portal-blue hover:underline" to={`/${b.target_type === 'club' ? 'clubs' : 'coaches'}/${b.target_id}`}>{owner(b.target_id).name}</Link>)}</div></section>}
    {!visible.length && !sessionItems.length && <p className="text-portal-muted py-8">{tab === 'for-you' ? t.disc_for_you_empty : t.disc_empty}</p>}
  </div>;
  return <div className="coach-portal min-h-screen bg-portal-bg text-portal-ink">
    <PublicNav /><main className="container py-8 md:py-12 space-y-6">
      <header className="space-y-4"><h1 className="font-display uppercase text-4xl md:text-5xl break-words">{t.disc_heading.replace('{city}', city === 'all' ? t.disc_all : city)}</h1><p className="text-portal-muted">{t.disc_sub}</p><div className="flex flex-wrap gap-2" role="group" aria-label={t.tr_city}>{['all', ...cities].map(c => <Button key={c} size="sm" variant="outline" aria-pressed={city === c} onClick={() => { setCity(c); setCityChosen(true); }} className={city === c ? 'bg-portal-selected border-portal-selected-border text-portal-blue' : ''}>{c === 'all' ? t.disc_all : c}</Button>)}</div></header>
      <Tabs value={tab} onValueChange={setTab}><TabsList className="flex justify-start overflow-x-auto w-full h-auto bg-transparent border-b border-portal-border rounded-none p-0 gap-2">{[['for-you', t.disc_for_you], ['trending', t.disc_trending], ['coaches', t.disc_coaches], ['clubs', t.disc_clubs], ['events', t.disc_events]].map(([value, label]) => <TabsTrigger key={value} value={value} className="shrink-0 px-4 py-3 rounded-none data-[state=active]:bg-portal-selected data-[state=active]:text-portal-blue data-[state=active]:shadow-none">{label}</TabsTrigger>)}</TabsList>
        {publicData.isLoading ? <div className="grid md:grid-cols-3 gap-4 py-8">{[1, 2, 3].map(i => <Skeleton key={i} className="h-72" />)}</div> : publicData.isError ? <div className="py-8 space-y-3"><p>{t.crm_error}</p><Button variant="outline" onClick={() => publicData.refetch()}>{t.disc_retry}</Button></div> : <>
          <TabsContent value="trending" className="mt-8">{content}</TabsContent><TabsContent value="for-you" className="mt-8">{content}{privateData.isError && <p className="text-portal-muted">{t.crm_error}</p>}</TabsContent>
          <TabsContent value="coaches" className="mt-8"><FeaturedCoaches discover={<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{coaches.filter(c => matchesCity(c.profiles?.city)).map(c => <Link key={c.id} to={`/coaches/${c.id}`} className={panel}>{c.profiles?.avatar_url && <img src={c.profiles.avatar_url} alt={c.profiles.full_name || ''} className="w-full aspect-[4/3] object-cover" />}<div className="p-5"><h3 className="font-display text-2xl flex items-center gap-2">{c.profiles?.full_name}{c.verified && <BadgeCheck className="h-4 w-4 text-gold" />}</h3><p className="text-sm text-portal-muted">{c.sport} · {c.profiles?.city}</p></div></Link>)}</div>} /><Button variant="link" asChild className="text-portal-blue"><Link to="/search">{t.disc_find_coach} →</Link></Button></TabsContent>
          <TabsContent value="clubs" className="mt-8"><div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{clubs.filter(c => matchesCity(c.city)).map(c => <article key={c.id} className={panel}>{c.profiles?.avatar_url && <img src={c.profiles.avatar_url} alt={c.name} className="w-full aspect-[16/9] object-cover" />}<div className="p-5 space-y-3"><Link to={`/clubs/${c.id}`} className="font-display text-2xl text-portal-blue flex items-center gap-2">{c.name}{c.verified && <BadgeCheck className="h-4 w-4 text-gold" />}</Link><p className="text-sm text-portal-muted">{c.sport} · {c.city}</p><div className="flex flex-wrap gap-2"><Button size="sm" disabled={actionDisabled} onClick={() => messageOwner(ctx, c.id)}>{t.disc_message}</Button>{saveButton('club', c.id)}</div></div></article>)}</div>{!clubs.filter(c => matchesCity(c.city)).length && <p className="text-portal-muted py-8">{t.disc_empty}</p>}</TabsContent>
          <TabsContent value="events" className="mt-8"><div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{events.map(eventCard)}</div><Button variant="link" asChild className="text-portal-blue"><Link to="/events">{t.disc_all_events} →</Link></Button></TabsContent>
        </>}
      </Tabs>
    </main><PublicFooter />{request && <SpotRequestDialog key={request.id} session={request} ctx={ctx} onClose={() => setRequest(null)} onRequested={id => { setRequested(prev => new Set([...prev, id])); cache.invalidateQueries({ queryKey: ['discover', user?.id, 'saved-requests'] }); }} />}
  </div>;
}
