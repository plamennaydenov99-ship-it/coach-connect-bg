CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _role public.app_role;
  _certs text[];
  _price numeric;
BEGIN
  _role := COALESCE(NEW.raw_user_meta_data->>'role', 'athlete')::public.app_role;

  INSERT INTO public.profiles (id, role, full_name, city, language)
  VALUES (
    NEW.id,
    _role,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'city',
    COALESCE(NEW.raw_user_meta_data->>'language', 'en')
  );

  IF _role = 'coach' THEN
    BEGIN
      _certs := ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'certifications'));
    EXCEPTION WHEN OTHERS THEN
      _certs := '{}';
    END;

    BEGIN
      _price := NULLIF(NEW.raw_user_meta_data->>'price_per_session', '')::numeric;
    EXCEPTION WHEN OTHERS THEN
      _price := NULL;
    END;

    INSERT INTO public.coach_profiles (id, sport, bio, price_per_session, certifications)
    VALUES (
      NEW.id,
      NULLIF(NEW.raw_user_meta_data->>'sport', ''),
      NULLIF(NEW.raw_user_meta_data->>'bio', ''),
      _price,
      COALESCE(_certs, '{}')
    );
  ELSIF _role = 'club' THEN
    INSERT INTO public.club_profiles (id, name, sport, about)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      NULLIF(NEW.raw_user_meta_data->>'sport', ''),
      NULLIF(NEW.raw_user_meta_data->>'about', '')
    );
  END IF;

  RETURN NEW;
END;
$function$;