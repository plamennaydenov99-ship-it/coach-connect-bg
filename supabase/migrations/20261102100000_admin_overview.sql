-- Admin panel, phase A: an overview, a safe "delete user", and an audit log.
-- Every function checks profiles.is_admin for the caller, the same way admin_list_users does.

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id     uuid,                       -- no foreign key on purpose: the log must outlive any account
  action       text NOT NULL,
  target_id    uuid,
  target_label text,
  detail       jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins read audit log" ON public.admin_audit_log;
CREATE POLICY "admins read audit log" ON public.admin_audit_log
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

REVOKE ALL ON public.admin_audit_log FROM anon, authenticated;
GRANT SELECT ON public.admin_audit_log TO authenticated;   -- writes only happen inside the functions below

CREATE INDEX IF NOT EXISTS admin_audit_log_created_idx ON public.admin_audit_log (created_at DESC);

-- One call that fills the /admin overview.
CREATE OR REPLACE FUNCTION public.admin_overview()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE r jsonb;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT jsonb_build_object(
    'people', jsonb_build_object(
      'total',       (SELECT count(*) FROM public.profiles),
      'athletes',    (SELECT count(*) FROM public.profiles WHERE role = 'athlete'),
      'coaches',     (SELECT count(*) FROM public.profiles WHERE role = 'coach'),
      'clubs',       (SELECT count(*) FROM public.profiles WHERE role = 'club'),
      'new_7d',      (SELECT count(*) FROM public.profiles WHERE created_at > now() - interval '7 days'),
      'unconfirmed', (SELECT count(*) FROM auth.users WHERE email_confirmed_at IS NULL)
    ),
    'waiting', jsonb_build_object(
      'coach_apps',   (SELECT count(*) FROM public.coach_profiles WHERE application_status = 'pending'),
      'club_apps',    (SELECT count(*) FROM public.club_profiles  WHERE application_status = 'pending'),
      'certificates', (SELECT count(*) FROM public.coach_certificates WHERE status = 'pending'),
      'boosts',       (SELECT count(*) FROM public.ad_campaigns WHERE status = 'in_review')
    ),
    'activity', jsonb_build_object(
      'upcoming_sessions', (SELECT count(*) FROM public.coach_sessions WHERE is_public AND status = 'scheduled' AND starts_at > now()),
      'bookings_7d',       (SELECT count(*) FROM public.bookings WHERE created_at > now() - interval '7 days'),
      'spot_requests_7d',  (SELECT count(*) FROM public.spot_requests WHERE created_at > now() - interval '7 days'),
      'messages_7d',       (SELECT count(*) FROM public.messages WHERE created_at > now() - interval '7 days'),
      'profile_views_7d',  (SELECT count(*) FROM public.profile_views WHERE created_at > now() - interval '7 days')
    ),
    'signups_14d', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('d', x.d, 'n', x.n) ORDER BY x.d), '[]'::jsonb)
      FROM (
        SELECT g::date AS d, (SELECT count(*) FROM public.profiles WHERE created_at::date = g::date) AS n
        FROM generate_series(current_date - 13, current_date, interval '1 day') g
      ) x
    )
  ) INTO r;

  RETURN r;
END;
$$;

-- Deletes one account and everything it owns (bookings, clients, messages, sessions ...).
-- Refuses to delete yourself or another admin. Always leaves a line in the audit log.
CREATE OR REPLACE FUNCTION public.admin_delete_user(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_email text;
  v_name  text;
  v_role  text;
  v_admin boolean;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  IF _user_id = auth.uid() THEN
    RAISE EXCEPTION 'you cannot delete your own account here';
  END IF;

  SELECT u.email::text, p.full_name, p.role::text, coalesce(p.is_admin, false)
    INTO v_email, v_name, v_role, v_admin
  FROM auth.users u LEFT JOIN public.profiles p ON p.id = u.id
  WHERE u.id = _user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'user not found'; END IF;
  IF v_admin THEN RAISE EXCEPTION 'this account is an admin: remove admin access first'; END IF;

  -- these columns only point at "who reviewed", so clear them rather than block the delete
  UPDATE public.coach_profiles SET reviewed_by = NULL WHERE reviewed_by = _user_id;
  UPDATE public.club_profiles  SET reviewed_by = NULL WHERE reviewed_by = _user_id;
  UPDATE public.ad_campaigns   SET reviewed_by = NULL WHERE reviewed_by = _user_id;

  INSERT INTO public.admin_audit_log (admin_id, action, target_id, target_label, detail)
  VALUES (auth.uid(), 'delete_user', _user_id, coalesce(v_email, v_name),
          jsonb_build_object('role', v_role, 'name', v_name));

  DELETE FROM auth.users WHERE id = _user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_overview()          FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_delete_user(uuid)   FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.admin_overview()          TO authenticated;
GRANT  EXECUTE ON FUNCTION public.admin_delete_user(uuid)   TO authenticated;
