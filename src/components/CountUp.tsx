import { useEffect, useState } from 'react';

/** Animate presentation only; retain the original precision and suffix. */
export function CountUp({ value }: { value: string }) {
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    const match = value.match(/^(-?\d+(?:\.\d+)?)(.*)$/);
    if (!match || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(value);
      return;
    }
    const target = Number(match[1]);
    const decimals = match[1].split('.')[1]?.length ?? 0;
    const suffix = match[2];
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / 1000);
      setDisplay((target * (1 - Math.pow(1 - progress, 3))).toFixed(decimals) + suffix);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <span aria-label={value}><span aria-hidden="true">{display}</span></span>;
}