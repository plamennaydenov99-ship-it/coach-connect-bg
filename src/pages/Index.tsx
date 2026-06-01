import { AnnouncementBar } from '@/components/layout/AnnouncementBar';
import { PublicNav } from '@/components/layout/PublicNav';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { SplitHero } from '@/components/home/SplitHero';
import { HeroBanner } from '@/components/home/HeroBanner';
import { MatchingSection } from '@/components/home/MatchingSection';
import { EventsSlider } from '@/components/marketplace/EventsSlider';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AnnouncementBar />
      <PublicNav />
      <main className="flex-1">
        <SplitHero />
        <HeroBanner />
        <MatchingSection />
        <EventsSlider />
      </main>
      <PublicFooter />
    </div>
  );
};

export default Index;
