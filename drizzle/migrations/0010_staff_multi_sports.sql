ALTER TABLE public.coach_profiles ADD COLUMN sports text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.club_profiles ADD COLUMN sports text[] NOT NULL DEFAULT '{}';

UPDATE public.coach_profiles SET sports = ARRAY[sport] WHERE sport IS NOT NULL;
UPDATE public.club_profiles SET sports = ARRAY[sport] WHERE sport IS NOT NULL;

ALTER TABLE public.coach_profiles ADD CONSTRAINT coach_profiles_sports_max3 CHECK (cardinality(sports) <= 3);
ALTER TABLE public.club_profiles ADD CONSTRAINT club_profiles_sports_max3 CHECK (cardinality(sports) <= 3);

CREATE OR REPLACE FUNCTION public.tg_normalize_sports()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.sports := COALESCE((
    SELECT array_agg(s ORDER BY first_pos)
    FROM (
      SELECT s, min(pos) AS first_pos
      FROM unnest(COALESCE(NEW.sports, '{}'::text[])) WITH ORDINALITY AS u(s, pos)
      WHERE s IS NOT NULL AND s <> ''
      GROUP BY s
    ) d
  ), '{}'::text[]);
  NEW.sport := NEW.sports[1];
  RETURN NEW;
END $$;

CREATE TRIGGER coach_profiles_normalize_sports
BEFORE INSERT OR UPDATE ON public.coach_profiles
FOR EACH ROW EXECUTE FUNCTION public.tg_normalize_sports();

CREATE TRIGGER club_profiles_normalize_sports
BEFORE INSERT OR UPDATE ON public.club_profiles
FOR EACH ROW EXECUTE FUNCTION public.tg_normalize_sports();