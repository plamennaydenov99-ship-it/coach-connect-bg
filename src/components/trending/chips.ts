import type { TrendRow } from '@/lib/trending';

export function chipsFor(r: TrendRow, t: Record<string, string>) {
  const hoursLeft = (Date.parse(r.starts_at) - Date.now()) / 3600000;
  const c: { label: string; hot?: boolean }[] = [];
  if (r.popup) c.push({ label: t.tn_chip_popup, hot: true });
  if (r.spots_left > 0 && r.spots_left <= 2) c.push({ label: t.tn_chip_almost, hot: true });
  if (r.book24 >= 2) c.push({ label: t.tn_chip_reserved.replace('{n}', String(r.book24)) });
  if (r.req24 >= 2) c.push({ label: t.tn_chip_asked.replace('{n}', String(r.req24)) });
  if (r.save24 >= 5) c.push({ label: t.tn_chip_saved.replace('{n}', String(r.save24)) });
  if (hoursLeft <= 6 && !r.popup) c.push({ label: t.tn_chip_starts_in.replace('{n}', String(Math.max(1, Math.round(hoursLeft)))) });
  if (r.pinned) c.push({ label: t.tn_picked });
  return c.slice(0, 3);
}
