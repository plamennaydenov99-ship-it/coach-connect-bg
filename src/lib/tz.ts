/**
 * DST-safe time-zone helpers built on Intl (no extra deps).
 * DateStr = 'YYYY-MM-DD' (a wall-clock calendar date), TimeStr = 'HH:MM'.
 */
export type DateStr = string;
export type TimeStr = string;

const cache = new Map<string, Intl.DateTimeFormat>();
function fmt(tz: string) {
  let f = cache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
    cache.set(tz, f);
  }
  return f;
}

export function zonedParts(ts: Date | string | number, tz: string) {
  const d = ts instanceof Date ? ts : new Date(ts);
  const p: Record<string, number> = {};
  for (const part of fmt(tz).formatToParts(d)) if (part.type !== 'literal') p[part.type] = Number(part.value);
  return { y: p.year, m: p.month, d: p.day, h: p.hour === 24 ? 0 : p.hour, mi: p.minute, s: p.second };
}

function offsetMs(ts: number, tz: string) {
  const p = zonedParts(ts, tz);
  return Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s) - Math.floor(ts / 1000) * 1000;
}

/** Wall-clock date + time in `tz` → UTC instant. */
export function zonedToUtc(date: DateStr, time: TimeStr, tz: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  const [h, mi] = time.split(':').map(Number);
  const guess = Date.UTC(y, m - 1, d, h, mi);
  const off1 = offsetMs(guess, tz);
  let ts = guess - off1;
  const off2 = offsetMs(ts, tz);
  if (off2 !== off1) ts = guess - off2;
  return new Date(ts);
}

const pad = (n: number) => String(n).padStart(2, '0');
export function toDateStr(ts: Date | string | number, tz: string): DateStr {
  const p = zonedParts(ts, tz);
  return `${p.y}-${pad(p.m)}-${pad(p.d)}`;
}
export function toTimeStr(ts: Date | string | number, tz: string): TimeStr {
  const p = zonedParts(ts, tz);
  return `${pad(p.h)}:${pad(p.mi)}`;
}
export function minutesOfDay(ts: Date | string | number, tz: string) {
  const p = zonedParts(ts, tz);
  return p.h * 60 + p.mi;
}
export function todayStr(tz: string): DateStr {
  return toDateStr(new Date(), tz);
}

/* Pure calendar-date arithmetic (no time zone involved). */
const toUtcNoon = (d: DateStr) => {
  const [y, m, dd] = d.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, dd, 12));
};
const fromUtc = (x: Date): DateStr => `${x.getUTCFullYear()}-${pad(x.getUTCMonth() + 1)}-${pad(x.getUTCDate())}`;
export function addDays(d: DateStr, n: number): DateStr {
  const x = toUtcNoon(d);
  x.setUTCDate(x.getUTCDate() + n);
  return fromUtc(x);
}
/** Monday = 0 … Sunday = 6. */
export function isoWeekday(d: DateStr) {
  return (toUtcNoon(d).getUTCDay() + 6) % 7;
}
export function startOfWeek(d: DateStr): DateStr {
  return addDays(d, -isoWeekday(d));
}
export function startOfMonth(d: DateStr): DateStr {
  return d.slice(0, 8) + '01';
}
export function addMonths(d: DateStr, n: number): DateStr {
  const x = toUtcNoon(startOfMonth(d));
  x.setUTCMonth(x.getUTCMonth() + n);
  return fromUtc(x);
}
export function minutesToTime(min: number): TimeStr {
  return `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
}
export function labelDate(d: DateStr, locale: string, opts: Intl.DateTimeFormatOptions) {
  return toUtcNoon(d).toLocaleDateString(locale, { ...opts, timeZone: 'UTC' });
}
