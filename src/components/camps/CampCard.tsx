import { Link } from 'react-router-dom';
import { MapPin, Calendar } from 'lucide-react';
import { type Camp, campImage } from '@/lib/camps';
import { useLanguage } from '@/context/LanguageContext';
import { lift } from '@/lib/ui';

export function CampCard({ camp }: { camp: Camp }) {
  const { t } = useLanguage();
  const lowSpots = camp.spotsLeft < 10;

  return (
    <div className={`group flex flex-col overflow-hidden bg-background-secondary ${lift}`}>
      <div className="relative aspect-[2/1] overflow-hidden bg-muted">
        <img
          src={campImage(camp.image)}
          alt={camp.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 bg-background px-2.5 py-1 text-sm font-semibold text-foreground">{camp.sport}</span>
        <span className="absolute right-3 top-3 bg-foreground px-2.5 py-1 text-sm font-semibold text-background">{camp.duration}</span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="t-plain text-xl">{camp.name}</h3>
        <p className="text-sm text-foreground-muted">{camp.coach}</p>

        <div className="mt-1 flex flex-col gap-1.5 text-sm text-foreground-muted">
          <p className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {camp.city}</p>
          <p className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {camp.dates}</p>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span className="bg-background px-2.5 py-1 text-sm font-medium">{camp.ageGroup}</span>
          <span className="bg-background px-2.5 py-1 text-sm font-medium">{camp.level}</span>
        </div>

        <div className="mt-auto flex items-end justify-between pt-4">
          <div>
            <p className="font-display text-4xl font-extrabold leading-none">{camp.price}</p>
            <p className={`mt-1.5 text-sm ${lowSpots ? 'font-semibold text-accent' : 'text-foreground-muted'}`}>{camp.spotsLeft} {t.spots_left}</p>
          </div>
          <Link to={`/camps/${camp.id}`} className="inline-flex h-11 items-center bg-primary px-5 font-display text-base font-bold uppercase tracking-[0.02em] text-primary-foreground transition-colors hover:bg-primary-hover">
            {t.view_camp}
          </Link>
        </div>
      </div>
    </div>
  );
}
