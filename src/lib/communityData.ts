export type PostType = 'thread' | 'tip' | 'activity';

export interface CommunityPost {
  id: number;
  type: PostType;
  sport: string;
  author: string;
  authorCity: string;
  avatar: string;
  verified: boolean;
  isPro: boolean;
  timeAgo: string;
  title: string;
  body: string;
  sport_tag: string;
  city: string;
  likes: number;
  comments: number;
  bookmarked: boolean;
}

export const COMMUNITY_POSTS: CommunityPost[] = [
  { id: 1, type: 'thread', sport: 'padel', author: 'Мартин Георгиев', authorCity: 'Sofia', avatar: 'https://i.pravatar.cc/300?img=11', verified: false, isPro: false, timeAgo: 'преди 23 мин', title: 'Търсим още двама за падел в Sofia Ring Mall', body: 'Имаме резервация утре в 19:00 ч. — търсим още 2 играчи. Средно ниво, приятна игра. Пишете в коментарите!', sport_tag: 'Padel', city: 'Sofia', likes: 8, comments: 6, bookmarked: false },
  { id: 2, type: 'tip', sport: 'football', author: 'Треньор Димитър Попов', authorCity: 'Plovdiv', avatar: 'https://i.pravatar.cc/300?img=15', verified: true, isPro: true, timeAgo: 'преди 1 час', title: '3 грешки, които всеки начинаещ футболист прави', body: 'След 12 години треньорски опит виждам едни и същи грешки. Първо — не гледате около себе си преди да получите топката. Второ — тичате към топката вместо в пространството. Трето — забравяте за позицията без топка.', sport_tag: 'Football', city: 'Plovdiv', likes: 34, comments: 12, bookmarked: false },
  { id: 3, type: 'thread', sport: 'running', author: 'Елена Тодорова', authorCity: 'Varna', avatar: 'https://i.pravatar.cc/300?img=23', verified: false, isPro: false, timeAgo: 'преди 2 часа', title: 'Някой за сутрешно бягане по Морската градина?', body: 'Бягам всяка събота в 7:30 от фонтана. Темпо около 5:30/км. Всички са добре дошли — главното е да се движим!', sport_tag: 'Running', city: 'Varna', likes: 15, comments: 9, bookmarked: false },
  { id: 4, type: 'activity', sport: 'tennis', author: 'Atleta', authorCity: '', avatar: '', verified: false, isPro: false, timeAgo: 'преди 3 часа', title: 'Христо Петков се записа за тенис лагера във Варна', body: 'Още 4 места налични → Виж лагера', sport_tag: 'Tennis', city: 'Varna', likes: 0, comments: 0, bookmarked: false },
  { id: 5, type: 'tip', sport: 'padel', author: 'Треньор Стела Маринова', authorCity: 'Sofia', avatar: 'https://i.pravatar.cc/300?img=32', verified: true, isPro: true, timeAgo: 'преди 4 часа', title: 'Как да подобрим бандехата за 2 седмици', body: 'Бандехата е един от най-сложните удари в падела. Ключът е в позицията на тялото — трябва да сте странично, не фронтално. Практикувайте срещу стената 15 минути на ден.', sport_tag: 'Padel', city: 'Sofia', likes: 27, comments: 8, bookmarked: false },
  { id: 6, type: 'thread', sport: 'basketball', author: 'Калоян Христов', authorCity: 'Sofia', avatar: 'https://i.pravatar.cc/300?img=41', verified: false, isPro: false, timeAgo: 'преди 5 часа', title: 'Streetball всяка неделя — Южен парк, София', body: 'Събираме се всяка неделя от 10:00 до 13:00. 3 на 3 или 5 на 5 зависи колко дойдат. Всички нива добре дошли. Носете вода!', sport_tag: 'Basketball', city: 'Sofia', likes: 41, comments: 18, bookmarked: false },
  { id: 7, type: 'tip', sport: 'bjj', author: 'Треньор Борислав Найденов', authorCity: 'Sofia', avatar: 'https://i.pravatar.cc/300?img=52', verified: true, isPro: true, timeAgo: 'преди 6 часа', title: 'Защо повечето начинаещи губят от гард позиция', body: 'Не защото техниката им е лоша — а защото панически се опитват да се измъкнат веднага. Спокойствието в долна позиция се учи. Дайте си 6 месеца.', sport_tag: 'BJJ', city: 'Sofia', likes: 19, comments: 7, bookmarked: false },
  { id: 8, type: 'thread', sport: 'cycling', author: 'Надя Василева', authorCity: 'Plovdiv', avatar: 'https://i.pravatar.cc/300?img=44', verified: false, isPro: false, timeAgo: 'преди 8 часа', title: 'Маршрут Пловдив → Бачково — някой правил ли го?', body: 'Планирам за следващия уикенд, около 60км. Търся компания или съвети за маршрута. Имам шосеен велосипед.', sport_tag: 'Cycling', city: 'Plovdiv', likes: 11, comments: 14, bookmarked: false },
  { id: 9, type: 'activity', sport: 'football', author: 'Atleta', authorCity: '', avatar: '', verified: false, isPro: false, timeAgo: 'преди 10 часа', title: 'FC Локомотив София публикуваха нов футболен лагер', body: 'Sofia Football Academy Camp — 14-18 Юли → Виж лагера', sport_tag: 'Football', city: 'Sofia', likes: 0, comments: 0, bookmarked: false },
  { id: 10, type: 'tip', sport: 'swimming', author: 'Треньор Ивайло Стефанов', authorCity: 'Varna', avatar: 'https://i.pravatar.cc/300?img=61', verified: true, isPro: true, timeAgo: 'преди 12 часа', title: 'Кранч или ротация? Грешката в кроул техниката', body: '90% от хората правят кранч на тялото вместо ротация около надлъжната ос. Резултатът — бавно плуване и бърза умора. Мислете за въртене, не за завиване.', sport_tag: 'Swimming', city: 'Varna', likes: 22, comments: 5, bookmarked: false },
  { id: 11, type: 'thread', sport: 'tennis', author: 'Виктор Димов', authorCity: 'Burgas', avatar: 'https://i.pravatar.cc/300?img=33', verified: false, isPro: false, timeAgo: 'преди 1 ден', title: 'Корт партньор в Бургас — средно ниво', body: 'Играя около 2 пъти седмично, търся редовен партньор. Имам членска карта в Tennis Club Burgas. Пишете ми!', sport_tag: 'Tennis', city: 'Burgas', likes: 6, comments: 3, bookmarked: false },
  { id: 12, type: 'tip', sport: 'crossfit', author: 'Треньор Рая Колева', authorCity: 'Sofia', avatar: 'https://i.pravatar.cc/300?img=47', verified: true, isPro: true, timeAgo: 'преди 1 ден', title: 'Как да не изгорите след първата CrossFit седмица', body: 'Новите атлети винаги идват с 100% интензитет. Грешка. Първите 2 седмици — 60-70% от максимума. Тялото трябва да свикне с движенията преди натоварването.', sport_tag: 'CrossFit', city: 'Sofia', likes: 48, comments: 21, bookmarked: false },
];
