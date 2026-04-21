import { Link } from 'react-router-dom';
import { Star, MapPin, BadgeCheck } from 'lucide-react';
import type { Coach } from '@/lib/mockData';
import { discountedPrice, findSport } from '@/lib/mockData';

export function CoachCard({ coach }: { coach: Coach }) {
  const sport = findSport(coach.sport);
  const final = discountedPrice(coach.pricePerSession, coach.discountPct);

  return (
    <Link
      to={`/coach/${coach.slug}`}
      className="group surface overflow-hidden flex flex-col transition-all hover:border-primary/50"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={coach.cover}
          alt={`${coach.name} — ${sport?.label} coach`}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-background/85 backdrop-blur text-foreground capitalize">
            {sport?.label}
          </span>
          {coach.verified && (
            <span className="badge-verified">
              <BadgeCheck className="h-3 w-3" /> Verified
            </span>
          )}
        </div>
        {coach.discountPct ? (
          <div className="absolute top-3 right-3 badge-discount">
            -{coach.discountPct}% Platform rate
          </div>
        ) : null}
      </div>

      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex items-start gap-3">
          <img
            src={coach.avatar}
            alt={coach.name}
            className="h-10 w-10 rounded-full object-cover border border-border"
            loading="lazy"
          />
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-lg leading-tight truncate">{coach.name}</h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin className="h-3 w-3" /> {coach.city}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-sm">
          <Star className="h-4 w-4 fill-primary text-primary" />
          <span className="font-semibold">{coach.rating.toFixed(2)}</span>
          <span className="text-muted-foreground">({coach.reviewCount})</span>
        </div>

        <div className="mt-auto pt-2 flex items-end justify-between border-t border-border">
          <div>
            {coach.discountPct ? (
              <>
                <p className="text-xs text-muted-foreground line-through">€{coach.pricePerSession}</p>
                <p className="font-semibold text-primary">€{final}<span className="text-xs text-muted-foreground font-normal">/session</span></p>
              </>
            ) : (
              <p className="font-semibold">€{coach.pricePerSession}<span className="text-xs text-muted-foreground font-normal">/session</span></p>
            )}
          </div>
          <span className="text-xs font-medium text-primary group-hover:underline">View profile →</span>
        </div>
      </div>
    </Link>
  );
}
