export type EventKind = 'race' | 'tournament' | 'open_day' | 'clinic' | 'workshop' | 'camp';
export const EVENT_KINDS: EventKind[] = ['race', 'tournament', 'open_day', 'clinic', 'workshop', 'camp'];

export interface EventRow {
  id: string;
  slug: string;
  title: string;
  kind: EventKind;
  sport: string | null;
  starts_on: string;
  ends_on: string | null;
  recurrence: string | null;
  venue: string | null;
  district: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  price_text: string | null;
  level: string | null;
  age_group: string | null;
  registration_url: string | null;
  source_url: string;
  source_name: string | null;
  summary: string | null;
  image_url: string | null;
  organiser_name: string | null;
  last_checked_at: string | null;
}

export const EVENT_COLS =
  'id, slug, title, kind, sport, starts_on, ends_on, recurrence, venue, district, address, lat, lng, price_text, level, age_group, registration_url, source_url, source_name, summary, image_url, organiser_name, last_checked_at';

export const localeOf = (lang: string) => (lang === 'bg' ? 'bg-BG' : lang === 'fr' ? 'fr-FR' : 'en-GB');
const parse = (d: string) => new Date(`${d}T00:00:00`);
export const todayIso = () => new Date().toLocaleDateString('sv-SE');

/** The giant number and the line under it on a poster: "10–11" over "October", or "5" over "April 2027". */
export function posterDate(startsOn: string, endsOn: string | null, lang: string): { big: string; small: string } {
  const a = parse(startsOn);
  const b = endsOn ? parse(endsOn) : null;
  const loc = localeOf(lang);
  const month = (d: Date) => d.toLocaleDateString(loc, { month: 'long' });
  const yr = (d: Date) => (d.getFullYear() !== new Date().getFullYear() ? ` ${d.getFullYear()}` : '');
  if (!b || +a === +b) return { big: String(a.getDate()), small: month(a) + yr(a) };
  if (a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()) return { big: `${a.getDate()}–${b.getDate()}`, small: month(a) + yr(a) };
  return { big: String(a.getDate()), small: `${month(a)} – ${b.getDate()} ${month(b)}${yr(b)}` };
}

/** "10–11 October 2026" in the reader's language. */
export function longDate(startsOn: string, endsOn: string | null, lang: string): string {
  const a = parse(startsOn);
  const b = endsOn ? parse(endsOn) : null;
  const fmt = new Intl.DateTimeFormat(localeOf(lang), { day: 'numeric', month: 'long', year: 'numeric' });
  if (!b || +a === +b) return fmt.format(a);
  try { return (fmt as Intl.DateTimeFormat & { formatRange: (x: Date, y: Date) => string }).formatRange(a, b); } catch { return `${fmt.format(a)} – ${fmt.format(b)}`; }
}

/** Does the event overlap the window from today until `untilIso`? */
export const overlapsUntil = (e: Pick<EventRow, 'starts_on' | 'ends_on'>, untilIso: string) =>
  e.starts_on <= untilIso && (e.ends_on ?? e.starts_on) >= todayIso();

export const weekEndIso = () => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toLocaleDateString('sv-SE'); };
export const monthEndIso = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth() + 1, 0).toLocaleDateString('sv-SE'); };

export const hostOf = (url: string) => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; } };
