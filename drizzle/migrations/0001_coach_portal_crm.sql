-- 1. coach_clients: support external clients
ALTER TABLE public.coach_clients ALTER COLUMN athlete_id DROP NOT NULL;
ALTER TABLE public.coach_clients
  ADD COLUMN display_name text NOT NULL DEFAULT '',
  ADD COLUMN email text,
  ADD COLUMN phone text,
  ADD COLUMN stage text NOT NULL DEFAULT 'enquiry',
  ADD COLUMN stage_position integer NOT NULL DEFAULT 0,
  ADD COLUMN goal text,
  ADD COLUMN source text,
  ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.coach_clients
  ADD CONSTRAINT coach_clients_stage_check
  CHECK (stage IN ('enquiry','trial','active','on_hold','archived'));

UPDATE public.coach_clients cc
SET display_name = COALESCE(p.full_name, '')
FROM public.profiles p
WHERE p.id = cc.athlete_id AND cc.display_name = '';

ALTER TABLE public.coach_clients DROP CONSTRAINT coach_clients_coach_id_athlete_id_key;
CREATE UNIQUE INDEX coach_clients_coach_athlete_uniq
  ON public.coach_clients (coach_id, athlete_id) WHERE athlete_id IS NOT NULL;
CREATE INDEX coach_clients_coach_stage_idx ON public.coach_clients (coach_id, stage, stage_position);

CREATE TRIGGER coach_clients_set_updated_at
  BEFORE UPDATE ON public.coach_clients
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE OR REPLACE FUNCTION public.tg_upsert_coach_client()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.coach_clients (coach_id, athlete_id, display_name, stage)
  VALUES (
    NEW.coach_id, NEW.athlete_id,
    COALESCE((SELECT full_name FROM public.profiles WHERE id = NEW.athlete_id), ''),
    'active'
  )
  ON CONFLICT (coach_id, athlete_id) WHERE athlete_id IS NOT NULL DO NOTHING;
  RETURN NEW;
END;
$$;

-- 2. session_series
CREATE TABLE public.session_series (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.coach_clients(id) ON DELETE CASCADE,
  weekday smallint NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time time NOT NULL,
  duration_min integer NOT NULL DEFAULT 60 CHECK (duration_min > 0),
  location text,
  starts_on date NOT NULL,
  ends_on date,
  kind text NOT NULL DEFAULT 'session' CHECK (kind IN ('session','trial')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.session_series TO authenticated;
GRANT ALL ON public.session_series TO service_role;
ALTER TABLE public.session_series ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Coach manages own series" ON public.session_series FOR ALL TO authenticated
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid() AND EXISTS (SELECT 1 FROM public.coach_clients c WHERE c.id = client_id AND c.coach_id = auth.uid()));
CREATE INDEX session_series_coach_idx ON public.session_series (coach_id);
CREATE INDEX session_series_client_idx ON public.session_series (client_id);

-- 3. coach_sessions
CREATE TABLE public.coach_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.coach_clients(id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  location text,
  kind text NOT NULL DEFAULT 'session' CHECK (kind IN ('session','trial')),
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','attended','no_show','cancelled')),
  series_id uuid REFERENCES public.session_series(id) ON DELETE SET NULL,
  booking_id uuid UNIQUE REFERENCES public.bookings(id) ON DELETE SET NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coach_sessions TO authenticated;
GRANT ALL ON public.coach_sessions TO service_role;
ALTER TABLE public.coach_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Coach manages own sessions" ON public.coach_sessions FOR ALL TO authenticated
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid() AND EXISTS (SELECT 1 FROM public.coach_clients c WHERE c.id = client_id AND c.coach_id = auth.uid()));
CREATE INDEX coach_sessions_coach_starts_idx ON public.coach_sessions (coach_id, starts_at);
CREATE INDEX coach_sessions_client_starts_idx ON public.coach_sessions (client_id, starts_at);
CREATE INDEX coach_sessions_series_idx ON public.coach_sessions (series_id);
CREATE TRIGGER coach_sessions_set_updated_at
  BEFORE UPDATE ON public.coach_sessions
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 4. coach_tasks
CREATE TABLE public.coach_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.coach_clients(id) ON DELETE SET NULL,
  title text NOT NULL,
  due_date date,
  done boolean NOT NULL DEFAULT false,
  done_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coach_tasks TO authenticated;
GRANT ALL ON public.coach_tasks TO service_role;
ALTER TABLE public.coach_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Coach manages own tasks" ON public.coach_tasks FOR ALL TO authenticated
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid() AND (client_id IS NULL OR EXISTS (SELECT 1 FROM public.coach_clients c WHERE c.id = client_id AND c.coach_id = auth.uid())));
CREATE INDEX coach_tasks_coach_idx ON public.coach_tasks (coach_id, done, due_date);
CREATE INDEX coach_tasks_client_idx ON public.coach_tasks (client_id);

-- 5. client_events (timeline)
CREATE TABLE public.client_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.coach_clients(id) ON DELETE CASCADE,
  coach_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('note','stage_change','session','task')),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_events TO authenticated;
GRANT ALL ON public.client_events TO service_role;
ALTER TABLE public.client_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Coach manages own client events" ON public.client_events FOR ALL TO authenticated
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid() AND EXISTS (SELECT 1 FROM public.coach_clients c WHERE c.id = client_id AND c.coach_id = auth.uid()));
CREATE INDEX client_events_client_created_idx ON public.client_events (client_id, created_at DESC);
CREATE INDEX client_events_coach_idx ON public.client_events (coach_id);

-- 6. Triggers
-- Confirmed booking -> coach_sessions (never blocks the booking update)
CREATE OR REPLACE FUNCTION public.tg_booking_to_session()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE _client uuid; _slot record;
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
      IF _client IS NOT NULL AND _slot.date IS NOT NULL THEN
        INSERT INTO public.coach_sessions (coach_id, client_id, starts_at, ends_at, booking_id, note)
        VALUES (NEW.coach_id, _client,
                (_slot.date + _slot.start_time)::timestamptz,
                (_slot.date + _slot.end_time)::timestamptz,
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
CREATE TRIGGER trg_booking_to_session
  AFTER UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.tg_booking_to_session();

-- Stage change -> client_events
CREATE OR REPLACE FUNCTION public.tg_client_stage_event()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.stage IS DISTINCT FROM OLD.stage THEN
    INSERT INTO public.client_events (client_id, coach_id, type, payload)
    VALUES (NEW.id, NEW.coach_id, 'stage_change', jsonb_build_object('from', OLD.stage, 'to', NEW.stage));
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_client_stage_event
  AFTER UPDATE ON public.coach_clients
  FOR EACH ROW EXECUTE FUNCTION public.tg_client_stage_event();

-- Session status change -> client_events
CREATE OR REPLACE FUNCTION public.tg_session_status_event()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.client_events (client_id, coach_id, type, payload)
    VALUES (NEW.client_id, NEW.coach_id, 'session',
            jsonb_build_object('session_id', NEW.id, 'from', OLD.status, 'to', NEW.status, 'starts_at', NEW.starts_at));
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_session_status_event
  AFTER UPDATE ON public.coach_sessions
  FOR EACH ROW EXECUTE FUNCTION public.tg_session_status_event();

-- Task completion -> client_events (only client-linked tasks)
CREATE OR REPLACE FUNCTION public.tg_task_done_event()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.done AND NOT OLD.done THEN
    NEW.done_at := COALESCE(NEW.done_at, now());
    IF NEW.client_id IS NOT NULL THEN
      INSERT INTO public.client_events (client_id, coach_id, type, payload)
      VALUES (NEW.client_id, NEW.coach_id, 'task', jsonb_build_object('task_id', NEW.id, 'title', NEW.title));
    END IF;
  ELSIF NOT NEW.done AND OLD.done THEN
    NEW.done_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_task_done_event
  BEFORE UPDATE ON public.coach_tasks
  FOR EACH ROW EXECUTE FUNCTION public.tg_task_done_event();
