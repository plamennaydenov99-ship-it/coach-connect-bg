import { Link, NavLink } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X, Zap, Sparkles } from 'lucide-react';
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
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur">
      <div className="container flex h-16 md:h-20 items-center justify-between gap-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="flex h-10 w-10 items-center justify-center bg-foreground text-background rounded-sm">
            <Zap className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <span className="font-display text-2xl md:text-3xl tracking-wider">ATLETA</span>
        </Link>

        {/* Center nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {links.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `font-condensed uppercase tracking-wider text-sm font-semibold px-4 py-2 rounded-sm transition-colors ${
                  isActive
                    ? 'text-foreground bg-card'
                    : 'text-muted-foreground hover:text-foreground hover:bg-card'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        {/* Right CTAs */}
        <div className="hidden md:flex items-center gap-2">
          <Link to="/search">
            <Button
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-transparent font-condensed uppercase tracking-wider font-bold rounded-sm h-10"
            >
              For Athletes
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button
              variant="outline"
              className="border-coach text-coach hover:bg-coach hover:text-coach-foreground bg-transparent font-condensed uppercase tracking-wider font-bold rounded-sm h-10"
            >
              For Coaches & Clubs
            </Button>
          </Link>
          <Link to="/search">
            <Button
              className="bg-foreground text-background hover:bg-foreground/90 font-condensed uppercase tracking-wider font-bold rounded-sm h-11 px-5 text-sm"
            >
              <Sparkles className="h-4 w-4 mr-2" /> Find Your Match
            </Button>
          </Link>
          <CartDrawer />
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <CartDrawer />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background lg:hidden">
          <div className="container space-y-2 py-4">
            {links.map(l => (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)}>
                <Button variant="ghost" className="w-full justify-start font-condensed uppercase tracking-wider">
                  {l.label}
                </Button>
              </Link>
            ))}
            <div className="my-2 h-px bg-border" />
            <Link to="/search" onClick={() => setOpen(false)} className="block">
              <Button className="w-full border border-primary text-primary bg-transparent hover:bg-primary hover:text-primary-foreground font-condensed uppercase tracking-wider rounded-sm">
                For Athletes
              </Button>
            </Link>
            <Link to="/dashboard" onClick={() => setOpen(false)} className="block">
              <Button className="w-full border border-coach text-coach bg-transparent hover:bg-coach hover:text-coach-foreground font-condensed uppercase tracking-wider rounded-sm">
                For Coaches & Clubs
              </Button>
            </Link>
            <Link to="/search" onClick={() => setOpen(false)} className="block">
              <Button className="w-full bg-foreground text-background hover:bg-foreground/90 font-condensed uppercase tracking-wider rounded-sm">
                Find Your Match
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
