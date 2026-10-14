/**
 * Revenue ESTIMATE from rates and attendance (not payments received).
 * Pure module: no React, no backend. Dates are wall-clock dates in the coach's time zone.
 */
import { addDays, addMonths, startOfMonth, startOfWeek, toDateStr, type DateStr } from './tz';

export type Source = 'own' | 'lokka_discover' | 'lokka_trending' | 'invite';
export type RevType = 'session' | 'group' | 'trial' | 'fees';
export const SOURCES: Source[] = ['own', 'lokka_discover', 'lokka_trending', 'invite'];
export const REV_TYPES: RevType[] = ['session', 'group', 'trial', 'fees'];

export interface RevClient {
  id: string;
  billing_type: string;
  rate: number | null;
  billing_start: DateStr | null;
  created_at: string;
  stage: string;
  acquired_via: string;
  pipeline_id: string | null;
  display_name: string;
}
export interface RevSession {
  id: string;
  client_id: string | null;
  kind: string;
  capacity: number | null;
  status: string;
  starts_at: string;
  price: number | null;
  attendees: { client_id: string; status: string }[];
}
export interface RevInput {
  clients: RevClient[];
  sessions: RevSession[];
  chargeNoShows: boolean;
  /** Current instant. */
  now: Date;
  timezone: string;
}

/** One earned/expected money line, attributed to a client. */
export interface RevItem { date: DateStr; amount: number; clientId: string; type: RevType; future: boolean }

export interface Breakdown<K extends string = string> { key: K; amount: number }
export interface RevSummary {
  total: number;
  bySource: Breakdown<Source>[];
  byPipeline: Breakdown[];
  byType: Breakdown<RevType>[];
  topClients: (Breakdown & { name: string })[];
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const num = (v: unknown) => (v == null || v === '' ? null : Number(v));

function sessionItems(inp: RevInput, byId: Map<string, RevClient>): RevItem[] {
  const nowMs = inp.now.getTime();
  const out: RevItem[] = [];
  for (const s of inp.sessions) {
    if (s.kind === 'hire' || s.status === 'cancelled') continue;
    const date = toDateStr(s.starts_at, inp.timezone);
    const future = new Date(s.starts_at).getTime() > nowMs;
    const price = num(s.price);
    if (s.capacity != null) {
      if (!price) continue;
      for (const a of s.attendees) {
        const counts = future
          ? a.status === 'booked'
          : a.status === 'attended' || (inp.chargeNoShows && a.status === 'no_show');
        if (counts && byId.has(a.client_id)) out.push({ date, amount: price, clientId: a.client_id, type: 'group', future });
      }
      continue;
    }
    if (!s.client_id) continue;
    const c = byId.get(s.client_id);
    if (!c) continue;
    const counts = future
      ? s.status === 'scheduled'
      : s.status === 'attended' || (inp.chargeNoShows && s.status === 'no_show');
    if (!counts) continue;
    const trial = s.kind === 'trial';
    const amount = price ?? (!trial && c.billing_type === 'per_session' ? num(c.rate) ?? 0 : 0);
    if (amount > 0) out.push({ date, amount, clientId: c.id, type: trial ? 'trial' : 'session', future });
  }
  return out;
}

/** Weekly/monthly fee lines between `from` and `to` (inclusive). Only clients active now. */
function feeItems(inp: RevInput, from: DateStr, to: DateStr, today: DateStr): RevItem[] {
  const out: RevItem[] = [];
  for (const c of inp.clients) {
    const rate = num(c.rate);
    if (c.stage !== 'active' || !rate) continue;
    const start = c.billing_start ?? toDateStr(c.created_at, inp.timezone);
    if (c.billing_type === 'weekly') {
      let w = startOfWeek(start);
      if (w < start) w = addDays(w, 7);
      if (w < startOfWeek(from)) w = startOfWeek(from);
      for (; w <= to; w = addDays(w, 7)) {
        if (w >= from && w >= start) out.push({ date: w, amount: rate, clientId: c.id, type: 'fees', future: w > today });
      }
    } else if (c.billing_type === 'monthly') {
      let m = startOfMonth(start);
      if (m < startOfMonth(from)) m = startOfMonth(from);
      for (; m <= to; m = addMonths(m, 1)) {
        if (m >= from) out.push({ date: m, amount: rate, clientId: c.id, type: 'fees', future: m > today });
      }
    }
  }
  return out;
}

export function allItems(inp: RevInput, from: DateStr, to: DateStr): RevItem[] {
  const byId = new Map(inp.clients.map((c) => [c.id, c]));
  const today = toDateStr(inp.now, inp.timezone);
  return [...sessionItems(inp, byId), ...feeItems(inp, from, to, today)].filter((i) => i.date >= from && i.date <= to);
}

export function summarize(items: RevItem[], clients: RevClient[]): RevSummary {
  const byId = new Map(clients.map((c) => [c.id, c]));
  const add = (m: Map<string, number>, k: string, v: number) => m.set(k, (m.get(k) ?? 0) + v);
  const src = new Map<string, number>(), pipe = new Map<string, number>(), type = new Map<string, number>(), cl = new Map<string, number>();
  let total = 0;
  for (const i of items) {
    const c = byId.get(i.clientId);
    total += i.amount;
    add(src, (SOURCES as string[]).includes(c?.acquired_via ?? '') ? c!.acquired_via : 'own', i.amount);
    add(pipe, c?.pipeline_id ?? 'none', i.amount);
    add(type, i.type, i.amount);
    add(cl, i.clientId, i.amount);
  }
  const list = <K extends string>(m: Map<string, number>) =>
    [...m].map(([key, amount]) => ({ key: key as K, amount: round2(amount) })).filter((x) => x.amount > 0).sort((a, b) => b.amount - a.amount);
  return {
    total: round2(total),
    bySource: list<Source>(src),
    byPipeline: list(pipe),
    byType: list<RevType>(type),
    topClients: list(cl).slice(0, 5).map((x) => ({ ...x, name: byId.get(x.key)?.display_name ?? '—' })),
  };
}

/** Earned (completed up to now) summary for a date range. */
export function earned(inp: RevInput, from: DateStr, to: DateStr): RevSummary {
  return summarize(allItems(inp, from, to).filter((i) => !i.future), inp.clients);
}

const monthEnd = (d: DateStr) => addDays(addMonths(d, 1), -1);

/** Same day-of-month last month, clamped to that month's last day. */
export function sameDayLastMonth(today: DateStr): DateStr {
  const prevStart = addMonths(today, -1);
  const end = monthEnd(prevStart);
  const cand = prevStart.slice(0, 8) + today.slice(8);
  return cand > end ? end : cand;
}

export interface WeekPoint { week: DateStr; lokka: number; own: number }

export interface RevenueReport {
  thisMonth: RevSummary;
  /** Earned + scheduled future sessions + remaining fees this month. */
  expectedMonth: number;
  lastMonth: RevSummary;
  /** Last month from day 1 up to the same day-of-month as today. */
  lastMonthToDate: RevSummary;
  /** % change of month-to-date vs last month to the same day; null if last month was 0. */
  deltaPct: number | null;
  weeks: WeekPoint[];
}

export function revenueReport(inp: RevInput): RevenueReport {
  const today = toDateStr(inp.now, inp.timezone);
  const mStart = startOfMonth(today);
  const lmStart = addMonths(today, -1);
  const monthItems = allItems(inp, mStart, monthEnd(mStart));
  const thisMonth = summarize(monthItems.filter((i) => !i.future), inp.clients);
  const expectedMonth = round2(monthItems.reduce((s, i) => s + i.amount, 0));
  const lastMonth = earned(inp, lmStart, monthEnd(lmStart));
  const lastMonthToDate = earned(inp, lmStart, sameDayLastMonth(today));
  const deltaPct = lastMonthToDate.total > 0 ? Math.round(((thisMonth.total - lastMonthToDate.total) / lastMonthToDate.total) * 100) : null;

  const curWeek = startOfWeek(today);
  const first = addDays(curWeek, -7 * 11);
  const byId = new Map(inp.clients.map((c) => [c.id, c]));
  const weeks: WeekPoint[] = Array.from({ length: 12 }, (_, i) => ({ week: addDays(first, i * 7), lokka: 0, own: 0 }));
  for (const it of allItems(inp, first, addDays(curWeek, 6))) {
    if (it.future) continue;
    const w = weeks.find((x) => x.week === startOfWeek(it.date));
    if (!w) continue;
    const src = byId.get(it.clientId)?.acquired_via;
    if (src === 'lokka_discover' || src === 'lokka_trending') w.lokka = round2(w.lokka + it.amount);
    else w.own = round2(w.own + it.amount);
  }
  return { thisMonth, expectedMonth, lastMonth, lastMonthToDate, deltaPct, weeks };
}

/** True when nothing can produce revenue yet (no client rate, no session price). */
export function hasRevenueInputs(clients: Pick<RevClient, 'rate' | 'billing_type'>[], sessions: Pick<RevSession, 'price'>[]) {
  return clients.some((c) => num(c.rate) && c.billing_type !== 'none') || sessions.some((s) => num(s.price));
}
