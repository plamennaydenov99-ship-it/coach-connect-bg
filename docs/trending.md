# Trending, Boost and the waitlist

Short guide for whoever works on this next. The long version, with diagrams, lives in the design blueprint.

## What it is
One ranked list per city (the pilot opens in Sofia only, see `src/lib/trending.ts`). The Trending page asks the database one question, `get_trending(city, sport, kind, period)`, and gets back a single list. Three kinds of rows go into it:

| Source | Owner | Rules |
|---|---|---|
| Earned | what people do | numbered rank, needs real activity (2 reservations or requests in 24 h, or 8 saves) |
| Picked by Lokka | staff, `/admin/trending` (`trending_items`) | tagged, always has an end date |
| Promoted | coaches and clubs, Studio > Boost | marked "Promoted", never numbered, fixed places 3 and 7, at most one per three earned rows |

If fewer than five sessions pass the evidence rule, the page switches to "Coming up" and lists sessions by start time. It never shows made-up heat. `/discover?sample=1` shows the design with sample rows for review only.

## Heat score
`trending_scores(as_of, city)` in the database. 100 points: demand 35, filling up 20, saved 15, starting soon 15, quality 15. Activity in the last 24 h counts in full, the next 48 h at half. The arrows compare today's rank with the rank computed for 24 h ago. Reservations, spot requests, saves and waitlist joins are read straight from their own tables, so there is no event log to keep in sync.

## What was added to the database (`supabase/migrations/20261101120000_trending_and_boost.sql`)
- `coach_sessions.is_popup` (set by a trigger when a public session is created less than 24 h ahead) and `join_mode` (only `request` is used today).
- `session_waitlist` plus `join_waitlist`, `leave_waitlist`, `claim_waitlist`. When places are added, or someone cancels, the next people in line are offered the place for 30 minutes (`offer_waitlist`, called by triggers).
- `engagement_events` and `track_event()` for views, impressions and clicks only. Anonymous visitors are counted with a hash that changes every day; nothing is stored in the browser. Rate limited, repeats dropped, bots ignored.
- `ad_campaigns` with `create_campaign`, `withdraw_campaign`, `set_campaign_paused`, `my_campaigns`, `admin_review_campaign`, `admin_set_campaign_payment`, `admin_campaigns`. The app can read its own rows and nothing else; every change goes through those functions.
- Security fix: `public_sessions` and `public_certificates` were auto-updatable views with write grants for signed-in users. The write grants are revoked.

Sample prices (promoted row 9 euros a day, presenting place 7 euros a day or 49 a week) live in `create_campaign` and in the Boost screen.

## Not built yet
- Card payment. Boosts go to staff review; once approved, invoice by bank transfer and mark it paid in `/admin/trending`.
- Email or push messages (waitlist offers show in the app only). Needs an edge function and a mail service.
- Pop-up push notifications, instant join (`join_mode = 'instant'`), calendar feeds.
- The scoring runs on every request. That is fine at hundreds of sessions. When it is not, move `trending_scores` into a table refreshed by `pg_cron`.
- `profile_views` still accepts anonymous inserts (the coach analytics page reads it). Move it to `track_event` and drop that policy.

## Where things are
- Page: `src/pages/Trending.tsx`, rows in `src/components/trending/`
- Data: `src/lib/trending.ts`, `src/hooks/useTrending.ts`
- Home: `src/components/home/HomeSections.tsx`
- Coach screen: `src/pages/coach/CoachBoost.tsx` (route `/coach/boost` and `/club/boost`)
- Admin queue: `src/components/admin/AdminBoosts.tsx`
- Theme: tokens at the top of `src/index.css`. Archivo has no Cyrillic, so Bulgarian text falls back to Oswald (headings) and Inter (body).
