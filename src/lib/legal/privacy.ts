/*
 * Draft generated for review by qualified counsel. Not legal advice.
 *
 * Privacy policy (GDPR Art. 13 and 14), written from the data map in LAUNCH_AUDIT.md.
 * Every [TO CONFIRM] must be settled before launch.
 */
import { OWNER, type LegalSet } from './owner';

const o = OWNER;

export const privacy: LegalSet = {
  en: {
    title: 'Privacy policy',
    summary: 'What personal data Lokka collects, why, who it goes to, how long we keep it and how to use your rights.',
    blocks: [
      {
        id: 'controller',
        h: '1. Who is responsible for your data',
        p: [
          `The controller is ${o.company}, ${o.address}, registration and VAT numbers ${o.numbers}. Contact for anything about your data: ${o.email}.`,
          'Data protection officer: [TO CONFIRM whether one is required; if so, add name and contact].',
        ],
      },
      {
        h: '2. What this policy covers',
        p: ['This policy covers the Lokka website and everything you do on it: browsing, creating an account, booking or requesting sessions, messaging, and the Studio workspace for coaches and clubs.'],
      },
      {
        id: 'purposes',
        h: '3. What we collect, why, on what legal basis, and for how long',
        table: [
          ['Data', 'Why we use it', 'Legal basis (GDPR Art. 6)', 'How long we keep it'],
          ['Account: email, password (stored only as a secure hash), name, chosen role (athlete, coach, club), language', 'To create and run your account', 'Contract, 6(1)(b)', 'While your account is open, then [RETENTION – TO CONFIRM]'],
          ['Public profile of coaches and clubs: name, photo, sports, area, prices, description, availability, verification status', 'To show you to athletes', 'Contract, 6(1)(b)', 'While your account is open'],
          ['Qualification documents uploaded by coaches and clubs', 'To check qualifications before a profile is shown as verified', 'Contract, 6(1)(b), and our legitimate interest in a trustworthy marketplace, 6(1)(f)', '[RETENTION – TO CONFIRM]'],
          ['Bookings, session requests, attendance', 'To arrange sessions between athletes and coaches or clubs', 'Contract, 6(1)(b)', '[RETENTION – TO CONFIRM]'],
          ['Messages between users', 'To let you talk to each other', 'Contract, 6(1)(b)', '[RETENTION – TO CONFIRM]'],
          ['Saved items (bookmarks)', 'To keep your lists', 'Contract, 6(1)(b)', 'Until you remove them or close your account'],
          ['Profile views: which profile, when, and your account id if you are signed in', 'To show coaches how many people viewed them and to order the Trending page', 'Legitimate interest, 6(1)(f)', '[RETENTION – TO CONFIRM]'],
          ['Reports and removal requests: your message and, if you give it, your email', 'To correct or remove listings and to answer you', 'Legitimate interest, 6(1)(f); legal obligation where a removal is required by law, 6(1)(c)', '[RETENTION – TO CONFIRM]'],
          ['Club page claims', 'To check that you represent the club before handing you its page', 'Contract, 6(1)(b)', '[RETENTION – TO CONFIRM]'],
          ['Orders, paid services and invoices', 'To provide what you bought and to keep accounting records', 'Contract, 6(1)(b); legal obligation under accounting and tax law, 6(1)(c)', 'As long as accounting law requires [PERIOD – TO CONFIRM]'],
          ['Technical and security logs kept by our providers: IP address, browser and device details, sign-in times', 'To keep the service secure and prevent abuse', 'Legitimate interest, 6(1)(f)', '[RETENTION – TO CONFIRM]'],
          ['Settings stored on your device: sign-in session, language, cookie choice', 'To make the site work; see the cookie page', 'Strictly necessary', 'See the cookie page'],
        ],
      },
      {
        h: '4. Data about people who do not use Lokka',
        list: [
          'Clients that a coach or club records in the Studio (names, contact details, notes, sessions, invoices). For this data the coach or club is the controller and Lokka processes it only on their instructions, as a processor (GDPR Art. 28). Coaches and clubs must tell their clients about it.',
          'Club and event listings. We list sports clubs and events using public business facts from OpenStreetMap and from organisers\' own websites: name, sports, address, website and dates. Each listing shows its source. We do not store personal phone numbers or emails for these listings. Anyone can ask for a correction or removal with the button on the listing, or by writing to us.',
        ],
      },
      {
        h: '5. Do you have to give us your data?',
        p: [
          'An email address and password are needed to create an account. Coaches and clubs must provide the details needed for verification. Everything else, such as a photo, a description or an email address on a report, is optional. If you do not give the required details, we cannot open the account or provide the service.',
        ],
      },
      {
        h: '6. Automated decisions',
        p: ['We do not make decisions about you based only on automated processing that have legal or similarly significant effects. Search results and the Trending page are sorted automatically by activity, distance and paid placement; paid placements are marked as such.'],
      },
      {
        id: 'recipients',
        h: '7. Who receives your data',
        table: [
          ['Recipient', 'Role', 'Location and safeguards'],
          ['Supabase (database, sign-in, file storage)', 'Processor', 'Server region [TO CONFIRM]; Supabase Inc. is a US company: [DPF or SCCs – TO CONFIRM]'],
          ['Lovable (platform the site is built and run on; sign-in broker for "Continue with Google"; email gateway)', 'Processor', '[TO CONFIRM location and safeguards]'],
          ['Resend (sends service emails)', 'Processor', 'United States: [DPF or SCCs – TO CONFIRM]'],
          [`Hosting provider: ${o.host}`, 'Processor', '[TO CONFIRM]'],
          ['Google, only if you choose "Continue with Google"', 'Separate controller for its own sign-in', 'United States: EU-US Data Privacy Framework [TO CONFIRM]'],
          ['Other Lokka users', 'They see what you make public, and messages or requests you send them', 'n/a'],
          ['Public authorities', 'Only when the law requires it', 'n/a'],
        ],
        p: ['We do not sell your data and we do not use advertising trackers.'],
      },
      {
        h: '8. Transfers outside the EU',
        p: ['Some providers above are based in the United States. Where data leaves the European Economic Area we rely on the EU-US Data Privacy Framework for certified providers, or on the European Commission\'s Standard Contractual Clauses [TO CONFIRM for each provider]. You can ask us for a copy of these safeguards.'],
      },
      {
        id: 'rights',
        h: '9. Your rights',
        list: [
          'Access: get a copy of your data.',
          'Rectification: have wrong data corrected.',
          'Erasure: have your data deleted when there is no reason to keep it.',
          'Restriction: have the use of your data paused while a question is checked.',
          'Portability: receive the data you gave us in a common machine-readable format.',
          'Objection: object to uses based on our legitimate interest.',
          'Withdraw consent at any time, for anything based on consent. This does not affect what was done before.',
        ],
        p: [`Write to ${o.email}. We answer within one month; for complex requests this can be extended by two more months, and we will tell you. We may ask you to confirm your identity.`],
      },
      {
        id: 'complaints',
        h: '10. Complaints',
        p: ['You can complain to the Bulgarian supervisory authority, the Commission for Personal Data Protection (КЗЛД), www.cpdp.bg [TO CONFIRM name, address and link], or to the authority in the EU country where you live or work. We would welcome the chance to sort it out with you first.'],
      },
      {
        h: '11. Children',
        p: ['Lokka is not meant for children under [MINIMUM AGE – TO CONFIRM] unless a parent or guardian agrees and manages the account.'],
      },
      {
        h: '12. Security',
        p: ['Connections are encrypted, passwords are stored only as hashes, and database rules make sure each account can only reach its own private data.'],
      },
      {
        h: '13. Changes',
        p: ['If we change this policy we will publish the new version here with its date. If the change is significant we will tell account holders before it takes effect.'],
      },
    ],
  },
  bg: {
    title: 'Политика за поверителност',
    summary: 'Какви лични данни събира Lokka, защо, на кого ги предава, колко време ги пази и как да упражните правата си.',
    blocks: [
      {
        id: 'controller',
        h: '1. Кой отговаря за данните ви',
        p: [
          `Администратор на данните е ${o.company}, ${o.address}, ЕИК и ДДС номер ${o.numbers}. За всякакви въпроси относно данните ви: ${o.email}.`,
          'Длъжностно лице по защита на данните: [ДА СЕ ПОТВЪРДИ дали е задължително; ако да, добавете име и контакт].',
        ],
      },
      {
        h: '2. Какво обхваща тази политика',
        p: ['Тази политика обхваща уебсайта Lokka и всичко, което правите в него: разглеждане, създаване на профил, заявки и резервации за тренировки, съобщения и работното пространство Studio за треньори и клубове.'],
      },
      {
        id: 'purposes',
        h: '3. Какво събираме, защо, на какво основание и за колко време',
        table: [
          ['Данни', 'За какво ги използваме', 'Правно основание (чл. 6 ОРЗД)', 'Срок на съхранение'],
          ['Профил: имейл, парола (пази се само като защитен хеш), име, избрана роля (спортист, треньор, клуб), език', 'За създаване и поддържане на профила ви', 'Договор, чл. 6(1)(б)', 'Докато профилът е активен, след това [СРОК – ДА СЕ ПОТВЪРДИ]'],
          ['Публичен профил на треньори и клубове: име, снимка, спортове, район, цени, описание, свободни часове, статус на проверка', 'За да ви виждат спортистите', 'Договор, чл. 6(1)(б)', 'Докато профилът е активен'],
          ['Документи за квалификация, качени от треньори и клубове', 'За проверка на квалификацията, преди профилът да бъде показан като проверен', 'Договор, чл. 6(1)(б), и легитимен интерес от надежден пазар, чл. 6(1)(е)', '[СРОК – ДА СЕ ПОТВЪРДИ]'],
          ['Резервации, заявки за тренировки, присъствие', 'За организиране на тренировки между спортисти и треньори или клубове', 'Договор, чл. 6(1)(б)', '[СРОК – ДА СЕ ПОТВЪРДИ]'],
          ['Съобщения между потребители', 'За да можете да си пишете', 'Договор, чл. 6(1)(б)', '[СРОК – ДА СЕ ПОТВЪРДИ]'],
          ['Запазени елементи (отметки)', 'За вашите списъци', 'Договор, чл. 6(1)(б)', 'Докато не ги премахнете или закриете профила си'],
          ['Прегледи на профили: кой профил, кога и номерът на вашия профил, ако сте влезли', 'За да покажем на треньорите колко хора са ги разгледали и за подреждане на страницата „Горещо“', 'Легитимен интерес, чл. 6(1)(е)', '[СРОК – ДА СЕ ПОТВЪРДИ]'],
          ['Сигнали и искания за премахване: вашето съобщение и имейл, ако го посочите', 'За коригиране или премахване на обяви и за отговор', 'Легитимен интерес, чл. 6(1)(е); законово задължение, когато премахването се изисква по закон, чл. 6(1)(в)', '[СРОК – ДА СЕ ПОТВЪРДИ]'],
          ['Заявки за поемане на страница на клуб', 'За проверка, че представлявате клуба, преди да ви предоставим страницата', 'Договор, чл. 6(1)(б)', '[СРОК – ДА СЕ ПОТВЪРДИ]'],
          ['Поръчки, платени услуги и фактури', 'За предоставяне на закупеното и за счетоводна отчетност', 'Договор, чл. 6(1)(б); законово задължение по счетоводното и данъчното законодателство, чл. 6(1)(в)', 'Колкото изисква счетоводното законодателство [СРОК – ДА СЕ ПОТВЪРДИ]'],
          ['Технически дневници и дневници за сигурност при нашите доставчици: IP адрес, данни за браузъра и устройството, часове на вход', 'За сигурност на услугата и предотвратяване на злоупотреби', 'Легитимен интерес, чл. 6(1)(е)', '[СРОК – ДА СЕ ПОТВЪРДИ]'],
          ['Настройки, пазени на вашето устройство: сесия за вход, език, избор за бисквитки', 'За работата на сайта; вижте страницата за бисквитки', 'Строго необходими', 'Вижте страницата за бисквитки'],
        ],
      },
      {
        h: '4. Данни за хора, които не използват Lokka',
        list: [
          'Клиенти, които треньор или клуб въвежда в Studio (имена, данни за контакт, бележки, тренировки, фактури). За тези данни администратор е треньорът или клубът, а Lokka ги обработва само по техни указания като обработващ (чл. 28 ОРЗД). Треньорите и клубовете трябва да информират клиентите си за това.',
          'Обяви за клубове и събития. Показваме спортни клубове и събития с публична фирмена информация от OpenStreetMap и от сайтовете на организаторите: име, спортове, адрес, уебсайт и дати. Всяка обява посочва източника си. Не пазим лични телефони или имейли за тези обяви. Всеки може да поиска корекция или премахване чрез бутона в обявата или като ни пише.',
        ],
      },
      {
        h: '5. Длъжни ли сте да ни предоставите данни?',
        p: ['За създаване на профил са необходими имейл и парола. Треньорите и клубовете трябва да предоставят данните, нужни за проверка. Всичко останало, като снимка, описание или имейл към сигнал, е по желание. Без задължителните данни не можем да открием профил или да предоставим услугата.'],
      },
      {
        h: '6. Автоматизирани решения',
        p: ['Не вземаме решения за вас единствено въз основа на автоматизирана обработка, които пораждат правни последици или ви засягат по сходен начин. Резултатите от търсене и страницата „Горещо“ се подреждат автоматично според активност, разстояние и платено позициониране; платените позиции са обозначени.'],
      },
      {
        id: 'recipients',
        h: '7. Кой получава данните ви',
        table: [
          ['Получател', 'Роля', 'Местоположение и гаранции'],
          ['Supabase (база данни, вход, съхранение на файлове)', 'Обработващ', 'Регион на сървъра [ДА СЕ ПОТВЪРДИ]; Supabase Inc. е американско дружество: [DPF или СДК – ДА СЕ ПОТВЪРДИ]'],
          ['Lovable (платформата, на която е изграден и работи сайтът; посредник при „Вход с Google“; имейл шлюз)', 'Обработващ', '[ДА СЕ ПОТВЪРДИ местоположение и гаранции]'],
          ['Resend (изпраща служебни имейли)', 'Обработващ', 'САЩ: [DPF или СДК – ДА СЕ ПОТВЪРДИ]'],
          [`Хостинг доставчик: ${o.host}`, 'Обработващ', '[ДА СЕ ПОТВЪРДИ]'],
          ['Google, само ако изберете „Вход с Google“', 'Самостоятелен администратор за собствения си вход', 'САЩ: Рамка за защита на данните ЕС–САЩ [ДА СЕ ПОТВЪРДИ]'],
          ['Други потребители на Lokka', 'Виждат това, което направите публично, и съобщенията или заявките, които им изпратите', '—'],
          ['Държавни органи', 'Само когато законът го изисква', '—'],
        ],
        p: ['Не продаваме данните ви и не използваме рекламни тракери.'],
      },
      {
        h: '8. Предаване извън ЕС',
        p: ['Някои от доставчиците по-горе са в САЩ. Когато данни напускат Европейското икономическо пространство, разчитаме на Рамката за защита на данните ЕС–САЩ за сертифицираните доставчици или на стандартните договорни клаузи на Европейската комисия [ДА СЕ ПОТВЪРДИ за всеки доставчик]. Можете да поискате копие от тези гаранции.'],
      },
      {
        id: 'rights',
        h: '9. Вашите права',
        list: [
          'Достъп: да получите копие от данните си.',
          'Коригиране: да поправите неточни данни.',
          'Изтриване: да изтриете данните си, когато няма основание да се пазят.',
          'Ограничаване: да спрете временно използването им, докато се изяснява въпрос.',
          'Преносимост: да получите данните, които сте ни дали, в общоприет машинночетим формат.',
          'Възражение: да възразите срещу обработка въз основа на нашия легитимен интерес.',
          'Оттегляне на съгласие по всяко време за обработка, основана на съгласие. Това не засяга вече извършената обработка.',
        ],
        p: [`Пишете ни на ${o.email}. Отговаряме в срок от един месец; при сложни искания срокът може да бъде удължен с още два месеца, за което ще ви уведомим. Може да ви помолим да потвърдите самоличността си.`],
      },
      {
        id: 'complaints',
        h: '10. Жалби',
        p: ['Можете да подадете жалба до Комисията за защита на личните данни (КЗЛД), www.cpdp.bg [ДА СЕ ПОТВЪРДИ наименование, адрес и връзка], или до надзорния орган в държавата от ЕС, в която живеете или работите. Ще се радваме първо да опитаме да решим въпроса заедно.'],
      },
      {
        h: '11. Деца',
        p: ['Lokka не е предназначен за деца под [МИНИМАЛНА ВЪЗРАСТ – ДА СЕ ПОТВЪРДИ] без съгласието на родител или настойник, който управлява профила.'],
      },
      {
        h: '12. Сигурност',
        p: ['Връзките са криптирани, паролите се пазят само като хеш, а правилата на базата данни гарантират, че всеки профил достъпва само собствените си лични данни.'],
      },
      {
        h: '13. Промени',
        p: ['Ако променим тази политика, ще публикуваме новата версия тук с дата. При съществени промени ще уведомим регистрираните потребители преди влизането им в сила.'],
      },
    ],
  },
};
