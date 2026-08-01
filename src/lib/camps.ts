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
  { id: 1, name: 'Sofia Football Academy Camp', sport: 'Football', coach: 'FC Lokomotiv Sofia', city: 'Sofia', dates: '14-18 September 2026', duration: '5 days', durationDays: 5, ageGroup: 'Ages 12-16', level: 'Intermediate', price: '€180', spotsLeft: 6, image: 'camp1' },
  { id: 2, name: 'Black Sea Tennis Camp', sport: 'Tennis', coach: 'Coach Dimitar Stoyanov', city: 'Varna', dates: '21-27 September 2026', duration: '7 days', durationDays: 7, ageGroup: 'Adults', level: 'All levels', price: '€320', spotsLeft: 12, image: 'camp2' },
  { id: 3, name: 'Plovdiv Padel Intensive', sport: 'Padel', coach: 'Padel Club Plovdiv', city: 'Plovdiv', dates: '3-4 October 2026', duration: '2 days', durationDays: 2, ageGroup: 'Adults', level: 'Beginner', price: '€95', spotsLeft: 4, image: 'camp3' },
  { id: 4, name: 'CrossFit Autumn Camp Sofia', sport: 'CrossFit', coach: 'Coach Georgi Ivanov', city: 'Sofia', dates: '5-11 October 2026', duration: '7 days', durationDays: 7, ageGroup: 'Adults', level: 'Advanced', price: '€280', spotsLeft: 8, image: 'camp4' },
  { id: 5, name: 'Youth Basketball Camp', sport: 'Basketball', coach: 'BC Akademik Sofia', city: 'Sofia', dates: '19-23 October 2026', duration: '5 days', durationDays: 5, ageGroup: 'Ages 10-15', level: 'Beginner', price: '€150', spotsLeft: 15, image: 'camp5' },
  { id: 6, name: 'Burgas Running Camp', sport: 'Running', coach: 'Coach Milena Kostova', city: 'Burgas', dates: '30 October - 1 November 2026', duration: '3 days', durationDays: 3, ageGroup: 'Adults', level: 'Intermediate', price: '€120', spotsLeft: 3, image: 'camp6' },
  { id: 7, name: 'Varna Swimming Intensive', sport: 'Swimming', coach: 'SC Cherno More', city: 'Varna', dates: '9-15 November 2026', duration: '7 days', durationDays: 7, ageGroup: 'Ages 8-14', level: 'All levels', price: '€210', spotsLeft: 9, image: 'camp7' },
  { id: 8, name: 'Mountain Cycling Camp', sport: 'Cycling', coach: 'Coach Aleksandar Petrov', city: 'Plovdiv', dates: '16-23 November 2026', duration: '8 days', durationDays: 8, ageGroup: 'Adults', level: 'Advanced', price: '€380', spotsLeft: 5, image: 'camp8' },

];

export const campImage = (seed: string) => `https://picsum.photos/seed/${seed}/800/400`;
export const findCamp = (id: number) => CAMPS.find(c => c.id === id);
