## Status

The database migration is **already applied** (I ran it while planning — approved on the previous turn):

- `app_role` enum (`athlete` / `coach` / `club`)
- `profiles`, `coach_profiles`, `club_profiles` tables with GRANTs, RLS, and updated_at triggers
- `handle_new_user` trigger on `auth.users` — auto-creates the correct rows from signup metadata
- RLS: public reads coach/club rows only when `verified = true`; owners read/edit their own; athlete profiles never public

**Temporary stopgap:** `verified` starts `false`. Until an admin UI exists, a new coach/club is flipped live by editing their row in the Cloud backend table editor. I'll surface this clearly in the register success toast and dashboard.

## Assumptions (flagging so you can correct)

1. **No auto-confirm email** — following defaults, users must confirm via email. If you want frictionless demo signups, say the word and I'll enable auto-confirm.
2. **No athlete_profiles table** — the plan you approved didn't ask for one. Athlete-specific data lives on `profiles` only.
3. **URLs are UUIDs, not slugs** — `/coach/:id` and `/club/:id` will accept the profile UUID. The old mock `slug` field is gone; existing routes still work via the id param.
4. **Coach and club data not in schema** (rating, reviews, `coachSlugs` for clubs, gallery for clubs, `sessionsCompleted`, `hours` structure, opening `hours[]`) will render as empty/hidden sections on public pages — no rating bar, no reviews list, no linked coaches on the club page — until we design those tables in a follow-up.
5. **Search filters** on `verified = true` coaches only. Clubs are not yet in the search results grid (Search page currently only shows coaches — I'll keep that scope).
6. **`mockData.ts` stays** for camps/events/community/marketplace, as you asked.

## File-by-file changes

### New files

- **`src/hooks/useAuth.tsx`** — `AuthProvider` + `useAuth`. Registers `onAuthStateChange` first, then hydrates via `getSession`, loads `profiles` row for current user. Exposes `{ user, session, profile, loading, signOut, refreshProfile }`.

### Edited

- **`src/App.tsx`** — wrap `<TooltipProvider>` subtree in `<AuthProvider>`.

- **`src/pages/Register.tsx`** — call `supabase.auth.signUp` with `emailRedirectTo: window.location.origin` and `options.data = { role, full_name, city, language }`. Role selector expands to `athlete | coach | club`. On success, navigate: coach/club → `/dashboard`, athlete → `/search`. Toast tells coach/club users their profile is pending verification.

- **`src/pages/Login.tsx`** — call `supabase.auth.signInWithPassword`. On success, redirect based on profile role (coach/club → `/dashboard`, athlete → `/search`). Google button remains UI-only for now (no provider configured — clearly noted in toast).

- **`src/pages/dashboard/ProfileEditor.tsx`** — replace static state with real read/write:
  - On mount, load `profiles` + `coach_profiles` (or `club_profiles`) for `auth.uid()`.
  - Renders coach or club editor based on role; unified profile fields (name, city, avatar URL) go to `profiles`; sport/bio/price/discount/specialisms/level/years/gallery URLs go to `coach_profiles`; club fields to `club_profiles`.
  - Save uses `supabase.from(...).update({...}).eq('id', user.id)`.
  - Banner at top when `verified = false`: *"Your profile is pending verification and isn't yet visible on Atleta."*
  - Availability grid stays UI-only (out of schema scope, matches your existing prototype).

- **`src/pages/Search.tsx`** — replace `COACHES` import with a `useEffect` query joining `coach_profiles` + `profiles` where `verified = true`. Filters (sport, city, price range, verified toggle becomes redundant, sort) applied client-side over the fetched set. Empty state on 0 results. Removes rating filter (no rating column yet — hidden).

- **`src/components/marketplace/CoachCard.tsx`** — accepts a normalised shape from either mock or DB; rating/discount blocks hide when absent.

- **`src/pages/CoachProfile.tsx`** — `useParams()` id → fetch `coach_profiles` + `profiles` where `id = param AND (verified = true OR id = auth.uid())`. Missing/unverified → "not found" state. Reviews, rating breakdown, and sessions-completed sections hide when no data. Bio, gallery, specialisms, pricing block, enquiry modal all remain and drive off DB fields.

- **`src/pages/ClubProfile.tsx`** — same treatment: fetch `club_profiles` + `profiles`. Hide `Coaches`, `Programs` (programs stored as JSONB — render if array is non-empty), and gallery when absent. Membership enquiry form stays UI-only.

### Untouched
- Everything under `/dashboard` except ProfileEditor (Analytics, Messages, Billing, Settings stay mock).
- Camps, Community, Events, Marketplace, Match, home components — all still mock, as requested.
- `mockData.ts` — retained for other modules; only coach/club/athlete imports removed from the four rewritten pages.

## Verification flow

1. Register as coach → email confirmation → login → land on `/dashboard`, see "pending verification" banner.
2. In Cloud backend table editor: `coach_profiles` → set `verified = true` for that row.
3. Public `/search` and `/coach/<uuid>` now show the coach.

## Open decisions to confirm before I switch to build mode

- **Enable auto-confirm email?** Prototype-friendly = yes. Say yes/no.
- **Anything else in the assumptions list you want to change** (esp. #3 UUID-as-URL and #4 hidden legacy fields)?

Ready to implement as soon as you switch to build mode.
