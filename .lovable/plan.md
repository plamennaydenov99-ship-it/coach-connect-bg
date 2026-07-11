## Status

The database migration is **already applied** (approved and executed on the previous turn):

- `app_role` enum: `athlete` / `coach` / `club`
- `profiles`, `coach_profiles`, `club_profiles` tables — full GRANTs, RLS enabled, updated_at triggers
- `handle_new_user` trigger on `auth.users` — reads signup metadata (`role`, `full_name`, `city`, `language`) and creates matching rows automatically
- RLS: public reads coach/club rows only when `verified = true`; owners always read/edit their own rows; athlete profiles never public

**Temporary stopgap (per your brief):** `verified` defaults to `false`. Until an admin UI exists, coach/club rows are flipped to visible by editing the row in the Cloud backend table editor. The dashboard shows a clear "pending verification" banner so new users know why they don't appear yet.

## Assumptions (flagging so you can correct)

1. **Email confirmation left ON (default).** Users must confirm via email before login. If you want frictionless demo signups, say the word and I'll enable auto-confirm.
2. **No athlete_profiles table** — brief didn't ask for one. Athlete data lives on `profiles`.
3. **URLs switch from slug to UUID.** `/coach/:slug` and `/club/:slug` now accept the profile UUID. The old mock `slug` field no longer exists in the DB.
4. **Legacy fields not in schema render as hidden sections:** rating, reviews, sessions_completed, linked coaches on club page, club gallery — none of these are in your schema, so the public pages skip those sections until we design follow-up tables.
5. **Search page shows coaches only** (matches current behaviour; clubs discovery is out of scope this round).
6. **`mockData.ts` stays** for camps/events/community — only coach/club imports are removed from the four rewritten pages.

## File-by-file changes

### New

- **`src/hooks/useAuth.tsx`** — `AuthProvider` + `useAuth`. Registers `onAuthStateChange` first, hydrates via `getSession`, loads the caller's `profiles` row. Exposes `{ user, session, profile, loading, signOut, refreshProfile }`.

### Edited

- **`src/App.tsx`** — wrap the subtree with `<AuthProvider>`.

- **`src/pages/Register.tsx`** — call `supabase.auth.signUp` with `emailRedirectTo: ${window.location.origin}/` and `options.data = { role, full_name, city, language }`. Role selector expands to `athlete | coach | club`. On success, athletes → `/search`, coach/club → `/dashboard`. Coach/club users see a toast noting the pending-verification gate.

- **`src/pages/Login.tsx`** — `supabase.auth.signInWithPassword`; on success, read the user's role from `profiles` and redirect (coach/club → `/dashboard`, athlete → `/search`). The Google button becomes a "not configured yet" toast.

- **`src/pages/dashboard/ProfileEditor.tsx`** — real read/write:
  - Load `profiles` + `coach_profiles` (or `club_profiles`) for `auth.uid()` on mount
  - Coach editor: bio, sport, specialisms, price, discount %, years, level, gallery URLs
  - Club editor: name, sport, city, about, hours, (programs render-only for now)
  - Common: full name, city, avatar URL
  - Saves via `.update({...}).eq('id', user.id)`
  - "Pending verification" banner when `verified = false`; "Verified" banner otherwise
  - Availability grid stays UI-only (out of schema scope)

- **`src/pages/Search.tsx`** — replace `COACHES` import with a query joining `coach_profiles` + `profiles` filtered on `verified = true`. Sport, city and price filters run client-side over the returned set. Rating filter and "Verified only" toggle removed (redundant / no column yet). Empty state: "No verified coaches yet."

- **`src/pages/CoachProfile.tsx`** — fetch `coach_profiles` + `profiles` by URL id. RLS naturally returns nothing for unverified rows unless the caller is the owner. Missing → "not found." Bio, gallery, specialisms, pricing block, enquiry modal all remain and read from the DB. Reviews / rating breakdown / sessions-completed sections hidden until schema exists.

- **`src/pages/ClubProfile.tsx`** — same treatment: fetch `club_profiles` + `profiles`. Hide Coaches tab and gallery grid (no schema). Programs tab renders when `programs` JSONB is non-empty. Membership enquiry form stays UI-only.

### Untouched

- All other dashboard pages (Analytics, Messages, Billing, Settings) stay mock.
- Camps, Community, Events, Marketplace, Match, home components — all still mock, as requested.
- `mockData.ts` — kept for those modules.

## Verification flow

1. Register as coach → confirm email → log in → land on `/dashboard`, see "Pending verification" banner
2. In Cloud backend table editor: `coach_profiles` → set `verified = true` for that row
3. Public `/search` and `/coach/<uuid>` now show the coach

## Open decisions to confirm before I build

- **Enable auto-confirm email?** Prototype-friendly = yes. Say yes/no.
- Anything to change in assumptions #3 (UUID-as-URL) or #4 (hidden legacy fields)?

Approve and I'll ship the file changes in one pass.
