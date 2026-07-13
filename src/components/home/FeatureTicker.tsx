const ITEMS = [
  { title: 'Find Your Coach', body: 'Match with certified professionals' },
  { title: 'Find Your Club', body: 'Discover clubs near you' },
  { title: 'Events Near You', body: 'Marathons, tournaments, camps' },
  { title: 'Connect With Athletes', body: 'Build your sports network' },
  { title: 'Exclusive Discounts', body: 'Members-only deals on gear' },
  { title: 'Elevate Your Game', body: 'Track progress, level up' },
];

export function FeatureTicker() {
  const loop = [...ITEMS, ...ITEMS];
  return (
    <section className="border-y border-border bg-background py-6 overflow-hidden pause-on-hover">
      <div className="flex w-max gap-0 animate-marquee">
        {loop.map((it, i) => (
          <div
            key={i}
            className="group flex items-center gap-3 px-8 py-3 min-w-[300px] border-r border-border-hover/40"
          >
            <span className="text-gold text-sm">◆</span>
            <div>
              <div className="font-display uppercase tracking-[0.12em] text-foreground-subtle group-hover:text-foreground-muted transition-colors text-sm">
                {it.title}
              </div>
              <div className="text-foreground-subtle text-xs mt-0.5 font-body">{it.body}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
