# Club portal shell

- Move public club profiles to `/clubs/:id`, update all profile links, and retain a UUID-only legacy redirect excluding reserved club portal segments.
- Extract the existing shell into a role-driven StaffLayout; retain CoachLayout as a wrapper. Share role-aware paths and EN/BG/FR labels across reused pages. Club booking defaults to Group.
- Add club-only authentication area, `/club/*` pages, club home redirect and legacy dashboard mappings, preserving onboarding and approval gates.
- Reuse CRM, dashboard, calendar, messaging and settings; skin the existing club profile editor with portal tokens and add the localized facilities placeholder.
- Verify RLS/FKs/grants read-only, run affected tests, inspect automatic typecheck/build, and verify logged-out public routes/redirects. No database changes or test accounts will be created; signed-in club verification will be reported as unverified.

## Technical details
Policies inspected on all seven requested tables are owner-based, with no coach-role predicate. Nested roster policies additionally require clients belonging to the same owner. Verify grants and FK targets before implementation completes.
