import { Link } from 'react-router-dom';
import { User, Tag, MapPin, Users, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface CardProps {
  icon: React.ReactNode;
  title: string;
  sub: string;
  cta: string;
  to?: string;
  disabled?: boolean;
}

function HeroCard({ icon, title, sub, cta, to, disabled }: CardProps) {
  const inner = (
    <div
      className={`group relative h-full p-8 md:p-10 transition-colors duration-300 border ${
        disabled
          ? 'border-border bg-background-secondary opacity-60 cursor-not-allowed'
          : 'border-border bg-background-secondary hover:border-gold'
      }`}
      style={{ borderRadius: '4px' }}
    >
      {!disabled && (
        <div className="absolute top-0 left-0 right-0 h-px bg-transparent group-hover:bg-navy-hover transition-colors duration-300" />
      )}
      <div className="text-foreground-subtle group-hover:text-gold transition-colors duration-300">
        {icon}
      </div>
      <h3 className="mt-6 font-display text-xl text-foreground leading-tight">{title}</h3>
      <p className="mt-2 text-sm font-body text-foreground-muted leading-relaxed">{sub}</p>
      <div
        className={`mt-6 inline-flex items-center gap-2 font-display uppercase tracking-[0.08em] text-[13px] ${
          disabled ? 'text-foreground-subtle' : 'text-gold'
        }`}
      >
        {cta} {!disabled && <ArrowRight className="h-3.5 w-3.5" />}
      </div>
    </div>
  );

  if (disabled || !to) return inner;
  return <Link to={to} className="block h-full">{inner}</Link>;
}

export function HeroBanner() {
  const { t } = useLanguage();
  return (
    <section className="border-b border-border bg-background">
      <div className="container py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <HeroCard
            icon={<User className="h-6 w-6" strokeWidth={1.25} />}
            title={t.find_coach_title}
            sub={t.find_coach_sub}
            cta={t.find_coach_cta}
            to="/search"
          />
          <HeroCard
            icon={<Tag className="h-6 w-6" strokeWidth={1.25} />}
            title={t.offers_title}
            sub={t.offers_sub}
            cta={t.offers_cta}
            to="/marketplace"
          />
          <HeroCard
            icon={<MapPin className="h-6 w-6" strokeWidth={1.25} />}
            title={t.events_title}
            sub={t.events_sub}
            cta={t.events_cta}
            to="/events"
          />
          <HeroCard
            icon={<Users className="h-6 w-6" strokeWidth={1.25} />}
            title={t.community_title}
            sub={t.community_sub}
            cta={t.community_cta}
            disabled
          />
        </div>
      </div>
    </section>
  );
}
