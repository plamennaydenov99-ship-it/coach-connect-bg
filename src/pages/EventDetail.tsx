import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, MapPin } from 'lucide-react';
import { PublicNav } from '@/components/layout/PublicNav';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { BookmarkButton } from '@/components/BookmarkButton';
import { ReportForm } from '@/components/ReportForm';
import { useLanguage } from '@/context/LanguageContext';
import { useEvent } from '@/hooks/useEvents';
import { hostOf, localeOf, longDate, posterDate } from '@/lib/events';
import { sportLabel } from '@/lib/trending';

const cream = '#F3EDE2';

export default function EventDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { t, lang } = useLanguage();
  const { data: ev, isLoading } = useEvent(slug);

  const shell = (children: React.ReactNode) => (
    <div className="flex min-h-screen flex-col bg-background text-foreground"><PublicNav /><main className="flex-1">{children}</main><PublicFooter /></div>
  );
  if (isLoading) return shell(<p className="container py-24 text-center text-foreground-muted">{t.coach_loading}</p>);
  if (!ev) return shell(
    <div className="container py-24 text-center">
      <h1 className="text-5xl">{t.rd_not_found}</h1>
      <Link to="/events" className="mt-8 inline-flex h-12 items-center bg-primary px-6 font-display text-base font-bold uppercase text-primary-foreground hover:bg-primary-hover">{t.rd_back_events}</Link>
    </div>,
  );

  const camp = ev.kind === 'camp';
  const { big, small } = posterDate(ev.starts_on, ev.ends_on, lang);
  const kind = (t as Record<string, string>)[`rd_k_${ev.kind}`] ?? ev.kind;
  const where = [ev.venue, ev.address, ev.district].filter(Boolean);
  const mapHref = ev.lat != null && ev.lng != null
    ? `https://www.openstreetmap.org/?mlat=${ev.lat}&mlon=${ev.lng}#map=17/${ev.lat}/${ev.lng}`
    : where.length ? `https://www.openstreetmap.org/search?query=${encodeURIComponent([ev.venue, ev.address, 'Sofia'].filter(Boolean).join(', '))}` : null;
  const facts: [string, React.ReactNode][] = [
    [t.rd_when, <><span className="block">{longDate(ev.starts_on, ev.ends_on, lang)}</span>{ev.recurrence && <span className="mt-1 block text-foreground-muted">{ev.recurrence}</span>}</>],
    ...(where.length ? [[t.rd_where, <><span className="block">{where.join(', ')}</span>{mapHref && <a href={mapHref} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline">{t.rd_open_map}<ArrowUpRight className="h-4 w-4" /></a>}</>] as [string, React.ReactNode]] : []),
    ...(ev.price_text ? [[t.rd_price, ev.price_text] as [string, React.ReactNode]] : []),
    ...(ev.level ? [[t.rd_level, ev.level] as [string, React.ReactNode]] : []),
    ...(ev.age_group ? [[t.rd_ages, ev.age_group] as [string, React.ReactNode]] : []),
    ...(ev.organiser_name ? [[t.rd_organiser, ev.organiser_name] as [string, React.ReactNode]] : []),
  ];
  const checked = ev.last_checked_at ? new Date(ev.last_checked_at).toLocaleDateString(localeOf(lang), { day: 'numeric', month: 'long' }) : null;
  const btn = 'inline-flex h-14 items-center gap-2 px-6 font-display text-lg font-bold uppercase transition-colors';

  return shell(
    <>
      <section className={`${camp ? 'bg-accent text-white' : 'bg-foreground'}`} style={{ color: cream }}>
        <div className="container py-10 md:py-16">
          <Link to={camp ? '/camps' : '/events'} className="mb-8 inline-flex items-center gap-2 text-sm font-medium opacity-80 transition-opacity hover:opacity-100"><ArrowLeft className="h-4 w-4" />{camp ? t.rd_back_camps : t.rd_back_events}</Link>
          <div className="grid items-end gap-8 md:grid-cols-12">
            <div className="md:col-span-4">
              <p className="font-display font-extrabold leading-[0.8] tabular-nums" style={{ fontSize: 'clamp(110px, 16vw, 230px)', color: cream }}>{big}</p>
              <p className="mt-3 font-display text-3xl font-extrabold uppercase" style={{ color: cream }}>{small}</p>
            </div>
            <div className="md:col-span-8">
              <div className="mb-4 flex flex-wrap gap-1.5">
                <span className="bg-[#F3EDE2] px-2.5 py-1 text-sm font-semibold text-foreground">{kind}</span>
                {ev.sport && <span className="bg-[#F3EDE2] px-2.5 py-1 text-sm font-semibold text-foreground">{sportLabel(ev.sport, lang)}</span>}
              </div>
              <h1 className="max-w-[20ch] font-display font-extrabold uppercase leading-[0.92]" style={{ fontSize: 'clamp(38px, 5.2vw, 78px)', color: cream }}>{ev.title}</h1>
              {where.length > 0 && <p className="mt-4 flex items-center gap-1.5 text-lg opacity-90"><MapPin className="h-5 w-5" aria-hidden="true" />{[ev.venue, ev.district].filter(Boolean).join(' · ')}</p>}
            </div>
          </div>
        </div>
      </section>

      <section className="container grid gap-10 py-10 md:py-14 lg:grid-cols-12">
        <div className="space-y-8 lg:col-span-8">
          {ev.summary && <p className="max-w-[60ch] text-xl leading-relaxed">{ev.summary}</p>}
          <dl className="grid gap-2 sm:grid-cols-2">
            {facts.map(([k, v]) => (
              <div key={k} className="bg-background-secondary p-5">
                <dt className="font-display text-xs font-bold uppercase tracking-[0.08em] text-foreground-muted">{k}</dt>
                <dd className="mt-2 text-lg font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-wrap gap-2">
            {ev.registration_url && <a href={ev.registration_url} target="_blank" rel="noopener noreferrer" className={`${btn} bg-foreground text-background hover:bg-primary`}>{t.rd_register}<ArrowUpRight className="h-5 w-5" /></a>}
            <a href={ev.source_url} target="_blank" rel="noopener noreferrer" className={`${btn} border-2 border-foreground hover:bg-background-secondary`}>{t.rd_official}<ArrowUpRight className="h-5 w-5" /></a>
            <BookmarkButton targetType="event" targetId={ev.id} />
          </div>
        </div>
        <aside className="space-y-6 lg:col-span-4">
          <div className="bg-background-secondary p-5 text-sm">
            <p className="font-display text-xs font-bold uppercase tracking-[0.08em] text-foreground-muted">{t.rd_source}</p>
            <a href={ev.source_url} target="_blank" rel="noopener noreferrer" className="mt-2 block break-all font-semibold underline underline-offset-4 hover:text-primary">{ev.source_name || hostOf(ev.source_url)}</a>
            {checked && <p className="mt-2 text-foreground-muted">{t.rd_checked} {checked}</p>}
          </div>
          <ReportForm targetType="event" targetId={ev.id} />
        </aside>
      </section>
    </>,
  );
}
