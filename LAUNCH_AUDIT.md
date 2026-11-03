# Lokka: EU launch-readiness audit

Audit 3 November 2026, Phases 1 to 3. Repo `coach-connect-bg`, branch `main`.

Standards checked:
- GDPR (Reg. 2016/679)
- ePrivacy, with CNIL guidance as the reference
- European Accessibility Act / WCAG 2.1 AA (EN 301 549)
- Bulgarian publisher-identification rules

Owner decisions:
- Bulgaria is the primary member state; legal pages are in **BG + EN**. French readers see the English text with a note.
- The site **sells online**, so the terms include full EU consumer-law content.
- **Hosting is not decided**; headers ship in a host-neutral file.
- All company, host and contact details are placeholders in the brief and stay `[...]` / `[TO CONFIRM]`. They are all filled from one file: `src/lib/legal/owner.ts`.

> Every legal page carries the HTML comment, and a visible notice: **"Draft generated for review by qualified counsel. Not legal advice."**

---

## 1. Final status of the 20 items

| # | Item | Before | **After** | Files changed | Open points |
|---|---|---|---|---|---|
| 1 | Privacy policy (Art. 13/14) | FAIL | **PASS (draft)** | `src/lib/legal/privacy.ts`, `src/pages/legal/LegalPage.tsx`, `src/App.tsx` (`/privacy`) | Controller details, DPO, Supabase region, processor safeguards, every retention period, minimum age, КЗЛД name/link [TO CONFIRM] |
| 2 | Terms (consumer law) + legal notice | FAIL | **PASS (draft)** | `src/lib/legal/terms.ts` (`/terms`: pre-contract info, 14-day withdrawal, model form, legal guarantee, VAT-inclusive prices, ADR via КЗП, Art. 28 clause for the coach CRM), `src/lib/legal/notice.ts` (`/legal`), footer on every public page | What is sold, currency, payment methods, complaint reply time, exact Bulgarian acts, КЗП as ADR body [TO CONFIRM]. See note A. |
| 3 | Secrets off the frontend | PARTIAL | **PASS** | `.gitignore` (`.env.*`, `!.env.example`), new `.env.example` | `.env` deliberately stays tracked (see note B). **MUST ROTATE: none.** |
| 4 | HTTPS + security headers | FAIL | **PARTIAL** (ready in repo; live once hosting is chosen) | new `public/_headers` (HSTS 1 year, **no preload**; CSP from the data map; nosniff; strict-origin-when-cross-origin; Permissions-Policy; `frame-ancestors 'none'` + X-Frame-Options), `public/_redirects`, `docs/launch-hosting.md` | Hosting choice; whether the host reads `_headers`. HTTP→HTTPS is a host setting. See note C. |
| 5 | Cookie consent (CNIL) | FAIL | **PASS** | Fonts self-hosted: `public/fonts/*.woff2` (14 files, 484 KB, OFL), `src/fonts.css`; Google injection removed from `src/main.tsx`. New `src/lib/consent.ts`, `src/components/CookieBanner.tsx`, `/cookies` page, footer "Cookie settings" button. | None |
| 6 | Unique title + description | FAIL | **PASS** | new `src/hooks/usePageMeta.ts`, used on every public page (incl. event, club and coach pages with their own names); 55 new strings in `src/lib/translations.ts`. All titles ≤60 and descriptions ≤155, checked by script in EN/BG/FR. | BG/FR wording needs a native read |
| 7 | Open Graph / Twitter + 1200×630 | FAIL | **PASS (placeholder image)** | `index.html`, `usePageMeta`, new `public/og-image.png` (1200×630, brand colours) | **Placeholder image: replace with a designed one.** Domain in absolute URLs [TO CONFIRM] |
| 8 | Favicon set | PARTIAL | **PASS** | `public/favicon.ico` (replaced), `favicon-32.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `site.webmanifest`, `index.html` | Placeholder "L" mark until there is a logo |
| 9 | sitemap.xml + robots.txt | PARTIAL | **PASS** | new `public/sitemap.xml` (14 static pages incl. all legal pages), `public/robots.txt` (allows all public pages; keeps out signed-in staff/admin areas only; Sitemap line) | Final domain [TO CONFIRM]; event/club/coach pages need a generated sitemap later |
| 10 | Alt text | PARTIAL | **PASS** | Re-check: all 19 `<img>` have `alt` (the first scan missed multi-line tags). Decorative photos use `alt=""`, hero photos describe the scene. | None |
| 11 | Images: WebP, sizes, lazy | FAIL | **PASS** | Hero photos as WebP 1200w (87–95 KB) and 2400w (252–314 KB), JPG fallback, via new `src/components/Picture.tsx`, used in `HomeSections.tsx`, `Trending.tsx`, `Start.tsx` (incl. a CSS `image-set()` background); `width`/`height`, `loading="lazy"` and `decoding="async"` added to 13 other images | Original JPGs kept as fallback (840–890 KB); recompress if wanted |
| 12 | Lighthouse before/after | NOT MEASURED | **DONE** (section 4) | none | Lab INP is not measurable; Total Blocking Time is the lab stand-in |
| 13 | Accessibility (WCAG 2.1 AA) | FAIL | **PASS on audited public pages** (Lighthouse a11y 100 on 6 of 7 pages) | `LanguageContext.tsx` (`<html lang>` follows language); `index.css` (clay `#B5603A`→`#9A4D2B`: white-on-clay 4.47→**6.05**, clay-on-sand 3.84→**5.19**, hover 3.67→**7.78**; global `:focus-visible` outline); `PublicNav.tsx` (skip link + `main` target); `LangSwitcher.tsx` (accessible names match the visible text; inactive contrast 4.18→>4.5); `HomeSections.tsx`, `Trending.tsx` (landmark, `dl` structure); `Start.tsx` (heading order, field errors via `aria-invalid`/`aria-describedby`/`role="alert"`); `ClubTile.tsx` (heading level); new `/accessibility` statement | Remaining flag: the decorative scrolling words on `/for-coaches` (`aria-hidden`, exempt as decoration). Studio and admin pages not audited. Whether the EAA applies (micro-enterprise exemption) [TO CONFIRM]. |
| 14 | Mobile (375/768/1440, 44px) | PARTIAL | **PASS on public pages** | 10 pages × 3 widths: **no horizontal scroll anywhere**. Tap areas raised to ≥44px: language buttons, menu button, nav links, logo, footer links, admin tabs, report buttons, "see all" link. | Studio/admin internals not measured; inline text links inside paragraphs are excluded, as WCAG allows |
| 15 | Custom 404 | PARTIAL | **PASS** | `src/pages/NotFound.tsx`: links to Home, Trending, Find a coach, Clubs, Events, For coaches; own title | None |
| 16 | Broken links | PARTIAL | **PASS** | Footer "Privacy" and "Help" no longer point to `/`; link check against `App.tsx` routes: **0 broken internal links**. External links (not changed): `openstreetmap.org` (map/credit), `example.org` (admin CSV template sample), organiser/club websites from data | Where "Help" should finally go (now `/legal#contact`) [TO CONFIRM] |
| 17 | Form validation, minimisation, notice | PARTIAL | **PASS** | `Start.tsx` (sign-up: inline accessible errors, privacy + terms links at the point of collection); `ReportForm.tsx` (accessible errors, notice, requires a message for corrections); `ListingView.tsx` (claim notice). Fields were already minimal (name, email, password / message, optional email). No marketing opt-in, as no marketing email exists. | Add an unticked opt-in if marketing email is ever sent |
| 18 | Spam protection | FAIL | **PARTIAL** | Honeypot on sign-up and report forms (bots get a fake success). Server rate limit written in `supabase/migrations/20261103140000_report_rate_limit.sql` (3 per listing per 10 min, 60 per hour) and **tested in a rolled-back run on the live DB** (4th report blocked). **Not yet applied:** the tool refused the live write; it needs the owner's go-ahead. No CAPTCHA, so no reCAPTCHA consent issue. | Apply the migration (note D). Supabase Auth has its own sign-up rate limits. |
| 19 | Analytics | PARTIAL | **PASS** | new `src/lib/analytics.ts`: loads a tracker only after consent, from `VITE_ANALYTICS_SCRIPT_URL` / `VITE_ANALYTICS_SITE_ID` (empty, so nothing is installed). The banner appears only when these are set. | Owner chooses a tool and creates the account; then add its host to the CSP and list it on the privacy and cookie pages |
| 20 | One primary CTA per page | PARTIAL | **PARTIAL (report only)** | none | See section 6 |

---

## 2. Data map (final)

| # | Flow | Code | Purpose | Provider (country) | Non-EU? | Consent? |
|---|---|---|---|---|---|---|
| 1 | ~~Google Fonts~~ → **self-hosted fonts** | `src/fonts.css`, `public/fonts/` | Typography | this site | No | No (third-party call removed) |
| 2 | Supabase: auth, DB, storage | `src/integrations/supabase/client.ts` | Accounts, profiles, bookings, messages, CRM, listings | Supabase Inc. (US company), region [TO CONFIRM] | Possibly: DPF/SCCs [TO CONFIRM] | No (needed); processor, needs a DPA |
| 3 | "Continue with Google" via Lovable broker | `Start.tsx`, `@lovable.dev/cloud-auth-js` (full-page redirect / popup to `oauth.lovable.app`) | Optional sign-in | Lovable [TO CONFIRM] + Google (US) | Yes, on click only | No (user-initiated); disclosed |
| 4 | Lovable editor-preview session bridge | `previewAuthStorage.ts` | Only inside the Lovable editor iframe | Lovable | n/a | No; check if hosting on `*.lovable.app` |
| 5 | Service email (admin alerts) | `supabase/functions/notify-coach-application` | Admin notification | Resend (US) via Lovable gateway | Yes [TO CONFIRM safeguards] | No; processor, needs a DPA |
| 6 | Profile-view logging | `CoachProfile.tsx`, `profile_views` | View counts, Trending order | first party | see 2 | No (legitimate interest); disclosed |
| 7 | Reports / removal requests | `ReportForm.tsx` → `listing_reports` | Corrections, removals | first party | see 2 | No; notice at the form |
| 8 | Club claims | `ListingView.tsx` → `club_claims` | Verify page ownership | first party | see 2 | No; notice at the form |
| 9 | Coach CRM (clients' data) | `src/pages/coach/*` | Coach's own business records | Lokka as **processor** for the coach | see 2 | Covered by the Art. 28 clause in the terms (annex [TO CONFIRM]) |
| 10 | Device storage | `atleta_lang`, `lokka_consent`, `lokka_last_role`, `lokka_coach_clients_view`, Supabase `sb-…-auth-token` (localStorage); `zenit_intended_role`, `pv_…` (sessionStorage); `sidebar:state` cookie (7 days, Studio only) | Sign-in, preferences, consent record | first party | No | No (strictly necessary or user-requested); all listed on `/cookies` |
| 11 | Optional analytics | `src/lib/analytics.ts` | Audience measurement | **none configured** | n/a | **Yes**: loaded only after "Accept" |
| none | Ads, pixels, error tracking, chat, video/map embeds, CAPTCHA | not present | none | none | none | none |

---

## 3. "MUST ROTATE" secrets

**None.** No live or test keys (Stripe, Resend, AWS, GitHub, Slack, private keys, service-role keys) were found in source, `index.html`, `public/`, `scripts/`, `supabase/`, the built bundle or git history. Edge functions read secrets from server environment variables.

---

## 4. Before / after metrics

Lighthouse 12.2.1 on the production build (`vite preview`), mobile emulation with default throttling, each run in a fresh headless Chrome profile.

| Page | Perf before → after | LCP before → after | CLS before → after | TBT before → after | A11y before → after | SEO | Best practices |
|---|---|---|---|---|---|---|---|
| `/` | 62 → **74** | 6.9 s → **4.7 s** | 0 → 0 | 0 → 100 ms | 92 → **100** | 100 | 100 |
| `/discover` | 60 → **74** | 9.9 s → **4.8 s** | 0.001 → 0 | 0 → 40 ms | 92 → **100** | 100 | 100 |
| `/events` | 68 → **72** | 4.6 s → **4.4 s** | 0.173 → **0.132** | 30 → 20 ms | 91 → **100** | 100 | 100 |
| `/for-coaches` | 80 → 77 | 3.5 s → 4.4 s | 0.111 → **0** | 30 → 20 ms | 92 → **96** | 100 | 100 |
| `/start` | not measured → 72 | → 5.3 s | → 0 | → 30 ms | → 100 | 100 | 100 |
| `/clubs` | not measured → 55 | → 4.4 s | → **0.533** | → 20 ms | → 100 | 100 | 100 |
| `/privacy` | (new) 76 | 4.5 s | 0 | 10 ms | 100 | 100 | 100 |

**INP** cannot be measured in a lab run. Total Blocking Time stays at or under 100 ms on all pages, which points to a good INP.

**What still holds performance back:**
- The app ships as **one 1.86 MB JavaScript file** (535 KB gzipped). Splitting it per page (`React.lazy`) would cut LCP the most. This is outside the 20 items, so it is recommended, not done.
- `/clubs` jumps (CLS 0.53) while its list loads. This is a layout fix outside the 20 items.
- `/for-coaches` LCP rose slightly because the fonts are now self-hosted instead of cached from Google's CDN. That is the privacy trade-off; it narrows once hosting adds long-cache headers (already in `_headers`).

---

## 5. Phase 3 verification evidence

- **Type check:** `tsc -p tsconfig.app.json --noEmit` clean.
- **Build:** `vite build` OK.
- **Tests:**
  - `vitest run`: 10/10 pass.
  - The two `node:test` files (`routes.test.ts`, `sessionMetrics.test.ts`) were never Vitest suites. Before and after the changes, Vitest reports them as "no test suite". Run with Node's test runner (`npx tsx --test …`), they pass **12/12**.
- **Lint** on changed files: 0 errors (3 existing-style "fast refresh" warnings).
- **No non-essential request before consent.** In a fresh profile with storage cleared, the only hosts contacted on `/`, `/discover`, `/events`, `/clubs`, `/for-coaches`, `/start` and `/privacy` were **this site and the Lokka Supabase project**. No Google Fonts, no analytics, **no cookies set**.
- **Consent gate test.** A test build with a fake analytics script switched on:
  - Banner shows "Reject all" and "Accept all" side by side, both 164×48 px with the same colour.
  - Before a choice: no analytics script and no request for it.
  - After "Accept all": the script loaded and ran; record saved as `{"version":1,"decidedAt":"2026-11-03T12:21:31Z","choices":{"analytics":true}}`.
  - After "Reject all" and a reload: no script, no request, no banner.
- **Language:** switching to BG sets `<html lang="bg">` and shows the Bulgarian legal text. "Cookie settings" opens the panel with focus on its heading.
- **Link check:** 0 broken internal links.

---

## 6. Item 20: primary call to action per page (report only)

| Page | Above the fold on mobile | Verdict |
|---|---|---|
| `/` home | A two-step finder (what you look for + sport chips) and then a list of "doors" (athlete / coach / club / events) of equal weight | **Several competing options.** Suggest one dominant "Find a coach" button and demote the doors below the fold. |
| `/discover` | Title + period/kind filter chips; no single button | **No primary CTA.** Suggest one "Book a spot" or "See tonight" action. |
| `/events`, `/camps`, `/clubs`, `/search` | Filter chips and listing grid | Browse pages: acceptable, as the listing itself is the action |
| `/for-coaches` | "Join as a coach" (filled) + "Join as a club" (outlined) | One dominant + one secondary: **acceptable** |
| `/start` | One role list, then one big submit button | **Pass** |

Changing these is a design decision, so nothing was changed.

---

## 7. Notes

- **A. "Sells online" vs the code.** There is no checkout or card payment in the code; Boost is invoiced by hand. The consumer terms are written as asked, but section 6 of the terms needs the real description of what is sold, currency, payment methods and start time before publishing.
- **B. `.env` stays tracked.**
  - It holds only the public Supabase URL and publishable key, which are in every browser bundle anyway.
  - Lovable writes this file and reads it to build. Removing it from git could break the Lovable preview and builds.
  - `.env.*` files (e.g. `.env.local`) are now ignored, and `.env.example` documents every variable.
- **C. No CSP `<meta>` fallback.**
  - A meta CSP cannot carry `frame-ancestors`.
  - It would also apply inside the Lovable editor preview, which injects its own scripts, and could break editing.
  - The headers file is the right place; `docs/launch-hosting.md` says how to set it on each host.
- **D. Actions the tool refused** (they need your explicit go-ahead in chat):
  - Applying the rate-limit migration to the live database.
  - Deleting the unused `src/pages/Login.tsx` and `src/pages/Register.tsx` (not routed anywhere).

---

## 8. All [TO CONFIRM] points

1. Legal entity name and form, registered address, EIK and VAT number (`src/lib/legal/owner.ts`)
2. Person responsible for the content
3. Privacy contact email
4. Hosting provider name, address, phone, and the hosting choice
5. Supabase server region and transfer safeguards (DPF / SCCs)
6. Lovable and Resend: processor roles, locations, safeguards
7. Retention period for each data category (privacy policy section 3)
8. Whether a data protection officer is required
9. Minimum age for accounts
10. КЗЛД (data protection) and КЗП (consumer protection) names, addresses, links; КЗП as the ADR body
11. What consumers buy, currency, payment methods, start of service, complaint reply time (note A)
12. Exact Bulgarian acts: E-Commerce Act article; act on digital content and services and sale of goods
13. Data processing annex (GDPR Art. 28) for the coach CRM
14. A self-service account deletion option (terms say "email us" for now)
15. Whether the EAA applies, the enforcement authority, and the reply time for accessibility feedback
16. Final domain: `index.html` OG URLs, `sitemap.xml`, `robots.txt` (currently `lokka1.lovable.app`)
17. Where the footer "Help" link should go (now `/legal#contact`)
18. Final OG image and logo (placeholders now)

---

## 9. Actions only the owner can take

1. Fill in `src/lib/legal/owner.ts` and the [TO CONFIRM] points, then have **qualified counsel review** all five legal pages (`/privacy`, `/terms`, `/legal`, `/cookies`, `/accessibility`). Have a native speaker read the Bulgarian and French text.
2. **Choose hosting.** Make sure it sends the headers in `public/_headers` and forces HTTPS (`docs/launch-hosting.md`). HSTS preload is a separate decision.
3. **Sign or accept DPAs** with Supabase, Lovable and Resend, and confirm the Supabase region.
4. **Analytics (optional):** pick a privacy-friendly EU tool, create the account, set `VITE_ANALYTICS_*`, add its host to the CSP and list it on the privacy and cookie pages.
5. Say yes in chat to: applying the rate-limit migration, and deleting `Login.tsx` / `Register.tsx`.
6. Decide on the home and Trending CTA (section 6), and replace the placeholder OG image and icon.
7. Key rotation: **none needed**.
