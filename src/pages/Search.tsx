import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PublicNav } from '@/components/layout/PublicNav';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { SPORTS, findSport } from '@/lib/mockData';
import { SlidersHorizontal, MapPin, BadgeCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type SortKey = 'relevance' | 'price' | 'newest';

interface CoachRow {
  id: string;
  bio: string | null;
  sport: string | null;
  price_per_session: number | null;
  discount_pct: number;
  years_experience: number | null;
  gallery: string[];
  verified: boolean;
  created_at: string;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
    city: string | null;
  } | null;
}

function FilterPanel({
  selectedSports, setSelectedSports,
  city, setCity,
  priceRange, setPriceRange,
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
        <Select value={city || 'any'} onValueChange={(v) => setCity(v === 'any' ? '' : v)}>
          <SelectTrigger><SelectValue placeholder="Any city" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any city</SelectItem>
            <SelectItem value="Nice">Nice</SelectItem>
            <SelectItem value="Monaco">Monaco</SelectItem>
            <SelectItem value="Sofia">Sofia</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-sm font-semibold mb-2 block">
          Price range: €{priceRange[0]} – €{priceRange[1]}
        </Label>
        <Slider value={priceRange} min={0} max={200} step={5} onValueChange={setPriceRange} />
      </div>

      <div className="flex items-center justify-between surface-2 p-3">
        <Label className="text-sm font-medium cursor-pointer" htmlFor="verified-only">Verified only</Label>
        <Switch id="verified-only" checked={verifiedOnly} onCheckedChange={setVerifiedOnly} />
      </div>
    </div>
  );
}

function CoachResultCard({ coach }: { coach: CoachRow }) {
  const sport = coach.sport ? findSport(coach.sport as any) : null;
  const name = coach.profiles?.full_name || 'Coach';
  const avatar = coach.profiles?.avatar_url || `https://i.pravatar.cc/300?u=${coach.id}`;
  const cover = coach.gallery?.[0] || `https://picsum.photos/seed/${coach.id}/800/500`;
  const price = coach.price_per_session ?? 0;
  const finalPrice = coach.discount_pct
    ? Math.round(price * (1 - coach.discount_pct / 100))
    : price;

  return (
    <Link
      to={`/coach/${coach.id}`}
      className="group surface overflow-hidden flex flex-col transition-all hover:border-primary/50"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img src={cover} alt={name} loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        <div className="absolute top-3 left-3 flex gap-2">
          {sport && (
            <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-background/85 backdrop-blur capitalize">
              {sport.label}
            </span>
          )}
          <span className="badge-verified"><BadgeCheck className="h-3 w-3" /> Verified</span>
        </div>
      </div>
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex items-start gap-3">
          <img src={avatar} alt={name} className="h-10 w-10 rounded-full object-cover border border-border" />
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-lg leading-tight truncate">{name}</h3>
            {coach.profiles?.city && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3" /> {coach.profiles.city}
              </p>
            )}
          </div>
        </div>
        <div className="mt-auto pt-2 flex items-end justify-between border-t border-border">
          <div>
            {coach.discount_pct ? (
              <>
                <p className="text-xs text-muted-foreground line-through">€{price}</p>
                <p className="font-semibold text-primary">€{finalPrice}<span className="text-xs text-muted-foreground font-normal">/session</span></p>
              </>
            ) : (
              <p className="font-semibold">€{price}<span className="text-xs text-muted-foreground font-normal">/session</span></p>
            )}
          </div>
          <span className="text-xs font-medium text-primary group-hover:underline">View profile →</span>
        </div>
      </div>
    </Link>
  );
}

const Search = () => {
  const [params] = useSearchParams();

  const [selectedSports, setSelectedSports] = useState<string[]>(
    params.get('sport') ? [params.get('sport')!] : []
  );
  const [city, setCity] = useState(params.get('city') ?? '');
  const [priceRange, setPriceRange] = useState<number[]>([0, 200]);
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [sort, setSort] = useState<SortKey>('relevance');

  const [coaches, setCoaches] = useState<CoachRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('coach_profiles')
        .select('id, bio, sport, price_per_session, discount_pct, years_experience, gallery, verified, created_at, profiles!coach_profiles_id_fkey(full_name, avatar_url, city)')
        .eq('verified', true);
      if (!error && data) setCoaches(data as any);
      setLoading(false);
    })();
  }, []);

  const results = useMemo(() => {
    let list = [...coaches];
    if (selectedSports.length) list = list.filter(c => c.sport && selectedSports.includes(c.sport));
    if (city.trim()) list = list.filter(c => c.profiles?.city?.toLowerCase().includes(city.toLowerCase()));
    list = list.filter(c => {
      const p = c.price_per_session ?? 0;
      return p >= priceRange[0] && p <= priceRange[1];
    });
    if (verifiedOnly) list = list.filter(c => c.verified);

    if (sort === 'price') list.sort((a, b) => (a.price_per_session ?? 0) - (b.price_per_session ?? 0));
    if (sort === 'newest') list.sort((a, b) => b.created_at.localeCompare(a.created_at));
    return list;
  }, [coaches, selectedSports, city, priceRange, verifiedOnly, sort]);

  const filterProps = {
    selectedSports, setSelectedSports,
    city, setCity,
    priceRange, setPriceRange,
    verifiedOnly, setVerifiedOnly,
  };

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNav />

      <main className="flex-1 container py-8">
        <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-3xl md:text-4xl">Coaches</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {loading ? 'Loading…' : `${results.length} results`}
            </p>
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
            {loading ? (
              <div className="surface p-10 text-center text-muted-foreground">Loading coaches…</div>
            ) : results.length === 0 ? (
              <div className="surface p-10 text-center">
                <p className="font-display text-xl">No coaches yet</p>
                <p className="text-muted-foreground text-sm mt-2">
                  Verified coaches will appear here as they join the platform.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {results.map(c => <CoachResultCard key={c.id} coach={c} />)}
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
