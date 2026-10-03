
- Coach portal lives under `/coach/*` (CoachLayout, RequireAuth area="coach"); portal colors are scoped `.coach-portal` CSS vars exposed as `portal-*` Tailwind colors — keeps public/club styling untouched.
- Coach portal data access lives in react-query hooks under `src/hooks/coach/`, always filtered by coach_id — one place for cache keys and invalidation.
