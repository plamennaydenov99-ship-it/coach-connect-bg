import { BadgeCheck, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import type { Product } from '@/lib/products';
import { lift } from '@/lib/ui';

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className={`surface flex flex-col overflow-hidden ${lift}`}>
      <div className="relative aspect-square overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
        />
        <span className={`absolute left-3 top-3 px-2.5 py-1 text-sm font-semibold ${product.stock === 'in' ? 'bg-background text-foreground' : 'bg-accent text-white'}`}>
          {product.stock === 'in' ? 'In stock' : 'Low stock'}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-1.5 text-sm text-foreground-muted">
          <span className="font-medium">{product.club}</span>
          <BadgeCheck className="h-4 w-4 text-primary" />
        </div>
        <h3 className="t-plain mt-1 text-xl">{product.name}</h3>
        <span className="mt-2 self-start bg-background px-2.5 py-1 text-sm font-medium">{product.category}</span>
        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <span className="font-display text-4xl font-extrabold leading-none">€{product.price}</span>
          <button
            type="button"
            onClick={() => toast.success(`${product.name} added to cart`)}
            className="inline-flex h-11 items-center gap-2 bg-primary px-5 font-display text-base font-bold uppercase tracking-[0.02em] text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            <ShoppingCart className="h-4 w-4" /> Add
          </button>
        </div>
      </div>
    </article>
  );
}
