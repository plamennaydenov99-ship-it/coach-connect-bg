CREATE TABLE public.profile_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  viewer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.profile_views TO authenticated;
GRANT INSERT ON public.profile_views TO anon;
GRANT ALL ON public.profile_views TO service_role;
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coach reads own profile views" ON public.profile_views
  FOR SELECT TO authenticated USING (coach_id = auth.uid());
CREATE POLICY "Anyone can log a profile view" ON public.profile_views
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE INDEX idx_profile_views_coach ON public.profile_views(coach_id, created_at DESC);

CREATE TABLE public.coach_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  event_date date NOT NULL,
  location text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coach_events TO authenticated;
GRANT SELECT ON public.coach_events TO anon;
GRANT ALL ON public.coach_events TO service_role;
ALTER TABLE public.coach_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view coach events" ON public.coach_events
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Coach manages own events" ON public.coach_events
  FOR ALL TO authenticated USING (coach_id = auth.uid()) WITH CHECK (coach_id = auth.uid());

CREATE INDEX idx_coach_events_date ON public.coach_events(event_date);