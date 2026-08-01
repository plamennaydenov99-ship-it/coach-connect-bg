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
    name: 'City 10K Road Race',
    sport: 'Running',
    date: '12 September',
    city: 'Sofia',
    description: 'Race through the heart of the city in this iconic 10K road run.',
    image: 'https://picsum.photos/900/400?random=1',
  },
  {
    id: 2,
    name: 'Riviera Padel Open',
    sport: 'Padel',
    date: '26 September',
    city: 'Nice',
    description: 'Open singles and doubles tournament with draws for every level.',
    image: 'https://picsum.photos/900/400?random=2',
  },
  {
    id: 3,
    name: '5-a-Side Football Cup',
    sport: 'Football',
    date: '10 October',
    city: 'Barcelona',
    description: 'Grab your squad and battle it out in this fast-paced autumn cup.',
    image: 'https://picsum.photos/900/400?random=3',
  },
  {
    id: 4,
    name: 'White Collar Boxing Night',
    sport: 'Boxing',
    date: '24 October',
    city: 'London',
    description: 'An electric evening of amateur bouts and live ringside entertainment.',
    image: 'https://picsum.photos/900/400?random=4',
  },
  {
    id: 5,
    name: 'Clay Court Championship',
    sport: 'Tennis',
    date: '7 November',
    city: 'Varna',
    description: 'Compete across multiple draws on premium clay courts.',
    image: 'https://picsum.photos/900/400?random=5',
  },
  {
    id: 6,
    name: 'CrossFit Open Challenge',
    sport: 'CrossFit',
    date: '21 November',
    city: 'Berlin',
    description: 'Test your limits across three workouts in a single high-energy day.',
    image: 'https://picsum.photos/900/400?random=6',
  },
];
