import { Link } from 'react-router-dom';
import { ArrowUpRight, BadgeCheck, MapPin } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { sportLabel } from '@/lib/trending';

const TONES = [
  'bg-foreground text-[#F3EDE2]',
  'bg-primary text-primary-foreground',
  'bg-accent text-white',
  'bg-background-tertiary text-foreground',
];
const hash = (s: string) => [...s].reduce((a, c) => a + c.charCodeAt(0), 0);

export type CoachTileData = { id: string; name: string; avatar: string | null; city: string | null; sports: string[]; price: number; verified: boolean };

/** A coach as a poster: photo or colour block, giant name, price, an arrow that moves on hover. */
export function CoachTile({ coach, index = 0 }: { coach: CoachTileData; index?: number }) {
  const { t, lang } = useLanguage();
  const tone = TONES[hash(coach.sports[0] ?? coach.name) % TONES.length];
  const light = coach.avatar || !tone.includes('background-tertiary');
  return (
    <Link
      to={`/coaches/${coach.id}`}
      style={{ animationDelay: `${Math.min(index, 11) * 70}ms` }}
      className={`group relative flex aspect-[4/5] animate-fade-up-in flex-col justify-between overflow-hidden transition-transform duration-500 hover:-translate-y-2 ${coach.avatar ? 'bg-foreground text-[#F3EDE2]' : tone}`}
    >
      {coach.avatar ? (
        <>
          <img src={coach.avatar} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.07]" />
          <div className="absolute inset-0 bg-foreground/45 transition-colors duration-500 group-hover:bg-foreground/25" />
        </>
      ) : (
        <span aria-hidden="true" className="pointer-events-none absolute -bottom-10 -right-3 select-none font-display font-extrabold leading-none opacity-[0.16] transition-transform duration-[1400ms] ease-out group-hover:-translate-x-3 group-hover:-translate-y-3" style={{ fontSize: 'clamp(220px, 22vw, 340px)' }}>
          {coach.name.trim()[0]}
        </span>
      )}
      <div className="relative flex flex-wrap gap-1.5 p-5">
        {coach.sports.slice(0, 2).map(s => <span key={s} className={`px-2.5 py-1 text-sm font-semibold ${light ? 'bg-[#F3EDE2] text-foreground' : 'bg-foreground text-background'}`}>{sportLabel(s, lang)}</span>)}
        {coach.verified && <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-sm font-semibold ${light ? 'bg-[#F3EDE2] text-foreground' : 'bg-foreground text-background'}`}><BadgeCheck className="h-4 w-4" aria-hidden="true" />{t.tn_verified}</span>}
      </div>
      <div className="relative p-5">
        <h3 className="font-display text-4xl font-extrabold uppercase leading-[0.92] [overflow-wrap:anywhere] md:text-5xl">{coach.name}</h3>
        {coach.city && <p className="mt-2 flex items-center gap-1.5 text-base opacity-90"><MapPin className="h-4 w-4" aria-hidden="true" />{coach.city}</p>}
        <div className="mt-5 flex items-end justify-between gap-3">
          <p className="font-display text-5xl font-extrabold leading-none">{coach.price > 0 ? `€${coach.price}` : <span className="text-2xl">{t.tn_ask_price}</span>}{coach.price > 0 && <span className="ml-1.5 font-sans text-sm font-normal">{t.tn_per_session}</span>}</p>
          <span className="grid h-12 w-12 shrink-0 place-items-center bg-[#F3EDE2] text-foreground transition-transform duration-500 group-hover:-translate-y-1 group-hover:translate-x-1" aria-hidden="true"><ArrowUpRight className="h-5 w-5" /></span>
        </div>
      </div>
    </Link>
  );
}
