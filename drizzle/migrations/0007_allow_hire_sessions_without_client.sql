-- Allow private-hire rows (kind = 'hire') to be saved without a linked client,
-- in addition to 1:1 sessions (client_id set) and group sessions (capacity set).
ALTER POLICY "Coach manages own sessions" ON public.coach_sessions
  WITH CHECK (
    (coach_id = auth.uid()) AND (
      capacity IS NOT NULL
      OR kind = 'hire'
      OR EXISTS (
        SELECT 1 FROM public.coach_clients c
        WHERE c.id = coach_sessions.client_id AND c.coach_id = auth.uid()
      )
    )
  );

ALTER POLICY "Coach manages own series" ON public.session_series
  WITH CHECK (
    (coach_id = auth.uid()) AND (
      capacity IS NOT NULL
      OR kind = 'hire'
      OR EXISTS (
        SELECT 1 FROM public.coach_clients c
        WHERE c.id = session_series.client_id AND c.coach_id = auth.uid()
      )
    )
  );