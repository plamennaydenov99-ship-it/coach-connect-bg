import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnnouncementBar } from '@/components/layout/AnnouncementBar';
import { PublicNav } from '@/components/layout/PublicNav';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { FeatureTicker } from '@/components/home/FeatureTicker';
import { MatchingSection, type MatchAnswers } from '@/components/home/MatchingSection';
import { EventsSlider } from '@/components/marketplace/EventsSlider';
import { CoachCard } from '@/components/marketplace/CoachCard';
import { Button } from '@/components/ui/button';
import { COACHES } from '@/lib/mockData';
import { ArrowRight, RefreshCw } from 'lucide-react';

export default function AthleteHome() {
  const [filters, setFilters] = useState<MatchAnswers>({});
  const navigate = useNavigate();

  const filtered = COACHES.filter(c => {
    if (filters.sport && c.sport !== filters.sport) return false;
    if (filters.city && !c.city.toLowerCase().includes(filters.city.toLowerCase())) return false;
    return true;
  });
  const preview = (filtered.length ? filtered : COACHES).slice(0, 4);

  const switchRole = () => {
    localStorage.removeItem('atleta_role');
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AnnouncementBar />
      <PublicNav />

      <main className="flex-1">
        <MatchingSection onMatch={setFilters} />
        <FeatureTicker />
        <EventsSlider />

        {/* Coach preview */}
        <section id="coach-preview" className="container py-16 md:py-20">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <span className="label-eyebrow text-primary">
                {Object.keys(filters).length ? 'Your matches' : 'Featured coaches'}
              </span>
              <h2 className="font-display mt-2">
                {filters.sport
                  ? `Top ${filters.sport} coaches${filters.city ? ` in ${filters.city}` : ''}`
                  : 'Top coaches near you'}
              </h2>
            </div>
            <Link to="/search" className="hidden md:block">
              <Button variant="ghost">
                Browse all <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>

          {preview.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {preview.map(c => <CoachCard key={c.slug} coach={c} />)}
            </div>
          ) : (
            <div className="border border-border bg-card p-12 text-center">
              <p className="text-foreground-muted font-body">
                No coaches match yet — we'll have more soon.
              </p>
            </div>
          )}

          <div className="mt-8 flex justify-center md:hidden">
            <Link to="/search">
              <Button variant="outline">
                Browse all <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <PublicFooter />

      {/* Switch user link */}
      <button
        onClick={switchRole}
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 border border-border-hover bg-background-secondary px-3 py-2 text-xs font-display uppercase tracking-[0.12em] text-foreground-muted hover:text-foreground hover:border-primary transition-colors"
      >
        <RefreshCw className="h-3 w-3" /> Not you? Switch
      </button>
    </div>
  );
}
