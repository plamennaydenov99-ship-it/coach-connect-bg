# Coach Portal — Audit and Build Plan

## 1. What exists today (reusable)

Routes (`src/App.tsx`)
- `/dashboard/*`, behind `RequireAuth area="staff"`, used by coach and club. It has a dark sidebar (`DashboardLayout`) whose menu items change by role.
- Coach pages: Home, ProfileEditor, Availability, BookingRequests, Clients, ClientDetail, Messages, Analytics, Billing, Settings.
- **`/coach/:id` is already taken by the public coach profile** (it is linked from Search, Bookmarks, MyBookings, CoachCard, Community and the dashboard's "view public" button).
- `/account/*` is the athlete area. Admin pages live at `/admin/review` and `/admin/users`.

Components and hooks
- `RequireAuth` checks the session, the profile and the application status, and gates onboarding. `CoachOnboarding` is the six-step flow; coaches are now auto-approved.
- `useAuth` provides session, profile, `profileLoading` and `profileError`. `useLanguage` with `translations.ts` covers EN/BG/FR.
- `ProgramSection` is the training-program editor inside ClientDetail. `CoachEvents` lets coaches create public events.
- `Messages.tsx` is the two-sided inbox. `lib/messaging.ts` has `getOrCreateConversation`.
- `Analytics.tsx` already counts real 30-day views, bookings and messages. The recharts library is installed.

Tables (all of them are currently empty: coach_clients, bookings, slots, notes and programs each have 0 rows)
- `availability_slots`: the coach's dated open/pending/booked slots. Athletes can see open slots for verified coaches.
- `bookings`: an athlete books a slot, and the coach confirms or declines it. Triggers sync the slot status and create the matching `coach_clients` row.
- `coach_clients`: links a coach to an athlete profile. It has `athlete_id NOT NULL`, a foreign key to profiles and a unique (coach, athlete) pair. Only the coach can access it (one ALL policy).
- `client_notes` and `client_goals`: private records per relationship, coach-only.
- `training_programs` and `program_tasks`: draft or sent programs. Athletes can read sent programs and tick tasks off, and a guard trigger stops them editing anything else.
- `conversations` and `messages`: athlete–coach threads. Only athletes can start a thread.

## 2. Gaps vs the target

- No `/coach/*` portal, no light top-bar layout, no copper or navy-tint tokens. The theme today is warm monochrome; "Daylight" values exist only in parts of the homepage.
- No support for **external clients** (no account, a phone number, a stage).
- No pipeline stages, no board or drag-and-drop, no table view, no drawer with a timeline.
- No session entity separate from athlete bookings: no attendance (done / no-show), no trial flag, no location, no recurrence.
- No coach to-do tasks. `program_tasks` belong to athletes.
- No calendar (week, day or month), no quick-book panel.
- No dashboard KPIs for attendance %, hours coached or the 8-week chart. No inbox panel on the right.
- No mobile Today screen or bottom tabs.
- No notifications feed. This first version will show a bell with an unread-messages count only.
- Coaches cannot start a conversation. External clients have no inbox; messages apply to clients who have an account.

## 3. Proposed data model (not applied)

```text
coach_clients (extend)
  athlete_id        uuid NULL  -> profiles.id   (null = external)
  display_name      text NOT NULL               (backfilled from the profile for linked rows)
  email             text NULL
  phone             text NULL                   (private, coach only)
  stage             text NOT NULL default 'enquiry'
                    check in (enquiry, trial, active, on_hold, archived)
  stage_position    int  NOT NULL default 0     (order on the board)
  goal              text NULL
  source            text NULL
  updated_at        timestamptz
  drop UNIQUE(coach_id, athlete_id) -> partial unique index where athlete_id is not null

coach_sessions (new; 1:1)
  id, coach_id -> profiles, client_id -> coach_clients (on delete cascade)
  starts_at timestamptz, ends_at timestamptz, location text
  kind text check in (session, trial)
  status text check in (scheduled, attended, no_show, cancelled)
  series_id uuid NULL -> session_series
  booking_id uuid NULL -> bookings (unique)    (set when it came from an athlete booking)
  note text, created_at, updated_at

session_series (new; weekly recurrence)
  id, coach_id, client_id, weekday smallint, start_time time, duration_min int,
  location, starts_on date, ends_on date NULL, kind
  -> materialise concrete coach_sessions rows 12 weeks ahead (one for each occurrence, editable on its own)

coach_tasks (new)
  id, coach_id, client_id NULL -> coach_clients, title, due_date NULL,
  done bool default false, done_at, created_at

client_events (new; drives the drawer timeline)
  id, client_id, coach_id, type (note | stage_change | session | task), payload jsonb, created_at
  written by triggers on stage changes, sessions and tasks; client_notes stays the store for notes
```

RLS: every new table gets `GRANT ... TO authenticated, service_role`, RLS turned on, and one ALL policy `coach_id = auth.uid()` (both USING and WITH CHECK). `client_notes` and `client_goals` keep their existing relationship-based policy. Athletes get no access to the new tables. Phone privacy holds because only the coach can read `coach_clients`.

How bookings link: the existing booking trigger, once a booking is confirmed, also inserts a `coach_sessions` row with `booking_id` set, linked to the existing `coach_clients` row (or a new one with stage 'active'). The trigger that creates `coach_clients` must also fill `display_name` from the athlete's name. Open availability slots still come from `availability_slots` and appear on the calendar as available time.

KPIs come from `coach_sessions`:
- sessions this week
- attendance % (attended out of attended plus no-show)
- hours coached (sum of attended session lengths)
- active clients (stage = active)

## 4. Login redirect today and the change

- The redirect lives in `src/pages/Start.tsx` lines 67, 79 and 101 (`athlete ? '/account' : '/dashboard'`), plus `ForCoaches.tsx` and the redirects inside `RequireAuth`.
- **Route conflict:** `/coach/:id` is the public profile. Two options:
  - (a) Recommended: move the public profile to `/coaches/:id`, keep a redirect from the old link, then use `/coach/*` for the portal. Put the fixed paths (`/coach/dashboard`, `/coach/clients`, …) ahead of the old link pattern.
  - (b) Name the portal `/portal/*` and skip the move.
- Add a helper `homeFor(role)` that sends athletes to `/account`, coaches to `/coach` and clubs to `/dashboard`. Use it in Start, RequireAuth and the PublicNav menu. Add `area="coach"` to RequireAuth so onboarding and status gating still apply. Redirect old `/dashboard/*` coach links to `/coach/*`.

## 5. Risks

- Breaking public coach links (the route conflict above). Fix it first, together with every place that links to a coach profile.
- Club accounts still depend on `DashboardLayout`. Leave `/dashboard` running for clubs.
- Making `athlete_id` nullable affects `Clients`, `ClientDetail`, `ProgramSection` and `MyProgram` (training programs need an athlete account to be "sent", so block sending to external clients).
- Booking triggers: the extra session insert must not fail when a booking is confirmed (SECURITY DEFINER and idempotent).
- Recurrence: materialising sessions ahead needs a "generate more" step. In this first version it runs when the series is created or edited and when the calendar opens.
- Theme: portal colours must be separate tokens scoped to the portal, so the public pages are unaffected.
- Data risk is low, because every affected table is currently empty.

## Recommended build order

1. Move the public profile to `/coaches/:id` with redirects and update all links. Add `homeFor(role)`.
2. Database migration: extend `coach_clients`, add `coach_sessions`, `session_series`, `coach_tasks` and `client_events` with grants, RLS and triggers (booking to session, stage change to event). Regenerate the types.
3. Portal shell: light Daylight tokens, `CoachLayout` with the top bar, side menu and mobile bottom tabs, `/coach/*` routes, redirect after login, EN/BG/FR keys.
4. Clients CRM: board with drag-and-drop (@dnd-kit) plus a table view, an "add client" form for external clients, and the drawer with the timeline, notes and phone.
5. Calendar: week, day and month views showing sessions, trials and open slots, a quick-book panel, weekly repeats, marking attendance.
6. Dashboard: KPI tiles, Today list, pipeline counts, tasks with checkboxes, 8-week bar chart, inbox panel on the right (reusing the Messages queries).
7. Messages page and public profile/settings inside the portal (reusing ProfileEditor and Settings), plus the unread-messages bell.
8. Mobile Today screen (mark attended, add note), tests for the KPI formulas, and an end-to-end check signed in as a coach.

## Assumptions

- Clubs stay on `/dashboard` for now.
- Coaches cannot message external clients in this version.
- "Notifications" means the unread-messages count only.
