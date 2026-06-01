export interface Camp {
  id: number;
  name: string;
  sport: string;
  coach: string;
  city: string;
  dates: string;
  duration: string;
  durationDays: number;
  ageGroup: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'All levels';
  price: string;
  spotsLeft: number;
  image: string;
  description?: string;
}

export const CAMPS: Camp[] = [
  { id: 1, name: 'Sofia Football Academy Camp', sport: 'Football', coach: 'FC Локомотив София', city: 'Sofia', dates: '14-18 Юли 2025', duration: '5 дни', durationDays: 5, ageGroup: 'Ages 12-16', level: 'Intermediate', price: '€180', spotsLeft: 6, image: 'camp1' },
  { id: 2, name: 'Черноморски тенис лагер', sport: 'Tennis', coach: 'Треньор Димитър Стоянов', city: 'Varna', dates: '21-27 Юли 2025', duration: '7 дни', durationDays: 7, ageGroup: 'Adults', level: 'All levels', price: '€320', spotsLeft: 12, image: 'camp2' },
  { id: 3, name: 'Пловдив Падел Интензив', sport: 'Padel', coach: 'Падел Клуб Пловдив', city: 'Plovdiv', dates: '5-6 Юли 2025', duration: '2 дни', durationDays: 2, ageGroup: 'Adults', level: 'Beginner', price: '€95', spotsLeft: 4, image: 'camp3' },
  { id: 4, name: 'CrossFit Summer Camp Sofia', sport: 'CrossFit', coach: 'Треньор Георги Иванов', city: 'Sofia', dates: '1-7 Август 2025', duration: '7 дни', durationDays: 7, ageGroup: 'Adults', level: 'Advanced', price: '€280', spotsLeft: 8, image: 'camp4' },
  { id: 5, name: 'Младежки баскетболен лагер', sport: 'Basketball', coach: 'БК Академик София', city: 'Sofia', dates: '10-14 Август 2025', duration: '5 дни', durationDays: 5, ageGroup: 'Ages 10-15', level: 'Beginner', price: '€150', spotsLeft: 15, image: 'camp5' },
  { id: 6, name: 'Бургас Running Camp', sport: 'Running', coach: 'Треньор Милена Костова', city: 'Burgas', dates: '19-21 Юли 2025', duration: '3 дни', durationDays: 3, ageGroup: 'Adults', level: 'Intermediate', price: '€120', spotsLeft: 3, image: 'camp6' },
  { id: 7, name: 'Варна Плуване Интензив', sport: 'Swimming', coach: 'СК Черно море', city: 'Varna', dates: '28 Юли - 3 Август 2025', duration: '7 дни', durationDays: 7, ageGroup: 'Ages 8-14', level: 'All levels', price: '€210', spotsLeft: 9, image: 'camp7' },
  { id: 8, name: 'Велоспорт планински лагер', sport: 'Cycling', coach: 'Треньор Александър Петров', city: 'Plovdiv', dates: '15-22 Август 2025', duration: '8 дни', durationDays: 8, ageGroup: 'Adults', level: 'Advanced', price: '€380', spotsLeft: 5, image: 'camp8' },
];

export const campImage = (seed: string) => `https://picsum.photos/seed/${seed}/800/400`;
export const findCamp = (id: number) => CAMPS.find(c => c.id === id);
