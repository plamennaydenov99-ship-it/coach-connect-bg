-- Security lockdown (2026-10-31)
-- 1) Nobody can make themselves an admin from the app.
--    Admins are granted only from the database (SQL editor / service role), where auth.uid() is NULL.
CREATE OR REPLACE FUNCTION public.tg_protect_is_admin()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.is_admin IS DISTINCT FROM OLD.is_admin AND auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'is_admin can only be changed from the database';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS profiles_protect_is_admin ON public.profiles;
CREATE TRIGGER profiles_protect_is_admin
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.tg_protect_is_admin();

-- 2) Logged-out visitors may only read (the RLS rules already limit which rows/columns),
--    plus log a profile view. Remove the extra write/admin-level table rights they were granted.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON ALL TABLES IN SCHEMA public FROM anon;
GRANT INSERT ON public.profile_views TO anon;

-- 3) Logged-in users never need TRUNCATE / REFERENCES / TRIGGER on any table.
REVOKE TRUNCATE, REFERENCES, TRIGGER ON ALL TABLES IN SCHEMA public FROM authenticated;

-- 4) Group booking requires an account.
REVOKE EXECUTE ON FUNCTION public.book_group_session(jsonb) FROM anon;
