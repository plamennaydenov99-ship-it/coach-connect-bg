import { Link } from 'react-router-dom';
import { MapPin, Calendar } from 'lucide-react';
import { type Camp, campImage } from '@/lib/camps';
import { useLanguage } from '@/context/LanguageContext';

export function CampCard({ camp }: { camp: Camp }) {
  const { t } = useLanguage();
  const lowSpots = camp.spotsLeft < 10;

  return (
    <div className="group flex flex-col bg-card border border-border hover:border-accent-electric transition-colors rounded-sm overflow-hidden">
      <div className="relative aspect-[2/1] overflow-hidden bg-muted">
        <img
          src={campImage(camp.image)}
          alt={camp.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <span className="absolute top-3 left-3 px-2 py-1 bg-background/85 backdrop-blur font-display uppercase tracking-[0.12em] text-[11px] text-foreground rounded-sm">
          {camp.sport}
        </span>
        <span className="absolute top-3 right-3 px-2 py-1 bg-background/85 backdrop-blur font-display uppercase tracking-[0.12em] text-[11px] text-accent-electric rounded-sm">
          {camp.duration}
        </span>
      </div>

      <div className="flex flex-col gap-2 p-4 flex-1">
        <h3 className="font-display text-[18px] leading-tight text-foreground">{camp.name}</h3>
        <p className="text-[13px] text-foreground-muted font-body">{camp.coach}</p>

        <div className="flex flex-col gap-1.5 mt-1">
          <p className="flex items-center gap-1.5 text-[13px] text-foreground-muted">
            <MapPin className="h-3.5 w-3.5" /> {camp.city}
          </p>
          <p className="flex items-center gap-1.5 text-[13px] text-foreground-muted">
            <Calendar className="h-3.5 w-3.5" /> {camp.dates}
          </p>
        </div>

        <div className="flex items-center gap-2 mt-1">
          <span className="text-[12px] text-foreground-muted">{camp.ageGroup}</span>
          <span className="text-foreground-subtle">·</span>
          <span className="px-2 py-0.5 text-[11px] font-display uppercase tracking-[0.1em] border border-border text-foreground-muted rounded-sm">
            {camp.level}
          </span>
        </div>

        <div className="mt-auto pt-3 border-t border-border flex items-end justify-between">
          <div>
            <p className="font-display text-[20px] text-foreground leading-none">{camp.price}</p>
            <p className={`text-[12px] mt-1 ${lowSpots ? 'text-accent-electric' : 'text-foreground-muted'}`}>
              {camp.spotsLeft} {t.spots_left}
            </p>
          </div>
          <Link
            to={`/camps/${camp.id}`}
            className="px-3 py-2 border border-border-hover font-display uppercase tracking-[0.12em] text-[12px] text-foreground hover:bg-accent-electric hover:text-primary-foreground hover:border-accent-electric transition-colors rounded-sm"
          >
            {t.view_camp}
          </Link>
        </div>
      </div>
    </div>
  );
}
