import { Link } from 'react-router-dom';
import { ArrowUpRight, MapPin } from 'lucide-react';
import type { ReactNode } from 'react';

const TONES = [
  'bg-foreground text-[#F3EDE2]',
  'bg-primary text-primary-foreground',
  'bg-accent text-white',
  'bg-background-tertiary text-foreground',
];
export const posterTone = (i: number) => TONES[i % TONES.length];

/** Events and camps as posters: a giant date, a title, one line of facts, an arrow. */
export function Poster({ index, to, big, small, chips, title, place, foot, cta }: {
  index: number; to?: string; big: string; small: string; chips?: string[]; title: string; place?: string; foot?: ReactNode; cta?: string;
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-[120px] font-extrabold leading-[0.8] tabular-nums transition-transform duration-500 group-hover:-translate-y-1 md:text-[140px]">{big}</p>
          <p className="mt-2 font-display text-2xl font-extrabold uppercase">{small}</p>
        </div>
        <div className="flex flex-wrap justify-end gap-1.5">{(chips ?? []).map(c => <span key={c} className="bg-[#F3EDE2] px-2.5 py-1 text-sm font-semibold text-foreground">{c}</span>)}</div>
      </div>
      <div>
        <h3 className="font-display text-3xl font-extrabold uppercase leading-[0.95] [overflow-wrap:anywhere] md:text-4xl">{title}</h3>
        {place && <p className="mt-2 flex items-center gap-1.5 text-base opacity-90"><MapPin className="h-4 w-4" aria-hidden="true" />{place}</p>}
        <div className="mt-5 flex items-end justify-between gap-3">
          <div className="min-w-0 text-base">{foot}</div>
          {to ? (
            <span className="inline-flex h-12 shrink-0 items-center gap-2 bg-[#F3EDE2] px-4 font-display text-base font-bold uppercase text-foreground transition-transform duration-500 group-hover:-translate-y-1 group-hover:translate-x-1">{cta}<ArrowUpRight className="h-5 w-5" aria-hidden="true" /></span>
          ) : null}
        </div>
      </div>
    </>
  );
  const cls = `group flex min-h-[420px] animate-fade-up-in flex-col justify-between gap-8 p-6 transition-transform duration-500 hover:-translate-y-2 md:p-7 ${posterTone(index)}`;
  const style = { animationDelay: `${Math.min(index, 11) * 70}ms` };
  return to ? <Link to={to} className={cls} style={style}>{body}</Link> : <article className={cls} style={style}>{body}</article>;
}
