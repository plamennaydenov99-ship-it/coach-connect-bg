
- Coach portal lives under `/coach/*` (CoachLayout, RequireAuth area="coach"); portal colors are scoped `.coach-portal` CSS vars exposed as `portal-*` Tailwind colors — keeps public/club styling untouched.
- Coach portal data access lives in react-query hooks under `src/hooks/coach/`, always filtered by coach_id — one place for cache keys and invalidation.
- Coach-portal times are computed in the coach's profiles.timezone via Intl helpers in `src/lib/tz.ts`; session_series.weekday uses Monday=0…Sunday=6 — DST-safe and independent of the browser zone.
- Series top-up is idempotent per (series, ISO week in coach tz), so a single rescheduled occurrence is never re-created.
