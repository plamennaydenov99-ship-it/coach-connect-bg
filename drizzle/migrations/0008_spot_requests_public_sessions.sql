-- 1. conversations: staff (coach or club) must be approved
DROP POLICY IF EXISTS "Athlete can create conversation" ON public.conversations;
CREATE POLICY "Athlete can create conversation" ON public.conversations
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = athlete_id AND athlete_id <> coach_id AND (
      EXISTS (SELECT 1 FROM public.coach_profiles p WHERE p.id = conversations.coach_id AND p.application_status = 'approved')
      OR EXISTS (SELECT 1 FROM public.club_profiles p WHERE p.id = conversations.coach_id AND p.application_status = 'approved')
    )
  );
COMMENT ON COLUMN public.conversations.coach_id IS 'Staff account: coach or club profile id.';

-- 2. bookmarks target types
ALTER TABLE public.bookmarks DROP CONSTRAINT bookmarks_target_type_check;
ALTER TABLE public.bookmarks ADD CONSTRAINT bookmarks_target_type_check
  CHECK (target_type IN ('coach','club','session','event'));

-- 3. spot_requests
CREATE TABLE public.spot_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.coach_sessions(id) ON DELETE CASCADE,
  athlete_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','handled')),
  created_at timestamptz DEFAULT now(),
  UNIQUE (session_id, athlete_id)
);
CREATE INDEX spot_requests_owner_status_idx ON public.spot_requests(owner_id, status);

REVOKE ALL ON public.spot_requests FROM anon;
GRANT SELECT, INSERT, DELETE ON public.spot_requests TO authenticated;
GRANT UPDATE (status) ON public.spot_requests TO authenticated;
GRANT ALL ON public.spot_requests TO service_role;
ALTER TABLE public.spot_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athlete creates own spot request" ON public.spot_requests
  FOR INSERT TO authenticated WITH CHECK (athlete_id = auth.uid());
CREATE POLICY "Athlete reads own spot requests" ON public.spot_requests
  FOR SELECT TO authenticated USING (athlete_id = auth.uid());
CREATE POLICY "Athlete deletes own spot requests" ON public.spot_requests
  FOR DELETE TO authenticated USING (athlete_id = auth.uid());
CREATE POLICY "Owner reads spot requests" ON public.spot_requests
  FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "Owner updates spot requests" ON public.spot_requests
  FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE OR REPLACE FUNCTION public.tg_spot_request_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _s public.coach_sessions%ROWTYPE;
BEGIN
  SELECT * INTO _s FROM public.coach_sessions WHERE id = NEW.session_id;
  IF NOT FOUND
     OR NOT _s.is_public
     OR _s.starts_at <= now()
     OR _s.status <> 'scheduled'
     OR NOT (
       EXISTS (SELECT 1 FROM public.coach_profiles p WHERE p.id = _s.coach_id AND p.application_status = 'approved')
       OR EXISTS (SELECT 1 FROM public.club_profiles p WHERE p.id = _s.coach_id AND p.application_status = 'approved')
     ) THEN
    RAISE EXCEPTION 'Session is not open for spot requests';
  END IF;
  NEW.owner_id := _s.coach_id;
  NEW.status := 'new';
  RETURN NEW;
END $$;
CREATE TRIGGER spot_request_guard BEFORE INSERT ON public.spot_requests
  FOR EACH ROW EXECUTE FUNCTION public.tg_spot_request_guard();

ALTER PUBLICATION supabase_realtime ADD TABLE public.spot_requests;

-- 4. safe public sessions view
CREATE VIEW public.public_sessions WITH (security_barrier = true) AS
SELECT s.id, s.coach_id AS owner_id, s.title, s.sport, s.led_by, s.location,
       s.starts_at, s.ends_at, s.capacity,
       GREATEST(COALESCE(s.capacity, 0) - (
         SELECT count(*) FROM public.session_attendees a
         WHERE a.session_id = s.id AND a.status IN ('booked','attended')
       ), 0)::integer AS spots_left
FROM public.coach_sessions s
WHERE s.is_public AND s.starts_at > now() AND s.status = 'scheduled'
  AND (
    EXISTS (SELECT 1 FROM public.coach_profiles p WHERE p.id = s.coach_id AND p.application_status = 'approved')
    OR EXISTS (SELECT 1 FROM public.club_profiles p WHERE p.id = s.coach_id AND p.application_status = 'approved')
  );
GRANT SELECT ON public.public_sessions TO anon, authenticated;

DROP POLICY IF EXISTS "Public future sessions of approved owners" ON public.coach_sessions;

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT DISTINCT column_name, privilege_type FROM information_schema.column_privileges
           WHERE table_schema = 'public' AND table_name = 'coach_sessions' AND grantee = 'anon'
  LOOP
    EXECUTE format('REVOKE %s (%I) ON public.coach_sessions FROM anon', r.privilege_type, r.column_name);
  END LOOP;
END $$;
REVOKE ALL ON public.coach_sessions FROM anon;

DROP FUNCTION IF EXISTS public.public_session_spots(uuid);