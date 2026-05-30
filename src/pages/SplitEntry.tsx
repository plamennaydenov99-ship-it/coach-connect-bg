import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Zap } from 'lucide-react';

export default function SplitEntry() {
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem('atleta_role');
    if (saved === 'athlete') navigate('/athlete', { replace: true });
    else if (saved === 'coach') navigate('/dashboard', { replace: true });
  }, [navigate]);

  const pick = (role: 'athlete' | 'coach') => {
    localStorage.setItem('atleta_role', role);
    navigate(role === 'athlete' ? '/athlete' : '/dashboard');
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-background">
      <div className="flex h-full w-full flex-col md:flex-row">
        {/* Athlete panel */}
        <button
          onClick={() => pick('athlete')}
          className="group relative flex flex-1 items-center justify-center overflow-hidden min-h-[50vh] md:min-h-0 transition-[flex] duration-700 md:hover:flex-[1.15] text-left"
          style={{ backgroundColor: '#0A0E14' }}
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 14px)',
            }}
          />
          <div className="absolute inset-0 bg-athlete opacity-0 transition-opacity duration-700 group-hover:opacity-40" />
          <img
            src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1600&q=80"
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-10 grayscale transition-all duration-700 group-hover:opacity-25 group-hover:scale-105"
          />
          <div className="relative z-10 px-8 md:px-16 max-w-xl">
            <span className="label-eyebrow text-foreground-muted">Athlete Mode</span>
            <h2 className="mt-4 font-display text-[16vw] md:text-[7vw] leading-[0.85] text-secondary">
              I AM AN<br />ATHLETE
            </h2>
            <p className="mt-5 text-foreground-muted max-w-sm font-body">
              Discover certified coaches, join clubs, and find events near you.
            </p>
            <div className="mt-8 inline-flex items-center gap-3 border border-border-hover text-secondary px-5 py-3 font-display uppercase tracking-[0.15em] text-sm transition-colors group-hover:border-foreground group-hover:text-foreground">
              Enter Athlete App <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </button>

        {/* Divider + logo */}
        <div className="relative hidden md:flex w-px items-center justify-center" style={{ background: 'hsl(var(--border-hover) / 0.5)' }}>
          <div className="absolute z-20 flex h-16 w-16 items-center justify-center bg-background border border-border-hover">
            <Zap className="h-7 w-7 text-foreground" strokeWidth={2} />
          </div>
        </div>

        {/* Coach panel */}
        <button
          onClick={() => pick('coach')}
          className="group relative flex flex-1 items-center justify-center overflow-hidden min-h-[50vh] md:min-h-0 transition-[flex] duration-700 md:hover:flex-[1.15] text-left"
          style={{ backgroundColor: '#0A120E' }}
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 14px)',
            }}
          />
          <div className="absolute inset-0 bg-coach-accent opacity-0 transition-opacity duration-700 group-hover:opacity-40" />
          <img
            src="https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1600&q=80"
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-10 grayscale transition-all duration-700 group-hover:opacity-25 group-hover:scale-105"
          />
          <div className="relative z-10 px-8 md:px-16 max-w-xl">
            <span className="label-eyebrow text-foreground-muted">Coach / Club Mode</span>
            <h2 className="mt-4 font-display text-[16vw] md:text-[7vw] leading-[0.85] text-secondary">
              I AM A<br />COACH / CLUB
            </h2>
            <p className="mt-5 text-foreground-muted max-w-sm font-body">
              Build your profile, grow your client base, and manage bookings.
            </p>
            <div className="mt-8 inline-flex items-center gap-3 border border-border-hover text-secondary px-5 py-3 font-display uppercase tracking-[0.15em] text-sm transition-colors group-hover:border-foreground group-hover:text-foreground">
              Enter Coach Dashboard <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
