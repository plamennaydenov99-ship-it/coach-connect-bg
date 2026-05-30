import { Link, NavLink } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CartDrawer } from '@/components/marketplace/CartDrawer';

export function PublicNav() {
  const [open, setOpen] = useState(false);

  const links = [
    { to: '/search', label: 'Find a Coach' },
    { to: '/events', label: 'Events' },
    { to: '/marketplace', label: 'Shop' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background">
      <div className="container flex h-16 md:h-20 items-center justify-between gap-6">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center bg-foreground text-background rounded-sm">
            <Zap className="h-4 w-4" strokeWidth={2.5} />
          </div>
          <span className="font-display text-2xl md:text-3xl tracking-[0.08em] font-semibold text-foreground">ATLETA</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-8">
          {links.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `font-display uppercase tracking-[0.12em] text-sm font-semibold transition-colors ${
                  isActive ? 'text-foreground' : 'text-foreground-muted hover:text-foreground'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link to="/dashboard">
            <Button variant="outline" className="h-10">I'm a Coach</Button>
          </Link>
          <Link to="/search">
            <Button className="h-10">Find Match</Button>
          </Link>
          <CartDrawer />
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <CartDrawer />
          <Button variant="ghost" size="icon" onClick={() => setOpen(!open)} aria-label="Toggle menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background lg:hidden">
          <div className="container space-y-2 py-4">
            {links.map(l => (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">{l.label}</Button>
              </Link>
            ))}
            <div className="my-2 h-px bg-border" />
            <Link to="/dashboard" onClick={() => setOpen(false)} className="block">
              <Button variant="outline" className="w-full">I'm a Coach</Button>
            </Link>
            <Link to="/search" onClick={() => setOpen(false)} className="block">
              <Button className="w-full">Find Match</Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
