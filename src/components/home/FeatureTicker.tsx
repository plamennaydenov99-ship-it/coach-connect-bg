const ITEMS = [
  { icon: '🏃', title: 'Find Your Coach', body: 'Match with certified professionals' },
  { icon: '🏟️', title: 'Find Your Club', body: 'Discover clubs near you' },
  { icon: '📍', title: 'Events Near You', body: 'Marathons, tournaments, camps' },
  { icon: '🤝', title: 'Connect With Athletes', body: 'Build your sports network' },
  { icon: '🏷️', title: 'Exclusive Discounts', body: 'Members-only deals on gear' },
  { icon: '⚡', title: 'Elevate Your Game', body: 'Track progress, level up' },
];

export function FeatureTicker() {
  const loop = [...ITEMS, ...ITEMS];
  return (
    <section className="border-y border-border bg-card py-6 overflow-hidden pause-on-hover">
      <div className="flex w-max gap-4 animate-marquee">
        {loop.map((it, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border border-border bg-background px-6 py-4 min-w-[320px]"
          >
            <span className="text-3xl">{it.icon}</span>
            <div>
              <div className="font-condensed font-bold uppercase tracking-wider text-foreground text-sm">
                {it.title}
              </div>
              <div className="text-muted-foreground text-xs mt-0.5">{it.body}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
