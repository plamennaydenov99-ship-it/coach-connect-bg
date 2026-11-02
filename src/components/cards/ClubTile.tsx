import { Link } from 'react-router-dom';
import { ArrowUpRight, BadgeCheck, MapPin } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { sportLabel } from '@/lib/trending';
import type { ClubCardData } from '@/hooks/useClubs';

const TONES = [
  'bg-foreground text-[#F3EDE2]',
  'bg-primary text-primary-foreground',
  'bg-accent text-white',
  'bg-background-tertiary text-foreground',
];
const hash = (s: string) => [...s].reduce((a, c) => a + c.charCodeAt(0), 0);
const initials = (name: string) => name.trim().split(/\s+/).filter(w => /^[\p{L}\p{N}]/u.test(w)).slice(0, 2).map(w => [...w][0]).join('').toUpperCase() || '·';

/** A club as a poster: colour block, giant initials, where it is, and whether it has joined yet. */
export function ClubTile({ club, index = 0 }: { club: ClubCardData; index?: number }) {
  const { t, lang } = useLanguage();
  const tone = TONES[hash(club.sports[0] ?? club.name) % TONES.length];
  const light = !tone.includes('background-tertiary');
  const chip = light ? 'bg-[#F3EDE2] text-foreground' : 'bg-foreground text-background';
  const where = club.address || club.district;
  return (
    <Link
      to={club.to}
      style={{ animationDelay: `${Math.min(index, 11) * 70}ms` }}
      className={`group relative flex aspect-[4/5] animate-fade-up-in flex-col justify-between overflow-hidden transition-transform duration-500 hover:-translate-y-2 ${tone}`}
    >
      <span aria-hidden="true" className="pointer-events-none absolute -bottom-10 -right-3 select-none font-display font-extrabold leading-none opacity-[0.16] transition-transform duration-[1400ms] ease-out group-hover:-translate-x-3 group-hover:-translate-y-3" style={{ fontSize: 'clamp(200px, 20vw, 320px)' }}>
        {initials(club.name)}
      </span>
      <div className="relative flex flex-wrap gap-1.5 p-5">
        {club.sports.slice(0, 2).map(s => <span key={s} className={`px-2.5 py-1 text-sm font-semibold ${chip}`}>{sportLabel(s, lang)}</span>)}
        {club.verified && <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-sm font-semibold ${chip}`}><BadgeCheck className="h-4 w-4" aria-hidden="true" />{t.tn_verified}</span>}
        {!club.claimed && <span className="border border-current px-2.5 py-1 text-sm font-semibold opacity-90">{t.rd_unclaimed}</span>}
      </div>
      <div className="relative p-5">
        <h3 className="font-display text-4xl font-extrabold uppercase leading-[0.92] [overflow-wrap:anywhere] md:text-[2.6rem]">{club.name}</h3>
        {where && <p className="mt-2 flex items-start gap-1.5 text-base opacity-90"><MapPin className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" /><span className="line-clamp-2">{where}</span></p>}
        <div className="mt-5 flex items-end justify-end">
          <span className="grid h-12 w-12 shrink-0 place-items-center bg-[#F3EDE2] text-foreground transition-transform duration-500 group-hover:-translate-y-1 group-hover:translate-x-1" aria-hidden="true"><ArrowUpRight className="h-5 w-5" /></span>
        </div>
      </div>
    </Link>
  );
}
