/*
 * Draft generated for review by qualified counsel. Not legal advice.
 *
 * Cookie and device-storage policy. Keep this table in step with the code: every
 * localStorage, sessionStorage and cookie key the site writes must be listed here.
 */
import type { LegalSet } from './owner';

export const cookies: LegalSet = {
  en: {
    title: 'Cookies and storage',
    summary: 'What Lokka stores on your device, why, and how to change your choice.',
    blocks: [
      {
        h: 'In short',
        p: [
          'Lokka only stores what it needs to work: keeping you signed in, remembering your language and remembering your cookie choice. These do not need your consent.',
          'We do not use advertising cookies or trackers. Our fonts are served from our own site, so loading a page does not contact Google or any other third party for them.',
          'If we ever add audience measurement, it will only run after you say yes, and it will be listed here first.',
        ],
      },
      {
        h: 'What we store',
        table: [
          ['Name', 'Type', 'Purpose', 'Kept for', 'Consent needed'],
          ['sb-…-auth-token', 'Local storage', 'Keeps you signed in', 'Until you sign out', 'No (strictly necessary)'],
          ['atleta_lang', 'Local storage', 'Remembers your language', 'Until you clear it', 'No (you asked for it)'],
          ['lokka_consent', 'Local storage', 'Remembers your cookie choice, with date and version', '13 months, then we ask again', 'No (strictly necessary)'],
          ['lokka_last_role', 'Local storage', 'Highlights the role you used last on the sign-in page', 'Until you clear it', 'No (you asked for it)'],
          ['lokka_coach_clients_view', 'Local storage', 'Remembers the board or list view in the Studio', 'Until you clear it', 'No (you asked for it)'],
          ['zenit_intended_role', 'Session storage', 'Finishes sign-in with the role you picked', 'Until the tab closes', 'No (strictly necessary)'],
          ['pv_…', 'Session storage', 'Counts a profile view only once per visit', 'Until the tab closes', 'No (strictly necessary for an accurate count)'],
          ['sidebar:state', 'Cookie', 'Remembers whether the Studio sidebar is open', '7 days', 'No (you asked for it)'],
        ],
      },
      {
        h: 'Changing your choice',
        p: ['Use "Cookie settings" at the bottom of every page. You can also clear site data in your browser settings at any time; you will then be signed out.'],
      },
    ],
  },
  bg: {
    title: 'Бисквитки и съхранение',
    summary: 'Какво съхранява Lokka на устройството ви, защо и как да промените избора си.',
    blocks: [
      {
        h: 'Накратко',
        p: [
          'Lokka съхранява само необходимото за работата си: да останете влезли, да запомни езика ви и избора ви за бисквитки. За тях не е нужно съгласие.',
          'Не използваме рекламни бисквитки или тракери. Шрифтовете се зареждат от нашия сайт, така че при отваряне на страница не се свързваме с Google или друга трета страна за тях.',
          'Ако някога добавим измерване на посещаемостта, то ще работи само след ваше съгласие и първо ще бъде описано тук.',
        ],
      },
      {
        h: 'Какво съхраняваме',
        table: [
          ['Име', 'Вид', 'Цел', 'Срок', 'Нужно ли е съгласие'],
          ['sb-…-auth-token', 'Локално хранилище', 'Поддържа входа ви', 'До излизане от профила', 'Не (строго необходимо)'],
          ['atleta_lang', 'Локално хранилище', 'Запомня езика ви', 'Докато не го изчистите', 'Не (по ваше искане)'],
          ['lokka_consent', 'Локално хранилище', 'Запомня избора ви за бисквитки с дата и версия', '13 месеца, след което питаме отново', 'Не (строго необходимо)'],
          ['lokka_last_role', 'Локално хранилище', 'Отбелязва последно използваната роля на страницата за вход', 'Докато не го изчистите', 'Не (по ваше искане)'],
          ['lokka_coach_clients_view', 'Локално хранилище', 'Запомня изгледа „табло“ или „списък“ в Studio', 'Докато не го изчистите', 'Не (по ваше искане)'],
          ['zenit_intended_role', 'Сесийно хранилище', 'Завършва входа с избраната от вас роля', 'До затваряне на раздела', 'Не (строго необходимо)'],
          ['pv_…', 'Сесийно хранилище', 'Отчита преглед на профил само веднъж на посещение', 'До затваряне на раздела', 'Не (строго необходимо за точен брой)'],
          ['sidebar:state', 'Бисквитка', 'Запомня дали страничното меню в Studio е отворено', '7 дни', 'Не (по ваше искане)'],
        ],
      },
      {
        h: 'Промяна на избора',
        p: ['Използвайте „Настройки за бисквитки“ в долната част на всяка страница. Можете и по всяко време да изчистите данните на сайта от настройките на браузъра; тогава ще излезете от профила си.'],
      },
    ],
  },
};
