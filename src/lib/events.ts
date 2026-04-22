export type EventItem = {
  id: number;
  name: string;
  sport: string;
  date: string;
  city: string;
  description: string;
  image: string;
};

export const EVENTS: EventItem[] = [
  {
    id: 1,
    name: 'City 10K Marathon',
    sport: 'Running',
    date: '15 June',
    city: 'Sofia',
    description: 'Race through the heart of the city in this iconic 10K road run.',
    image: 'https://picsum.photos/900/400?random=1',
  },
  {
    id: 2,
    name: 'Summer Padel Open',
    sport: 'Padel',
    date: '22 June',
    city: 'Sofia',
    description: 'Open singles and doubles tournament with prizes for every level.',
    image: 'https://picsum.photos/900/400?random=2',
  },
  {
    id: 3,
    name: '5-a-Side Football Cup',
    sport: 'Football',
    date: '29 June',
    city: 'Sofia',
    description: 'Grab your squad and battle it out in this fast-paced summer cup.',
    image: 'https://picsum.photos/900/400?random=3',
  },
  {
    id: 4,
    name: 'Boxing White Collar Night',
    sport: 'Boxing',
    date: '6 July',
    city: 'Sofia',
    description: 'An electric evening of amateur bouts and live ringside entertainment.',
    image: 'https://picsum.photos/900/400?random=4',
  },
  {
    id: 5,
    name: 'Tennis Club Championship',
    sport: 'Tennis',
    date: '13 July',
    city: 'Sofia',
    description: 'Compete across multiple draws on premium clay courts.',
    image: 'https://picsum.photos/900/400?random=5',
  },
  {
    id: 6,
    name: 'CrossFit Open Challenge',
    sport: 'CrossFit',
    date: '20 July',
    city: 'Sofia',
    description: 'Test your limits across three workouts in a single high-energy day.',
    image: 'https://picsum.photos/900/400?random=6',
  },
];
