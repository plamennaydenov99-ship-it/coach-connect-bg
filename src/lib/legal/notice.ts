/*
 * Draft generated for review by qualified counsel. Not legal advice.
 *
 * Legal notice: the publisher information the Bulgarian E-Commerce Act requires
 * (Закон за електронната търговия, Art. 4 [TO CONFIRM]) plus the host.
 */
import { OWNER, type LegalSet } from './owner';

const o = OWNER;

export const notice: LegalSet = {
  en: {
    title: 'Legal notice',
    summary: 'Who publishes Lokka, where it is hosted and how to reach us.',
    blocks: [
      {
        h: 'Publisher',
        list: [
          `Company name and legal form: ${o.company}`,
          `Registered address: ${o.address}`,
          `Registration number (EIK, Bulgarian Commercial Register) and VAT number: ${o.numbers}`,
          `Responsible for the content: ${o.director}`,
          `Email: ${o.email}`,
        ],
      },
      {
        id: 'contact',
        h: 'Contact and help',
        p: [`For questions, help with your account, privacy requests or to report content, write to ${o.email}. Listings also have a "report" button.`],
      },
      {
        h: 'Hosting',
        list: [`Website host: ${o.host}`, 'Database, sign-in and file storage: Supabase Inc. [TO CONFIRM address and server region]'],
      },
      {
        h: 'Supervisory authorities',
        list: [
          'Personal data: Commission for Personal Data Protection (КЗЛД), www.cpdp.bg [TO CONFIRM]',
          'Consumer protection: Commission for Consumer Protection (КЗП), www.kzp.bg [TO CONFIRM]',
        ],
      },
      {
        h: 'Credits',
        list: [
          'Photos from Wikimedia Commons: Saint Alexander Nevsky Cathedral by Julian Lupyan (public domain); Borisova Garden by Stolichanin (CC BY-SA 4.0).',
          'Club and map data: © OpenStreetMap contributors, Open Database License.',
          'Fonts: Archivo, Inter, Oswald and JetBrains Mono, SIL Open Font License 1.1.',
        ],
      },
    ],
  },
  bg: {
    title: 'Правна информация',
    summary: 'Кой издава Lokka, къде се хоства и как да се свържете с нас.',
    blocks: [
      {
        h: 'Издател',
        list: [
          `Наименование и правна форма: ${o.company}`,
          `Седалище и адрес на управление: ${o.address}`,
          `ЕИК (Търговски регистър) и ДДС номер: ${o.numbers}`,
          `Отговорно лице за съдържанието: ${o.director}`,
          `Имейл: ${o.email}`,
        ],
      },
      {
        id: 'contact',
        h: 'Контакт и помощ',
        p: [`За въпроси, помощ с профила, искания относно лични данни или сигнали за съдържание пишете на ${o.email}. Обявите имат и бутон за сигнал.`],
      },
      {
        h: 'Хостинг',
        list: [`Хостинг на сайта: ${o.host}`, 'База данни, вход и съхранение на файлове: Supabase Inc. [ДА СЕ ПОТВЪРДИ адрес и регион на сървъра]'],
      },
      {
        h: 'Надзорни органи',
        list: [
          'Лични данни: Комисия за защита на личните данни (КЗЛД), www.cpdp.bg [ДА СЕ ПОТВЪРДИ]',
          'Защита на потребителите: Комисия за защита на потребителите (КЗП), www.kzp.bg [ДА СЕ ПОТВЪРДИ]',
        ],
      },
      {
        h: 'Източници',
        list: [
          'Снимки от Wikimedia Commons: катедрала „Св. Александър Невски“ от Julian Lupyan (обществено достояние); Борисова градина от Stolichanin (CC BY-SA 4.0).',
          'Данни за клубове и карти: © сътрудниците на OpenStreetMap, Open Database License.',
          'Шрифтове: Archivo, Inter, Oswald и JetBrains Mono, SIL Open Font License 1.1.',
        ],
      },
    ],
  },
};
