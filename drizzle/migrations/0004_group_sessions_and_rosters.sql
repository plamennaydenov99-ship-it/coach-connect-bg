ALTER TABLE public.coach_sessions
  ADD COLUMN capacity integer CHECK (capacity > 0),
  ADD COLUMN title text,
  ADD COLUMN sport text,
  ADD COLUMN led_by text,
  ADD COLUMN is_public boolean NOT NULL DEFAULT false,
  ADD COLUMN resource_id uuid,
  ALTER COLUMN client_id DROP NOT NULL,
  ADD CONSTRAINT coach_sessions_client_type CHECK ((capacity IS NULL AND client_id IS NOT NULL) OR (capacity IS NOT NULL AND client_id IS NULL));
ALTER TABLE public.session_series
  ADD COLUMN capacity integer CHECK (capacity > 0),
  ADD COLUMN title text,
  ADD COLUMN sport text,
  ADD COLUMN led_by text,
  ADD COLUMN is_public boolean NOT NULL DEFAULT false,
  ADD COLUMN resource_id uuid,
  ALTER COLUMN client_id DROP NOT NULL,
  ADD CONSTRAINT session_series_client_type CHECK ((capacity IS NULL AND client_id IS NOT NULL) OR (capacity IS NOT NULL AND client_id IS NULL));

DROP POLICY "Coach manages own sessions" ON public.coach_sessions;
CREATE POLICY "Coach manages own sessions" ON public.coach_sessions FOR ALL TO authenticated
USING (coach_id = auth.uid()) WITH CHECK (coach_id = auth.uid() AND (capacity IS NOT NULL OR EXISTS (SELECT 1 FROM public.coach_clients c WHERE c.id = client_id AND c.coach_id = auth.uid())));
DROP POLICY "Coach manages own series" ON public.session_series;
CREATE POLICY "Coach manages own series" ON public.session_series FOR ALL TO authenticated
USING (coach_id = auth.uid()) WITH CHECK (coach_id = auth.uid() AND (capacity IS NOT NULL OR EXISTS (SELECT 1 FROM public.coach_clients c WHERE c.id = client_id AND c.coach_id = auth.uid())));

CREATE TABLE public.session_attendees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.coach_sessions(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.coach_clients(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'booked' CHECK (status IN ('booked','attended','no_show','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, client_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.session_attendees TO authenticated;
GRANT ALL ON public.session_attendees TO service_role;
ALTER TABLE public.session_attendees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages session attendees" ON public.session_attendees FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.coach_sessions s WHERE s.id = session_id AND s.coach_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.coach_sessions s JOIN public.coach_clients c ON c.id = session_attendees.client_id AND c.coach_id = s.coach_id WHERE s.id = session_id AND s.coach_id = auth.uid() AND s.capacity IS NOT NULL));
CREATE INDEX session_attendees_client_idx ON public.session_attendees(client_id);

CREATE TABLE public.series_members (
  series_id uuid NOT NULL REFERENCES public.session_series(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.coach_clients(id) ON DELETE CASCADE,
  PRIMARY KEY (series_id, client_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.series_members TO authenticated;
GRANT ALL ON public.series_members TO service_role;
ALTER TABLE public.series_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages series members" ON public.series_members FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.session_series s WHERE s.id = series_id AND s.coach_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.session_series s JOIN public.coach_clients c ON c.id = series_members.client_id AND c.coach_id = s.coach_id WHERE s.id = series_id AND s.coach_id = auth.uid() AND s.capacity IS NOT NULL));
CREATE INDEX series_members_client_idx ON public.series_members(client_id);

GRANT SELECT (id, coach_id, title, sport, starts_at, ends_at, capacity, led_by, location) ON public.coach_sessions TO anon;
CREATE POLICY "Public future sessions of approved owners" ON public.coach_sessions FOR SELECT TO anon, authenticated
USING (is_public = true AND starts_at > now() AND (EXISTS (SELECT 1 FROM public.coach_profiles cp WHERE cp.id = coach_sessions.coach_id AND cp.application_status = 'approved') OR EXISTS (SELECT 1 FROM public.club_profiles cp WHERE cp.id = coach_sessions.coach_id AND cp.application_status = 'approved')));

CREATE OR REPLACE FUNCTION public.public_session_spots(session_id uuid)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT greatest(0, s.capacity - (SELECT count(*)::integer FROM public.session_attendees a WHERE a.session_id = s.id AND a.status IN ('booked','attended')))
 FROM public.coach_sessions s WHERE s.id = $1 AND s.capacity IS NOT NULL AND
 (s.coach_id = auth.uid() OR (s.is_public AND s.starts_at > now() AND
 (EXISTS (SELECT 1 FROM public.coach_profiles p WHERE p.id = s.coach_id AND p.application_status = 'approved') OR EXISTS (SELECT 1 FROM public.club_profiles p WHERE p.id = s.coach_id AND p.application_status = 'approved'))));
$$;
REVOKE ALL ON FUNCTION public.public_session_spots(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_session_spots(uuid) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.tg_attendee_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.coach_sessions; owner uuid;
BEGIN
 SELECT * INTO s FROM public.coach_sessions WHERE id = NEW.session_id FOR UPDATE;
 SELECT coach_id INTO owner FROM public.coach_clients WHERE id = NEW.client_id;
 IF s.capacity IS NULL OR owner IS DISTINCT FROM s.coach_id THEN RAISE EXCEPTION 'Invalid group attendee'; END IF;
 IF NEW.status IN ('booked','attended') AND (SELECT count(*) FROM public.session_attendees a WHERE a.session_id = NEW.session_id AND a.status IN ('booked','attended') AND a.id <> NEW.id) >= s.capacity THEN RAISE EXCEPTION 'Group capacity reached'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER attendee_guard BEFORE INSERT OR UPDATE ON public.session_attendees FOR EACH ROW EXECUTE FUNCTION public.tg_attendee_guard();

CREATE OR REPLACE FUNCTION public.tg_attendee_event()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF NEW.status IS DISTINCT FROM OLD.status THEN
 INSERT INTO public.client_events (client_id, coach_id, type, payload)
 SELECT NEW.client_id, s.coach_id, 'session', jsonb_build_object('session_id', s.id, 'from', OLD.status, 'to', NEW.status, 'starts_at', s.starts_at)
 FROM public.coach_sessions s WHERE s.id = NEW.session_id;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER attendee_status_event AFTER UPDATE ON public.session_attendees FOR EACH ROW EXECUTE FUNCTION public.tg_attendee_event();

CREATE OR REPLACE FUNCTION public.tg_group_occurrence_roster()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF NEW.capacity IS NOT NULL AND NEW.series_id IS NOT NULL THEN
 INSERT INTO public.session_attendees(session_id, client_id)
 SELECT NEW.id, m.client_id FROM public.series_members m JOIN public.coach_clients c ON c.id = m.client_id AND c.coach_id = NEW.coach_id WHERE m.series_id = NEW.series_id
 ON CONFLICT (session_id, client_id) DO NOTHING;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER group_occurrence_roster AFTER INSERT ON public.coach_sessions FOR EACH ROW EXECUTE FUNCTION public.tg_group_occurrence_roster();

CREATE OR REPLACE FUNCTION public.tg_session_status_event()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF NEW.status IS DISTINCT FROM OLD.status THEN
 IF NEW.client_id IS NOT NULL THEN
 INSERT INTO public.client_events (client_id, coach_id, type, payload)
 VALUES (NEW.client_id, NEW.coach_id, 'session', jsonb_build_object('session_id', NEW.id, 'from', OLD.status, 'to', NEW.status, 'starts_at', NEW.starts_at));
 ELSIF NEW.status = 'cancelled' THEN
 UPDATE public.session_attendees SET status = 'cancelled' WHERE session_id = NEW.id AND status = 'booked';
 END IF;
 END IF;
 RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.book_group_session(payload jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE sid uuid; result uuid; o jsonb; member uuid;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
 IF (payload->>'repeat')::boolean THEN
 INSERT INTO public.session_series(coach_id, client_id, capacity, title, sport, is_public, location, weekday, start_time, duration_min, starts_on, ends_on)
 VALUES (auth.uid(), NULL, (payload->>'capacity')::integer, payload->>'title', payload->>'sport', (payload->>'is_public')::boolean, payload->>'location', (payload->>'weekday')::smallint, (payload->>'time')::time, (payload->>'duration')::integer, (payload->>'date')::date, NULLIF(payload->>'ends_on','')::date) RETURNING id INTO sid;
 FOR member IN SELECT value::uuid FROM jsonb_array_elements_text(payload->'attendee_ids') LOOP
 INSERT INTO public.series_members(series_id, client_id) VALUES (sid, member);
 END LOOP;
 END IF;
 FOR o IN SELECT value FROM jsonb_array_elements(payload->'occurrences') LOOP
 INSERT INTO public.coach_sessions(coach_id, client_id, capacity, title, sport, is_public, location, series_id, starts_at, ends_at)
 VALUES (auth.uid(), NULL, (payload->>'capacity')::integer, payload->>'title', payload->>'sport', (payload->>'is_public')::boolean, payload->>'location', sid, (o->>'starts_at')::timestamptz, (o->>'ends_at')::timestamptz) RETURNING id INTO result;
 IF sid IS NULL THEN
 FOR member IN SELECT value::uuid FROM jsonb_array_elements_text(payload->'attendee_ids') LOOP
 INSERT INTO public.session_attendees(session_id, client_id) VALUES (result, member);
 END LOOP;
 END IF;
 END LOOP;
 RETURN coalesce(sid,result);
END $$;
REVOKE ALL ON FUNCTION public.book_group_session(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.book_group_session(jsonb) TO authenticated, service_role;