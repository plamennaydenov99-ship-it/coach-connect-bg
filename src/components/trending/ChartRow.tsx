import { Bookmark, ChevronDown } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { movement, sportLabel, whenLabel, type TrendPromo, type TrendRow } from '@/lib/trending';
import { chipsFor } from '@/components/trending/chips';

const meter = 'h-2.5 w-full bg-background';

export type RowAction = { id: string; label: string; disabled?: boolean; onClick: () => void };

function Chip({ children, hot }: { children: React.ReactNode; hot?: boolean }) {
  return <span className={`inline-flex h-7 items-center px-2.5 text-sm font-semibold ${hot ? 'bg-accent text-white' : 'bg-background text-foreground'}`}>{children}</span>;
}

function MoveBadge({ row }: { row: Pick<TrendRow, 'city_rank' | 'prev_rank'> }) {
  const { t } = useLanguage();
  const m = movement(row);
  const tone = m.kind === 'up' ? 'text-success' : m.kind === 'down' ? 'text-destructive' : m.kind === 'new' ? 'text-primary' : 'text-foreground-muted';
  const path = m.kind === 'up' ? 'M12 19V5 M6 11l6-6 6 6' : m.kind === 'down' ? 'M12 5v14 M6 13l6 6 6-6' : m.kind === 'new' ? 'M12 4v16 M4 12h16' : 'M5 12h14';
  const text = m.kind === 'new' ? t.tn_new : m.kind === 'same' ? t.tn_same : String(m.n);
  return (
    <div className={`flex items-center gap-1 text-base font-bold ${tone}`} aria-label={text}>
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={path} /></svg>
      <span>{text}</span>
    </div>
  );
}

type Common = { open: boolean; onToggle: () => void; saved: boolean; onSave: () => void; action: RowAction; saveBusy?: boolean };

/** One numbered place in the chart. */
export function ChartRow({ row, open, onToggle, saved, onSave, action, saveBusy }: Common & { row: TrendRow }) {
  const { t, lang } = useLanguage();
  const when = whenLabel(row.starts_at, lang, { today: t.tn_today, tomorrow: t.tn_tomorrow });
  const fill = Math.round((100 * (row.capacity - row.spots_left)) / row.capacity);
  const low = row.spots_left <= 2;
  const parts = [
    { label: t.tn_part_demand, pct: row.parts.demand, note: t.tn_note_demand.replace('{b}', String(row.book24)).replace('{r}', String(row.req24)) },
    { label: t.tn_part_filling, pct: row.parts.filling, note: t.tn_note_filling.replace('{a}', String(row.capacity - row.spots_left)).replace('{c}', String(row.capacity)) },
    { label: t.tn_part_saved, pct: row.parts.saved, note: t.tn_note_saved.replace('{n}', String(row.save24)) },
    { label: t.tn_part_soon, pct: row.parts.soon, note: row.parts.soon >= 85 ? t.tn_note_soon_day : t.tn_note_soon_later },
  ];
  return (
    <article className="grid grid-cols-[56px_1fr] items-center gap-x-4 gap-y-3 bg-background-secondary px-4 py-5 transition-[background,transform] duration-300 hover:bg-background-tertiary md:grid-cols-[84px_74px_minmax(0,1fr)_210px_190px] md:gap-x-5 md:px-6 md:hover:translate-x-2">
      <div className="font-display text-5xl font-extrabold leading-[0.8] tabular-nums md:text-7xl" aria-label={`${t.tn_number} ${row.rank}`}>{row.rank}</div>
      <div className="hidden md:block"><MoveBadge row={row} /></div>
      <div className="min-w-0 md:col-auto">
        <h3 className="t-plain text-xl">{row.title}</h3>
        <p className="mt-1 text-sm text-foreground-muted">{when} · {row.host}{row.location ? ` · ${row.location}` : ''}{row.sport ? ` · ${sportLabel(row.sport, lang)}` : ''}</p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">{chipsFor(row, t).map(c => <Chip key={c.label} hot={c.hot}>{c.label}</Chip>)}</div>
        <button type="button" onClick={onToggle} aria-expanded={open} className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
          {open ? t.tn_why_hide : t.tn_why}<ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>
      <div className="col-span-2 md:col-span-1">
        <div className={meter}><div className={`h-full ${low ? 'bg-accent' : 'bg-primary'} transition-[width] duration-700`} style={{ width: `${fill}%` }} /></div>
        <p className="mt-1.5 text-sm tabular-nums">{row.spots_left === 0 ? t.tn_full : t.tn_spots_of.replace('{left}', String(row.spots_left)).replace('{cap}', String(row.capacity))} · {t.tn_heat} {row.heat}</p>
      </div>
      <div className="col-span-2 flex items-center gap-1.5 md:col-span-1 md:justify-end">
        <button type="button" onClick={onSave} disabled={saveBusy} aria-pressed={saved} aria-label={saved ? t.disc_unsave : t.disc_save} className={`grid h-11 w-11 shrink-0 place-items-center transition-colors ${saved ? 'bg-foreground text-background' : 'bg-background hover:bg-background-tertiary'}`}>
          <Bookmark className={`h-5 w-5 ${saved ? 'fill-current' : ''}`} />
        </button>
        <button type="button" onClick={action.onClick} disabled={action.disabled} className="h-11 flex-1 bg-primary px-4 font-display text-sm font-bold uppercase tracking-[0.02em] text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50 md:flex-none">{action.label}</button>
      </div>
      {open && (
        <div className="col-span-2 grid gap-6 pt-4 md:col-span-5 md:grid-cols-4">
          {parts.map(p => (
            <div key={p.label}>
              <p className="mb-2 text-base font-semibold">{p.label}</p>
              <div className={meter}><div className="h-full bg-primary" style={{ width: `${p.pct}%` }} /></div>
              <p className="mt-1.5 text-sm text-foreground-muted">{p.note}</p>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

/** A paid place. Marked, blue, and never numbered. */
export function PromoRow({ promo, open, onToggle, saved, onSave, action, saveBusy, city }: Common & { promo: TrendPromo; city: string }) {
  const { t, lang } = useLanguage();
  const when = whenLabel(promo.starts_at, lang, { today: t.tn_today, tomorrow: t.tn_tomorrow });
  const fill = promo.capacity ? Math.round((100 * (promo.capacity - promo.spots_left)) / promo.capacity) : 0;
  return (
    <article className="grid grid-cols-1 items-center gap-x-5 gap-y-3 bg-primary px-4 py-5 text-primary-foreground transition-[background,transform] duration-300 hover:bg-primary-hover md:grid-cols-[158px_minmax(0,1fr)_210px_190px] md:px-6 md:hover:translate-x-2">
      <p><span className="inline-flex h-7 items-center bg-[#F3EDE2] px-3 text-sm font-bold text-foreground">{t.tn_promoted}</span></p>
      <div className="min-w-0">
        <h3 className="t-plain text-xl" style={{ color: 'inherit' }}>{promo.title}</h3>
        <p className="mt-1 text-sm text-primary-foreground/85">{promo.host} · {when}{promo.location ? ` · ${promo.location}` : ''}</p>
        <button type="button" onClick={onToggle} aria-expanded={open} className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold hover:underline">
          {open ? t.tn_why_hide : t.tn_why_promo}<ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && <p className="mt-3 max-w-[70ch] text-base text-primary-foreground/90">{t.tn_promo_text.replace('{host}', promo.host).replace('{city}', city)}</p>}
      </div>
      <div>
        <div className="h-2.5 w-full bg-primary-foreground/25"><div className="h-full bg-primary-foreground" style={{ width: `${fill}%` }} /></div>
        <p className="mt-1.5 text-sm tabular-nums">{t.tn_spots_of.replace('{left}', String(promo.spots_left)).replace('{cap}', String(promo.capacity))}</p>
      </div>
      <div className="flex items-center gap-1.5 md:justify-end">
        <button type="button" onClick={onSave} disabled={saveBusy} aria-pressed={saved} aria-label={saved ? t.disc_unsave : t.disc_save} className={`grid h-11 w-11 shrink-0 place-items-center transition-colors ${saved ? 'bg-[#F3EDE2] text-foreground' : 'bg-primary-foreground/15 hover:bg-primary-foreground/25'}`}>
          <Bookmark className={`h-5 w-5 ${saved ? 'fill-current' : ''}`} />
        </button>
        <button type="button" onClick={action.onClick} disabled={action.disabled} className="h-11 flex-1 bg-[#F3EDE2] px-4 font-display text-sm font-bold uppercase tracking-[0.02em] text-foreground transition-colors hover:bg-white disabled:opacity-50 md:flex-none">{action.label}</button>
      </div>
    </article>
  );
}
