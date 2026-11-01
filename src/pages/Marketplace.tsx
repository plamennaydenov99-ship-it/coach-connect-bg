import { useMemo, useState } from 'react';
import { PublicNav } from '@/components/layout/PublicNav';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { PageHeader } from '@/components/layout/PageHeader';
import { chip, lift } from '@/lib/ui';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { FloatingCartButton } from '@/components/marketplace/FloatingCartButton';
import { PRODUCTS, PRODUCT_CATEGORIES, type ProductCategory } from '@/lib/products';
import { useLanguage } from '@/context/LanguageContext';

type Filter = 'All' | ProductCategory;

export default function Marketplace() {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<Filter>('All');

  const filtered = useMemo(
    () => (filter === 'All' ? PRODUCTS : PRODUCTS.filter(p => p.category === filter)),
    [filter],
  );

  const filters: Filter[] = ['All', ...PRODUCT_CATEGORIES];
  const label = (f: Filter) => (f === 'All' ? t.shop_all : f);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <PublicNav />

      <main className="flex-1">
        <PageHeader title={t.shop_title} sub={t.shop_sub} tone="sand" />
        <div className="container py-12 md:py-16">
        <div className="mb-8 flex flex-wrap gap-1.5">
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={chip(filter === f)}
            >
              {label(f)}
            </button>
          ))}
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        </div>
      </main>

      <PublicFooter />
      <FloatingCartButton />
    </div>
  );
}
