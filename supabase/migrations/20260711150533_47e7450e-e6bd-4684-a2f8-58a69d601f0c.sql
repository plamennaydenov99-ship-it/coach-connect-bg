
-- Replace the public-visibility policy on profiles so it no longer uses a SECURITY DEFINER function
DROP POLICY IF EXISTS "Public can view profiles linked to verified coach/club" ON public.profiles;

CREATE POLICY "Public can view profiles linked to verified coach/club"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.coach_profiles c WHERE c.id = profiles.id AND c.verified = true)
    OR EXISTS (SELECT 1 FROM public.club_profiles c WHERE c.id = profiles.id AND c.verified = true)
  );

DROP FUNCTION IF EXISTS public.is_public_profile(uuid);

-- Lock down internal trigger functions
REVOKE EXECUTE ON FUNCTION public.tg_set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
