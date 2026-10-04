REVOKE UPDATE ON public.spot_requests FROM authenticated;
GRANT UPDATE (status) ON public.spot_requests TO authenticated;

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
  IF NEW.conversation_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = NEW.conversation_id AND c.athlete_id = NEW.athlete_id AND c.coach_id = NEW.owner_id
  ) THEN
    RAISE EXCEPTION 'Conversation does not match this request';
  END IF;
  NEW.status := 'new';
  RETURN NEW;
END $$;

CREATE TABLE public.trending_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('sport','session','event')),
  session_id uuid REFERENCES public.coach_sessions(id) ON DELETE CASCADE,
  owner_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 80),
  blurb text CHECK (blurb IS NULL OR char_length(blurb) <= 240),
  sport text,
  city text CHECK (city IN ('Sofia','Nice','Monaco')),
  image_url text,
  starts_on date,
  ends_on date,
  rank integer NOT NULL DEFAULT 100,
  sponsored boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT trending_items_session_check CHECK (type <> 'session' OR session_id IS NOT NULL)
);
CREATE INDEX trending_items_active_rank_idx ON public.trending_items(active, rank);

GRANT SELECT ON public.trending_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trending_items TO authenticated;
GRANT ALL ON public.trending_items TO service_role;
REVOKE INSERT, UPDATE, DELETE ON public.trending_items FROM anon;
ALTER TABLE public.trending_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads live trending" ON public.trending_items
  FOR SELECT TO anon, authenticated
  USING (active AND (ends_on IS NULL OR ends_on >= current_date));
CREATE POLICY "Admins manage trending" ON public.trending_items
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));