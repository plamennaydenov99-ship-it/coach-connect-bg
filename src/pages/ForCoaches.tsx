import { Link, useNavigate } from 'react-router-dom';
import { PublicNav } from '@/components/layout/PublicNav';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { Button } from '@/components/ui/button';
import { ArrowRight, BarChart3, MessageSquare, Sparkles, Wallet } from 'lucide-react';

const ForCoaches = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col">
      <PublicNav />
      <main className="flex-1">
        <section className="border-b border-border">
          <div className="container py-20 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground mb-5">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> For coaches & clubs
            </div>
            <h1 className="font-display">Grow your client base. <span className="text-primary">Keep your edge.</span></h1>
            <p className="mt-5 text-lg text-muted-foreground">
              List your services, manage enquiries, and reach motivated athletes — all from one dashboard.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button size="lg" onClick={() => navigate('/register')}>Get started — free</Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/dashboard')}>
                See dashboard demo <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </section>

        <section className="container py-16 grid gap-4 md:grid-cols-3">
          {[
            { icon: BarChart3, title: 'Profile analytics', body: 'Track views, enquiries, and conversion in real time.' },
            { icon: MessageSquare, title: 'In-app messaging', body: 'Reply to leads without sharing personal contact info.' },
            { icon: Wallet, title: 'Pro features', body: 'Verified badge, platform discounts, priority placement.' },
          ].map(f => (
            <div key={f.title} className="surface p-6">
              <f.icon className="h-6 w-6 text-primary mb-3" />
              <h3 className="font-display text-xl">{f.title}</h3>
              <p className="text-sm text-muted-foreground mt-2">{f.body}</p>
            </div>
          ))}
        </section>
      </main>
      <PublicFooter />
    </div>
  );
};

export default ForCoaches;
