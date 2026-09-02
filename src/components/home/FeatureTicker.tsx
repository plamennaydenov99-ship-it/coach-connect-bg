import { useLanguage } from '@/context/LanguageContext';

export function FeatureTicker() {
  const { t } = useLanguage();
  const ITEMS = [
    { title: t.ticker_1_title, body: t.ticker_1_body },
    { title: t.ticker_2_title, body: t.ticker_2_body },
    { title: t.ticker_3_title, body: t.ticker_3_body },
    { title: t.ticker_4_title, body: t.ticker_4_body },
    { title: t.ticker_5_title, body: t.ticker_5_body },
    { title: t.ticker_6_title, body: t.ticker_6_body },
  ];
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
