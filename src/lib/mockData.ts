// The list of sports Lokka knows about, and the pilot city.

export type SportSlug =
  | 'football' | 'tennis' | 'padel' | 'basketball' | 'swimming' | 'boxing'
  | 'bjj' | 'yoga' | 'running' | 'cycling' | 'golf' | 'crossfit';

export interface Sport {
  slug: SportSlug;
  label: string;
  labelBg: string;
  icon: string;
}

export const SPORTS: Sport[] = [
  { slug: 'football', label: 'Football', labelBg: 'Футбол', icon: 'Goal' },
  { slug: 'tennis', label: 'Tennis', labelBg: 'Тенис', icon: 'Trophy' },
  { slug: 'padel', label: 'Padel', labelBg: 'Падел', icon: 'CircleDot' },
  { slug: 'basketball', label: 'Basketball', labelBg: 'Баскетбол', icon: 'Dribbble' },
  { slug: 'swimming', label: 'Swimming', labelBg: 'Плуване', icon: 'Waves' },
  { slug: 'boxing', label: 'Boxing', labelBg: 'Бокс', icon: 'Swords' },
  { slug: 'bjj', label: 'BJJ', labelBg: 'Джу-Джицу', icon: 'Shield' },
  { slug: 'yoga', label: 'Yoga', labelBg: 'Йога', icon: 'Flower2' },
  { slug: 'running', label: 'Running', labelBg: 'Бягане', icon: 'Footprints' },
  { slug: 'cycling', label: 'Cycling', labelBg: 'Колоездене', icon: 'Bike' },
  { slug: 'golf', label: 'Golf', labelBg: 'Голф', icon: 'Flag' },
  { slug: 'crossfit', label: 'CrossFit', labelBg: 'КросФит', icon: 'Dumbbell' },
];

// Pilot city: Sofia first
export const CITIES_EN = ['Sofia'];
export const CITIES_BG = ['София'];
export const CITIES = CITIES_EN;

export const findSport = (slug: string) => SPORTS.find(s => s.slug === slug);
