REVOKE ALL ON public.session_attendees FROM anon;
REVOKE ALL ON public.series_members FROM anon;
REVOKE ALL ON public.coach_sessions FROM anon;
GRANT SELECT (id, coach_id, title, sport, starts_at, ends_at, capacity, led_by, location) ON public.coach_sessions TO anon;

CREATE OR REPLACE FUNCTION public.tg_group_capacity_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF NEW.capacity IS NOT NULL AND (SELECT count(*) FROM public.session_attendees a WHERE a.session_id = NEW.id AND a.status IN ('booked','attended')) > NEW.capacity THEN
 RAISE EXCEPTION 'Capacity is below the current attendee count';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER group_capacity_guard BEFORE UPDATE OF capacity ON public.coach_sessions FOR EACH ROW EXECUTE FUNCTION public.tg_group_capacity_guard();

CREATE OR REPLACE FUNCTION public.tg_series_member_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.session_series; owner uuid;
BEGIN
 SELECT * INTO s FROM public.session_series WHERE id = NEW.series_id FOR UPDATE;
 SELECT coach_id INTO owner FROM public.coach_clients WHERE id = NEW.client_id;
 IF s.capacity IS NULL OR owner IS DISTINCT FROM s.coach_id THEN RAISE EXCEPTION 'Invalid series member'; END IF;
 IF (SELECT count(*) FROM public.series_members m WHERE m.series_id = NEW.series_id AND m.client_id <> NEW.client_id) >= s.capacity THEN RAISE EXCEPTION 'Group capacity reached'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER series_member_guard BEFORE INSERT OR UPDATE ON public.series_members FOR EACH ROW EXECUTE FUNCTION public.tg_series_member_guard();