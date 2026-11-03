import { PublicNav } from '@/components/layout/PublicNav';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { MatchingSection } from '@/components/home/MatchingSection';
import { useLanguage } from '@/context/LanguageContext';
import { usePageMeta } from '@/hooks/usePageMeta';

export default function Match() {
  const { t } = useLanguage();
  usePageMeta(t.meta_match_t, t.meta_match_d);
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNav />
      <main className="flex-1">
        <MatchingSection />
      </main>
      <PublicFooter />
    </div>
  );
}
