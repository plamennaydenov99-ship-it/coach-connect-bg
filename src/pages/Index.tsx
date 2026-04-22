import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Search, MapPin, Trophy, ArrowRight, Shield, Sparkles, MessageSquare } from 'lucide-react';
import * as Icons from 'lucide-react';
import { PublicNav } from '@/components/layout/PublicNav';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CoachCard } from '@/components/marketplace/CoachCard';
import { EventsSlider } from '@/components/marketplace/EventsSlider';
import { COACHES, SPORTS } from '@/lib/mockData';

const Index = () => {
  const navigate = useNavigate();
  const [sport, setSport] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [level, setLevel] = useState<string>('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (sport) params.set('sport', sport);
    if (city) params.set('city', city);
    if (level) params.set('level', level);
    navigate(`/search?${params.toString()}`);
  };

  const featured = COACHES.slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNav />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border">
          <div
            className="absolute inset-0 -z-10 opacity-30"
            style={{
              background:
                'radial-gradient(60% 50% at 70% 20%, hsl(150 65% 49% / 0.25), transparent 60%), radial-gradient(50% 40% at 10% 80%, hsl(150 65% 49% / 0.15), transparent 60%)',
            }}
          />
          <div className="container py-20 md:py-28 max-w-5xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground mb-6">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Verified coaches · Exclusive platform rates
            </div>
            <h1 className="font-display leading-[1.05]">
              Find your perfect<br />sports coach.
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-2xl">
              Discover verified coaches and clubs near you — book sessions at exclusive platform rates.
            </p>

            {/* Search bar */}
            <form
              onSubmit={handleSearch}
              className="mt-8 surface p-3 grid gap-2 md:grid-cols-[1fr_1fr_1fr_auto] md:gap-2"
            >
              <div className="relative">
                <Trophy className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Select value={sport} onValueChange={setSport}>
                  <SelectTrigger className="pl-9 h-12 bg-transparent border-0 focus:ring-0">
                    <SelectValue placeholder="Sport" />
                  </SelectTrigger>
                  <SelectContent>
                    {SPORTS.map(s => (
                      <SelectItem key={s.slug} value={s.slug}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="City"
                  className="pl-9 h-12 bg-transparent border-0 focus-visible:ring-0"
                />
              </div>

              <div className="relative">
                <Shield className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger className="pl-9 h-12 bg-transparent border-0 focus:ring-0">
                    <SelectValue placeholder="Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" size="lg" className="h-12 px-6">
                <Search className="h-4 w-4 mr-2" /> Search
              </Button>
            </form>
          </div>
        </section>

        {/* Events slider */}
        <EventsSlider />

        {/* Sport categories */}
        <section className="container py-16 md:py-20">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="font-display">Browse by sport</h2>
              <p className="text-muted-foreground mt-2">Pick a discipline to see coaches and clubs.</p>
            </div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {SPORTS.map(s => {
              const Icon = (Icons as any)[s.icon] ?? Icons.Trophy;
              return (
                <button
                  key={s.slug}
                  onClick={() => navigate(`/search?sport=${s.slug}`)}
                  className="surface p-4 flex flex-col items-center gap-3 hover:border-primary/50 hover:bg-card transition-all group"
                >
                  <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium">{s.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* How it works */}
        <section className="container py-16 md:py-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-display">How it works</h2>
            <p className="text-muted-foreground mt-2">From browsing to booking in three simple steps.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { n: '01', title: 'Search & discover', body: 'Filter by sport, city, level and price. Compare verified coaches and clubs.', icon: Search },
              { n: '02', title: 'Book at exclusive rates', body: 'Send an enquiry and unlock platform discounts unavailable elsewhere.', icon: Sparkles },
              { n: '03', title: 'Train and review', body: 'Show up, train hard, then leave a review to help the next athlete.', icon: Trophy },
            ].map(step => (
              <div key={step.n} className="surface p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="font-display text-2xl text-primary">{step.n}</span>
                  <step.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <h3 className="font-display text-xl mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Featured coaches */}
        <section className="container py-16 md:py-20">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="font-display">Featured coaches</h2>
              <p className="text-muted-foreground mt-2">Top-rated, hand-picked for you this week.</p>
            </div>
            <Button variant="ghost" onClick={() => navigate('/search')} className="hidden md:inline-flex">
              View all <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
          <div className="overflow-x-auto pb-3 -mx-4 px-4 md:mx-0 md:px-0 md:overflow-visible">
            <div className="flex md:grid md:grid-cols-4 gap-4 min-w-max md:min-w-0">
              {featured.map(c => (
                <div key={c.slug} className="w-72 md:w-auto shrink-0">
                  <CoachCard coach={c} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="container py-16 md:py-20">
          <div className="surface p-10 md:p-14 text-center">
            <MessageSquare className="h-8 w-8 mx-auto text-primary mb-4" />
            <h2 className="font-display">Are you a coach?</h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
              Join Atleta and grow your client base with a profile that converts. Free to start, simple to scale.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button size="lg" onClick={() => navigate('/register')}>Become a coach</Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/dashboard')}>See dashboard demo</Button>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
};

export default Index;
