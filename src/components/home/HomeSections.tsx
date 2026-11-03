import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { PublicNav } from '@/components/layout/PublicNav';
import { useLanguage } from '@/context/LanguageContext';
import { useCityCoaches, useTrending } from '@/hooks/useTrending';
import { useUpcomingEvents } from '@/hooks/useEvents';
import { useClubs } from '@/hooks/useClubs';
import { posterDate } from '@/lib/events';
import { DEFAULT_CITY, cityLabel, sportLabel, whenLabel } from '@/lib/trending';
import { Picture } from '@/components/Picture';

type Kind = 'coach' | 'event' | 'camp' | 'club';
const SPORTS = ['all', 'padel', 'tennis', 'yoga', 'football', 'boxing', 'running'];
const pill = 'h-11 px-4 text-base font-medium transition-colors';
const pillOn = 'bg-[#F3EDE2] text-foreground';
const pillOff = 'bg-[#F3EDE2]/15 text-[#F3EDE2] hover:bg-[#F3EDE2]/28';

type Result = { key: string; title: string; sub: string; cta: string; to: string };

function SentenceView({ template, kind, sport, city }: { template: string; kind: string; sport: string; city: string }) {
  const parts = template.split(/(\{kind\}|\{sport\}|\{city\})/);
  return (
    <>
      {parts.map((p, i) => p === '{kind}' ? <u key={i} className="underline decoration-[0.07em] underline-offset-[0.09em]">{kind}</u>
        : p === '{sport}' ? <u key={i} className="underline decoration-[0.07em] underline-offset-[0.09em]">{sport}</u>
        : p === '{city}' ? <u key={i} className="underline decoration-[0.07em] underline-offset-[0.09em]">{city}</u> : <span key={i}>{p}</span>)}
    </>
  );
}

/** The first screen: say what you want, and the answers appear beside it. */
export function Concierge() {
  const { t, lang } = useLanguage();
  const [kind, setKind] = useState<Kind>('coach');
  const [sport, setSport] = useState('all');
  const city = DEFAULT_CITY;
  const cityName = cityLabel(city, lang);
  const coaches = useCityCoaches(city, 12);
  const trending = useTrending(city, sport, 'all', 'week', false);
  const events = useUpcomingEvents();
  const clubs = useClubs();

  const results: Result[] = useMemo(() => {
    const okSport = (s?: string | null) => sport === 'all' || (s ?? '').toLowerCase().includes(sport);
    if (kind === 'coach') {
      return (coaches.data ?? []).filter(c => sport === 'all' || okSport(c.sport) || (c.sports ?? []).some(x => okSport(x))).slice(0, 4)
        .map(c => ({ key: c.id, title: c.profiles?.full_name ?? '', sub: `${sportLabel(c.sport, lang)} · ${cityName}${c.verified ? ` · ${t.tn_verified}` : ''}`, cta: t.tn_see_profile, to: `/coaches/${c.id}` }));
    }
    const when = (e: { starts_on: string; ends_on: string | null }) => { const d = posterDate(e.starts_on, e.ends_on, lang); return `${d.big} ${d.small}`; };
    const fromTable = (camps: boolean): Result[] => (events.data ?? [])
      .filter(e => (e.kind === 'camp') === camps && okSport(e.sport)).slice(0, 4)
      .map(e => ({ key: e.id, title: e.title, sub: [when(e), e.venue ?? e.district].filter(Boolean).join(' · '), cta: t.tn_see_it, to: `/events/${e.slug}` }));
    if (kind === 'event') {
      const d = trending.data;
      const labels = { today: t.tn_today, tomorrow: t.tn_tomorrow };
      const sessions: Result[] = [...(d?.rows ?? []), ...(d?.coming ?? [])].map(r => ({ key: r.id, title: r.title, sub: `${whenLabel(r.starts_at, lang, labels)} · ${r.host}`, cta: t.tn_see_it, to: '/discover' }));
      return [...fromTable(false), ...sessions].slice(0, 4);
    }
    if (kind === 'camp') return fromTable(true);
    return (clubs.data ?? []).filter(c => sport === 'all' || c.sports.includes(sport)).slice(0, 4)
      .map(c => ({ key: c.key, title: c.name, sub: [c.district ?? c.address, c.sports.slice(0, 2).map(x => sportLabel(x, lang)).join(', ')].filter(Boolean).join(' · '), cta: t.rd_see_club, to: c.to }));
  }, [kind, sport, coaches.data, trending.data, events.data, clubs.data, lang, t, cityName]);

  const kinds: [Kind, string][] = [['coach', t.tn_c_k_coach], ['event', t.tn_c_k_event], ['camp', t.tn_c_k_camp], ['club', t.rd_k_club]];
  const sentence = sport === 'all' ? t.tn_c_sentence_any : t.tn_c_sentence_sport;
  const resTitle = { coach: t.tn_r_coaches, event: t.tn_r_events, camp: t.tn_r_camps, club: t.rd_r_clubs }[kind];
  const seeAll = { coach: '/search', event: '/events', camp: '/camps', club: '/clubs' }[kind];
  const loading = (kind === 'coach' && coaches.isLoading) || (kind === 'event' && (events.isLoading || trending.isLoading)) || (kind === 'camp' && events.isLoading) || (kind === 'club' && clubs.isLoading);
  const emptyText = kind === 'coach' ? t.tn_no_coaches : t.tn_none_yet;

  return (
    <section className="relative overflow-hidden bg-foreground text-[#F3EDE2]" id="top">
      <Picture name="sofia-cathedral" alt={t.tn_hero_alt} eager sizes="(min-width: 1024px) 42vw, 100vw" className="absolute inset-0 h-full w-full animate-[kb_34s_ease-in-out_infinite_alternate] object-cover" />
      <div className="absolute inset-0 bg-foreground/50" />
      <PublicNav variant="overlay" />
      <div className="container relative grid gap-10 pb-14 pt-32 md:pb-20 md:pt-44 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="mb-7 max-w-[34ch] text-xl md:text-2xl">{t.tn_c_intro}</p>
          <h1 className="font-display font-extrabold uppercase leading-[0.95]" style={{ fontSize: 'clamp(42px, 5.6vw, 88px)', color: '#F3EDE2' }} aria-live="polite">
            <SentenceView template={sentence} kind={kinds.find(k => k[0] === kind)?.[1] ?? ''} sport={sportLabel(sport, lang)} city={cityName} />
          </h1>
          <div className="mt-10 grid gap-5">
            <div><p className="mb-2 text-base">{t.tn_c_looking}</p><div className="flex flex-wrap gap-1.5">{kinds.map(([k, label]) => <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)} className={`${pill} ${kind === k ? pillOn : pillOff}`}>{label}</button>)}</div></div>
            <div><p className="mb-2 text-base">{t.tn_c_sport}</p><div className="flex flex-wrap gap-1.5">{SPORTS.map(s => <button key={s} type="button" aria-pressed={sport === s} onClick={() => setSport(s)} className={`${pill} ${sport === s ? pillOn : pillOff}`}>{s === 'all' ? t.tn_sport_all : sportLabel(s, lang)}</button>)}</div></div>
          </div>
        </div>
        <aside className="lg:col-span-5" aria-label={resTitle}>
          <div className="bg-background p-6 text-foreground md:p-7">
            <div className="mb-5 flex items-baseline justify-between gap-4"><p className="font-display text-3xl font-extrabold uppercase" style={{ color: 'inherit' }}>{resTitle}</p><span className="text-sm text-foreground-muted" aria-live="polite">{results.length} {results.length === 1 ? t.tn_result : t.tn_results}</span></div>
            {loading && <p className="bg-background-secondary p-5">…</p>}
            {!loading && results.length === 0 && <p className="bg-background-secondary p-5 text-base">{emptyText}</p>}
            <div className="flex flex-col gap-2">
              {results.map(r => (
                <Link key={r.key} to={r.to} className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 bg-background-secondary px-5 py-4 transition-transform duration-300 hover:translate-x-1.5">
                  <span className="min-w-0"><span className="block truncate text-lg font-semibold leading-tight">{r.title}</span><span className="block truncate text-sm text-foreground-muted">{r.sub}</span></span>
                  <span className="inline-flex h-10 items-center gap-2 bg-primary px-4 font-display text-sm font-bold uppercase text-primary-foreground group-hover:bg-primary-hover">{r.cta}</span>
                </Link>
              ))}
            </div>
            <Link to={seeAll} className="mt-5 inline-flex items-center gap-2 text-base font-semibold text-primary hover:underline">{t.tn_see_all.replace('{city}', cityName)}<ArrowRight className="h-4 w-4" /></Link>
          </div>
        </aside>
      </div>
    </section>
  );
}

/** Four ways in. Each is a whole panel and a link. */
export function Doors() {
  const { t } = useLanguage();
  const doors = [
    { to: '/search', title: t.tn_d_coaches, sub: t.tn_d_coaches_sub, bg: 'bg-foreground text-[#F3EDE2]' },
    { to: '/events', title: t.tn_d_events, sub: t.tn_d_events_sub, bg: 'bg-primary text-primary-foreground' },
    { to: '/camps', title: t.tn_d_camps, sub: t.tn_d_camps_sub, bg: 'bg-accent text-white' },
    { to: '/clubs', title: t.rd_d_clubs, sub: t.rd_d_clubs_sub, bg: 'bg-background-tertiary text-foreground' },
  ];
  return (
    <section aria-labelledby="h-doors" className="container py-20 md:py-28">
      <div className="mb-10 grid items-end gap-6 md:grid-cols-12"><h2 id="h-doors" className="max-w-[14ch] text-4xl md:col-span-8 md:text-6xl">{t.tn_doors_title}</h2><p className="max-w-[34ch] text-lg md:col-span-4">{t.tn_doors_sub}</p></div>
      <div className="flex min-h-[640px] flex-col gap-2 md:h-[640px] md:flex-row">
        {doors.map(d => (
          <Link key={d.to} to={d.to} className={`group relative flex min-h-[150px] flex-1 flex-col justify-between overflow-hidden p-6 transition-[flex-grow] duration-700 ease-out md:min-h-0 md:hover:flex-[2.2] md:focus-visible:flex-[2.2] ${d.bg}`}>
            <span className="font-display font-extrabold uppercase leading-[0.9] [overflow-wrap:anywhere]" style={{ fontSize: 'clamp(40px, 3.8vw, 60px)' }}>{d.title}</span>
            <span className="flex items-end justify-between gap-4"><span className="max-w-[24ch] text-lg">{d.sub}</span><ArrowRight className="h-8 w-8 shrink-0 transition-transform duration-500 group-hover:translate-x-2" /></span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function Why() {
  const { t } = useLanguage();
  const points = [[t.tn_why1_t, t.tn_why1_b], [t.tn_why2_t, t.tn_why2_b], [t.tn_why3_t, t.tn_why3_b]];
  return (
    <section className="bg-foreground py-24 text-[#F3EDE2] md:py-36" aria-labelledby="h-why">
      <div className="container">
        <div className="grid items-start gap-8 md:grid-cols-12">
          <h2 id="h-why" className="max-w-[14ch] font-display font-extrabold uppercase leading-[0.92] md:col-span-7" style={{ fontSize: 'clamp(36px, 4.6vw, 68px)', color: '#F3EDE2' }}>{t.tn_why_title}</h2>
          <p className="max-w-[40ch] text-xl md:col-span-4 md:col-start-9">{t.tn_why_body}</p>
        </div>
        <dl className="mt-16 grid gap-10 md:grid-cols-3">
          {points.map(([a, b]) => <div key={a}><dt className="font-display text-4xl font-extrabold uppercase leading-[0.95] md:text-5xl" style={{ color: '#F3EDE2' }}>{a}</dt><dd className="mt-3 max-w-[30ch] text-base text-[#F3EDE2]/80">{b}</dd></div>)}
        </dl>
      </div>
    </section>
  );
}

export function ForCoachesBand() {
  const { t } = useLanguage();
  return (
    <section className="bg-background-secondary py-20 md:py-28" aria-labelledby="h-for">
      <div className="container grid items-start gap-8 md:grid-cols-12">
        <h2 id="h-for" className="max-w-[10ch] text-4xl md:col-span-5 md:text-6xl">{t.tn_for_title}</h2>
        <div className="md:col-span-6 md:col-start-7">
          <p className="mb-8 text-xl leading-snug md:text-2xl">{t.tn_for_body}</p>
          <Link to="/for-coaches" className="inline-flex h-14 items-center gap-3 bg-foreground px-7 font-display text-lg font-bold uppercase text-background transition-colors hover:bg-foreground/85">{t.tn_for_cta}<ArrowRight className="h-5 w-5" /></Link>
        </div>
      </div>
    </section>
  );
}

export function JoinBand() {
  const { t } = useLanguage();
  return (
    <Link to="/start" className="group relative block h-[420px] overflow-hidden bg-primary text-primary-foreground transition-colors hover:bg-background hover:text-primary md:h-[560px]">
      <p className="absolute left-5 top-5 max-w-[28ch] text-lg font-medium">{t.tn_join_line}</p>
      <ArrowRight className="absolute right-5 top-5 h-12 w-12 -rotate-45" aria-hidden="true" />
      <span aria-hidden="true" className="absolute inset-x-0 bottom-3 text-center font-display font-extrabold uppercase leading-[0.78]" style={{ fontSize: 'clamp(180px, 30vw, 460px)', color: 'inherit' }}>{t.tn_join_word}</span>
    </Link>
  );
}
