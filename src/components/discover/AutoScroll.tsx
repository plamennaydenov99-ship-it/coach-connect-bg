import { useEffect, useRef, useState, type ReactNode } from 'react';

/** Advances existing scroll content, never duplicates actionable cards. */
export function AutoScroll({ children, label, ticker = false }: { children: ReactNode; label: string; ticker?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const node = ref.current;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!node || paused) return;
    const interval = window.setInterval(() => {
      if (reduced.matches || node.scrollWidth <= node.clientWidth) return;
      const end = node.scrollWidth - node.clientWidth;
      node.scrollTo({ left: node.scrollLeft >= end - 2 ? 0 : node.scrollLeft + (ticker ? 180 : 300), behavior: 'smooth' });
    }, ticker ? 2200 : 4500);
    return () => window.clearInterval(interval);
  }, [paused, ticker]);
  return <div ref={ref} role="region" aria-label={label} tabIndex={0}
    onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
    onTouchStart={() => setPaused(true)} onPointerDown={() => setPaused(true)}
    onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}
    className={`flex gap-4 overflow-x-auto pb-3 ${ticker ? '' : 'snap-x snap-mandatory'}`}>{children}</div>;
}
