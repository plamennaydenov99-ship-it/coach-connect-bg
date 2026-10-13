CREATE TABLE public.crm_pipelines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 60),
  position integer NOT NULL DEFAULT 0,
  is_default boolean NOT NULL DEFAULT false,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX crm_pipelines_owner_idx ON public.crm_pipelines(owner_id);
CREATE UNIQUE INDEX crm_pipelines_one_default ON public.crm_pipelines(owner_id) WHERE is_default;

CREATE TABLE public.crm_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id uuid NOT NULL REFERENCES public.crm_pipelines(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  name text CHECK (name IS NULL OR char_length(name) BETWEEN 1 AND 60),
  system_key text CHECK (system_key IS NULL OR system_key IN ('enquiry','trial','active','on_hold','archived')),
  category text NOT NULL CHECK (category IN ('enquiry','trial','active','on_hold','archived')),
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX crm_stages_pipeline_idx ON public.crm_stages(pipeline_id, position);
CREATE INDEX crm_stages_owner_idx ON public.crm_stages(owner_id);
CREATE UNIQUE INDEX crm_stages_one_archived ON public.crm_stages(pipeline_id) WHERE category = 'archived';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_pipelines TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_stages TO authenticated;
GRANT ALL ON public.crm_pipelines TO service_role;
GRANT ALL ON public.crm_stages TO service_role;
ALTER TABLE public.crm_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner reads pipelines" ON public.crm_pipelines FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "Owner adds pipelines" ON public.crm_pipelines FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owner updates pipelines" ON public.crm_pipelines FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owner deletes pipelines" ON public.crm_pipelines FOR DELETE TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "Owner reads stages" ON public.crm_stages FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "Owner adds stages" ON public.crm_stages FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owner updates stages" ON public.crm_stages FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owner deletes stages" ON public.crm_stages FOR DELETE TO authenticated USING (owner_id = auth.uid());

CREATE OR REPLACE FUNCTION public.tg_crm_stage_owner_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.crm_pipelines p WHERE p.id = NEW.pipeline_id AND p.owner_id = NEW.owner_id) THEN
    RAISE EXCEPTION 'Stage owner must match its pipeline owner';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER crm_stages_owner_guard BEFORE INSERT OR UPDATE ON public.crm_stages
FOR EACH ROW EXECUTE FUNCTION public.tg_crm_stage_owner_guard();

-- Callable by the owner themselves, or from inside our triggers (e.g. booking → client upsert).
CREATE OR REPLACE FUNCTION public.ensure_default_pipeline(owner uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pid uuid;
BEGIN
  IF owner IS NULL THEN RAISE EXCEPTION 'owner required'; END IF;
  IF auth.uid() IS DISTINCT FROM owner AND pg_trigger_depth() = 0 AND auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  SELECT id INTO pid FROM public.crm_pipelines WHERE owner_id = owner AND is_default;
  IF pid IS NOT NULL THEN RETURN pid; END IF;
  INSERT INTO public.crm_pipelines (owner_id, name, position, is_default)
  VALUES (owner, 'Main', 0, true)
  ON CONFLICT (owner_id) WHERE is_default DO NOTHING
  RETURNING id INTO pid;
  IF pid IS NULL THEN
    SELECT id INTO pid FROM public.crm_pipelines WHERE owner_id = owner AND is_default;
    RETURN pid;
  END IF;
  INSERT INTO public.crm_stages (pipeline_id, owner_id, name, system_key, category, position)
  SELECT pid, owner, NULL, k, k, i - 1
  FROM unnest(ARRAY['enquiry','trial','active','on_hold','archived']) WITH ORDINALITY AS u(k, i);
  RETURN pid;
END $$;
REVOKE ALL ON FUNCTION public.ensure_default_pipeline(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_default_pipeline(uuid) TO authenticated, service_role;

ALTER TABLE public.coach_clients
  ADD COLUMN pipeline_id uuid REFERENCES public.crm_pipelines(id) ON DELETE RESTRICT,
  ADD COLUMN stage_id uuid REFERENCES public.crm_stages(id) ON DELETE RESTRICT;
CREATE INDEX coach_clients_stage_id_idx ON public.coach_clients(stage_id);
CREATE INDEX coach_clients_pipeline_id_idx ON public.coach_clients(pipeline_id);

-- Backfill (before the new triggers exist)
SELECT public.ensure_default_pipeline(o.coach_id) FROM (SELECT DISTINCT coach_id FROM public.coach_clients) o;
ALTER TABLE public.coach_clients DISABLE TRIGGER trg_client_stage_event;
ALTER TABLE public.coach_clients DISABLE TRIGGER coach_clients_set_updated_at;
UPDATE public.coach_clients c
SET stage_id = s.id, pipeline_id = s.pipeline_id
FROM public.crm_pipelines p
JOIN public.crm_stages s ON s.pipeline_id = p.id
WHERE p.owner_id = c.coach_id AND p.is_default AND s.category = c.stage;
ALTER TABLE public.coach_clients ENABLE TRIGGER trg_client_stage_event;
ALTER TABLE public.coach_clients ENABLE TRIGGER coach_clients_set_updated_at;
ALTER TABLE public.coach_clients ALTER COLUMN stage_id SET NOT NULL;

ALTER TABLE public.coach_clients DROP CONSTRAINT IF EXISTS coach_clients_stage_check;
ALTER TABLE public.coach_clients ADD CONSTRAINT coach_clients_stage_check
  CHECK (stage IN ('enquiry','trial','active','on_hold','archived'));

CREATE OR REPLACE FUNCTION public.tg_coach_client_stage_sync()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE st public.crm_stages%ROWTYPE; pid uuid;
BEGIN
  IF NEW.stage_id IS NULL THEN
    pid := public.ensure_default_pipeline(NEW.coach_id);
    SELECT id INTO NEW.stage_id FROM public.crm_stages
      WHERE pipeline_id = pid AND category = COALESCE(NEW.stage, 'enquiry') ORDER BY position LIMIT 1;
  ELSIF TG_OP = 'UPDATE' AND NEW.stage_id = OLD.stage_id AND NEW.stage IS DISTINCT FROM OLD.stage THEN
    SELECT id INTO NEW.stage_id FROM public.crm_stages
      WHERE pipeline_id = OLD.pipeline_id AND category = NEW.stage ORDER BY position LIMIT 1;
    IF NEW.stage_id IS NULL THEN
      RAISE EXCEPTION 'This pipeline has no stage in category %', NEW.stage;
    END IF;
  END IF;
  SELECT * INTO st FROM public.crm_stages WHERE id = NEW.stage_id;
  IF NOT FOUND OR st.owner_id IS DISTINCT FROM NEW.coach_id THEN
    RAISE EXCEPTION 'Stage does not belong to this account';
  END IF;
  NEW.pipeline_id := st.pipeline_id;
  NEW.stage := st.category;
  RETURN NEW;
END $$;
CREATE TRIGGER coach_clients_stage_sync BEFORE INSERT OR UPDATE ON public.coach_clients
FOR EACH ROW EXECUTE FUNCTION public.tg_coach_client_stage_sync();

CREATE OR REPLACE FUNCTION public.tg_client_stage_event()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE f public.crm_stages%ROWTYPE; t public.crm_stages%ROWTYPE;
BEGIN
  IF NEW.stage IS DISTINCT FROM OLD.stage OR NEW.stage_id IS DISTINCT FROM OLD.stage_id THEN
    SELECT * INTO f FROM public.crm_stages WHERE id = OLD.stage_id;
    SELECT * INTO t FROM public.crm_stages WHERE id = NEW.stage_id;
    INSERT INTO public.client_events (client_id, coach_id, type, payload)
    VALUES (NEW.id, NEW.coach_id, 'stage_change', jsonb_build_object(
      'from', OLD.stage, 'to', NEW.stage,
      'from_stage_id', OLD.stage_id, 'to_stage_id', NEW.stage_id,
      'from_name', f.name, 'to_name', t.name,
      'from_system_key', f.system_key, 'to_system_key', t.system_key,
      'from_pipeline_id', OLD.pipeline_id, 'pipeline_id', NEW.pipeline_id));
  END IF;
  RETURN NEW;
END $$;