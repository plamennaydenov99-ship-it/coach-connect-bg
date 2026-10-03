-- Coach timezone for session timestamps
ALTER TABLE public.profiles
  ADD COLUMN timezone text NOT NULL DEFAULT 'Europe/Sofia',
  ADD CONSTRAINT profiles_timezone_check
    CHECK (timezone IN ('Europe/Sofia','Europe/Paris','Europe/Monaco'));

-- Sessions are anchored to the coach's timezone when derived from a booking slot
CREATE OR REPLACE FUNCTION public.tg_booking_to_session()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE _client uuid; _slot record; _tz text;
BEGIN
  IF NEW.status = 'confirmed' AND OLD.status IS DISTINCT FROM 'confirmed' THEN
    BEGIN
      SELECT id INTO _client FROM public.coach_clients
        WHERE coach_id = NEW.coach_id AND athlete_id = NEW.athlete_id;
      IF _client IS NULL THEN
        INSERT INTO public.coach_clients (coach_id, athlete_id, display_name, stage)
        VALUES (NEW.coach_id, NEW.athlete_id,
                COALESCE((SELECT full_name FROM public.profiles WHERE id = NEW.athlete_id), ''), 'active')
        ON CONFLICT (coach_id, athlete_id) WHERE athlete_id IS NOT NULL DO NOTHING
        RETURNING id INTO _client;
        IF _client IS NULL THEN
          SELECT id INTO _client FROM public.coach_clients
            WHERE coach_id = NEW.coach_id AND athlete_id = NEW.athlete_id;
        END IF;
      END IF;
      SELECT date, start_time, end_time INTO _slot FROM public.availability_slots WHERE id = NEW.slot_id;
      SELECT COALESCE(timezone, 'Europe/Sofia') INTO _tz FROM public.profiles WHERE id = NEW.coach_id;
      IF _client IS NOT NULL AND _slot.date IS NOT NULL THEN
        INSERT INTO public.coach_sessions (coach_id, client_id, starts_at, ends_at, booking_id, note)
        VALUES (NEW.coach_id, _client,
                ((_slot.date + _slot.start_time) AT TIME ZONE _tz),
                ((_slot.date + _slot.end_time) AT TIME ZONE _tz),
                NEW.id, NEW.note)
        ON CONFLICT (booking_id) DO NOTHING;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'tg_booking_to_session failed for booking %: %', NEW.id, SQLERRM;
    END;
  END IF;
  RETURN NEW;
END;
$$;