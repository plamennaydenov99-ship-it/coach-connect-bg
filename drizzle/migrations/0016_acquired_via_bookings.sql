CREATE OR REPLACE FUNCTION public.derive_acquired_via(_coach uuid, _athlete uuid, _keep_invite boolean)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN _athlete IS NULL THEN 'own'
    WHEN _keep_invite THEN 'invite'
    WHEN EXISTS (SELECT 1 FROM public.spot_requests r JOIN public.coach_sessions s ON s.id = r.session_id
                 WHERE r.athlete_id = _athlete AND s.coach_id = _coach) THEN 'lokka_trending'
    WHEN EXISTS (SELECT 1 FROM public.bookings b WHERE b.athlete_id = _athlete AND b.coach_id = _coach) THEN 'lokka_discover'
    WHEN EXISTS (SELECT 1 FROM public.conversations c WHERE c.athlete_id = _athlete AND c.coach_id = _coach) THEN 'lokka_discover'
    ELSE 'own' END
$$;
REVOKE ALL ON FUNCTION public.derive_acquired_via(uuid, uuid, boolean) FROM PUBLIC, anon;

UPDATE public.coach_clients SET acquired_via = public.derive_acquired_via(coach_id, athlete_id, acquired_via = 'invite');