import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { MOCK_CART } from '@/lib/products';
import { toast } from 'sonner';

export function CartDrawer() {
  const [items] = useState(MOCK_CART);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Cart">
          <ShoppingCart className="h-5 w-5" />
          {items.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {items.length}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Your cart</SheetTitle>
          <SheetDescription>{items.length} items ready to checkout</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {items.map(item => (
            <div key={item.id} className="surface p-3 flex gap-3 items-center">
              <img src={item.image} alt={item.name} className="h-16 w-16 rounded-md object-cover" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Qty {item.qty}</p>
              </div>
              <span className="font-display text-primary">€{item.price}</span>
            </div>
          ))}
        </div>

        <SheetFooter className="border-t border-border pt-4">
          <div className="w-full space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="font-display text-2xl text-primary">€{subtotal}</span>
            </div>
            <Button className="w-full" size="lg" onClick={() => toast.success('Checkout flow coming soon.')}>
              Checkout
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
