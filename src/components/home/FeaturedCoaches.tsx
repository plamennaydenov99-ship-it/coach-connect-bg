import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CoachCard } from '@/components/coaches/CoachCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { coaches } from '@/lib/data';

export function FeaturedCoaches() {
  const { t, language } = useLanguage();
  const featuredCoaches = coaches.slice(0, 4);

  return (
    <section className="py-16 bg-secondary/30">
      <div className="container">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="mb-2 text-3xl font-bold">
              {language === 'bg' ? 'Топ треньори' : 'Top Coaches'}
            </h2>
            <p className="text-muted-foreground">
              {language === 'bg' 
                ? 'Високо оценени треньори от цяла България' 
                : 'Highly rated coaches across Bulgaria'}
            </p>
          </div>
          <Link to="/coaches">
            <Button variant="ghost" className="hidden gap-2 sm:flex">
              {t.common.seeAll}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featuredCoaches.map((coach) => (
            <CoachCard key={coach.id} coach={coach} />
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link to="/coaches">
            <Button variant="outline" className="gap-2">
              {t.common.seeAll}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
