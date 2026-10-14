CREATE TABLE public.billing_settings (
  owner_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  charge_no_shows boolean NOT NULL DEFAULT false,
  currency text NOT NULL DEFAULT 'EUR',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.billing_settings TO authenticated;
GRANT ALL ON public.billing_settings TO service_role;
REVOKE ALL ON public.billing_settings FROM anon;
ALTER TABLE public.billing_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner reads billing settings" ON public.billing_settings FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "Owner inserts billing settings" ON public.billing_settings FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owner updates billing settings" ON public.billing_settings FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE TRIGGER billing_settings_updated_at BEFORE UPDATE ON public.billing_settings FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

ALTER TABLE public.coach_clients
  ADD COLUMN billing_type text NOT NULL DEFAULT 'none' CHECK (billing_type IN ('none','per_session','weekly','monthly')),
  ADD COLUMN rate numeric(10,2) CHECK (rate >= 0),
  ADD COLUMN currency text NOT NULL DEFAULT 'EUR',
  ADD COLUMN billing_start date,
  ADD COLUMN acquired_via text NOT NULL DEFAULT 'own' CHECK (acquired_via IN ('own','lokka_discover','lokka_trending','invite'));

ALTER TABLE public.coach_sessions ADD COLUMN price numeric(10,2) CHECK (price >= 0);
ALTER TABLE public.session_series ADD COLUMN price numeric(10,2) CHECK (price >= 0);
COMMENT ON COLUMN public.coach_sessions.price IS 'Price per person for group sessions, per session for 1:1.';
COMMENT ON COLUMN public.session_series.price IS 'Price per person for group sessions, per session for 1:1.';

CREATE OR REPLACE FUNCTION public.derive_acquired_via(_coach uuid, _athlete uuid, _keep_invite boolean)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN _athlete IS NULL THEN 'own'
    WHEN _keep_invite THEN 'invite'
    WHEN EXISTS (SELECT 1 FROM public.spot_requests r JOIN public.coach_sessions s ON s.id = r.session_id
                 WHERE r.athlete_id = _athlete AND s.coach_id = _coach) THEN 'lokka_trending'
    WHEN EXISTS (SELECT 1 FROM public.conversations c WHERE c.athlete_id = _athlete AND c.coach_id = _coach) THEN 'lokka_discover'
    ELSE 'own' END
$$;
REVOKE ALL ON FUNCTION public.derive_acquired_via(uuid, uuid, boolean) FROM PUBLIC, anon;

CREATE OR REPLACE FUNCTION public.tg_coach_client_billing()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _svc boolean := coalesce(auth.role(), '') = 'service_role';
BEGIN
  IF NEW.athlete_id IS NOT NULL AND NOT _svc
     AND (TG_OP = 'INSERT' OR NEW.athlete_id IS DISTINCT FROM OLD.athlete_id)
     AND auth.uid() IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM public.conversations c WHERE c.athlete_id = NEW.athlete_id AND c.coach_id = NEW.coach_id)
     AND NOT EXISTS (SELECT 1 FROM public.bookings b WHERE b.athlete_id = NEW.athlete_id AND b.coach_id = NEW.coach_id) THEN
    RAISE EXCEPTION 'This athlete has not contacted you on Lokka';
  END IF;
  NEW.acquired_via := public.derive_acquired_via(NEW.coach_id, NEW.athlete_id,
    (TG_OP = 'UPDATE' AND OLD.acquired_via = 'invite') OR (_svc AND NEW.acquired_via = 'invite'));
  RETURN NEW;
END $$;
CREATE TRIGGER coach_clients_zz_billing BEFORE INSERT OR UPDATE ON public.coach_clients
  FOR EACH ROW EXECUTE FUNCTION public.tg_coach_client_billing();

UPDATE public.coach_clients SET acquired_via = public.derive_acquired_via(coach_id, athlete_id, false);

CREATE OR REPLACE FUNCTION public.book_group_session(payload jsonb)
 RETURNS uuid LANGUAGE plpgsql SET search_path TO 'public'
AS $function$
DECLARE sid uuid; result uuid; o jsonb; member uuid;
 _led text := NULLIF(payload->>'led_by','');
 _res uuid := NULLIF(payload->>'resource_id','')::uuid;
 _price numeric := NULLIF(payload->>'price','')::numeric;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
 IF (payload->>'repeat')::boolean THEN
 INSERT INTO public.session_series(coach_id, client_id, capacity, title, sport, is_public, location, weekday, start_time, duration_min, starts_on, ends_on, led_by, resource_id, price)
 VALUES (auth.uid(), NULL, (payload->>'capacity')::integer, payload->>'title', payload->>'sport', (payload->>'is_public')::boolean, payload->>'location', (payload->>'weekday')::smallint, (payload->>'time')::time, (payload->>'duration')::integer, (payload->>'date')::date, NULLIF(payload->>'ends_on','')::date, _led, _res, _price) RETURNING id INTO sid;
 FOR member IN SELECT value::uuid FROM jsonb_array_elements_text(payload->'attendee_ids') LOOP
 INSERT INTO public.series_members(series_id, client_id) VALUES (sid, member);
 END LOOP;
 END IF;
 FOR o IN SELECT value FROM jsonb_array_elements(payload->'occurrences') LOOP
 INSERT INTO public.coach_sessions(coach_id, client_id, capacity, title, sport, is_public, location, series_id, starts_at, ends_at, led_by, resource_id, price)
 VALUES (auth.uid(), NULL, (payload->>'capacity')::integer, payload->>'title', payload->>'sport', (payload->>'is_public')::boolean, payload->>'location', sid, (o->>'starts_at')::timestamptz, (o->>'ends_at')::timestamptz, _led, _res, _price) RETURNING id INTO result;
 IF sid IS NULL THEN
 FOR member IN SELECT value::uuid FROM jsonb_array_elements_text(payload->'attendee_ids') LOOP
 INSERT INTO public.session_attendees(session_id, client_id) VALUES (result, member);
 END LOOP;
 END IF;
 END LOOP;
 RETURN coalesce(sid,result);
END $function$;