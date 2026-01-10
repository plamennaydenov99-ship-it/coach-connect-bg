import { Link } from 'react-router-dom';
import { Star, CheckCircle2, MapPin, Globe2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Coach } from '@/lib/data';

interface CoachCardProps {
  coach: Coach;
}

export function CoachCard({ coach }: CoachCardProps) {
  const { t } = useLanguage();

  return (
    <article className="group card-elevated overflow-hidden">
      {/* Cover image */}
      <div className="relative h-40 overflow-hidden">
        <img
          src={coach.coverPhotos[0] || '/placeholder.svg'}
          alt=""
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {/* Type badge */}
        {coach.type === 'company' && (
          <Badge className="absolute right-3 top-3 bg-card/90 text-foreground backdrop-blur-sm">
            Club
          </Badge>
        )}
      </div>

      <div className="p-5">
        {/* Avatar and basic info */}
        <div className="-mt-12 mb-4 flex items-end gap-4">
          <img
            src={coach.avatarUrl}
            alt={coach.displayName}
            className="h-20 w-20 rounded-2xl border-4 border-card object-cover shadow-lg"
          />
          <div className="mb-1 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">{coach.displayName}</h3>
              {coach.verified && (
                <CheckCircle2 className="h-4 w-4 text-primary" />
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {t.cities[coach.city as keyof typeof t.cities]}
            </div>
          </div>
        </div>

        {/* Rating and experience */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-warning text-warning" />
            <span className="font-semibold">{coach.ratingAvg.toFixed(1)}</span>
            <span className="text-sm text-muted-foreground">
              ({coach.ratingCount} {t.coach.reviews})
            </span>
          </div>
          <span className="text-sm text-muted-foreground">
            {coach.experienceYears} {t.coach.years}
          </span>
        </div>

        {/* Specializations */}
        <div className="mb-4 flex flex-wrap gap-1.5">
          {coach.specializations.slice(0, 3).map((spec) => (
            <Badge key={spec} variant="secondary" className="rounded-lg text-xs">
              {t.sports[spec as keyof typeof t.sports] || spec}
            </Badge>
          ))}
          {coach.specializations.length > 3 && (
            <Badge variant="secondary" className="rounded-lg text-xs">
              +{coach.specializations.length - 3}
            </Badge>
          )}
        </div>

        {/* Languages */}
        <div className="mb-5 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Globe2 className="h-3.5 w-3.5" />
          <span>{t.coach.speaks}:</span>
          {coach.languages.map((lang) => (
            <span key={lang} className="font-medium uppercase">
              {lang}
            </span>
          ))}
        </div>

        {/* Price and CTA */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground">{t.coach.fromPrice}</span>
            <div className="price-tag text-lg text-foreground">
              {coach.priceFrom} <span className="text-sm">{t.common.bgn}</span>
            </div>
          </div>
          <Link to={`/coach/${coach.id}`}>
            <Button>{t.coach.viewProfile}</Button>
          </Link>
        </div>
      </div>
    </article>
  );
}
