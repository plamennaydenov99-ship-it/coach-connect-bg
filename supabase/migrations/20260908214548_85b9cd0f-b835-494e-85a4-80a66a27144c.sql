CREATE TABLE public.coach_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  athlete_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (coach_id, athlete_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coach_clients TO authenticated;
GRANT ALL ON public.coach_clients TO service_role;
ALTER TABLE public.coach_clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Coach manages own client relationships" ON public.coach_clients
  FOR ALL TO authenticated USING (auth.uid() = coach_id) WITH CHECK (auth.uid() = coach_id);

CREATE TABLE public.client_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_id uuid NOT NULL REFERENCES public.coach_clients(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_notes TO authenticated;
GRANT ALL ON public.client_notes TO service_role;
ALTER TABLE public.client_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Coach manages notes on own relationships" ON public.client_notes
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.coach_clients cc WHERE cc.id = client_notes.relationship_id AND cc.coach_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.coach_clients cc WHERE cc.id = client_notes.relationship_id AND cc.coach_id = auth.uid()));

CREATE TABLE public.client_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_id uuid NOT NULL REFERENCES public.coach_clients(id) ON DELETE CASCADE,
  goal text NOT NULL,
  target_date date,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','abandoned')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_goals TO authenticated;
GRANT ALL ON public.client_goals TO service_role;
ALTER TABLE public.client_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Coach manages goals on own relationships" ON public.client_goals
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.coach_clients cc WHERE cc.id = client_goals.relationship_id AND cc.coach_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.coach_clients cc WHERE cc.id = client_goals.relationship_id AND cc.coach_id = auth.uid()));

CREATE INDEX idx_coach_clients_coach ON public.coach_clients(coach_id);
CREATE INDEX idx_client_notes_rel ON public.client_notes(relationship_id, created_at DESC);
CREATE INDEX idx_client_goals_rel ON public.client_goals(relationship_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.tg_upsert_coach_client()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.coach_clients (coach_id, athlete_id)
  VALUES (NEW.coach_id, NEW.athlete_id)
  ON CONFLICT (coach_id, athlete_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_upsert_coach_client
AFTER INSERT ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.tg_upsert_coach_client();

INSERT INTO public.coach_clients (coach_id, athlete_id)
SELECT DISTINCT coach_id, athlete_id FROM public.bookings
ON CONFLICT DO NOTHING;