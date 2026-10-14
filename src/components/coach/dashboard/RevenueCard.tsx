import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/context/LanguageContext';
import { useStaffPaths } from '@/context/StaffRoleContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useRevenue } from '@/hooks/coach/useRevenue';
import { pipelineLabel } from '@/hooks/coach/useCoachClients';
import { LOCALES, portalBtnGhost } from '@/components/coach/clients/shared';
import { labelDate } from '@/lib/tz';
import type { RevSummary } from '@/lib/revenue';

const card = 'animate-fade-up-in bg-portal-card border border-portal-border rounded-[4px] p-5';
const title = 'font-display uppercase tracking-[0.1em] text-base text-portal-ink';

export function RevenueCard() {
  const { t, lang } = useLanguage();
  const { peoplePath } = useStaffPaths();
  const { data, isLoading } = useRevenue();
  const [open, setOpen] = useState(false);
  const locale = LOCALES[lang];
  const eur = (n: number) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: n % 1 ? 2 : 0 }).format(n);

  if (isLoading || !data) return <Skeleton className="h-64" />;

  if (!data.hasInputs) {
    return (
      <section className={card}>
        <h2 className={`${title} mb-2`}>{t.rev_title}</h2>
        <p className="text-sm text-portal-muted-strong">{t.rev_empty}</p>
        <Link to={peoplePath} className="inline-block mt-2 text-sm text-portal-blue hover:underline">{t.rev_empty_link} →</Link>
      </section>
    );
  }

  const m = data.thisMonth;
  const lokka = m.bySource.filter((s) => s.key === 'lokka_discover' || s.key === 'lokka_trending').reduce((a, s) => a + s.amount, 0);
  const lokkaPct = m.total > 0 ? Math.round((lokka / m.total) * 100) : 0;
  const delta = data.deltaPct;
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <section className={card}>
      <div className="grid md:grid-cols-[1fr_auto] gap-4">
        <div>
          <h2 className={title}>{t.rev_title}</h2>
          <div className="mt-2 font-display text-4xl text-portal-ink">{eur(m.total)}</div>
          <p className="text-sm text-portal-muted-strong">{t.rev_of_expected.replace('{amount}', eur(data.expectedMonth))}</p>
          {delta !== null && (
            <p className={`text-sm mt-1 ${delta >= 0 ? 'text-portal-success' : 'text-portal-coral-text'}`}>
              {delta >= 0 ? '▲' : '▼'} {Math.abs(delta)}% <span className="text-portal-muted">{t.rev_vs_last}</span>
            </p>
          )}
        </div>
        <div className="rounded-[4px] border border-portal-selected-border bg-portal-selected p-4 md:min-w-[200px]">
          <div className="font-display uppercase tracking-[0.1em] text-xs text-portal-blue">{t.rev_from_lokka}</div>
          <div className="font-display text-3xl text-portal-ink mt-1">{eur(lokka)}</div>
          <div className="text-sm text-portal-muted-strong">{t.rev_of_earned.replace('{pct}', String(lokkaPct))}</div>
        </div>
      </div>

      <div className="h-40 mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.weeks.map((w) => ({ ...w, label: labelDate(w.week, locale, { day: '2-digit', month: 'short' }) }))}>
            <CartesianGrid vertical={false} stroke="hsl(var(--portal-border))" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--portal-muted))' }} />
            <YAxis allowDecimals={false} domain={[0, 'auto']} tickLine={false} axisLine={false} width={40} tick={{ fontSize: 11, fill: 'hsl(var(--portal-muted))' }} />
            <Tooltip cursor={{ fill: 'hsl(var(--portal-bg))' }} content={({ active, payload }) => active && payload?.length ? (
              <div className="bg-portal-card border border-portal-border rounded-[4px] px-2 py-1 text-xs space-y-0.5">
                <div className="text-portal-muted">{(payload[0].payload as { label: string }).label}</div>
                <div className="text-portal-ink">{t.rev_lokka}: {eur((payload[0].payload as { lokka: number }).lokka)}</div>
                <div className="text-portal-ink">{t.rev_own}: {eur((payload[0].payload as { own: number }).own)}</div>
              </div>
            ) : null} />
            <Bar dataKey="own" stackId="r" fill="hsl(var(--portal-muted))" isAnimationActive={!reduced} animationDuration={800} />
            <Bar dataKey="lokka" stackId="r" fill="hsl(var(--portal-blue))" isAnimationActive={!reduced} animationDuration={800} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-portal-muted">{t.rev_footnote}</p>
        <button className={portalBtnGhost} onClick={() => setOpen(true)}>{t.rev_breakdown}</button>
      </div>

      <BreakdownSheet open={open} onOpenChange={setOpen} thisMonth={data.thisMonth} lastMonth={data.lastMonth} pipelines={data.pipelines} eur={eur} />
    </section>
  );
}

function BreakdownSheet({ open, onOpenChange, thisMonth, lastMonth, pipelines, eur }: {
  open: boolean; onOpenChange: (o: boolean) => void; thisMonth: RevSummary; lastMonth: RevSummary;
  pipelines: { id: string; name: string; is_default: boolean }[]; eur: (n: number) => string;
}) {
  const { t } = useLanguage();
  const mobile = useIsMobile();
  const [which, setWhich] = useState<'this' | 'last'>('this');
  const s = which === 'this' ? thisMonth : lastMonth;
  const pName = (id: string) => { const p = pipelines.find((x) => x.id === id); return p ? pipelineLabel(p, t) : t.rev_no_pipeline; };

  const List = ({ heading, rows }: { heading: string; rows: { label: string; amount: number }[] }) => (
    <div className="space-y-2">
      <h3 className="font-display uppercase tracking-[0.1em] text-sm text-portal-ink">{heading}</h3>
      {!rows.length ? <p className="text-sm text-portal-muted">{t.rev_nothing}</p> : rows.map((r) => {
        const pct = s.total > 0 ? Math.round((r.amount / s.total) * 100) : 0;
        return (
          <div key={r.label} className="text-sm">
            <div className="flex justify-between gap-2"><span className="text-portal-ink truncate">{r.label}</span><span className="text-portal-muted-strong shrink-0">{eur(r.amount)} · {pct}%</span></div>
            <div className="h-1.5 mt-1 bg-portal-bg rounded-[4px] overflow-hidden"><div className="h-full bg-portal-blue" style={{ width: `${pct}%` }} /></div>
          </div>
        );
      })}
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={mobile ? 'bottom' : 'right'} className={`coach-portal bg-portal-card border-portal-border overflow-y-auto ${mobile ? 'max-h-[85vh]' : 'w-full sm:max-w-md'}`}>
        <SheetTitle className="font-display uppercase tracking-[0.1em] text-portal-ink">{t.rev_breakdown}</SheetTitle>
        <SheetDescription className="text-xs text-portal-muted">{t.rev_footnote}</SheetDescription>
        <div className="flex gap-2 my-4">
          {(['this', 'last'] as const).map((k) => (
            <button key={k} onClick={() => setWhich(k)}
              className={`h-9 px-3 rounded-[4px] border text-sm ${which === k ? 'bg-portal-selected border-portal-selected-border text-portal-ink' : 'border-portal-border text-portal-muted-strong'}`}>
              {k === 'this' ? t.rev_this_month : t.rev_last_month}
            </button>
          ))}
        </div>
        <div className="font-display text-3xl text-portal-ink mb-4">{eur(s.total)}</div>
        <div className="space-y-6">
          <List heading={t.rev_by_source} rows={s.bySource.map((x) => ({ label: t[`src_${x.key}`] ?? x.key, amount: x.amount }))} />
          <List heading={t.rev_by_pipeline} rows={s.byPipeline.map((x) => ({ label: pName(x.key), amount: x.amount }))} />
          <List heading={t.rev_by_type} rows={s.byType.map((x) => ({ label: t[`rev_type_${x.key}`] ?? x.key, amount: x.amount }))} />
          <List heading={t.rev_top_clients} rows={s.topClients.map((x) => ({ label: x.name, amount: x.amount }))} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
