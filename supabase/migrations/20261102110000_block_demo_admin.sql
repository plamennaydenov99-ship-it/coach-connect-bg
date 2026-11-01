-- The deployed demo-login function was still the old passwordless one (DEMO_MODE on), and it re-creates
-- demo-admin@lokka.test as an admin on every call. Whatever sets the flag, an @lokka.test account can never be admin.
CREATE OR REPLACE FUNCTION public.tg_no_demo_admin() RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $f$
BEGIN
  IF NEW.is_admin AND EXISTS (SELECT 1 FROM auth.users u WHERE u.id = NEW.id AND u.email ILIKE '%@lokka.test') THEN
    NEW.is_admin := false;
  END IF;
  RETURN NEW;
END $f$;

DROP TRIGGER IF EXISTS profiles_no_demo_admin ON public.profiles;
CREATE TRIGGER profiles_no_demo_admin BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_no_demo_admin();

UPDATE public.profiles SET is_admin = false
WHERE is_admin AND id IN (SELECT id FROM auth.users WHERE email ILIKE '%@lokka.test');
