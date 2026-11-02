import { supabase } from '@/integrations/supabase/client';

// The pilot opens in one city. Add more names here when the next one opens.
export const CITIES = ['Sofia'] as const;
export type City = (typeof CITIES)[number];
export const DEFAULT_CITY: City = 'Sofia';
export const CITY_TZ: Record<string, string> = { Sofia: 'Europe/Sofia', 'French Riviera': 'Europe/Paris' };
const CITY_LABEL: Record<string, Record<string, string>> = {
  Sofia: { en: 'Sofia', bg: 'София', fr: 'Sofia' },
  'French Riviera': { en: 'French Riviera', bg: 'Френска Ривиера', fr: "Côte d'Azur" },
};
export const cityLabel = (city: string, lang: string) => CITY_LABEL[city]?.[lang] ?? city;

export type TrendRow = {
  id: string; kind: 'session'; title: string; sport: string | null; host: string; host_kind: 'coach' | 'club'; host_id: string;
  location: string | null; starts_at: string; capacity: number; spots_left: number; price: number | null; popup: boolean; verified: boolean; pinned: boolean;
  heat: number; rank: number; city_rank: number; prev_rank: number | null; book24: number; req24: number; save24: number;
  parts: { demand: number; filling: number; saved: number; soon: number; quality: number };
};
export type TrendLite = {
  id: string; title: string; sport: string | null; host: string; host_id: string; location: string | null; starts_at: string; capacity: number; spots_left: number; popup: boolean;
};
export type TrendPromo = {
  campaign_id: string; id: string; title: string; sport: string | null; host: string; host_id: string; location: string | null; starts_at: string; capacity: number; spots_left: number;
  headline?: string | null;
};
export type TrendItem = {
  id: string; type: 'sport' | 'session' | 'event'; title: string; blurb: string | null; sport: string | null; image_url: string | null;
  starts_on: string | null; ends_on: string | null; owner_id: string | null; session_id: string | null; rank: number;
};
export type TrendingData = {
  mode: 'hot' | 'cold'; city: string; generated_at: string;
  rows: TrendRow[]; coming: TrendLite[]; soon: TrendLite[]; promoted: TrendPromo[]; pick: TrendPromo | null;
  events: TrendItem[]; sport_tiles: TrendItem[]; sports: string[];
};

type RpcResult<T> = Promise<{ data: T | null; error: { message: string } | null }>;
// The generated database types do not list the newer functions, so call them through one typed door.
export function rpc<T>(fn: string, args?: Record<string, unknown>): RpcResult<T> {
  return (supabase as unknown as { rpc: (f: string, a?: unknown) => RpcResult<T> }).rpc(fn, args);
}

export async function fetchTrending(city: string, sport: string, kind: string, period: string): Promise<TrendingData> {
  const { data, error } = await rpc<TrendingData>('get_trending', { p_city: city, p_sport: sport === 'all' ? null : sport, p_kind: kind, p_period: period });
  if (error || !data) throw new Error(error?.message || 'No data');
  return data;
}

// Views, impressions and clicks go through one guarded database function.
// It drops repeats, rate limits, and ignores bots. Failing quietly is fine.
const sent = new Set<string>();
export function track(type: 'view' | 'impression' | 'click', targetType: 'session' | 'coach' | 'club' | 'item' | 'campaign', targetId: string, campaignId?: string) {
  const key = `${type}:${targetType}:${targetId}`;
  if (sent.has(key)) return;
  sent.add(key);
  void rpc('track_event', { p_type: type, p_target_type: targetType, p_target_id: targetId, p_campaign: campaignId ?? null });
}

export function movement(row: Pick<TrendRow, 'city_rank' | 'prev_rank'>): { kind: 'new' | 'up' | 'down' | 'same'; n: number } {
  if (row.prev_rank == null) return { kind: 'new', n: 0 };
  const d = row.prev_rank - row.city_rank;
  return d > 0 ? { kind: 'up', n: d } : d < 0 ? { kind: 'down', n: -d } : { kind: 'same', n: 0 };
}

const LOCALES = { en: 'en-GB', bg: 'bg-BG', fr: 'fr-FR' } as const;
export const localeOf = (lang: string) => LOCALES[lang as keyof typeof LOCALES] ?? 'en-GB';

function dayKey(d: Date, tz: string) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}
/** "Today 19:30", "Tomorrow 07:30" or "Saturday 09:00", in the city's own time. */
export function whenLabel(iso: string, lang: string, labels: { today: string; tomorrow: string }, tz = CITY_TZ.Sofia) {
  const d = new Date(iso);
  const now = new Date();
  const loc = localeOf(lang);
  const time = new Intl.DateTimeFormat(loc, { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
  const dayDiff = Math.round((Date.parse(dayKey(d, tz)) - Date.parse(dayKey(now, tz))) / 86400000);
  const day = dayDiff <= 0 ? labels.today : dayDiff === 1 ? labels.tomorrow : new Intl.DateTimeFormat(loc, { timeZone: tz, weekday: 'long' }).format(d);
  return `${day} ${time}`;
}
export function countdown(iso: string, now: number) {
  const s = Math.max(0, Math.floor((Date.parse(iso) - now) / 1000));
  const p = (n: number) => String(n).padStart(2, '0');
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return h > 0 ? `${h}:${p(m)}:${p(sec)}` : `${p(m)}:${p(sec)}`;
}

export const SPORT_LABEL: Record<string, { en: string; bg: string; fr: string }> = {
  padel: { en: 'Padel', bg: 'Падел', fr: 'Padel' }, tennis: { en: 'Tennis', bg: 'Тенис', fr: 'Tennis' }, yoga: { en: 'Yoga', bg: 'Йога', fr: 'Yoga' },
  football: { en: 'Football', bg: 'Футбол', fr: 'Football' }, boxing: { en: 'Boxing', bg: 'Бокс', fr: 'Boxe' }, bjj: { en: 'BJJ', bg: 'BJJ', fr: 'BJJ' },
  running: { en: 'Running', bg: 'Бягане', fr: 'Course' }, hyrox: { en: 'Hyrox', bg: 'Hyrox', fr: 'Hyrox' }, crossfit: { en: 'CrossFit', bg: 'КросФит', fr: 'CrossFit' },
  basketball: { en: 'Basketball', bg: 'Баскетбол', fr: 'Basket' }, swimming: { en: 'Swimming', bg: 'Плуване', fr: 'Natation' }, cycling: { en: 'Cycling', bg: 'Колоездене', fr: 'Cyclisme' },
};
export function sportLabel(key: string | null | undefined, lang: string) {
  if (!key) return '';
  const k = key.toLowerCase();
  const e = SPORT_LABEL[k];
  return e ? e[lang as 'en' | 'bg' | 'fr'] ?? e.en : key.charAt(0).toUpperCase() + key.slice(1);
}

// ---- Sample data, only shown on /discover?sample=1 so the design can be reviewed before there is real activity.
export function sampleTrending(): TrendingData {
  const H = 3600000;
  // Near times count from now (rounded to the half hour). Later ones sit at a fixed clock time on a given day.
  const soon = (h: number) => { const d = new Date(Date.now() + h * H); d.setMinutes(d.getMinutes() < 15 ? 0 : d.getMinutes() < 45 ? 30 : 60, 0, 0); return d.toISOString(); };
  const onDay = (days: number, hh: number, mm = 0) => { const d = new Date(); d.setDate(d.getDate() + days); d.setHours(hh, mm, 0, 0); return d.toISOString(); };
  const mk = (i: number, title: string, sport: string, host: string, starts: string, cap: number, left: number, book: number, req: number, save: number, pk: Partial<TrendRow> = {}): TrendRow => {
    const hrs = (Date.parse(starts) - Date.now()) / H;
    return {
      id: `sample-${i}`, kind: 'session', title, sport, host, host_kind: 'coach', host_id: `sample-host-${i}`, location: 'Borisova Garden', starts_at: starts, capacity: cap, spots_left: left, price: 20,
      popup: false, verified: true, pinned: false, heat: 0, rank: i, city_rank: i, prev_rank: i + 1, book24: book, req24: req, save24: save,
      parts: { demand: Math.min(100, (book + req) * 8), filling: Math.round(100 * (cap - left) / cap), saved: Math.min(100, save * 3), soon: hrs <= 3 ? 100 : hrs <= 24 ? 85 : 55, quality: 100 }, ...pk,
    };
  };
  const rows = [
    mk(1, 'Serve clinic', 'tennis', 'Kalina Georgieva', soon(2), 8, 2, 6, 4, 22),
    mk(2, 'Sunrise terrace flow', 'yoga', 'Desislava Nikolova', onDay(1, 7, 30), 14, 6, 5, 2, 31, { prev_rank: 4 }),
    mk(3, 'Open doubles night', 'padel', 'Sofia Padel Club', soon(6), 16, 2, 6, 3, 12, { host_kind: 'club', prev_rank: null }),
    mk(4, 'Youth football clinic', 'football', 'Dimitar Petrov', onDay(1, 17), 16, 6, 4, 2, 16, { prev_rank: 4 }),
    mk(5, 'Park flow', 'yoga', 'Liliya Popova', onDay(1, 8), 20, 10, 5, 1, 28, { prev_rank: 7 }),
    mk(6, 'Kids tennis group', 'tennis', 'Radoslava Mitkova', onDay(2, 10), 10, 3, 5, 3, 15, { prev_rank: 6 }),
    mk(7, 'Goalkeeping session', 'football', 'Plamen Stoyanov', onDay(4, 18), 8, 4, 2, 1, 6, { prev_rank: 5 }),
  ].map((r) => ({ ...r, heat: Math.round(100 * (0.35 * r.parts.demand / 100 + 0.2 * r.parts.filling / 100 + 0.15 * r.parts.saved / 100 + 0.15 * r.parts.soon / 100 + 0.15)) }));
  rows.sort((a, b) => b.heat - a.heat).forEach((r, i) => { r.rank = i + 1; r.city_rank = i + 1; });
  const lite = (r: TrendRow): TrendLite => ({ id: r.id, title: r.title, sport: r.sport, host: r.host, host_id: r.host_id, location: r.location, starts_at: r.starts_at, capacity: r.capacity, spots_left: r.spots_left, popup: r.popup });
  const popup1 = lite(mk(20, 'Evening mobility in the park', 'yoga', 'Liliya Popova', soon(1.75), 25, 17, 2, 0, 7, { popup: true }));
  popup1.popup = true;
  return {
    mode: 'hot', city: 'Sofia', generated_at: new Date().toISOString(), rows,
    coming: [lite(mk(21, 'Evening restore', 'yoga', 'Desislava Nikolova', onDay(1, 19, 30), 12, 8, 1, 0, 5)), lite(mk(22, 'Wall play clinic', 'padel', 'Tsvetelina Dimova', onDay(5, 11), 8, 4, 1, 0, 6))],
    soon: [popup1, lite(rows.find(r => r.title === 'Serve clinic') ?? rows[0]), lite(rows.find(r => r.title === 'Open doubles night') ?? rows[2])],
    promoted: [
      { campaign_id: 'sample-c1', id: 'sample-p1', title: 'Free trial court hour', sport: 'padel', host: 'Sofia Padel Club', host_id: 'sample-h', location: 'Court 2', starts_at: onDay(1, 18), capacity: 12, spots_left: 9 },
      { campaign_id: 'sample-c2', id: 'sample-p2', title: 'Spring league, teams of five', sport: 'football', host: 'Borisova Football School', host_id: 'sample-h2', location: 'Borisova Garden', starts_at: onDay(5, 19), capacity: 40, spots_left: 22 },
    ],
    pick: { campaign_id: 'sample-c3', id: 'sample-p3', title: 'Spring camp at Sofia Tennis Club', headline: 'Two days in the park for juniors, run by verified coaches.', sport: 'tennis', host: 'Sofia Tennis Club', host_id: 'sample-h3', location: 'Borisova Garden', starts_at: onDay(6, 10), capacity: 14, spots_left: 6 },
    events: [], sport_tiles: [], sports: ['padel', 'tennis', 'yoga', 'football'],
  };
}
