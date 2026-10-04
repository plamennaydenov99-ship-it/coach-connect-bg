CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA extensions;

CREATE TABLE public.club_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 60),
  sport text,
  kind text NOT NULL CHECK (kind IN ('court','room','field','pool','other')),
  capacity integer CHECK (capacity > 0),
  open_time time NOT NULL DEFAULT '07:00',
  close_time time NOT NULL DEFAULT '23:00',
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT club_resources_hours_check CHECK (close_time > open_time)
);
CREATE INDEX club_resources_owner_idx ON public.club_resources(owner_id);
REVOKE ALL ON public.club_resources FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.club_resources TO authenticated;
GRANT ALL ON public.club_resources TO service_role;
ALTER TABLE public.club_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage their resources" ON public.club_resources
  FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

ALTER TABLE public.coach_sessions ADD CONSTRAINT coach_sessions_resource_id_fkey
  FOREIGN KEY (resource_id) REFERENCES public.club_resources(id) ON DELETE SET NULL;
ALTER TABLE public.session_series ADD CONSTRAINT session_series_resource_id_fkey
  FOREIGN KEY (resource_id) REFERENCES public.club_resources(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.tg_resource_owner_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.resource_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.club_resources r WHERE r.id = NEW.resource_id AND r.owner_id = NEW.coach_id
  ) THEN
    RAISE EXCEPTION 'Facility does not belong to this account';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER resource_owner_guard BEFORE INSERT OR UPDATE OF resource_id, coach_id ON public.coach_sessions
  FOR EACH ROW EXECUTE FUNCTION public.tg_resource_owner_guard();
CREATE TRIGGER resource_owner_guard BEFORE INSERT OR UPDATE OF resource_id, coach_id ON public.session_series
  FOR EACH ROW EXECUTE FUNCTION public.tg_resource_owner_guard();

ALTER TABLE public.coach_sessions DROP CONSTRAINT coach_sessions_kind_check;
ALTER TABLE public.coach_sessions ADD CONSTRAINT coach_sessions_kind_check CHECK (kind IN ('session','trial','hire'));
ALTER TABLE public.session_series DROP CONSTRAINT session_series_kind_check;
ALTER TABLE public.session_series ADD CONSTRAINT session_series_kind_check CHECK (kind IN ('session','trial','hire'));

ALTER TABLE public.coach_sessions DROP CONSTRAINT coach_sessions_client_type;
ALTER TABLE public.coach_sessions ADD CONSTRAINT coach_sessions_client_type CHECK (
  (kind = 'hire' AND client_id IS NULL AND capacity IS NULL AND title IS NOT NULL AND resource_id IS NOT NULL)
  OR (kind <> 'hire' AND ((capacity IS NULL AND client_id IS NOT NULL) OR (capacity IS NOT NULL AND client_id IS NULL))));
ALTER TABLE public.session_series DROP CONSTRAINT session_series_client_type;
ALTER TABLE public.session_series ADD CONSTRAINT session_series_client_type CHECK (
  (kind = 'hire' AND client_id IS NULL AND capacity IS NULL AND title IS NOT NULL AND resource_id IS NOT NULL)
  OR (kind <> 'hire' AND ((capacity IS NULL AND client_id IS NOT NULL) OR (capacity IS NOT NULL AND client_id IS NULL))));

ALTER TABLE public.coach_sessions ADD CONSTRAINT coach_sessions_no_resource_overlap
  EXCLUDE USING gist (resource_id WITH =, tstzrange(starts_at, ends_at, '[)') WITH &&)
  WHERE (resource_id IS NOT NULL AND status <> 'cancelled');

CREATE OR REPLACE FUNCTION public.book_group_session(payload jsonb)
 RETURNS uuid LANGUAGE plpgsql SET search_path TO 'public'
AS $function$
DECLARE sid uuid; result uuid; o jsonb; member uuid;
 _led text := NULLIF(payload->>'led_by','');
 _res uuid := NULLIF(payload->>'resource_id','')::uuid;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
 IF (payload->>'repeat')::boolean THEN
 INSERT INTO public.session_series(coach_id, client_id, capacity, title, sport, is_public, location, weekday, start_time, duration_min, starts_on, ends_on, led_by, resource_id)
 VALUES (auth.uid(), NULL, (payload->>'capacity')::integer, payload->>'title', payload->>'sport', (payload->>'is_public')::boolean, payload->>'location', (payload->>'weekday')::smallint, (payload->>'time')::time, (payload->>'duration')::integer, (payload->>'date')::date, NULLIF(payload->>'ends_on','')::date, _led, _res) RETURNING id INTO sid;
 FOR member IN SELECT value::uuid FROM jsonb_array_elements_text(payload->'attendee_ids') LOOP
 INSERT INTO public.series_members(series_id, client_id) VALUES (sid, member);
 END LOOP;
 END IF;
 FOR o IN SELECT value FROM jsonb_array_elements(payload->'occurrences') LOOP
 INSERT INTO public.coach_sessions(coach_id, client_id, capacity, title, sport, is_public, location, series_id, starts_at, ends_at, led_by, resource_id)
 VALUES (auth.uid(), NULL, (payload->>'capacity')::integer, payload->>'title', payload->>'sport', (payload->>'is_public')::boolean, payload->>'location', sid, (o->>'starts_at')::timestamptz, (o->>'ends_at')::timestamptz, _led, _res) RETURNING id INTO result;
 IF sid IS NULL THEN
 FOR member IN SELECT value::uuid FROM jsonb_array_elements_text(payload->'attendee_ids') LOOP
 INSERT INTO public.session_attendees(session_id, client_id) VALUES (result, member);
 END LOOP;
 END IF;
 END LOOP;
 RETURN coalesce(sid,result);
END $function$;