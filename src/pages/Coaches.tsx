import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, SlidersHorizontal, Map, Grid3X3, X } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CoachCard } from '@/components/coaches/CoachCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useLanguage } from '@/contexts/LanguageContext';
import { coaches, sports, cities } from '@/lib/data';

const Coaches = () => {
  const { t, language } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Filter state
  const [selectedSport, setSelectedSport] = useState(searchParams.get('sport') || '');
  const [selectedCity, setSelectedCity] = useState(searchParams.get('city') || '');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sessionType, setSessionType] = useState<'all' | '1v1' | 'group'>('all');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 200 });

  // Apply filters
  const filteredCoaches = useMemo(() => {
    return coaches.filter((coach) => {
      if (selectedSport && !coach.specializations.includes(selectedSport)) return false;
      if (selectedCity && coach.city !== selectedCity) return false;
      if (verifiedOnly && !coach.verified) return false;
      if (coach.priceFrom < priceRange.min || coach.priceFrom > priceRange.max) return false;
      return true;
    });
  }, [selectedSport, selectedCity, verifiedOnly, priceRange]);

  const activeFilters = [
    selectedSport && { key: 'sport', value: t.sports[selectedSport as keyof typeof t.sports] },
    selectedCity && { key: 'city', value: t.cities[selectedCity as keyof typeof t.cities] },
    verifiedOnly && { key: 'verified', value: t.filters.verified },
  ].filter(Boolean);

  const clearFilters = () => {
    setSelectedSport('');
    setSelectedCity('');
    setVerifiedOnly(false);
    setSessionType('all');
    setPriceRange({ min: 0, max: 200 });
  };

  const FiltersContent = () => (
    <div className="space-y-6">
      {/* Sport */}
      <div>
        <label className="mb-2 block text-sm font-medium">{t.filters.sport}</label>
        <Select value={selectedSport} onValueChange={setSelectedSport}>
          <SelectTrigger>
            <SelectValue placeholder={language === 'bg' ? 'Всички спортове' : 'All sports'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{language === 'bg' ? 'Всички спортове' : 'All sports'}</SelectItem>
            {sports.map((sport) => (
              <SelectItem key={sport} value={sport}>
                {t.sports[sport as keyof typeof t.sports]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* City */}
      <div>
        <label className="mb-2 block text-sm font-medium">{t.filters.city}</label>
        <Select value={selectedCity} onValueChange={setSelectedCity}>
          <SelectTrigger>
            <SelectValue placeholder={language === 'bg' ? 'Всички градове' : 'All cities'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{language === 'bg' ? 'Всички градове' : 'All cities'}</SelectItem>
            {cities.map((city) => (
              <SelectItem key={city} value={city}>
                {t.cities[city as keyof typeof t.cities]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Session Type */}
      <div>
        <label className="mb-2 block text-sm font-medium">{t.filters.sessionType}</label>
        <div className="flex gap-2">
          <Button
            variant={sessionType === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSessionType('all')}
          >
            {language === 'bg' ? 'Всички' : 'All'}
          </Button>
          <Button
            variant={sessionType === '1v1' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSessionType('1v1')}
          >
            {t.filters.oneOnOne}
          </Button>
          <Button
            variant={sessionType === 'group' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSessionType('group')}
          >
            {t.filters.group}
          </Button>
        </div>
      </div>

      {/* Price Range */}
      <div>
        <label className="mb-2 block text-sm font-medium">{t.filters.priceRange}</label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="0"
            value={priceRange.min}
            onChange={(e) => setPriceRange({ ...priceRange, min: Number(e.target.value) })}
            className="w-24"
          />
          <span className="text-muted-foreground">—</span>
          <Input
            type="number"
            placeholder="200"
            value={priceRange.max}
            onChange={(e) => setPriceRange({ ...priceRange, max: Number(e.target.value) })}
            className="w-24"
          />
          <span className="text-sm text-muted-foreground">{t.common.bgn}</span>
        </div>
      </div>

      {/* Verified Only */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="verified"
          checked={verifiedOnly}
          onCheckedChange={(checked) => setVerifiedOnly(checked as boolean)}
        />
        <label htmlFor="verified" className="text-sm font-medium cursor-pointer">
          {t.filters.verified}
        </label>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4">
        <Button variant="outline" className="flex-1" onClick={clearFilters}>
          {t.filters.clearAll}
        </Button>
        <Button className="flex-1" onClick={() => setFiltersOpen(false)}>
          {t.filters.apply}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="container py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="mb-2">
              {language === 'bg' ? 'Намери треньор' : 'Find a Coach'}
            </h1>
            <p className="text-muted-foreground">
              {filteredCoaches.length} {language === 'bg' ? 'треньора намерени' : 'coaches found'}
            </p>
          </div>

          {/* Toolbar */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {/* Mobile filter button */}
              <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="gap-2 lg:hidden">
                    <SlidersHorizontal className="h-4 w-4" />
                    {t.filters.sport}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80">
                  <SheetHeader>
                    <SheetTitle>{language === 'bg' ? 'Филтри' : 'Filters'}</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FiltersContent />
                  </div>
                </SheetContent>
              </Sheet>

              {/* Active filters */}
              {activeFilters.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  {activeFilters.map((filter: any) => (
                    <Badge key={filter.key} variant="secondary" className="gap-1 pr-1">
                      {filter.value}
                      <button
                        onClick={() => {
                          if (filter.key === 'sport') setSelectedSport('');
                          if (filter.key === 'city') setSelectedCity('');
                          if (filter.key === 'verified') setVerifiedOnly(false);
                        }}
                        className="ml-1 rounded-full p-0.5 hover:bg-muted"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    {t.filters.clearAll}
                  </Button>
                </div>
              )}
            </div>

            {/* View mode toggle */}
            <div className="flex items-center gap-1 rounded-lg bg-secondary p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'map' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('map')}
              >
                <Map className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Main content */}
          <div className="flex gap-8">
            {/* Desktop sidebar */}
            <aside className="hidden w-72 shrink-0 lg:block">
              <div className="sticky top-24 rounded-2xl bg-card p-6 shadow-card">
                <h3 className="mb-6 font-semibold">
                  {language === 'bg' ? 'Филтри' : 'Filters'}
                </h3>
                <FiltersContent />
              </div>
            </aside>

            {/* Results */}
            <div className="flex-1">
              {viewMode === 'grid' ? (
                filteredCoaches.length > 0 ? (
                  <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredCoaches.map((coach) => (
                      <CoachCard key={coach.id} coach={coach} />
                    ))}
                  </div>
                ) : (
                  <div className="py-16 text-center">
                    <Filter className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                    <h3 className="mb-2 text-lg font-semibold">{t.common.noResults}</h3>
                    <p className="text-muted-foreground">{t.common.tryAdjusting}</p>
                    <Button variant="outline" className="mt-4" onClick={clearFilters}>
                      {t.filters.clearAll}
                    </Button>
                  </div>
                )
              ) : (
                <div className="flex h-[600px] items-center justify-center rounded-2xl bg-secondary">
                  <div className="text-center">
                    <Map className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      {language === 'bg' ? 'Картата ще бъде налична скоро' : 'Map view coming soon'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Coaches;
