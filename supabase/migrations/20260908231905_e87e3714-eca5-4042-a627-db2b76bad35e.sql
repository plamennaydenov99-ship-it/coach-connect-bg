CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (
  id uuid,
  email text,
  email_confirmed boolean,
  role public.app_role,
  full_name text,
  city text,
  created_at timestamptz,
  application_status text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    u.email::text,
    (u.email_confirmed_at IS NOT NULL) AS email_confirmed,
    p.role,
    p.full_name,
    p.city,
    p.created_at,
    CASE
      WHEN p.role = 'coach' THEN cp.application_status
      WHEN p.role = 'club' THEN clp.application_status
      ELSE NULL
    END AS application_status
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.id
  LEFT JOIN public.coach_profiles cp ON cp.id = p.id
  LEFT JOIN public.club_profiles clp ON clp.id = p.id
  ORDER BY p.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_confirm_email(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  UPDATE auth.users
  SET email_confirmed_at = now()
  WHERE id = _user_id AND email_confirmed_at IS NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_users() FROM public, anon;
REVOKE ALL ON FUNCTION public.admin_confirm_email(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_confirm_email(uuid) TO authenticated;