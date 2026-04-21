import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PublicNav } from '@/components/layout/PublicNav';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { CoachCard } from '@/components/marketplace/CoachCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { COACHES, SPORTS } from '@/lib/mockData';
import { SlidersHorizontal, Star } from 'lucide-react';

type SortKey = 'relevance' | 'rating' | 'price' | 'newest';

function FilterPanel({
  selectedSports, setSelectedSports,
  city, setCity,
  type, setType,
  priceRange, setPriceRange,
  minRating, setMinRating,
  verifiedOnly, setVerifiedOnly,
}: any) {
  return (
    <div className="space-y-6">
      <div>
        <Label className="text-sm font-semibold mb-3 block">Sport</Label>
        <div className="space-y-2 max-h-56 overflow-y-auto pr-2">
          {SPORTS.map(s => (
            <label key={s.slug} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={selectedSports.includes(s.slug)}
                onCheckedChange={(v) => {
                  setSelectedSports(v
                    ? [...selectedSports, s.slug]
                    : selectedSports.filter((x: string) => x !== s.slug));
                }}
              />
              {s.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-sm font-semibold mb-2 block">City</Label>
        <Input value={city} onChange={e => setCity(e.target.value)} placeholder="Any city" />
      </div>

      <div>
        <Label className="text-sm font-semibold mb-2 block">Type</Label>
        <div className="flex gap-2">
          {(['all', 'coach', 'club'] as const).map(t => (
            <Button
              key={t}
              type="button"
              variant={type === t ? 'default' : 'outline'}
              size="sm"
              onClick={() => setType(t)}
              className="capitalize flex-1"
            >
              {t}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-sm font-semibold mb-2 block">
          Price range: €{priceRange[0]} – €{priceRange[1]}
        </Label>
        <Slider
          value={priceRange}
          min={0}
          max={150}
          step={5}
          onValueChange={setPriceRange}
        />
      </div>

      <div>
        <Label className="text-sm font-semibold mb-2 block">Min rating</Label>
        <div className="flex gap-1">
          {[0, 3, 4, 4.5].map(r => (
            <Button
              key={r}
              type="button"
              variant={minRating === r ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMinRating(r)}
              className="flex-1"
            >
              {r === 0 ? 'Any' : <><Star className="h-3 w-3 mr-1 fill-current" /> {r}+</>}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between surface-2 p-3">
        <Label className="text-sm font-medium cursor-pointer" htmlFor="verified-only">Verified only</Label>
        <Switch id="verified-only" checked={verifiedOnly} onCheckedChange={setVerifiedOnly} />
      </div>
    </div>
  );
}

const Search = () => {
  const [params] = useSearchParams();

  const [selectedSports, setSelectedSports] = useState<string[]>(
    params.get('sport') ? [params.get('sport')!] : []
  );
  const [city, setCity] = useState(params.get('city') ?? '');
  const [type, setType] = useState<'all' | 'coach' | 'club'>(
    (params.get('type') as any) ?? 'all'
  );
  const [priceRange, setPriceRange] = useState<number[]>([0, 150]);
  const [minRating, setMinRating] = useState(0);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>('relevance');

  const results = useMemo(() => {
    let list = [...COACHES];
    if (selectedSports.length) list = list.filter(c => selectedSports.includes(c.sport));
    if (city.trim()) list = list.filter(c => c.city.toLowerCase().includes(city.toLowerCase()));
    list = list.filter(c => c.pricePerSession >= priceRange[0] && c.pricePerSession <= priceRange[1]);
    if (minRating) list = list.filter(c => c.rating >= minRating);
    if (verifiedOnly) list = list.filter(c => c.verified);

    if (sort === 'rating') list.sort((a, b) => b.rating - a.rating);
    if (sort === 'price') list.sort((a, b) => a.pricePerSession - b.pricePerSession);
    if (sort === 'newest') list.reverse();
    return list;
  }, [selectedSports, city, priceRange, minRating, verifiedOnly, sort]);

  const filterProps = {
    selectedSports, setSelectedSports,
    city, setCity,
    type, setType,
    priceRange, setPriceRange,
    minRating, setMinRating,
    verifiedOnly, setVerifiedOnly,
  };

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNav />

      <main className="flex-1 container py-8">
        <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-3xl md:text-4xl">Coaches & clubs</h1>
            <p className="text-muted-foreground mt-1 text-sm">{results.length} results</p>
          </div>

          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="md:hidden">
                  <SlidersHorizontal className="h-4 w-4 mr-2" /> Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[320px] overflow-y-auto">
                <SheetHeader><SheetTitle>Filters</SheetTitle></SheetHeader>
                <div className="mt-6"><FilterPanel {...filterProps} /></div>
              </SheetContent>
            </Sheet>

            <Select value={sort} onValueChange={(v: SortKey) => setSort(v)}>
              <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Sort: Relevance</SelectItem>
                <SelectItem value="rating">Sort: Rating</SelectItem>
                <SelectItem value="price">Sort: Price</SelectItem>
                <SelectItem value="newest">Sort: Newest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-[260px_1fr]">
          <aside className="hidden md:block surface p-5 h-fit sticky top-20">
            <FilterPanel {...filterProps} />
          </aside>

          <div>
            {results.length === 0 ? (
              <div className="surface p-10 text-center">
                <p className="font-display text-xl">No results</p>
                <p className="text-muted-foreground text-sm mt-2">Try widening your filters.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {results.map(c => <CoachCard key={c.slug} coach={c} />)}
              </div>
            )}
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};

export default Search;
