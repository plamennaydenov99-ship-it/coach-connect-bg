CREATE TABLE public.training_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_id uuid NOT NULL REFERENCES public.coach_clients(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent')),
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.training_programs TO authenticated;
GRANT ALL ON public.training_programs TO service_role;
ALTER TABLE public.training_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coach manages programs on own relationships" ON public.training_programs
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.coach_clients cc WHERE cc.id = training_programs.relationship_id AND cc.coach_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.coach_clients cc WHERE cc.id = training_programs.relationship_id AND cc.coach_id = auth.uid()));

CREATE POLICY "Athlete views sent programs" ON public.training_programs
  FOR SELECT TO authenticated
  USING (status = 'sent' AND EXISTS (SELECT 1 FROM public.coach_clients cc WHERE cc.id = training_programs.relationship_id AND cc.athlete_id = auth.uid()));

CREATE TABLE public.program_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.training_programs(id) ON DELETE CASCADE,
  task_date date NOT NULL,
  title text NOT NULL,
  description text,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.program_tasks TO authenticated;
GRANT ALL ON public.program_tasks TO service_role;
ALTER TABLE public.program_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coach manages tasks on own programs" ON public.program_tasks
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.training_programs tp
    JOIN public.coach_clients cc ON cc.id = tp.relationship_id
    WHERE tp.id = program_tasks.program_id AND cc.coach_id = auth.uid()))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.training_programs tp
    JOIN public.coach_clients cc ON cc.id = tp.relationship_id
    WHERE tp.id = program_tasks.program_id AND cc.coach_id = auth.uid()));

CREATE POLICY "Athlete views tasks of sent programs" ON public.program_tasks
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.training_programs tp
    JOIN public.coach_clients cc ON cc.id = tp.relationship_id
    WHERE tp.id = program_tasks.program_id AND tp.status = 'sent' AND cc.athlete_id = auth.uid()));

CREATE POLICY "Athlete toggles completion on sent tasks" ON public.program_tasks
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.training_programs tp
    JOIN public.coach_clients cc ON cc.id = tp.relationship_id
    WHERE tp.id = program_tasks.program_id AND tp.status = 'sent' AND cc.athlete_id = auth.uid()))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.training_programs tp
    JOIN public.coach_clients cc ON cc.id = tp.relationship_id
    WHERE tp.id = program_tasks.program_id AND tp.status = 'sent' AND cc.athlete_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.tg_program_task_athlete_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE is_coach boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.training_programs tp
    JOIN public.coach_clients cc ON cc.id = tp.relationship_id
    WHERE tp.id = OLD.program_id AND cc.coach_id = auth.uid()
  ) INTO is_coach;

  IF NOT is_coach THEN
    NEW.id := OLD.id;
    NEW.program_id := OLD.program_id;
    NEW.task_date := OLD.task_date;
    NEW.title := OLD.title;
    NEW.description := OLD.description;
    NEW.created_at := OLD.created_at;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.tg_program_task_athlete_guard() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_program_task_athlete_guard
BEFORE UPDATE ON public.program_tasks
FOR EACH ROW EXECUTE FUNCTION public.tg_program_task_athlete_guard();

CREATE INDEX idx_training_programs_rel ON public.training_programs(relationship_id, created_at DESC);
CREATE INDEX idx_program_tasks_program ON public.program_tasks(program_id, task_date);