import { PublicFooter } from '@/components/layout/PublicFooter';
import { Concierge, Doors, ForCoachesBand, JoinBand, Why } from '@/components/home/HomeSections';

const Index = () => {
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
