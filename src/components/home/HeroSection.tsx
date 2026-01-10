import { Search, MapPin } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';

export function HeroSection() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/coaches?q=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <section className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 hero-gradient" />
      
      {/* Decorative shapes */}
      <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-white/5 blur-3xl" />

      <div className="container relative py-20 md:py-32">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
            <MapPin className="h-4 w-4" />
            <span>Bulgaria's #1 Coach Marketplace</span>
          </div>

          {/* Title */}
          <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-white md:text-5xl lg:text-6xl">
            {t.hero.title}
          </h1>

          {/* Subtitle */}
          <p className="mb-10 text-lg text-white/80 md:text-xl">
            {t.hero.subtitle}
          </p>

          {/* Search box */}
          <form onSubmit={handleSearch} className="mx-auto max-w-2xl">
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-0">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={t.hero.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-14 rounded-2xl border-0 bg-white pl-12 pr-4 text-base shadow-xl placeholder:text-muted-foreground sm:rounded-r-none"
                />
              </div>
              <Button 
                type="submit"
                size="xl" 
                className="rounded-2xl sm:rounded-l-none"
              >
                {t.hero.ctaSearch}
              </Button>
            </div>
          </form>

          {/* Popular searches */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            <span className="text-sm text-white/60">Popular:</span>
            {['fitness', 'yoga', 'boxing', 'tennis'].map((sport) => (
              <button
                key={sport}
                onClick={() => navigate(`/coaches?sport=${sport}`)}
                className="rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/20"
              >
                {t.sports[sport as keyof typeof t.sports]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
