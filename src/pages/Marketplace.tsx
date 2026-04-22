import { useMemo, useState } from 'react';
import { PublicNav } from '@/components/layout/PublicNav';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { PRODUCTS, PRODUCT_CATEGORIES, type ProductCategory } from '@/lib/products';
import { cn } from '@/lib/utils';

type Filter = 'All' | ProductCategory;

export default function Marketplace() {
  const [filter, setFilter] = useState<Filter>('All');

  const filtered = useMemo(
    () => (filter === 'All' ? PRODUCTS : PRODUCTS.filter(p => p.category === filter)),
    [filter],
  );

  const filters: Filter[] = ['All', ...PRODUCT_CATEGORIES];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <PublicNav />

      <main className="flex-1 container py-10 md:py-14">
        <header className="mb-8">
          <h1 className="font-display text-4xl md:text-5xl">Club Shop</h1>
          <p className="mt-2 text-muted-foreground">
            Gear and merch from your favourite clubs.
          </p>
        </header>

        <div className="flex flex-wrap gap-2 mb-8 border-b border-border pb-4">
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition-colors',
                filter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground',
              )}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
