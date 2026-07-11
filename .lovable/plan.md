## Overview

Introduce real Supabase-backed auth + profiles for three roles (athlete, coach, club), gate public discovery behind a manual `verified` flag, and replace mock data reads in Search/CoachProfile/ClubProfile/ProfileEditor with live queries. Camps, events, and community stay on `mockData.ts` — out of scope.

## Assumption

Athletes have a profile row but no separate `athlete_profiles` table yet — everything an athlete needs (name, city, language, avatar) fits on `profiles`. Say the word if you want a dedicated table for athlete-specific fields (goals, preferred sports, level) and I'll add it.

---

## Database schema

### Enum
- `app_role`: `athlete` | `coach` | `club`

### `public.profiles` (1:1 with `auth.users`)
- `id uuid PK` → references `auth.users(id) ON DELETE CASCADE`
- `role app_role NOT NULL`
- `full_name text`
- `avatar_url text` (plain URL string, no upload widget)
- `city text`
- `language text` (`en` | `bg`, default `en`)
- `created_at`, `updated_at`

### `public.coach_profiles` (1:1 with profiles, only when role='coach')
- `id uuid PK` → references `profiles(id) ON DELETE CASCADE`
- `bio text`
- `sport text`
- `specialisms text[]`
- `price_per_session numeric`
- `discount_pct int` (0–100)
- `years_experience int`
- `level text` (Beginner/Intermediate/Advanced/Pro)
- `gallery text[]` (URL strings)
- `verified boolean NOT NULL DEFAULT false`
- `created_at`, `updated_at`

### `public.club_profiles` (1:1 with profiles, only when role='club')
- `id uuid PK` → references `profiles(id) ON DELETE CASCADE`
- `name text NOT NULL`
- `sport text`
- `city text`
- `about text`
- `hours text` (freeform, e.g. "Mon–Fri 08:00–22:00")
- `programs jsonb` (array of `{name, description, price}`)
- `verified boolean NOT NULL DEFAULT false`
- `created_at`, `updated_at`

### Auto-provisioning
- Trigger `handle_new_user()` on `auth.users` insert → creates a `profiles` row using `role`, `full_name`, `city`, `language` from `raw_user_meta_data`.
- Second trigger (or same function) → inserts empty `coach_profiles`/`club_profiles` row when role is `coach`/`club`.

### RLS policies

`profiles`:
- SELECT: owner always; anon/authenticated can select rows whose owner has a corresponding verified coach/club row (via `has_verified_public_profile(id)` security-definer helper). Athlete profiles never public.
- UPDATE: owner only. INSERT: handled by trigger (service role).

`coach_profiles`:
- SELECT: owner OR `verified = true` (public).
- UPDATE: owner only. INSERT: trigger.

`club_profiles`: same shape as coach_profiles.

GRANTs (per project rules): `SELECT` to `anon` + `authenticated`, `INSERT/UPDATE/DELETE` to `authenticated`, `ALL` to `service_role`.

### ⚠️ Temporary stopgap (flagged)
There is **no admin UI** in this round. To publish a coach/club, you must manually flip `verified = true` in the Cloud → Backend table editor. This is explicitly temporary — a proper admin/moderation flow (user_roles table + `/admin` route) is a follow-up.

---

## File-by-file changes

### New
- `supabase/migrations/<ts>_auth_and_profiles.sql` — enum, 3 tables, GRANTs, RLS, triggers, helper function.
- `src/hooks/useAuth.tsx` — context wrapping `supabase.auth`, exposing `session`, `user`, `profile`, `loading`, `signOut`. Registers `onAuthStateChange` first, then loads session; fetches `profiles` row on session change.
- `src/hooks/useCoachProfile.ts` / `useClubProfile.ts` — fetch + update helpers for the editor pages.

### Auth pages (rewrite)
- `src/pages/Register.tsx` — real `supabase.auth.signUp` with `emailRedirectTo: window.location.origin`, passing `{ data: { role, full_name, city, language } }` so the trigger populates rows. Role selector expands to **athlete / coach / club**. On success: athlete → `/search`, coach → `/dashboard`, club → `/dashboard`. Show "Pending verification" note for coach/club.
- `src/pages/Login.tsx` — real `signInWithPassword`. Redirect by role read from `profiles` after auth.
- Optional: `src/pages/ResetPassword.tsx` — deferred; not required for this round unless you want it now.

### Dashboard
- `src/pages/dashboard/ProfileEditor.tsx` — read current user's `coach_profiles` (or `club_profiles` if role=club), replace all `useState` mock defaults with live values, `onSave` calls `update()`. Add a "Verification status" banner (pending/approved). File-upload area stays visual-only; gallery/avatar remain URL string inputs.
- `src/components/dashboard/DashboardLayout.tsx` — gate route behind `useAuth`; redirect to `/login` if unauth or role=athlete.

### Public reads (swap mockData → Supabase)
- `src/pages/Search.tsx` — query `coach_profiles` joined with `profiles` where `verified = true`; keep existing filter UI, wire filters to query params (`sport`, `city`, price range).
- `src/pages/CoachProfile.tsx` — fetch by id from Supabase; 404 if not verified and viewer ≠ owner.
- `src/pages/ClubProfile.tsx` — same pattern against `club_profiles`.
- `src/components/home/FeaturedCoaches.tsx` — query top verified coaches (limit 3); show skeleton/empty state when DB empty (which it will be at launch).

### Left as-is
- `src/lib/mockData.ts` stays in repo for camps/events/community references but is no longer imported by Search/CoachProfile/ClubProfile/FeaturedCoaches.
- Camps, Events, Community pages — untouched.
- `App.tsx` — add `<AuthProvider>` wrapper; no new routes needed beyond what exists.

---

## Migration order (build mode)

1. Migration tool call (schema + RLS + trigger) — requires your approval.
2. Wait for type regen.
3. Build `useAuth` + rewrite Login/Register.
4. Rewrite ProfileEditor + dashboard guard.
5. Swap Search/CoachProfile/ClubProfile/FeaturedCoaches to live queries with empty/loading states.
6. Manual smoke test: register coach → dashboard shows "pending" → flip `verified=true` in table editor → coach appears in `/search`.

## Open questions

- **Athlete profile table?** Currently folded into `profiles`. Confirm or request a dedicated `athlete_profiles` table.
- **Email confirmation:** default Supabase behavior requires email confirmation before login. Want me to enable `auto_confirm_email` for the prototype so signup → immediate login works?
- **Password reset page** — include now or defer?
