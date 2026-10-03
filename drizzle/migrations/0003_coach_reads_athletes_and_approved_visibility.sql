CREATE OR REPLACE FUNCTION public.coach_has_athlete(_coach uuid, _athlete uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _coach IS NOT NULL AND (
    EXISTS (SELECT 1 FROM public.conversations c WHERE c.coach_id = _coach AND c.athlete_id = _athlete)
    OR EXISTS (SELECT 1 FROM public.bookings b WHERE b.coach_id = _coach AND b.athlete_id = _athlete)
  )
$$;
REVOKE EXECUTE ON FUNCTION public.coach_has_athlete(uuid, uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.coach_has_athlete(uuid, uuid) TO authenticated;

CREATE POLICY "Coach can view linked athlete profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.coach_has_athlete(auth.uid(), id));

DROP POLICY IF EXISTS "Public can view profiles linked to verified coach/club" ON public.profiles;
CREATE POLICY "Public can view profiles of approved coach/club" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.coach_profiles c WHERE c.id = profiles.id AND c.application_status = 'approved')
    OR EXISTS (SELECT 1 FROM public.club_profiles c WHERE c.id = profiles.id AND c.application_status = 'approved')
  );

DROP POLICY IF EXISTS "Public can view verified coach profiles" ON public.coach_profiles;
CREATE POLICY "Public can view approved coach profiles" ON public.coach_profiles
  FOR SELECT USING (application_status = 'approved');

DROP POLICY IF EXISTS "Public can view verified club profiles" ON public.club_profiles;
CREATE POLICY "Public can view approved club profiles" ON public.club_profiles
  FOR SELECT USING (application_status = 'approved');

DROP POLICY IF EXISTS "Public can view open slots of verified coaches" ON public.availability_slots;
CREATE POLICY "Public can view open slots of approved coaches" ON public.availability_slots
  FOR SELECT USING (status = 'open' AND EXISTS (
    SELECT 1 FROM public.coach_profiles cp WHERE cp.id = availability_slots.coach_id AND cp.application_status = 'approved'));

-- Logged-out visitors may only read non-sensitive profile columns
REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT (id, role, full_name, avatar_url, city, created_at) ON public.profiles TO anon;