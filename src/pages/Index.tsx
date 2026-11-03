import { PublicFooter } from '@/components/layout/PublicFooter';
import { Concierge, Doors, ForCoachesBand, JoinBand, Why } from '@/components/home/HomeSections';
import { useLanguage } from '@/context/LanguageContext';
import { usePageMeta } from '@/hooks/usePageMeta';

const Index = () => {
  const { t } = useLanguage();
  usePageMeta(t.meta_home_t, t.meta_home_d);
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1">
        <Concierge />
        <Doors />
        <Why />
        <ForCoachesBand />
        <JoinBand />
      </main>
      <PublicFooter />
    </div>
  );
};

export default Index;
