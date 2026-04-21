import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-card/40 mt-20">
      <div className="container py-12 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Zap className="h-4 w-4" strokeWidth={2.5} />
            </div>
            <span className="font-display text-lg">Atleta</span>
          </Link>
          <p className="mt-3 text-sm text-muted-foreground max-w-sm">
            The marketplace for verified sports coaches. Discover, enquire, and train at exclusive platform rates.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold mb-3">Explore</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/search" className="hover:text-foreground">Find a coach</Link></li>
            <li><Link to="/search?type=club" className="hover:text-foreground">Browse clubs</Link></li>
            <li><Link to="/for-coaches" className="hover:text-foreground">For coaches</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold mb-3">Company</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/" className="hover:text-foreground">About</Link></li>
            <li><Link to="/" className="hover:text-foreground">Help centre</Link></li>
            <li><Link to="/" className="hover:text-foreground">Privacy</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container py-5 text-xs text-muted-foreground flex flex-wrap justify-between gap-2">
          <span>© {new Date().getFullYear()} Atleta. All rights reserved.</span>
          <span>Made for athletes, by athletes.</span>
        </div>
      </div>
    </footer>
  );
}
