import type { ReactNode } from 'react';

const TONES = {
  ink: 'bg-foreground text-[#F3EDE2]',
  blue: 'bg-primary text-primary-foreground',
  clay: 'bg-accent text-white',
  sand: 'bg-background-secondary text-foreground',
} as const;

/** The title band that opens every page: one huge condensed line, a short sentence beside it. */
export function PageHeader({ title, sub, tone = 'ink', image, children }: { title: ReactNode; sub?: ReactNode; tone?: keyof typeof TONES; image?: string; children?: ReactNode }) {
  return (
    <section className={`relative overflow-hidden ${TONES[tone]}`}>
      {image && (<>
        <img src={image} alt="" className="absolute inset-0 h-full w-full animate-[kb_34s_ease-in-out_infinite_alternate] object-cover" />
        <div className="absolute inset-0 bg-foreground/55" />
      </>)}
      <div className="container relative grid items-end gap-x-8 gap-y-6 py-14 md:grid-cols-12 md:py-20">
        <h1 className="max-w-[16ch] md:col-span-8" style={{ fontSize: 'clamp(52px, 8.5vw, 132px)', lineHeight: 0.9, color: 'inherit' }}>{title}</h1>
        {sub && <p className="max-w-[34ch] text-lg md:col-span-4 md:text-xl">{sub}</p>}
        {children && <div className="md:col-span-12">{children}</div>}
      </div>
    </section>
  );
}
