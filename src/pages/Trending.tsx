import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, BadgeCheck } from 'lucide-react';
import { toast } from 'sonner';
import { PublicNav } from '@/components/layout/PublicNav';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { ChartRow, PromoRow, type RowAction } from '@/components/trending/ChartRow';
import { chipsFor } from '@/components/trending/chips';
import { SpotRequestDialog, type RequestSession } from '@/components/discover/SpotRequestDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { claimWaitlist, joinWaitlist, useCityCoaches, useMyWaitlist, useTrending } from '@/hooks/useTrending';
import { guardAthlete, messageOwner, toggleAthleteBookmark } from '@/lib/athleteActions';
import { supabase } from '@/integrations/supabase/client';
import { CITIES, DEFAULT_CITY, cityLabel, countdown, localeOf, sportLabel, track, whenLabel, type TrendLite, type TrendPromo, type TrendRow } from '@/lib/trending';

type Period = 'tonight' | 'weekend' | 'week';
type Kind = 'all' | 'session' | 'event';

const chip = 'h-11 px-4 text-base font-medium transition-colors';

export default function Trending() {
  const { t, lang } = useLanguage();
  const { user, profile, loading, profileLoading } = useAuth();
  const navigate = useNavigate();
  const cache = useQueryClient();
  const [params] = useSearchParams();
  const sample = params.get('sample') === '1';
  const [city, setCity] = useState<string>(DEFAULT_CITY);
  const cityName = cityLabel(city, lang);
  const [period, setPeriod] = useState<Period>('week');
  const [kind, setKind] = useState<Kind>('all');
  const [sport, setSport] = useState('all');
  const [open, setOpen] = useState<string | null>(null);
  const [request, setRequest] = useState<RequestSession | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const { data, isLoading, isError, refetch } = useTrending(city, sport, kind, period, sample);
  const waitlist = useMyWaitlist();

  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);

  const uid = user?.id;
  const athlete = profile?.role === 'athlete';
  const saves = useQuery({
    queryKey: ['trending', uid, 'saves'],
    enabled: !!uid && athlete,
    queryFn: async () => {
      const r = await supabase.from('bookmarks').select('target_type, target_id').eq('athlete_id', uid as string);
      if (r.error) throw r.error;
      return new Set((r.data ?? []).map(b => `${b.target_type}:${b.target_id}`));
    },
  });
  const requested = useQuery({
    queryKey: ['trending', uid, 'requests'],
    enabled: !!uid && athlete,
    queryFn: async () => {
      const r = await supabase.from('spot_requests').select('session_id').eq('athlete_id', uid as string);
      if (r.error) throw r.error;
      return new Set((r.data ?? []).map(x => x.session_id));
    },
  });
  const coaches = useCityCoaches(city, 4);

  const ctx = { userId: uid, role: profile?.role, navigate, signInText: t.coach_sign_in_required, athleteOnlyText: t.disc_only_athletes, unavailableText: t.disc_unavailable };
  const actionsLocked = loading || profileLoading || (!!uid && athlete && (saves.isLoading || requested.isLoading));
  const labels = { today: t.tn_today, tomorrow: t.tn_tomorrow };
  const rows = useMemo(() => (kind === 'event' ? [] : data?.rows ?? []), [data, kind]);
  const comingAll = useMemo(() => (kind === 'event' ? [] : data?.coming ?? []), [data, kind]);
  const promoted = useMemo(() => (kind === 'event' ? [] : data?.promoted ?? []), [data, kind]);
  const events = kind === 'session' ? [] : data?.events ?? [];
  const hot = data?.mode === 'hot';
  const top = rows[0];
  const soon = data?.soon ?? [];
  const onList = new Set((waitlist.data ?? []).map(w => w.session_id));
  const offer = (waitlist.data ?? []).find(w => w.status === 'offered');

  // Paid places are counted as seen once they are on screen.
  useEffect(() => { for (const p of data?.promoted ?? []) track('impression', 'campaign', p.campaign_id, p.campaign_id); if (data?.pick) track('impression', 'campaign', data.pick.campaign_id, data.pick.campaign_id); }, [data]);

  const isSaved = (id: string) => saves.data?.has(`session:${id}`) ?? false;
  const save = async (id: string) => {
    if (busy || sample) return;
    setBusy(id);
    try {
      const next = await toggleAthleteBookmark(ctx, 'session', id, isSaved(id));
      if (next !== null) { await cache.invalidateQueries({ queryKey: ['trending'] }); toast.success(next ? t.disc_save : t.disc_unsave); }
    } catch (e) { toast.error((e as { message?: string }).message || t.crm_error); }
    finally { setBusy(null); }
  };
  const ask = (item: { id: string; host_id: string; title: string; starts_at: string }, promo?: TrendPromo) => {
    if (sample) { toast.info(t.tn_sample_note); return; }
    if (promo) track('click', 'campaign', promo.campaign_id, promo.campaign_id);
    if (!guardAthlete(ctx)) return;
    const when = whenLabel(item.starts_at, lang, labels);
    setRequest({ id: item.id, ownerId: item.host_id, title: item.title, date: when, summary: `${item.title} · ${when}` });
  };
  const joinList = async (id: string) => {
    if (sample) { toast.info(t.tn_sample_note); return; }
    if (!guardAthlete(ctx)) return;
    try { const pos = await joinWaitlist(id); toast.success(t.tn_waitlist_joined.replace('{n}', String(pos))); await cache.invalidateQueries({ queryKey: ['waitlist'] }); }
    catch (e) { toast.error((e as { message?: string }).message || t.crm_error); }
  };
  const actionFor = (id: string, hostId: string, title: string, startsAt: string, left: number, promo?: TrendPromo): RowAction => {
    if (left <= 0) return onList.has(id) ? { id, label: t.tn_on_waitlist, disabled: true, onClick: () => {} } : { id, label: t.tn_join_waitlist, onClick: () => joinList(id) };
    if (requested.data?.has(id)) return { id, label: t.disc_requested, disabled: true, onClick: () => {} };
    return { id, label: t.disc_request, disabled: actionsLocked && !sample, onClick: () => ask({ id, host_id: hostId, title, starts_at: startsAt }, promo) };
  };

  // Promoted rows take fixed places (3rd and 7th), and only when there are enough earned rows around them.
  const stream = useMemo(() => {
    const out: ({ type: 'row'; row: TrendRow } | { type: 'promo'; promo: TrendPromo })[] = rows.map(row => ({ type: 'row' as const, row }));
    const count = Math.min(promoted.length, Math.floor(rows.length / 3));
    promoted.slice(0, count).forEach((p, i) => out.splice(Math.min(i === 0 ? 2 : 6, out.length), 0, { type: 'promo', promo: p }));
    return out;
  }, [rows, promoted]);

  const filling = rows.filter(r => r.spots_left > 0 && (r.capacity - r.spots_left) / r.capacity >= 0.6).length;
  const savesToday = rows.reduce((n, r) => n + r.save24, 0);
  const upcoming = rows.length + comingAll.length;
  const pulse = hot
    ? t.tn_pulse_hot.replace('{a}', String(filling)).replace('{b}', String(soon.length)).replace('{c}', String(savesToday))
    : upcoming > 0 ? t.tn_pulse_cold.replace('{n}', String(upcoming)) : t.tn_pulse_empty;
  const sportKeys = useMemo(() => Array.from(new Set(data?.sports ?? [])).sort(), [data]);
  const periods: [Period, string][] = [['tonight', t.tn_period_tonight], ['weekend', t.tn_period_weekend], ['week', t.tn_period_week]];
  const kinds: [Kind, string][] = [['all', t.tn_kind_all], ['session', t.tn_kind_sessions], ['event', t.tn_kind_events]];
  const empty = !hot && upcoming === 0 ? t.tn_pulse_empty : period === 'tonight' ? t.tn_empty_tonight : period === 'weekend' ? t.tn_empty_weekend : t.tn_empty_week;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section className="relative h-[620px] overflow-hidden bg-foreground text-[#F3EDE2] md:h-[740px]">
        <img src="/images/sofia-cathedral.jpg" alt={t.tn_hero_alt} className="absolute inset-0 h-full w-full animate-[kb_34s_ease-in-out_infinite_alternate] object-cover" />
        <div className="absolute inset-0 bg-foreground/45" />
        <PublicNav variant="overlay" />
        <div className="container absolute inset-x-0 bottom-0 pb-10 md:pb-14">
          <h1 className="font-display font-extrabold uppercase leading-[0.88] text-[#F3EDE2]" style={{ fontSize: 'clamp(72px, 13vw, 200px)', color: '#F3EDE2' }}>
            <span className="block text-[0.5em] leading-none">{t.tn_hot_in}</span>
            {CITIES.length > 1 ? (
              <span className="flex flex-wrap gap-x-10" role="group" aria-label={t.tr_city}>
                {CITIES.map(c => <button key={c} type="button" aria-pressed={city === c} onClick={() => setCity(c)} className={`transition-opacity ${city === c ? 'opacity-100' : 'opacity-35 hover:opacity-70'}`}>{cityLabel(c, lang)}</button>)}
              </span>
            ) : <span className="block">{cityName}</span>}
          </h1>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-5">
            <div className="flex flex-wrap gap-1.5" role="group" aria-label={t.tn_when}>
              {periods.map(([k, label]) => <button key={k} type="button" aria-pressed={period === k} onClick={() => { setPeriod(k); setOpen(null); }} className={`${chip} ${period === k ? 'bg-[#F3EDE2] text-foreground' : 'bg-[#F3EDE2]/15 text-[#F3EDE2] hover:bg-[#F3EDE2]/28'}`}>{label}</button>)}
            </div>
            <p className="flex items-center gap-3 text-base" aria-live="polite"><span className="h-3 w-3 shrink-0 animate-pulse rounded-full bg-[#E5BE86]" aria-hidden="true" />{pulse}</p>
          </div>
        </div>
      </section>

      {sample && <p className="bg-accent px-4 py-2 text-center text-sm font-semibold text-white">{t.tn_sample_banner}</p>}

      {isError && (
        <div className="container py-16"><p className="text-xl">{t.tn_error}</p><button type="button" onClick={() => refetch()} className="mt-4 h-11 bg-primary px-6 font-display text-base font-bold uppercase text-primary-foreground">{t.disc_retry}</button></div>
      )}
      {isLoading && <div className="container grid gap-4 py-16 md:grid-cols-3"><Skeleton className="h-72" /><Skeleton className="h-72" /><Skeleton className="h-72" /></div>}

      {data && (
        <>
          {/* Number one and starting soon */}
          <section className="bg-background-secondary py-14 md:py-20" aria-label={t.tn_starting_soon}>
            <div className="container grid gap-8 lg:grid-cols-12">
              <div className="lg:col-span-7">
                {top ? (
                  <article className="relative flex min-h-[480px] flex-col justify-end overflow-hidden bg-foreground p-6 text-[#F3EDE2] md:min-h-[600px] md:p-9">
                    <img src="/images/sofia-borisova.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-foreground/55" />
                    <span aria-hidden="true" className="absolute right-6 top-0 font-display text-[200px] font-extrabold leading-[0.82] text-[#F3EDE2] md:text-[300px]">1</span>
                    <div className="relative">
                      <h2 className="max-w-[11ch] font-display font-extrabold uppercase leading-[0.9] text-[#F3EDE2]" style={{ fontSize: 'clamp(44px, 5.4vw, 88px)', color: '#F3EDE2' }}>{top.title}</h2>
                      <p className="mb-4 mt-3 text-lg">{t.tn_number_one.replace('{city}', cityName)} {whenLabel(top.starts_at, lang, labels)} · {top.host}</p>
                      <div className="mb-5 flex flex-wrap gap-1.5">{chipsFor(top, t).map(c => <span key={c.label} className={`inline-flex h-7 items-center px-2.5 text-sm font-semibold ${c.hot ? 'bg-accent text-white' : 'bg-[#F3EDE2] text-foreground'}`}>{c.label}</span>)}</div>
                      <div className="flex flex-wrap items-center gap-5">
                        <div className="w-60"><div className="h-2.5 bg-[#F3EDE2]/35"><div className="h-full bg-[#F3EDE2]" style={{ width: `${Math.round((100 * (top.capacity - top.spots_left)) / top.capacity)}%` }} /></div><p className="mt-1.5 text-sm tabular-nums">{top.spots_left === 0 ? t.tn_full : t.tn_spots_of.replace('{left}', String(top.spots_left)).replace('{cap}', String(top.capacity))}</p></div>
                        <button type="button" onClick={() => (top.spots_left > 0 ? ask(top) : joinList(top.id))} className="inline-flex h-14 items-center gap-3 bg-[#F3EDE2] px-7 font-display text-lg font-bold uppercase text-foreground transition-colors hover:bg-white">{top.spots_left > 0 ? t.disc_request : t.tn_join_waitlist}<ArrowRight className="h-5 w-5" /></button>
                      </div>
                    </div>
                  </article>
                ) : (
                  <article className="flex min-h-[420px] flex-col justify-between bg-primary p-8 text-primary-foreground md:min-h-[600px] md:p-10">
                    <h2 className="max-w-[12ch] font-display text-5xl font-extrabold uppercase leading-[0.9] md:text-7xl" style={{ color: 'inherit' }}>{t.tn_opening_title.replace('{city}', cityName)}</h2>
                    <div>
                      <p className="max-w-[38ch] text-xl">{t.tn_opening_body}</p>
                      <div className="mt-8 flex flex-wrap gap-3">
                        <Link to="/search" className="inline-flex h-14 items-center gap-3 bg-[#F3EDE2] px-7 font-display text-lg font-bold uppercase text-foreground hover:bg-white">{t.footer_find_coach}<ArrowRight className="h-5 w-5" /></Link>
                        <Link to="/for-coaches" className="inline-flex h-14 items-center px-7 font-display text-lg font-bold uppercase text-primary-foreground ring-2 ring-primary-foreground/50 hover:ring-primary-foreground">{t.tn_for_coaches_cta}</Link>
                      </div>
                    </div>
                  </article>
                )}
              </div>
              <div className="flex flex-col gap-2 lg:col-span-5">
                <h2 className="mb-3 text-4xl md:text-5xl">{t.tn_starting_soon}</h2>
                {soon.length === 0 && <p className="bg-background p-5 text-lg">{t.tn_no_soon}</p>}
                {soon.map((s: TrendLite) => (
                  <article key={s.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 bg-foreground p-5 text-[#F3EDE2] transition-transform duration-300 hover:-translate-x-2">
                    <div className="min-w-0">
                      <p className="text-sm text-[#F3EDE2]/80">{sportLabel(s.sport, lang)}{s.location ? ` · ${s.location}` : ''}</p>
                      <p className="mt-1 text-xl font-semibold leading-tight">{s.title}</p>
                      <p className="mt-0.5 text-sm text-[#F3EDE2]/85">{s.host} · {t.tn_spots_of.replace('{left}', String(s.spots_left)).replace('{cap}', String(s.capacity))}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-5xl font-extrabold leading-[0.85] tabular-nums" style={{ color: '#F3EDE2' }}>{countdown(s.starts_at, now)}</p>
                      <p className="mb-2.5 mt-1.5 text-sm text-[#F3EDE2]/80">{Date.parse(s.starts_at) <= now ? t.tn_under_way : t.tn_until_start}</p>
                      <button type="button" onClick={() => ask({ id: s.id, host_id: s.host_id, title: s.title, starts_at: s.starts_at })} className="h-10 bg-[#F3EDE2] px-4 font-display text-sm font-bold uppercase text-foreground hover:bg-white">{t.disc_request}</button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          {/* The chart */}
          {kind !== 'event' && (
            <section className="container py-16 md:py-24" id="chart" aria-labelledby="h-chart">
              <div className="grid items-end gap-6 md:grid-cols-12">
                <h2 id="h-chart" className="max-w-[16ch] text-4xl md:col-span-7 md:text-6xl">{(hot ? t.tn_chart_hot : t.tn_chart_cold).replace('{city}', cityName)}</h2>
                <p className="max-w-[44ch] text-base md:col-span-5 md:col-start-8">{hot ? t.tn_chart_note_hot : t.tn_chart_note_cold}</p>
              </div>
              <div className="my-8 flex flex-wrap gap-x-7 gap-y-3" role="group" aria-label={t.tn_filter}>
                <div className="flex flex-wrap gap-1.5">{kinds.map(([k, label]) => <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)} className={`${chip} ${kind === k ? 'bg-foreground text-background' : 'bg-background-secondary hover:bg-background-tertiary'}`}>{label}</button>)}</div>
                <div className="flex flex-wrap gap-1.5">
                  {['all', ...sportKeys].map(k => <button key={k} type="button" aria-pressed={sport === k} onClick={() => { setSport(k); setOpen(null); }} className={`${chip} ${sport === k ? 'bg-foreground text-background' : 'bg-background-secondary hover:bg-background-tertiary'}`}>{k === 'all' ? t.tn_sport_all : sportLabel(k, lang)}</button>)}
                </div>
              </div>

              {offer && offer.offered_until && (
                <div className="mb-3 flex flex-wrap items-center justify-between gap-4 bg-accent p-5 text-white" role="status">
                  <p className="text-lg font-semibold">{t.tn_offer_banner.replace('{title}', offer.title ?? '').replace('{time}', new Intl.DateTimeFormat(localeOf(lang), { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Sofia' }).format(new Date(offer.offered_until)))}</p>
                  {offer.owner_id && offer.starts_at && <button type="button" onClick={() => { if (!guardAthlete(ctx)) return; const when = whenLabel(offer.starts_at as string, lang, labels); setRequest({ id: offer.session_id, ownerId: offer.owner_id as string, title: offer.title ?? '', date: when, summary: `${offer.title} · ${when}` }); }} className="h-11 bg-[#F3EDE2] px-5 font-display text-base font-bold uppercase text-foreground">{t.tn_offer_cta}</button>}
                </div>
              )}

              {stream.length === 0 && <p className="bg-background-secondary p-7 text-xl">{empty}</p>}
              <div className="flex flex-col gap-2" aria-live="polite">
                {stream.map(item => item.type === 'row' ? (
                  <ChartRow key={item.row.id} row={item.row} open={open === item.row.id} onToggle={() => setOpen(open === item.row.id ? null : item.row.id)}
                    saved={isSaved(item.row.id)} onSave={() => save(item.row.id)} saveBusy={busy === item.row.id}
                    action={actionFor(item.row.id, item.row.host_id, item.row.title, item.row.starts_at, item.row.spots_left)} />
                ) : (
                  <PromoRow key={item.promo.campaign_id} promo={item.promo} city={cityName} open={open === item.promo.campaign_id} onToggle={() => setOpen(open === item.promo.campaign_id ? null : item.promo.campaign_id)}
                    saved={isSaved(item.promo.id)} onSave={() => save(item.promo.id)} saveBusy={busy === item.promo.id}
                    action={actionFor(item.promo.id, item.promo.host_id, item.promo.title, item.promo.starts_at, item.promo.spots_left, item.promo)} />
                ))}
              </div>

              {comingAll.length > 0 && (
                <div className="mt-12">
                  <h3 className="mb-3 text-3xl md:text-4xl">{t.tn_coming_up}</h3>
                  <div className="flex flex-col gap-2">
                    {comingAll.map(c => {
                      const parts = whenLabel(c.starts_at, lang, labels).split(' ');
                      return (
                        <article key={c.id} className="grid grid-cols-[88px_minmax(0,1fr)] items-center gap-x-5 gap-y-2 px-4 py-4 transition-colors hover:bg-background-secondary md:grid-cols-[130px_minmax(0,1fr)_190px_auto] md:px-6">
                          <div><p className="font-display text-3xl font-extrabold leading-none tabular-nums">{parts[parts.length - 1]}</p><p className="mt-1 text-sm text-foreground-muted">{parts.slice(0, -1).join(' ')}</p></div>
                          <div className="min-w-0"><p className="truncate text-lg font-semibold">{c.title}</p><p className="truncate text-sm text-foreground-muted">{c.host}{c.location ? ` · ${c.location}` : ''}</p></div>
                          <p className="col-span-2 text-sm tabular-nums md:col-span-1">{c.spots_left === 0 ? t.tn_full : t.tn_spots_of.replace('{left}', String(c.spots_left)).replace('{cap}', String(c.capacity))}</p>
                          <button type="button" disabled={actionsLocked && !sample} onClick={() => (c.spots_left > 0 ? ask({ id: c.id, host_id: c.host_id, title: c.title, starts_at: c.starts_at }) : joinList(c.id))} className="col-span-2 h-10 bg-primary px-4 font-display text-sm font-bold uppercase text-primary-foreground hover:bg-primary-hover disabled:opacity-50 md:col-span-1">{c.spots_left > 0 ? t.disc_request : t.tn_join_waitlist}</button>
                        </article>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Picked by Lokka: events and popular sports */}
          {(events.length > 0 || (kind !== 'session' && (data.sport_tiles?.length ?? 0) > 0)) && (
            <section className="bg-background-secondary py-16 md:py-20" aria-labelledby="h-picks">
              <div className="container">
                <h2 id="h-picks" className="max-w-[16ch] text-4xl md:text-6xl">{t.tn_picks_title}</h2>
                {events.length > 0 && (
                  <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {events.map(e => (
                      <article key={e.id} className="flex flex-col bg-background transition-transform duration-500 hover:-translate-y-2">
                        {e.image_url && <img src={e.image_url} alt={e.title} loading="lazy" className="aspect-[16/9] w-full object-cover" />}
                        <div className="flex flex-1 flex-col gap-3 p-6">
                          {(e.starts_on || e.ends_on) && <p className="text-sm font-semibold text-primary">{[e.starts_on, e.ends_on].filter(Boolean).map(d => new Intl.DateTimeFormat(localeOf(lang), { day: 'numeric', month: 'short' }).format(new Date(`${d}T12:00:00`))).join(' – ')}</p>}
                          <h3 className="t-plain text-2xl">{e.title}</h3>
                          {e.blurb && <p className="text-base text-foreground-muted">{e.blurb}</p>}
                          {e.owner_id && <button type="button" onClick={() => messageOwner(ctx, e.owner_id as string)} className="mt-auto h-11 self-start bg-primary px-5 font-display text-base font-bold uppercase text-primary-foreground hover:bg-primary-hover">{t.disc_organiser}</button>}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
                {kind !== 'session' && (data.sport_tiles?.length ?? 0) > 0 && (
                  <div className="mt-8 grid gap-4 md:grid-cols-3">
                    {data.sport_tiles.map(s => (
                      <Link key={s.id} to={`/search${s.sport ? `?sport=${encodeURIComponent(s.sport)}` : ''}`} className="group flex min-h-[200px] flex-col justify-between bg-foreground p-6 text-[#F3EDE2] transition-colors hover:bg-primary">
                        <h3 className="font-display text-5xl font-extrabold uppercase leading-[0.9]" style={{ color: '#F3EDE2' }}>{s.title}</h3>
                        <div>{s.blurb && <p className="mb-3 text-base text-[#F3EDE2]/85">{s.blurb}</p>}<span className="inline-flex items-center gap-2 text-base font-semibold">{t.disc_find_coach}<ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1.5" /></span></div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Coaches */}
          <section className="container py-16 md:py-24" aria-labelledby="h-coaches">
            <div className="grid items-end gap-6 md:grid-cols-12"><h2 id="h-coaches" className="max-w-[14ch] text-4xl md:col-span-7 md:text-6xl">{t.tn_coaches_title.replace('{city}', cityName)}</h2><p className="max-w-[44ch] text-base md:col-span-5 md:col-start-8">{t.tn_coaches_sub}</p></div>
            {coaches.data && coaches.data.length === 0 && <p className="mt-8 bg-background-secondary p-7 text-xl">{t.tn_no_coaches}</p>}
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {(coaches.data ?? []).map(c => (
                <Link key={c.id} to={`/coaches/${c.id}`} className="group flex flex-col gap-4 bg-background-secondary p-6 transition-transform duration-500 hover:-translate-y-2">
                  <div className="flex items-center gap-4">
                    {c.profiles?.avatar_url ? <img src={c.profiles.avatar_url} alt="" className="h-14 w-14 rounded-full object-cover" /> : <span className="grid h-14 w-14 place-items-center rounded-full bg-primary font-display text-2xl font-bold text-primary-foreground">{(c.profiles?.full_name ?? '?')[0]}</span>}
                    <div className="min-w-0"><p className="flex items-center gap-1.5 text-lg font-semibold leading-tight">{c.profiles?.full_name}{c.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-primary" aria-label={t.tn_verified} />}</p><p className="text-sm text-foreground-muted">{sportLabel(c.sport, lang)} · {cityName}</p></div>
                  </div>
                  <span className="inline-flex items-center gap-2 text-base font-semibold text-primary">{t.tn_see_profile}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1.5" /></span>
                </Link>
              ))}
            </div>
          </section>

          {/* Presenting place */}
          {data.pick && (
            <section className="grid bg-primary text-primary-foreground lg:grid-cols-[1.15fr_1fr]" aria-label={t.tn_promoted}>
              <div className="relative min-h-[320px] overflow-hidden"><img src="/images/sofia-borisova.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" /></div>
              <div className="flex flex-col justify-between gap-8 p-8 md:p-14">
                <div>
                  <span className="inline-flex h-7 items-center bg-[#F3EDE2] px-3 text-sm font-bold text-foreground">{t.tn_promoted}</span>
                  <h2 className="mt-7 max-w-[11ch] font-display font-extrabold uppercase leading-[0.9]" style={{ fontSize: 'clamp(44px, 5vw, 80px)', color: 'inherit' }}>{data.pick.title}</h2>
                  {data.pick.headline && <p className="mt-5 max-w-[30ch] text-xl">{data.pick.headline}</p>}
                </div>
                <div>
                  <button type="button" onClick={() => data.pick && ask({ id: data.pick.id, host_id: data.pick.host_id, title: data.pick.title, starts_at: data.pick.starts_at }, data.pick)} className="inline-flex h-14 items-center gap-3 bg-[#F3EDE2] px-7 font-display text-lg font-bold uppercase text-foreground hover:bg-white">{t.disc_request}<ArrowRight className="h-5 w-5" /></button>
                  <p className="mt-5 max-w-[60ch] text-sm text-primary-foreground/90">{t.tn_sponsor_by.replace('{host}', data.pick.host).replace('{city}', cityName)}</p>
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {/* For coaches and clubs */}
      <section className="bg-foreground py-20 text-[#F3EDE2] md:py-28" aria-labelledby="h-adv">
        <div className="container grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <h2 id="h-adv" className="max-w-[12ch] font-display font-extrabold uppercase leading-[0.9]" style={{ fontSize: 'clamp(40px, 4.6vw, 68px)', color: '#F3EDE2' }}>{t.tn_adv_title.replace('{city}', cityName)}</h2>
            <p className="mb-9 mt-6 max-w-[34ch] text-xl">{t.tn_adv_sub}</p>
            <Link to={profile?.role === 'coach' || profile?.role === 'club' ? `/${profile.role}/boost` : '/for-coaches'} className="inline-flex h-14 items-center gap-3 bg-[#F3EDE2] px-7 font-display text-lg font-bold uppercase text-foreground hover:bg-white">{t.tn_adv_cta}<ArrowRight className="h-5 w-5" /></Link>
          </div>
          <dl className="lg:col-span-5 lg:col-start-8">
            {[[t.tn_adv_row, t.tn_adv_row_p], [t.tn_adv_pick, t.tn_adv_pick_p]].map(([a, b]) => (
              <div key={a} className="flex items-baseline justify-between gap-6 py-5"><dt className="font-display text-4xl font-extrabold uppercase" style={{ color: '#F3EDE2' }}>{a}</dt><dd className="text-xl">{b}</dd></div>
            ))}
            <p className="pt-3 text-sm text-[#F3EDE2]/75">{t.tn_adv_note}</p>
          </dl>
        </div>
      </section>

      <PublicFooter />
      {request && <SpotRequestDialog key={request.id} session={request} ctx={ctx} onClose={() => setRequest(null)} onRequested={id => { void claimWaitlist(id); cache.invalidateQueries({ queryKey: ['trending'] }); cache.invalidateQueries({ queryKey: ['waitlist'] }); }} />}
    </div>
  );
}
