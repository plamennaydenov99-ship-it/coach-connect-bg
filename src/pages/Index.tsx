import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { AnnouncementBar } from '@/components/layout/AnnouncementBar';
import { PublicNav } from '@/components/layout/PublicNav';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { HeroSection } from '@/components/home/SplitHero';
import { HeroBanner } from '@/components/home/HeroBanner';
import { MatchingSection, type MatchAnswers } from '@/components/home/MatchingSection';
import { EventsSlider } from '@/components/marketplace/EventsSlider';
import { CoachCard } from '@/components/marketplace/CoachCard';
import { CampCard } from '@/components/camps/CampCard';
import { PostCard } from '@/components/community/PostCard';
import { Button } from '@/components/ui/button';
import { COACHES } from '@/lib/mockData';
import { CAMPS } from '@/lib/camps';
import { COMMUNITY_POSTS } from '@/lib/communityData';
import { useLanguage } from '@/context/LanguageContext';

function CoachPreviewSection({ filters }: { filters: MatchAnswers }) {
  const { t } = useLanguage();
  const filtered = COACHES.filter(c => {
    if (filters.sport && c.sport !== filters.sport) return false;
    if (filters.city && !c.city.toLowerCase().includes(filters.city.toLowerCase())) return false;
    return true;
  });
  const preview = (filtered.length ? filtered : COACHES).slice(0, 4);

  return (
    <section id="coach-preview" className="container py-16 md:py-20">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <span className="label-eyebrow text-accent-electric">
            {Object.keys(filters).length ? t.your_matches : t.featured_coaches}
          </span>
          <h2 className="font-display mt-2">{t.top_coaches_near}</h2>
        </div>
        <Link to="/search" className="hidden md:block">
          <Button variant="ghost">
            {t.browse_all} <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </div>

      {preview.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {preview.map(c => <CoachCard key={c.slug} coach={c} />)}
        </div>
      ) : (
        <div className="border border-border bg-card p-12 text-center">
          <p className="text-foreground-muted font-body">{t.no_matches}</p>
        </div>
      )}
    </section>
  );
}

function CampsPreviewSection() {
  const { t } = useLanguage();
  const campsPreview = CAMPS.slice(0, 3);
  return (
    <section className="container py-16 md:py-20 border-t border-border">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <span className="label-eyebrow text-accent-electric">{t.camps_preview_title}</span>
          <p className="mt-2 text-foreground-muted font-body normal-case max-w-xl">{t.camps_preview_sub}</p>
        </div>
        <Link to="/camps" className="hidden md:block">
          <Button variant="ghost">
            {t.view_all_camps} <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {campsPreview.map(c => <CampCard key={c.id} camp={c} />)}
      </div>
      <div className="mt-8 flex justify-center md:hidden">
        <Link to="/camps">
          <Button variant="outline">
            {t.view_all_camps} <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </div>
    </section>
  );
}

function CommunityPreviewSection() {
  const { t } = useLanguage();
  const communityPreview = COMMUNITY_POSTS.filter(p => p.type === 'thread').slice(0, 3);
  return (
    <section className="bg-background-secondary border-y border-border py-16 md:py-20">
      <div className="container">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl md:text-4xl text-foreground">{t.community_preview_title}</h2>
            <p className="mt-2 text-foreground-muted font-body normal-case max-w-xl">{t.community_preview_sub}</p>
          </div>
          <Link to="/community" className="hidden md:block">
            <Button variant="ghost">
              {t.go_to_community} <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {communityPreview.map(p => <PostCard key={p.id} post={p} />)}
        </div>
        <div className="mt-8 flex justify-center md:hidden">
          <Link to="/community">
            <Button variant="outline">
              {t.go_to_community} <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

const Index = () => {
  const [filters, setFilters] = useState<MatchAnswers>({});

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AnnouncementBar />
      <PublicNav />
      <main className="flex-1">
        <HeroSection />
        <HeroBanner />
        <MatchingSection onMatch={setFilters} />
        <CoachPreviewSection filters={filters} />
        <CampsPreviewSection />
        <CommunityPreviewSection />
        <EventsSlider />
      </main>
      <PublicFooter />
    </div>
  );
};

export default Index;
