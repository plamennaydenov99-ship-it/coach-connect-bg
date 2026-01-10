// Demo data for the sports coaching marketplace

export interface Coach {
  id: string;
  displayName: string;
  avatarUrl: string;
  coverPhotos: string[];
  bio: string;
  specializations: string[];
  experienceYears: number;
  verified: boolean;
  gender: 'male' | 'female' | 'other';
  languages: string[];
  city: string;
  ratingAvg: number;
  ratingCount: number;
  priceFrom: number;
  type: 'coach' | 'company';
}

export interface Offer {
  id: string;
  coachId: string;
  title: string;
  type: '1v1' | 'group';
  durationMin: number;
  priceBGN: number;
  capacity?: number;
  mode: 'in-person' | 'online' | 'either';
  description: string;
}

export interface Review {
  id: string;
  coachId: string;
  authorName: string;
  authorAvatar: string;
  rating: number;
  text: string;
  createdAt: string;
  verified: boolean;
}

export const sports = [
  'fitness', 'boxing', 'tennis', 'football', 'basketball', 'mma', 'yoga', 
  'pilates', 'swimming', 'running', 'cycling', 'crossfit', 'climbing', 
  'volleyball', 'tableTennis', 'badminton', 'danceFitness', 'martialArts', 
  'physiotherapy', 'stretching'
] as const;

export const cities = [
  'sofia', 'plovdiv', 'varna', 'burgas', 'ruse', 'staraZagora', 
  'pleven', 'sliven', 'dobrich', 'shumen'
] as const;

export const coaches: Coach[] = [
  {
    id: '1',
    displayName: 'Иван Петров',
    avatarUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=400&fit=crop&crop=face',
    coverPhotos: ['https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800'],
    bio: 'Сертифициран фитнес треньор с 8 години опит. Специализирам се в силови тренировки и програми за отслабване.',
    specializations: ['fitness', 'crossfit', 'stretching'],
    experienceYears: 8,
    verified: true,
    gender: 'male',
    languages: ['bg', 'en'],
    city: 'sofia',
    ratingAvg: 4.9,
    ratingCount: 127,
    priceFrom: 45,
    type: 'coach',
  },
  {
    id: '2',
    displayName: 'Мария Георгиева',
    avatarUrl: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=400&h=400&fit=crop&crop=face',
    coverPhotos: ['https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800'],
    bio: 'Инструктор по йога и пилатес. Помагам на хората да намерят баланс между тялото и ума.',
    specializations: ['yoga', 'pilates', 'stretching'],
    experienceYears: 6,
    verified: true,
    gender: 'female',
    languages: ['bg', 'en', 'de'],
    city: 'plovdiv',
    ratingAvg: 4.8,
    ratingCount: 89,
    priceFrom: 35,
    type: 'coach',
  },
  {
    id: '3',
    displayName: 'Георги Димитров',
    avatarUrl: 'https://images.unsplash.com/photo-1583468982228-19f19164aee2?w=400&h=400&fit=crop&crop=face',
    coverPhotos: ['https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=800'],
    bio: 'Професионален боксьор и треньор. Тренирам както начинаещи, така и състезатели.',
    specializations: ['boxing', 'mma', 'martialArts'],
    experienceYears: 12,
    verified: true,
    gender: 'male',
    languages: ['bg'],
    city: 'varna',
    ratingAvg: 4.95,
    ratingCount: 156,
    priceFrom: 60,
    type: 'coach',
  },
  {
    id: '4',
    displayName: 'Елена Стоянова',
    avatarUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop&crop=face',
    coverPhotos: ['https://images.unsplash.com/photo-1518459031867-a89b944bffe4?w=800'],
    bio: 'Тенис треньор с опит в работа с деца и възрастни. Бивш национален състезател.',
    specializations: ['tennis'],
    experienceYears: 10,
    verified: true,
    gender: 'female',
    languages: ['bg', 'en'],
    city: 'sofia',
    ratingAvg: 4.7,
    ratingCount: 64,
    priceFrom: 55,
    type: 'coach',
  },
  {
    id: '5',
    displayName: 'Николай Христов',
    avatarUrl: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=400&h=400&fit=crop&crop=face',
    coverPhotos: ['https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800'],
    bio: 'Триатлон треньор. Подготвям състезатели за маратони, колоездене и плуване.',
    specializations: ['running', 'cycling', 'swimming'],
    experienceYears: 7,
    verified: false,
    gender: 'male',
    languages: ['bg', 'en'],
    city: 'burgas',
    ratingAvg: 4.6,
    ratingCount: 43,
    priceFrom: 40,
    type: 'coach',
  },
  {
    id: '6',
    displayName: 'FitZone Sofia',
    avatarUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=400&fit=crop',
    coverPhotos: ['https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800'],
    bio: 'Модерна фитнес зала в центъра на София с групови тренировки и персонални треньори.',
    specializations: ['fitness', 'crossfit', 'danceFitness', 'yoga'],
    experienceYears: 5,
    verified: true,
    gender: 'other',
    languages: ['bg', 'en'],
    city: 'sofia',
    ratingAvg: 4.5,
    ratingCount: 234,
    priceFrom: 15,
    type: 'company',
  },
  {
    id: '7',
    displayName: 'Димитър Атанасов',
    avatarUrl: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=400&h=400&fit=crop&crop=face',
    coverPhotos: ['https://images.unsplash.com/photo-1546483875-ad9014c88eba?w=800'],
    bio: 'Физиотерапевт и личен треньор. Помагам при възстановяване след травми и подобряване на подвижността.',
    specializations: ['physiotherapy', 'stretching', 'pilates'],
    experienceYears: 9,
    verified: true,
    gender: 'male',
    languages: ['bg'],
    city: 'plovdiv',
    ratingAvg: 4.85,
    ratingCount: 78,
    priceFrom: 70,
    type: 'coach',
  },
  {
    id: '8',
    displayName: 'Анна Колева',
    avatarUrl: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=400&h=400&fit=crop&crop=face',
    coverPhotos: ['https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800'],
    bio: 'Инструктор по танцов фитнес и зумба. Превръщам тренировките в забавление!',
    specializations: ['danceFitness', 'fitness'],
    experienceYears: 4,
    verified: true,
    gender: 'female',
    languages: ['bg', 'en', 'es'],
    city: 'sofia',
    ratingAvg: 4.75,
    ratingCount: 112,
    priceFrom: 25,
    type: 'coach',
  },
];

export const offers: Offer[] = [
  {
    id: 'o1',
    coachId: '1',
    title: 'Персонална тренировка',
    type: '1v1',
    durationMin: 60,
    priceBGN: 45,
    mode: 'in-person',
    description: 'Индивидуална тренировка с пълен фокус върху вашите цели.',
  },
  {
    id: 'o2',
    coachId: '1',
    title: 'Групова CrossFit тренировка',
    type: 'group',
    durationMin: 60,
    priceBGN: 20,
    capacity: 12,
    mode: 'in-person',
    description: 'Интензивна групова тренировка за издръжливост и сила.',
  },
  {
    id: 'o3',
    coachId: '2',
    title: 'Йога сесия',
    type: '1v1',
    durationMin: 75,
    priceBGN: 35,
    mode: 'either',
    description: 'Релаксираща йога сесия за баланс на тялото и ума.',
  },
  {
    id: 'o4',
    coachId: '3',
    title: 'Бокс тренировка',
    type: '1v1',
    durationMin: 90,
    priceBGN: 60,
    mode: 'in-person',
    description: 'Научете основите на бокса или подобрете техниката си.',
  },
  {
    id: 'o5',
    coachId: '4',
    title: 'Тенис урок',
    type: '1v1',
    durationMin: 60,
    priceBGN: 55,
    mode: 'in-person',
    description: 'Индивидуален урок по тенис за всички нива.',
  },
  {
    id: 'o6',
    coachId: '6',
    title: 'Групов фитнес',
    type: 'group',
    durationMin: 45,
    priceBGN: 15,
    capacity: 20,
    mode: 'in-person',
    description: 'Енергизираща групова тренировка за цялото тяло.',
  },
];

export const reviews: Review[] = [
  {
    id: 'r1',
    coachId: '1',
    authorName: 'Петър Николов',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    rating: 5,
    text: 'Иван е страхотен треньор! След 3 месеца тренировки постигнах резултати, които не очаквах.',
    createdAt: '2024-01-10',
    verified: true,
  },
  {
    id: 'r2',
    coachId: '1',
    authorName: 'София Димитрова',
    authorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    rating: 5,
    text: 'Препоръчвам на всеки, който търси професионален подход и мотивация.',
    createdAt: '2024-01-05',
    verified: true,
  },
  {
    id: 'r3',
    coachId: '2',
    authorName: 'Андрей Попов',
    authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
    rating: 4,
    text: 'Мария създава прекрасна атмосфера на тренировките. Чувствам се много по-спокоен.',
    createdAt: '2024-01-08',
    verified: true,
  },
  {
    id: 'r4',
    coachId: '3',
    authorName: 'Калоян Стефанов',
    authorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    rating: 5,
    text: 'Георги е легенда! Научих повече за 2 месеца отколкото за година сам.',
    createdAt: '2024-01-12',
    verified: true,
  },
];
