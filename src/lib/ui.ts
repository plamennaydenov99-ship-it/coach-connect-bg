/** Flat square filter button: dark when on, sand when off. */
export const chip = (on: boolean) =>
  `h-11 px-4 text-base font-medium transition-colors ${on ? 'bg-foreground text-background' : 'bg-background-secondary text-foreground hover:bg-background-tertiary'}`;

/** A card that lifts a little on hover. */
export const lift = 'transition-transform duration-500 ease-out hover:-translate-y-2';
