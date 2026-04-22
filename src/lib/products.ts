export type ProductCategory = 'Clothing' | 'Equipment' | 'Accessories' | 'Nutrition';

export type Product = {
  id: number;
  name: string;
  club: string;
  clubSlug: string;
  category: ProductCategory;
  price: number;
  image: string;
  stock: 'in' | 'low';
};

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  'Clothing',
  'Equipment',
  'Accessories',
  'Nutrition',
];

export const PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'FC Vitosha Training Jersey',
    club: 'FC Vitosha',
    clubSlug: 'lisbon-padel-club',
    category: 'Clothing',
    price: 49,
    image: 'https://picsum.photos/400/400?random=10',
    stock: 'in',
  },
  {
    id: 2,
    name: 'Boxing Club Gloves 12oz',
    club: 'Porto Fight Academy',
    clubSlug: 'porto-fight-academy',
    category: 'Equipment',
    price: 89,
    image: 'https://picsum.photos/400/400?random=11',
    stock: 'in',
  },
  {
    id: 3,
    name: 'Padel Racket Bundle',
    club: 'Lisbon Padel Club',
    clubSlug: 'lisbon-padel-club',
    category: 'Equipment',
    price: 159,
    image: 'https://picsum.photos/400/400?random=12',
    stock: 'low',
  },
  {
    id: 4,
    name: 'Algarve Yoga Mat',
    club: 'Algarve Yoga Retreat',
    clubSlug: 'algarve-yoga-retreat',
    category: 'Equipment',
    price: 39,
    image: 'https://picsum.photos/400/400?random=13',
    stock: 'in',
  },
  {
    id: 5,
    name: 'Performance Shaker Bottle',
    club: 'FC Vitosha',
    clubSlug: 'lisbon-padel-club',
    category: 'Accessories',
    price: 12,
    image: 'https://picsum.photos/400/400?random=14',
    stock: 'in',
  },
  {
    id: 6,
    name: 'Whey Protein 1kg',
    club: 'Porto Fight Academy',
    clubSlug: 'porto-fight-academy',
    category: 'Nutrition',
    price: 35,
    image: 'https://picsum.photos/400/400?random=15',
    stock: 'low',
  },
  {
    id: 7,
    name: 'Club Hoodie',
    club: 'Lisbon Padel Club',
    clubSlug: 'lisbon-padel-club',
    category: 'Clothing',
    price: 65,
    image: 'https://picsum.photos/400/400?random=16',
    stock: 'in',
  },
  {
    id: 8,
    name: 'Hand Wraps (pair)',
    club: 'Porto Fight Academy',
    clubSlug: 'porto-fight-academy',
    category: 'Accessories',
    price: 14,
    image: 'https://picsum.photos/400/400?random=17',
    stock: 'in',
  },
  {
    id: 9,
    name: 'Yoga Block Set',
    club: 'Algarve Yoga Retreat',
    clubSlug: 'algarve-yoga-retreat',
    category: 'Equipment',
    price: 22,
    image: 'https://picsum.photos/400/400?random=18',
    stock: 'in',
  },
  {
    id: 10,
    name: 'Recovery Tea Blend',
    club: 'Algarve Yoga Retreat',
    clubSlug: 'algarve-yoga-retreat',
    category: 'Nutrition',
    price: 18,
    image: 'https://picsum.photos/400/400?random=19',
    stock: 'low',
  },
  {
    id: 11,
    name: 'Padel Grip Tape (3-pack)',
    club: 'Lisbon Padel Club',
    clubSlug: 'lisbon-padel-club',
    category: 'Accessories',
    price: 9,
    image: 'https://picsum.photos/400/400?random=20',
    stock: 'in',
  },
  {
    id: 12,
    name: 'Energy Bar Box (12)',
    club: 'Porto Fight Academy',
    clubSlug: 'porto-fight-academy',
    category: 'Nutrition',
    price: 24,
    image: 'https://picsum.photos/400/400?random=21',
    stock: 'in',
  },
];

export const MOCK_CART = [
  { id: 1, name: 'FC Vitosha Training Jersey', price: 49, qty: 1, image: 'https://picsum.photos/400/400?random=10' },
  { id: 3, name: 'Padel Racket Bundle', price: 159, qty: 1, image: 'https://picsum.photos/400/400?random=12' },
];
