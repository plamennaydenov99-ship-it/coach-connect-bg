import { BadgeCheck, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { Product } from '@/lib/products';

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="surface overflow-hidden flex flex-col transition hover:border-gold/50">
      <div className="relative aspect-square overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
        />
        <span
          className={`absolute right-2 top-2 rounded-md px-2 py-0.5 text-[10px] font-semibold backdrop-blur ${
            product.stock === 'in'
              ? 'bg-success/15 text-success'
              : 'bg-amber-500/15 text-amber-400'
          }`}
        >
          {product.stock === 'in' ? 'In stock' : 'Low stock'}
        </span>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="font-medium">{product.club}</span>
          <BadgeCheck className="h-3.5 w-3.5 text-gold" />
        </div>
        <h3 className="mt-1 font-display text-lg leading-tight">{product.name}</h3>
        <Badge variant="secondary" className="mt-2 self-start">
          {product.category}
        </Badge>
        <div className="mt-auto pt-4 flex items-center justify-between gap-3">
          <span className="font-display text-2xl text-gold">€{product.price}</span>
          <Button
            size="sm"
            onClick={() => toast.success(`${product.name} added to cart`)}
          >
            <ShoppingCart className="h-4 w-4" /> Add
          </Button>
        </div>
      </div>
    </article>
  );
}
