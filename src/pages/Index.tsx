import { PublicNav } from '@/components/layout/PublicNav';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { HeroSection } from '@/components/home/HeroSection';
import { ManifestoSection } from '@/components/home/ManifestoSection';
import { PillarsSection } from '@/components/home/PillarsSection';
import { FeaturedCoaches } from '@/components/home/FeaturedCoaches';
import { ClosingCTA } from '@/components/home/ClosingCTA';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNav />
      <main className="flex-1">
        <HeroSection />
        <ManifestoSection />
        <PillarsSection />
        <FeaturedCoaches />
        <ClosingCTA />
      </main>
      <PublicFooter />
    </div>
  );
};

export default Index;
