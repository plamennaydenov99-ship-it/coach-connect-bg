CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = _user_id AND p.is_admin)
$$;

REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;

DROP POLICY IF EXISTS "Admins can view coach applications" ON public.coach_profiles;
DROP POLICY IF EXISTS "Admins can review coach applications" ON public.coach_profiles;

CREATE POLICY "Admins can view coach applications"
ON public.coach_profiles FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can review coach applications"
ON public.coach_profiles FOR UPDATE TO authenticated
USING (public.is_admin(auth.uid()));