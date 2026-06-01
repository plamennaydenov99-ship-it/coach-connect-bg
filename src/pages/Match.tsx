import { AnnouncementBar } from '@/components/layout/AnnouncementBar';
import { PublicNav } from '@/components/layout/PublicNav';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { MatchingSection } from '@/components/home/MatchingSection';

export default function Match() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AnnouncementBar />
      <PublicNav />
      <main className="flex-1">
        <MatchingSection />
      </main>
      <PublicFooter />
    </div>
  );
}
