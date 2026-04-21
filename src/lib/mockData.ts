// Centralized mock data for the sports marketplace prototype.

export type SportSlug =
  | 'football' | 'tennis' | 'padel' | 'basketball' | 'swimming' | 'boxing'
  | 'bjj' | 'yoga' | 'running' | 'cycling' | 'golf' | 'crossfit';

export interface Sport {
  slug: SportSlug;
  label: string;
  icon: string; // lucide name
}

export const SPORTS: Sport[] = [
  { slug: 'football', label: 'Football', icon: 'Goal' },
  { slug: 'tennis', label: 'Tennis', icon: 'Trophy' },
  { slug: 'padel', label: 'Padel', icon: 'CircleDot' },
  { slug: 'basketball', label: 'Basketball', icon: 'Dribbble' },
  { slug: 'swimming', label: 'Swimming', icon: 'Waves' },
  { slug: 'boxing', label: 'Boxing', icon: 'Swords' },
  { slug: 'bjj', label: 'BJJ', icon: 'Shield' },
  { slug: 'yoga', label: 'Yoga', icon: 'Flower2' },
  { slug: 'running', label: 'Running', icon: 'Footprints' },
  { slug: 'cycling', label: 'Cycling', icon: 'Bike' },
  { slug: 'golf', label: 'Golf', icon: 'Flag' },
  { slug: 'crossfit', label: 'CrossFit', icon: 'Dumbbell' },
];

export const CITIES = ['Lisbon', 'Porto', 'Cascais', 'Faro', 'Braga', 'Coimbra'];

export interface Review {
  id: string;
  author: string;
  avatar: string;
  rating: number;
  text: string;
  date: string;
}

export interface Coach {
  slug: string;
  name: string;
  avatar: string;
  cover: string;
  gallery: string[];
  sport: SportSlug;
  city: string;
  bio: string;
  specialisms: string[];
  rating: number;
  reviewCount: number;
  pricePerSession: number; // EUR
  discountPct?: number; // platform discount
  verified: boolean;
  yearsExperience: number;
  sessionsCompleted: number;
  reviews: Review[];
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'All levels';
}

const pic = (seed: number) => `https://picsum.photos/seed/sport${seed}/800/500`;
const av = (seed: number) => `https://i.pravatar.cc/300?img=${seed}`;

const mkReviews = (seed: number, count: number): Review[] => {
  const samples = [
    'Incredible coach. Pushed me harder than I thought possible — saw real progress in 4 weeks.',
    'Patient, clear, and a great communicator. Highly recommend for anyone starting out.',
    'Top tier technical knowledge. Took my game to the next level.',
    'Sessions are fun, structured, and challenging. Best decision I made this year.',
    'Professional, punctual, and genuinely cares about your goals.',
  ];
  const names = ['Sofia M.', 'Diogo R.', 'Inês P.', 'Tiago L.', 'Mariana C.', 'André S.'];
  return Array.from({ length: count }, (_, i) => ({
    id: `r${seed}-${i}`,
    author: names[(seed + i) % names.length],
    avatar: av(20 + ((seed + i) % 30)),
    rating: 4 + ((seed + i) % 2),
    text: samples[(seed + i) % samples.length],
    date: `${2 + (i % 8)} weeks ago`,
  }));
};

export const COACHES: Coach[] = [
  {
    slug: 'rui-marques',
    name: 'Rui Marques',
    avatar: av(12),
    cover: pic(1),
    gallery: [pic(11), pic(12), pic(13), pic(14), pic(15), pic(16)],
    sport: 'football',
    city: 'Lisbon',
    bio: 'Former semi-pro footballer turned coach. I work with youth and adult players on technique, tactical awareness and match readiness. Sessions are sharp, video-supported, and built around your weak points.',
    specialisms: ['Striker training', 'Set pieces', 'Youth development', 'Tactical analysis'],
    rating: 4.9,
    reviewCount: 87,
    pricePerSession: 65,
    discountPct: 15,
    verified: true,
    yearsExperience: 9,
    sessionsCompleted: 1240,
    reviews: mkReviews(1, 4),
    level: 'All levels',
  },
  {
    slug: 'beatriz-fonseca',
    name: 'Beatriz Fonseca',
    avatar: av(45),
    cover: pic(2),
    gallery: [pic(21), pic(22), pic(23), pic(24), pic(25), pic(26)],
    sport: 'tennis',
    city: 'Cascais',
    bio: 'WTA-certified tennis coach. I focus on stroke mechanics, footwork, and match strategy for intermediate to advanced players preparing for amateur tournaments.',
    specialisms: ['Serve development', 'Match strategy', 'Footwork', 'Mental game'],
    rating: 4.8,
    reviewCount: 64,
    pricePerSession: 80,
    discountPct: 10,
    verified: true,
    yearsExperience: 11,
    sessionsCompleted: 980,
    reviews: mkReviews(2, 4),
    level: 'Intermediate',
  },
  {
    slug: 'marco-tavares',
    name: 'Marco Tavares',
    avatar: av(33),
    cover: pic(3),
    gallery: [pic(31), pic(32), pic(33), pic(34), pic(35), pic(36)],
    sport: 'boxing',
    city: 'Porto',
    bio: 'Boxing coach with a fight career across European amateur circuits. I teach proper fundamentals — stance, guard, footwork — before any sparring. Clean technique, no shortcuts.',
    specialisms: ['Fundamentals', 'Pad work', 'Conditioning', 'Sparring prep'],
    rating: 4.95,
    reviewCount: 142,
    pricePerSession: 55,
    verified: true,
    yearsExperience: 12,
    sessionsCompleted: 2100,
    reviews: mkReviews(3, 5),
    level: 'All levels',
  },
  {
    slug: 'leonor-pinto',
    name: 'Leonor Pinto',
    avatar: av(48),
    cover: pic(4),
    gallery: [pic(41), pic(42), pic(43), pic(44), pic(45), pic(46)],
    sport: 'yoga',
    city: 'Lisbon',
    bio: 'Vinyasa and Hatha instructor. Sessions blend breath, mobility and strength. Suitable for stressed professionals and athletes recovering from injury.',
    specialisms: ['Vinyasa flow', 'Mobility', 'Breathwork', 'Recovery'],
    rating: 4.85,
    reviewCount: 53,
    pricePerSession: 45,
    discountPct: 20,
    verified: true,
    yearsExperience: 6,
    sessionsCompleted: 720,
    reviews: mkReviews(4, 4),
    level: 'All levels',
  },
  {
    slug: 'joao-azevedo',
    name: 'João Azevedo',
    avatar: av(15),
    cover: pic(5),
    gallery: [pic(51), pic(52), pic(53), pic(54), pic(55), pic(56)],
    sport: 'bjj',
    city: 'Porto',
    bio: 'Black belt under Atos lineage. I run private and small-group BJJ classes covering fundamentals, competition prep, and no-gi specialisation.',
    specialisms: ['Guard passing', 'Competition prep', 'Self-defence', 'No-gi'],
    rating: 4.9,
    reviewCount: 96,
    pricePerSession: 70,
    verified: true,
    yearsExperience: 14,
    sessionsCompleted: 1680,
    reviews: mkReviews(5, 4),
    level: 'All levels',
  },
  {
    slug: 'carolina-dias',
    name: 'Carolina Dias',
    avatar: av(20),
    cover: pic(6),
    gallery: [pic(61), pic(62), pic(63), pic(64), pic(65), pic(66)],
    sport: 'padel',
    city: 'Cascais',
    bio: 'Padel coach competing on the national circuit. Focused on positioning, smashes, and doubles strategy. Great for couples and friends learning together.',
    specialisms: ['Doubles strategy', 'Smash', 'Wall play', 'Positioning'],
    rating: 4.7,
    reviewCount: 41,
    pricePerSession: 60,
    discountPct: 10,
    verified: true,
    yearsExperience: 5,
    sessionsCompleted: 420,
    reviews: mkReviews(6, 3),
    level: 'Beginner',
  },
  {
    slug: 'pedro-nunes',
    name: 'Pedro Nunes',
    avatar: av(53),
    cover: pic(7),
    gallery: [pic(71), pic(72), pic(73), pic(74), pic(75), pic(76)],
    sport: 'football',
    city: 'Braga',
    bio: 'Goalkeeper specialist. 1-on-1 sessions for keepers of all ages working on positioning, distribution, and shot stopping.',
    specialisms: ['Goalkeeping', 'Distribution', 'Shot stopping', '1v1 situations'],
    rating: 4.6,
    reviewCount: 28,
    pricePerSession: 50,
    verified: false,
    yearsExperience: 4,
    sessionsCompleted: 310,
    reviews: mkReviews(7, 3),
    level: 'Intermediate',
  },
  {
    slug: 'mariana-rocha',
    name: 'Mariana Rocha',
    avatar: av(36),
    cover: pic(8),
    gallery: [pic(81), pic(82), pic(83), pic(84), pic(85), pic(86)],
    sport: 'tennis',
    city: 'Lisbon',
    bio: 'Coaching kids and beginners with patience and a structured curriculum. Group sessions and private lessons available at multiple Lisbon clubs.',
    specialisms: ['Kids tennis', 'Beginners', 'Group sessions', 'Forehand technique'],
    rating: 4.75,
    reviewCount: 58,
    pricePerSession: 45,
    discountPct: 15,
    verified: true,
    yearsExperience: 7,
    sessionsCompleted: 880,
    reviews: mkReviews(8, 4),
    level: 'Beginner',
  },
  {
    slug: 'tiago-ferreira',
    name: 'Tiago Ferreira',
    avatar: av(60),
    cover: pic(9),
    gallery: [pic(91), pic(92), pic(93), pic(94), pic(95), pic(96)],
    sport: 'boxing',
    city: 'Lisbon',
    bio: 'White-collar boxing coach. I help office workers get fight-ready in 12 weeks — fitness, technique, and confidence built session by session.',
    specialisms: ['White-collar boxing', 'Fitness', 'Confidence', 'Footwork'],
    rating: 4.5,
    reviewCount: 22,
    pricePerSession: 40,
    verified: false,
    yearsExperience: 3,
    sessionsCompleted: 180,
    reviews: mkReviews(9, 3),
    level: 'Beginner',
  },
  {
    slug: 'ines-correia',
    name: 'Inês Correia',
    avatar: av(25),
    cover: pic(10),
    gallery: [pic(101), pic(102), pic(103), pic(104), pic(105), pic(106)],
    sport: 'yoga',
    city: 'Faro',
    bio: 'Beachside yoga and mobility sessions in the Algarve. Private lessons, sunset group flows, and corporate retreats.',
    specialisms: ['Beach yoga', 'Sunset flows', 'Corporate retreats', 'Mobility'],
    rating: 4.85,
    reviewCount: 47,
    pricePerSession: 50,
    discountPct: 10,
    verified: true,
    yearsExperience: 8,
    sessionsCompleted: 640,
    reviews: mkReviews(10, 4),
    level: 'All levels',
  },
];

export interface Club {
  slug: string;
  name: string;
  city: string;
  cover: string;
  gallery: string[];
  sport: SportSlug;
  rating: number;
  reviewCount: number;
  about: string;
  hours: { day: string; open: string }[];
  programs: { name: string; price: number; duration: string }[];
  coachSlugs: string[];
  verified: boolean;
}

export const CLUBS: Club[] = [
  {
    slug: 'lisbon-padel-club',
    name: 'Lisbon Padel Club',
    city: 'Lisbon',
    cover: pic(200),
    gallery: [pic(201), pic(202), pic(203), pic(204), pic(205), pic(206)],
    sport: 'padel',
    rating: 4.7,
    reviewCount: 312,
    about: '8 indoor courts, pro shop, café and recovery zone. Home to weekly leagues, beginner clinics, and one of the largest padel communities in the city.',
    hours: [
      { day: 'Monday', open: '07:00 – 23:00' },
      { day: 'Tuesday', open: '07:00 – 23:00' },
      { day: 'Wednesday', open: '07:00 – 23:00' },
      { day: 'Thursday', open: '07:00 – 23:00' },
      { day: 'Friday', open: '07:00 – 23:00' },
      { day: 'Saturday', open: '08:00 – 22:00' },
      { day: 'Sunday', open: '08:00 – 21:00' },
    ],
    programs: [
      { name: 'Beginner clinic (4 weeks)', price: 120, duration: '4 × 90min' },
      { name: 'Court rental (off-peak)', price: 24, duration: '60min' },
      { name: 'Doubles league entry', price: 80, duration: 'Season' },
    ],
    coachSlugs: ['carolina-dias'],
    verified: true,
  },
  {
    slug: 'porto-fight-academy',
    name: 'Porto Fight Academy',
    city: 'Porto',
    cover: pic(210),
    gallery: [pic(211), pic(212), pic(213), pic(214), pic(215), pic(216)],
    sport: 'boxing',
    rating: 4.85,
    reviewCount: 198,
    about: 'Boxing, BJJ and MMA under one roof. Open mat sessions, fighter-led classes, and a strength room calibrated for combat athletes.',
    hours: [
      { day: 'Monday', open: '06:30 – 22:30' },
      { day: 'Tuesday', open: '06:30 – 22:30' },
      { day: 'Wednesday', open: '06:30 – 22:30' },
      { day: 'Thursday', open: '06:30 – 22:30' },
      { day: 'Friday', open: '06:30 – 22:00' },
      { day: 'Saturday', open: '09:00 – 18:00' },
      { day: 'Sunday', open: 'Closed' },
    ],
    programs: [
      { name: 'Boxing fundamentals (8 weeks)', price: 180, duration: '16 × 60min' },
      { name: 'BJJ all-levels drop-in', price: 18, duration: '90min' },
      { name: 'Private coaching package', price: 320, duration: '5 × 60min' },
    ],
    coachSlugs: ['marco-tavares', 'joao-azevedo'],
    verified: true,
  },
  {
    slug: 'algarve-yoga-retreat',
    name: 'Algarve Yoga Retreat',
    city: 'Faro',
    cover: pic(220),
    gallery: [pic(221), pic(222), pic(223), pic(224), pic(225), pic(226)],
    sport: 'yoga',
    rating: 4.9,
    reviewCount: 156,
    about: 'Beachfront yoga shala with daily classes, monthly retreats, and teacher training. Bring a mat or rent one — we handle the rest.',
    hours: [
      { day: 'Monday', open: '07:00 – 20:00' },
      { day: 'Tuesday', open: '07:00 – 20:00' },
      { day: 'Wednesday', open: '07:00 – 20:00' },
      { day: 'Thursday', open: '07:00 – 20:00' },
      { day: 'Friday', open: '07:00 – 20:00' },
      { day: 'Saturday', open: '08:00 – 18:00' },
      { day: 'Sunday', open: '08:00 – 18:00' },
    ],
    programs: [
      { name: 'Sunrise flow drop-in', price: 15, duration: '60min' },
      { name: 'Weekend retreat', price: 240, duration: '2 days' },
      { name: '10-class pass', price: 110, duration: '60min × 10' },
    ],
    coachSlugs: ['ines-correia'],
    verified: true,
  },
];

export const findCoach = (slug: string) => COACHES.find(c => c.slug === slug);
export const findClub = (slug: string) => CLUBS.find(c => c.slug === slug);
export const findSport = (slug: string) => SPORTS.find(s => s.slug === slug);

export const discountedPrice = (price: number, pct?: number) =>
  pct ? Math.round(price * (1 - pct / 100)) : price;
