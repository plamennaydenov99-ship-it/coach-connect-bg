# Atleta — Camps + Community + Nav Update

Two new standalone pages (Sports Camps and Community Feed), nav entries for both, homepage preview sections, and translation keys. All mock data, Bulgarian context, follows existing dark + electric-teal design system.

## 1. Navigation (`src/components/layout/PublicNav.tsx`)

Insert two new items into the `links` array, in order:
`Find a Coach | Events | Camps | Community | Shop`

- `{ to: '/camps', label: t.nav_camps }`
- `{ to: '/community', label: t.nav_community }`

Mobile hamburger inherits same array — no extra work. Styling already matches spec (muted → foreground, electric underline on active/hover).

## 2. Routes (`src/App.tsx`)

Add:
```
<Route path="/camps" element={<Camps />} />
<Route path="/camps/:id" element={<CampDetail />} />
<Route path="/community" element={<Community />} />
```

## 3. Mock data

**`src/lib/camps.ts`** — 8 camps exactly as specified (Sofia / Plovdiv / Varna / Burgas, Bulgarian names, Cyrillic dates, picsum images via `https://picsum.photos/seed/camp{N}/800/400`).

**`src/lib/communityData.ts`** — 12 posts as specified (`thread | tip | activity`, Bulgarian authors, pravatar avatars, verified/isPro flags, sport tags).

## 4. Shared components

**`src/components/camps/CampCard.tsx`** — reusable card used in Camps grid, CampDetail related, and AthleteHome preview. Cover image with sport tag (top-left) + duration badge (top-right) overlays, name, host, city w/ MapPin icon, dates w/ Calendar icon, age group, level pill, price, spots-left in `--accent-electric` when `<10` else muted, "View Camp" outline button that fills electric on hover. Card bg `bg-card`, 4px corners, no shadows, hover border electric.

**`src/components/community/PostCard.tsx`** — renders three variants by `type`:
- `thread`: avatar, name + city + timeAgo, verified tick (electric) if true, PRO pill if true, sport tag pill (athlete-tint bg, forest-tint text), title `font-display 16px`, body 14px muted 3-line clamp + "read more", footer row with Heart / MessageCircle / Bookmark counts.
- `tip`: same as thread + left 2px electric border + small "COACH TIP" eyebrow above title.
- `activity`: lighter bg `bg-background`, Zap/logo icon instead of avatar, italic body, electric inline link, no like/comment row.

## 5. `/camps` — `src/pages/Camps.tsx`

Layout: `AnnouncementBar` → `PublicNav` → Hero → Filter Bar → Grid → `PublicFooter`.

- **Hero**: dark section, 56px display heading "SPORTS CAMPS", muted subhead, two stat pills ("12 Active camps", "6 Cities") with surface bg + electric text + 4px corners.
- **Filter Bar**: sport pills (All, Football, Tennis, Padel, Basketball, Running, Swimming, Cycling) + duration pills (Any / Weekend 2-3 days / Week 5-7 days / 2 Weeks+) + city select (All / Sofia / Plovdiv / Varna / Burgas). Local `useState` filter logic against `CAMPS`.
- **Grid**: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`, gap-5, renders `CampCard` for each filtered camp.

## 6. `/camps/:id` — `src/pages/CampDetail.tsx`

- Full-width 400px cover with darkened gradient overlay, camp name + sport tag overlaid, back arrow to `/camps`.
- Two-col layout `lg:grid-cols-[2fr_1fr]`:
  - Left: 2-3 sentence description, daily schedule accordion (use existing `@/components/ui/accordion`), coach/club section with avatar + bio snippet.
  - Right: sticky sidebar with price, dates, location, spots left, age group, level, "Apply for Camp" solid electric button (with `// Booking integration to be added in Phase 2`), "Ask a question" outline button.
- Lookup camp by `id` from `CAMPS`; 404 fallback.

## 7. `/community` — `src/pages/Community.tsx`

Layout: `AnnouncementBar` → `PublicNav` → Hero → Sport tabs → 2-col (Feed 65% / Sidebar 35%) → `PublicFooter`.

- **Hero**: 48px display heading, muted Bulgarian subhead, two CTAs — "Start a Thread" solid electric (disabled, tooltip "Sign in to post" via existing `Tooltip`), "Browse by Sport" outline (scrolls to tabs).
- **Tabs**: horizontal scrollable (`overflow-x-auto`): All, Football, Tennis, Padel, Basketball, Running, Swimming, Boxing, BJJ, Yoga, Cycling, CrossFit, Golf. Active = electric bottom border + text; inactive = `text-foreground-subtle`. Filter posts by `sport`.
- **Feed**: stack of `PostCard` components from filtered `COMMUNITY_POSTS`.
- **Sidebar**: four boxes (4px corners, surface bg, border):
  1. Join community (Sign In outline + Register solid electric).
  2. Trending sports — 5 rows with thin electric progress bar.
  3. Active coaches — 3 mini-cards from `COACHES` (avatar, name, sport, city, "View profile" link).
  4. Upcoming camps — 2 camp mini-cards linking to `/camps/:id`.

## 8. AthleteHome additions (`src/pages/AthleteHome.tsx`)

Between `MatchingSection` and the coach preview section (the spec says before the Shop/Marketplace section — placing right after coach preview, before `EventsSlider`):

- **Camps preview**: container section, eyebrow + display heading ("СПОРТНИ ЛАГЕРИ" / "SPORTS CAMPS") + muted subhead, 3-col row of `CampCard` (first 3 from `CAMPS`), "View all camps →" button to `/camps`.
- **Community teaser**: full-width dark band (`bg-background-secondary`), heading "JOIN THE CONVERSATION", Bulgarian subhead, 3-col grid of `PostCard` filtered to `type === 'thread'` (first 3), "Go to Community →" button to `/community`.

## 9. Translations (`src/lib/translations.ts`)

Add all new keys listed in the prompt to both `en` and `bg` blocks (`nav_camps`, `nav_community`, `camps_hero_title`, `camps_hero_sub`, `community_hero_title`, `community_cta_post`, `community_cta_browse`, `coach_tip_label`, `spots_left`, `view_camp`, `apply_camp`, `ask_question`). Used by PublicNav, Camps page, Community page, CampCard, PostCard, CampDetail.

## Design conformance

- All colors via semantic tokens (`bg-card`, `bg-background-secondary`, `border-border`, `text-foreground-muted`, `text-accent-electric`).
- 4px max corner radius; no shadows; borders for separation.
- `font-display` (Barlow Condensed) for headings/labels, `font-body` for prose.
- Mobile: grids collapse to single column; nav items in existing hamburger.
- No changes to existing colors, fonts, components, or routing outside the additions above.

## Files

**Created**
- `src/pages/Camps.tsx`
- `src/pages/CampDetail.tsx`
- `src/pages/Community.tsx`
- `src/lib/camps.ts`
- `src/lib/communityData.ts`
- `src/components/camps/CampCard.tsx`
- `src/components/community/PostCard.tsx`

**Edited**
- `src/App.tsx` (3 new routes)
- `src/components/layout/PublicNav.tsx` (2 nav items)
- `src/pages/AthleteHome.tsx` (Camps + Community preview sections)
- `src/lib/translations.ts` (new keys, EN + BG)
