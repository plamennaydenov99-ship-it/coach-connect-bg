/*
 * Draft generated for review by qualified counsel. Not legal advice.
 *
 * Terms and conditions, including EU consumer-law terms (Directive 2011/83/EU on consumer
 * rights, Directive 2019/770 on digital services) because the owner said Lokka sells online.
 * The code has no checkout yet: describe what is actually sold before publishing.
 */
import { OWNER, type LegalSet } from './owner';

const o = OWNER;

const formEn = [
  `To: ${o.company}, ${o.address}, ${o.email}`,
  'I/We (*) hereby give notice that I/We (*) withdraw from my/our (*) contract of sale of the following goods (*) / for the provision of the following service (*):',
  'Ordered on (*) / received on (*):',
  'Name of consumer(s):',
  'Address of consumer(s):',
  'Signature of consumer(s) (only if this form is notified on paper):',
  'Date:',
  '(*) Delete as appropriate.',
];

const formBg = [
  `До: ${o.company}, ${o.address}, ${o.email}`,
  'Аз/Ние (*) уведомявам/уведомяваме (*), че се отказвам/отказваме (*) от сключения от мен/нас (*) договор за покупка на следните стоки (*) / за предоставяне на следната услуга (*):',
  'Поръчан на (*) / получен на (*):',
  'Име на потребителя/потребителите:',
  'Адрес на потребителя/потребителите:',
  'Подпис на потребителя/потребителите (само ако формулярът е на хартия):',
  'Дата:',
  '(*) Ненужното се зачертава.',
];

export const terms: LegalSet = {
  en: {
    title: 'Terms and conditions',
    summary: 'The rules for using Lokka and for anything you buy from us, including your 14-day right of withdrawal.',
    blocks: [
      {
        h: '1. Who we are',
        p: [`Lokka is run by ${o.company}, ${o.address}, registration and VAT numbers ${o.numbers}, email ${o.email}. Full details are on the legal notice page.`],
      },
      {
        h: '2. What Lokka is',
        p: [
          'Lokka helps athletes in Sofia find coaches, clubs and events. Coaches and clubs run their own sessions. Unless a page says otherwise, a session you book is an agreement between you and the coach or club, and Lokka is not a party to it [TO CONFIRM].',
          'Listings of clubs and events that have not joined Lokka are based on public information and are marked as such.',
        ],
      },
      {
        h: '3. Your account',
        list: [
          'Give accurate details and keep them up to date.',
          'Keep your password private. You are responsible for what happens in your account.',
          'One person per account. You must be at least [MINIMUM AGE – TO CONFIRM], or have a parent or guardian manage the account.',
          `You can close your account at any time by writing to ${o.email} [TO CONFIRM a self-service delete option].`,
        ],
      },
      {
        h: '4. Rules for everyone',
        list: [
          'No unlawful, misleading or offensive content, and no fake profiles or reviews.',
          'No harassment, spam or attempts to break or overload the service.',
          'Respect other people\'s rights, including their privacy and intellectual property.',
          'We may remove content or suspend an account that breaks these rules. We will tell you why and how to contest the decision, unless the law forbids it.',
        ],
      },
      {
        h: '5. Coaches and clubs',
        list: [
          'Your qualifications and profile must be true. We may ask for documents before showing you as verified.',
          'You are responsible for your sessions, safety, insurance, prices and taxes.',
          'Client records in the Studio: you are the controller of your clients\' data and Lokka processes it only on your instructions, keeps it confidential and secure, uses only the processors listed in the privacy policy, helps you answer your clients\' requests, and deletes or returns it when you leave. The full data processing terms (GDPR Art. 28) are [TO CONFIRM: annex to be added].',
        ],
      },
      {
        id: 'sales',
        h: '6. What we sell (information before you buy)',
        list: [
          'Services: [DESCRIPTION OF PAID SERVICES – TO CONFIRM, e.g. Boost paid placement for coaches and clubs].',
          'Main characteristics, duration and, for subscriptions, how to cancel: shown on the order page before you pay [TO CONFIRM].',
          'Price: shown in [CURRENCY – TO CONFIRM], including VAT where it applies, plus any other charges, before you confirm the order.',
          'Payment methods: [TO CONFIRM].',
          'When the service starts: [TO CONFIRM].',
          'The contract is concluded when we confirm your order by email. It is available in English and Bulgarian.',
        ],
      },
      {
        id: 'withdrawal',
        h: '7. Your right of withdrawal (consumers)',
        p: [
          'If you are a consumer you can withdraw from a contract made online within 14 days without giving any reason. The 14 days start on the day the contract is concluded.',
          `To withdraw, tell us clearly before the 14 days end, for example by email to ${o.email}. You can use the model form below, but you do not have to.`,
          'We refund all payments within 14 days of receiving your notice, using the same payment method unless you agree otherwise, at no cost to you.',
          'If you asked us to start a service during the withdrawal period, you pay for the part already provided. Once the service has been fully provided you lose the right of withdrawal, provided you expressly asked for it to start and acknowledged that you would lose the right.',
          'Business customers (for example coaches and clubs buying for their business) do not have this right.',
        ],
      },
      {
        id: 'form',
        h: '8. Model withdrawal form',
        p: ['Complete and return this form only if you wish to withdraw from the contract.'],
        list: formEn,
      },
      {
        h: '9. Legal guarantee of conformity',
        p: [
          'Consumers have a legal guarantee that what we provide matches the contract. If it does not, you are entitled to have it brought into conformity, or to a price reduction or to end the contract, under Bulgarian law on digital content, digital services and the sale of goods [TO CONFIRM the exact act].',
          `Send complaints to ${o.email}. We confirm receipt and answer within [TO CONFIRM] days.`,
        ],
      },
      {
        h: '10. Complaints and disputes',
        p: [
          'Please contact us first so we can try to fix the problem.',
          'Consumers can also turn to the Commission for Consumer Protection (КЗП), www.kzp.bg, and its conciliation committees for out-of-court settlement [TO CONFIRM the competent body and link].',
          'These terms are governed by Bulgarian law. If you are a consumer living in another EU country, you keep the protection of the mandatory rules of that country and can go to the courts where you live.',
        ],
      },
      {
        h: '11. Liability',
        p: [
          'Nothing in these terms limits liability that cannot be limited by law, including for death or personal injury caused by negligence, or for intent or gross negligence.',
          'Sport carries a risk of injury. Check with a doctor if you are unsure whether an activity is right for you. [TO CONFIRM further limits with counsel].',
        ],
      },
      {
        h: '12. Content and intellectual property',
        p: [
          'You keep the rights to what you post and allow us to show it on Lokka for as long as it is online. The Lokka name, design and software belong to us.',
          'Map and club data marked as such come from OpenStreetMap, © OpenStreetMap contributors, under the Open Database License.',
        ],
      },
      {
        h: '13. Changes to these terms',
        p: ['We will tell account holders about important changes before they take effect. If you do not agree, you can close your account.'],
      },
      {
        h: '14. Contact',
        p: [`${o.company}, ${o.address}, ${o.email}.`],
      },
    ],
  },
  bg: {
    title: 'Общи условия',
    summary: 'Правилата за ползване на Lokka и за всичко, което купувате от нас, включително правото ви на отказ в 14-дневен срок.',
    blocks: [
      {
        h: '1. Кои сме ние',
        p: [`Lokka се управлява от ${o.company}, ${o.address}, ЕИК и ДДС номер ${o.numbers}, имейл ${o.email}. Пълните данни са на страницата „Правна информация“.`],
      },
      {
        h: '2. Какво е Lokka',
        p: [
          'Lokka помага на спортисти в София да намерят треньори, клубове и събития. Треньорите и клубовете провеждат собствените си тренировки. Освен ако страницата не посочва друго, резервираната тренировка е договор между вас и треньора или клуба, а Lokka не е страна по него [ДА СЕ ПОТВЪРДИ].',
          'Обявите за клубове и събития, които не са се присъединили към Lokka, се основават на публична информация и са обозначени като такива.',
        ],
      },
      {
        h: '3. Вашият профил',
        list: [
          'Посочвайте верни данни и ги поддържайте актуални.',
          'Пазете паролата си в тайна. Вие отговаряте за действията във вашия профил.',
          'Един човек на профил. Трябва да сте навършили [МИНИМАЛНА ВЪЗРАСТ – ДА СЕ ПОТВЪРДИ] или профилът да се управлява от родител или настойник.',
          `Можете да закриете профила си по всяко време, като ни пишете на ${o.email} [ДА СЕ ПОТВЪРДИ възможност за самостоятелно изтриване].`,
        ],
      },
      {
        h: '4. Правила за всички',
        list: [
          'Без незаконно, подвеждащо или обидно съдържание и без фалшиви профили или отзиви.',
          'Без тормоз, спам или опити да се наруши или претовари услугата.',
          'Зачитайте правата на другите, включително личния им живот и интелектуалната им собственост.',
          'Можем да премахнем съдържание или да спрем профил, който нарушава тези правила. Ще ви уведомим за причината и как да оспорите решението, освен ако законът не го забранява.',
        ],
      },
      {
        h: '5. Треньори и клубове',
        list: [
          'Квалификациите и профилът ви трябва да са верни. Можем да поискаме документи, преди да ви покажем като проверени.',
          'Вие отговаряте за тренировките си, безопасността, застраховката, цените и данъците.',
          'Записи за клиенти в Studio: вие сте администратор на данните на клиентите си, а Lokka ги обработва само по ваши указания, пази ги поверителни и защитени, използва само обработващите, посочени в политиката за поверителност, помага ви да отговаряте на исканията на клиентите си и ги изтрива или връща, когато напуснете. Пълните условия за обработване (чл. 28 ОРЗД) са [ДА СЕ ПОТВЪРДИ: предстои приложение].',
        ],
      },
      {
        id: 'sales',
        h: '6. Какво продаваме (информация преди покупка)',
        list: [
          'Услуги: [ОПИСАНИЕ НА ПЛАТЕНИТЕ УСЛУГИ – ДА СЕ ПОТВЪРДИ, напр. платено позициониране Boost за треньори и клубове].',
          'Основни характеристики, срок и, при абонамент, начин на прекратяване: показват се на страницата на поръчката преди плащане [ДА СЕ ПОТВЪРДИ].',
          'Цена: в [ВАЛУТА – ДА СЕ ПОТВЪРДИ], с включен ДДС, когато е приложим, и всички други разходи, преди да потвърдите поръчката.',
          'Начини на плащане: [ДА СЕ ПОТВЪРДИ].',
          'Начало на услугата: [ДА СЕ ПОТВЪРДИ].',
          'Договорът се сключва, когато потвърдим поръчката ви по имейл. Достъпен е на български и английски език.',
        ],
      },
      {
        id: 'withdrawal',
        h: '7. Право на отказ (потребители)',
        p: [
          'Ако сте потребител, можете да се откажете от договор, сключен онлайн, в срок от 14 дни, без да посочвате причина. Срокът тече от деня на сключване на договора.',
          `За да се откажете, уведомете ни ясно преди изтичане на 14-те дни, например по имейл на ${o.email}. Можете да използвате стандартния формуляр по-долу, но не сте длъжни.`,
          'Възстановяваме всички плащания в срок от 14 дни от получаване на уведомлението, чрез същия начин на плащане, освен ако не се договорим друго, без разходи за вас.',
          'Ако сте поискали услугата да започне през срока за отказ, заплащате вече предоставената част. След като услугата е изцяло предоставена, губите правото на отказ, при условие че изрично сте поискали започването ѝ и сте потвърдили, че ще загубите това право.',
          'Бизнес клиентите (например треньори и клубове, които купуват за дейността си) нямат това право.',
        ],
      },
      {
        id: 'form',
        h: '8. Стандартен формуляр за упражняване правото на отказ',
        p: ['Попълнете и изпратете този формуляр само ако желаете да се откажете от договора.'],
        list: formBg,
      },
      {
        h: '9. Законова гаранция за съответствие',
        p: [
          'Потребителите имат законова гаранция, че предоставеното от нас съответства на договора. Ако не съответства, имате право то да бъде приведено в съответствие, на намаляване на цената или на прекратяване на договора съгласно българското законодателство за цифровото съдържание, цифровите услуги и продажбата на стоки [ДА СЕ ПОТВЪРДИ точният закон].',
          `Изпращайте рекламации на ${o.email}. Потвърждаваме получаването и отговаряме в срок от [ДА СЕ ПОТВЪРДИ] дни.`,
        ],
      },
      {
        h: '10. Жалби и спорове',
        p: [
          'Моля, първо се свържете с нас, за да опитаме да решим проблема.',
          'Потребителите могат да се обърнат и към Комисията за защита на потребителите (КЗП), www.kzp.bg, и нейните помирителни комисии за извънсъдебно решаване на спорове [ДА СЕ ПОТВЪРДИ компетентният орган и връзката].',
          'Тези условия се уреждат от българското право. Ако сте потребител, живеещ в друга държава от ЕС, запазвате защитата на задължителните правила на тази държава и можете да се обърнете към съдилищата по местоживеенето си.',
        ],
      },
      {
        h: '11. Отговорност',
        p: [
          'Нищо в тези условия не ограничава отговорност, която по закон не може да бъде ограничена, включително за смърт или телесна повреда, причинени по небрежност, или за умисъл или груба небрежност.',
          'Спортът носи риск от травми. Консултирайте се с лекар, ако не сте сигурни дали дадена дейност е подходяща за вас. [ДА СЕ ПОТВЪРДИ допълнителни ограничения с юрист].',
        ],
      },
      {
        h: '12. Съдържание и интелектуална собственост',
        p: [
          'Запазвате правата върху публикуваното от вас и ни разрешавате да го показваме в Lokka, докато е онлайн. Името, дизайнът и софтуерът на Lokka са наша собственост.',
          'Картографските данни и данните за клубове, обозначени като такива, са от OpenStreetMap, © сътрудниците на OpenStreetMap, под лиценз Open Database License.',
        ],
      },
      {
        h: '13. Промени в условията',
        p: ['Ще уведомим регистрираните потребители за важни промени преди влизането им в сила. Ако не сте съгласни, можете да закриете профила си.'],
      },
      {
        h: '14. Контакт',
        p: [`${o.company}, ${o.address}, ${o.email}.`],
      },
    ],
  },
};
