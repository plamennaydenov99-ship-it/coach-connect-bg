/*
 * Draft generated for review by qualified counsel. Not legal advice.
 *
 * Accessibility statement (European Accessibility Act, EN 301 549, WCAG 2.1 AA).
 * Update the known limitations whenever an audit changes them.
 */
import { OWNER, type LegalSet } from './owner';

const o = OWNER;

export const accessibility: LegalSet = {
  en: {
    title: 'Accessibility statement',
    summary: 'How accessible Lokka is, what we know is not yet right, and how to tell us about a problem.',
    blocks: [
      {
        h: 'Our aim',
        p: ['We want everyone to be able to use Lokka, including people who use a keyboard, a screen reader, zoom or reduced motion. We aim to meet the Web Content Accessibility Guidelines (WCAG) 2.1 level AA, the level required by the European standard EN 301 549.'],
      },
      {
        h: 'Status',
        p: ['Lokka partially meets WCAG 2.1 AA. The public pages and the sign-in page were checked; the issues we know about are listed below.'],
      },
      {
        h: 'What we have done',
        list: [
          'Page language follows the language you choose.',
          'Text and buttons meet the contrast minimum; a visible outline shows where the keyboard is.',
          'A "Skip to content" link at the top of each public page.',
          'Form fields have labels, and errors are announced to screen readers.',
          'Animations stop when your device asks for reduced motion.',
        ],
      },
      {
        h: 'Known limitations',
        list: [
          'The Studio workspace for coaches and clubs and the admin pages have not yet been fully tested.',
          'Some large decorative moving words have low contrast on purpose. They repeat nearby text and are hidden from screen readers.',
          'A few small controls inside the Studio are smaller than 44 by 44 pixels.',
        ],
      },
      {
        h: 'How we checked',
        p: ['Self-assessment on 3 November 2026 with automated tools (Lighthouse and axe) and manual keyboard checks.'],
      },
      {
        h: 'Tell us about a problem',
        p: [`If something does not work for you, write to ${o.email}. We reply within [TO CONFIRM] working days and can give you the information in another format.`],
      },
      {
        h: 'Enforcement',
        p: ['If you are not satisfied with our answer, you can contact the Bulgarian authority responsible for enforcing the European Accessibility Act [TO CONFIRM authority and link].'],
      },
    ],
  },
  bg: {
    title: 'Декларация за достъпност',
    summary: 'Доколко Lokka е достъпен, какво още не е наред и как да ни съобщите за проблем.',
    blocks: [
      {
        h: 'Нашата цел',
        p: ['Искаме всеки да може да използва Lokka, включително хора, които ползват клавиатура, екранен четец, увеличение или намалено движение. Стремим се да отговаряме на Насоките за достъпност на уеб съдържание (WCAG) 2.1, ниво AA, изисквано от европейския стандарт EN 301 549.'],
      },
      {
        h: 'Състояние',
        p: ['Lokka отговаря частично на WCAG 2.1 AA. Публичните страници и страницата за вход са проверени; известните проблеми са изброени по-долу.'],
      },
      {
        h: 'Какво сме направили',
        list: [
          'Езикът на страницата следва избрания от вас език.',
          'Текстът и бутоните отговарят на минималния контраст; видима рамка показва къде е фокусът на клавиатурата.',
          'Връзка „Към съдържанието“ в началото на всяка публична страница.',
          'Полетата във формулярите имат етикети, а грешките се съобщават на екранните четци.',
          'Анимациите спират, когато устройството ви е настроено за намалено движение.',
        ],
      },
      {
        h: 'Известни ограничения',
        list: [
          'Работното пространство Studio за треньори и клубове и администраторските страници все още не са напълно проверени.',
          'Някои големи декоративни движещи се думи са с нисък контраст умишлено. Те повтарят близкия текст и са скрити от екранните четци.',
          'Някои малки бутони в Studio са по-малки от 44 на 44 пиксела.',
        ],
      },
      {
        h: 'Как проверихме',
        p: ['Самооценка на 3 ноември 2026 г. с автоматизирани инструменти (Lighthouse и axe) и ръчна проверка с клавиатура.'],
      },
      {
        h: 'Съобщете ни за проблем',
        p: [`Ако нещо не работи за вас, пишете на ${o.email}. Отговаряме в срок от [ДА СЕ ПОТВЪРДИ] работни дни и можем да ви предоставим информацията в друг формат.`],
      },
      {
        h: 'Прилагане',
        p: ['Ако не сте доволни от отговора ни, можете да се обърнете към българския орган, отговорен за прилагането на Европейския акт за достъпността [ДА СЕ ПОТВЪРДИ органът и връзката].'],
      },
    ],
  },
};
